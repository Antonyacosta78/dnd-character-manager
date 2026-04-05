import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/server/adapters/prisma/prisma-client";
import type { NormalizedDataSource, NormalizedEntity } from "@/server/import/parser-types";
import type { ImportIssue } from "@/server/import/types";
import type {
  ActivatePublishedCatalogInput,
  CatalogPublishRepository,
  PublishCatalogPhase1Input,
  PublishCatalogPhase1Result,
  RecoverPendingActivationInput,
} from "@/server/ports/catalog-publish-repository";
import {
  CatalogActivationGuardError,
  CatalogPayloadOverflowError,
  CatalogVersionLockError,
} from "@/server/ports/catalog-publish-repository";

const PAYLOAD_JSON_LIMIT_BYTES = 2 * 1024 * 1024;

function toPayloadOverflowIssues(entities: NormalizedEntity[]): ImportIssue[] {
  const issues: ImportIssue[] = [];

  for (const entity of entities) {
    const payloadJson = JSON.stringify(entity.payload);
    const payloadBytes = Buffer.byteLength(payloadJson, "utf8");

    if (payloadBytes <= PAYLOAD_JSON_LIMIT_BYTES) {
      continue;
    }

    issues.push({
      stage: "publish",
      severity: "error",
      code: "PUBLISH_PAYLOAD_JSON_TOO_LARGE",
      message: `payloadJson exceeds 2MB for ${entity.kind}:${entity.identity}.`,
      details: {
        kind: entity.kind,
        identity: entity.identity,
        payloadBytes,
        maxBytes: PAYLOAD_JSON_LIMIT_BYTES,
      },
    });
  }

  return issues;
}

function isUniqueConstraintError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2002";
  }

  if (error && typeof error === "object" && "code" in error) {
    return (error as { code?: unknown }).code === "P2002";
  }

  return false;
}

async function writeVersionRows(
  tx: Prisma.TransactionClient,
  catalogVersionId: string,
  normalized: NormalizedDataSource,
): Promise<void> {
  await tx.catalogEntity.deleteMany({ where: { catalogVersionId } });
  await tx.catalogFeatureReference.deleteMany({ where: { catalogVersionId } });
  await tx.catalogSpellSourceEdge.deleteMany({ where: { catalogVersionId } });

  if (normalized.entities.length > 0) {
    await tx.catalogEntity.createMany({
      data: normalized.entities.map((entity) => ({
        catalogVersionId,
        kind: entity.kind,
        identity: entity.identity,
        name: entity.name,
        source: entity.source,
        edition: entity.edition ?? null,
        payloadJson: JSON.stringify(entity.payload),
      })),
    });
  }

  if (normalized.featureReferences.length > 0) {
    await tx.catalogFeatureReference.createMany({
      data: normalized.featureReferences.map((reference) => ({
        catalogVersionId,
        ownerKind: reference.ownerKind,
        ownerName: reference.ownerName,
        ownerSource: reference.ownerSource,
        ownerClassName: reference.ownerClassName ?? null,
        ownerClassSource: reference.ownerClassSource ?? null,
        featureKind: reference.featureKind,
        featureUid: reference.featureUid,
        featureName: reference.featureName ?? null,
        featureSource: reference.featureSource ?? null,
        flagsJson: reference.flags ? JSON.stringify(reference.flags) : null,
      })),
    });
  }

  if (normalized.spellSourceEdges.length > 0) {
    await tx.catalogSpellSourceEdge.createMany({
      data: normalized.spellSourceEdges.map((edge) => ({
        catalogVersionId,
        spellName: edge.spellName,
        spellSource: edge.spellSource,
        grantType: edge.grantType,
        ownerName: edge.ownerName,
        ownerSource: edge.ownerSource,
        ownerClassName: edge.ownerClassName ?? null,
        ownerClassSource: edge.ownerClassSource ?? null,
        ownerSubclassShortName: edge.ownerSubclassShortName ?? null,
        additionType: edge.additionType ?? null,
        definedInSource: edge.definedInSource ?? null,
        definedInSourcesJson: edge.definedInSources
          ? JSON.stringify(edge.definedInSources)
          : null,
      })),
    });
  }
}

export function createPrismaCatalogPublishRepository(
  db: PrismaClient = defaultPrisma,
): CatalogPublishRepository {
  return {
    async recoverPendingActivation(
      input: RecoverPendingActivationInput,
    ): Promise<{ catalogVersionId: string } | null> {
      const pending = await db.catalogVersion.findFirst({
        where: {
          status: "published",
          phase1CompletedAt: { not: null },
          activatedAt: null,
        },
        select: {
          id: true,
          datasetFingerprint: true,
        },
        orderBy: { phase1CompletedAt: "asc" },
      });

      if (!pending) {
        return null;
      }

      await this.activatePublishedCatalog({
        catalogVersionId: pending.id,
        datasetFingerprint: pending.datasetFingerprint,
        runId: input.runId,
        activatedByUserId: input.activatedByUserId,
        reason: input.reason ?? "AUTO_RECOVER_PENDING_ACTIVATION",
      });

      return { catalogVersionId: pending.id };
    },

    async publishPhase1(input: PublishCatalogPhase1Input): Promise<PublishCatalogPhase1Result> {
      const overflowIssues = toPayloadOverflowIssues(input.normalized.entities);
      if (overflowIssues.length > 0) {
        throw new CatalogPayloadOverflowError(overflowIssues);
      }

      return db.$transaction(async (tx) => {
        const version = await tx.catalogVersion.upsert({
          where: {
            providerKind_datasetFingerprint_importerVersion: {
              providerKind: input.providerKind,
              datasetFingerprint: input.datasetFingerprint,
              importerVersion: input.importerVersion,
            },
          },
          create: {
            providerKind: input.providerKind,
            datasetFingerprint: input.datasetFingerprint,
            importerVersion: input.importerVersion,
            status: "draft",
          },
          update: {},
          select: {
            id: true,
          },
        });

        try {
          await tx.catalogVersionPublishLock.create({
            data: {
              catalogVersionId: version.id,
              datasetFingerprint: input.datasetFingerprint,
              runId: input.runId,
            },
          });
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throw new CatalogVersionLockError(
              `Publish lock is already held for catalog version ${version.id}.`,
            );
          }

          throw error;
        }

        await writeVersionRows(tx, version.id, input.normalized);

        await tx.catalogVersion.update({
          where: { id: version.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            phase1CompletedAt: new Date(),
            phase1Fingerprint: input.datasetFingerprint,
          },
        });

        await tx.catalogVersionPublishLock.delete({
          where: { catalogVersionId: version.id },
        });

        return {
          catalogVersionId: version.id,
        };
      });
    },

    async activatePublishedCatalog(input: ActivatePublishedCatalogInput): Promise<void> {
      await db.$transaction(async (tx) => {
        const version = await tx.catalogVersion.findUnique({
          where: { id: input.catalogVersionId },
          select: {
            id: true,
            status: true,
            datasetFingerprint: true,
            phase1CompletedAt: true,
            phase1Fingerprint: true,
          },
        });

        if (!version) {
          throw new CatalogActivationGuardError(
            `Catalog version ${input.catalogVersionId} does not exist.`,
          );
        }

        if (
          version.status !== "published" ||
          !version.phase1CompletedAt ||
          version.phase1Fingerprint !== input.datasetFingerprint ||
          version.datasetFingerprint !== input.datasetFingerprint
        ) {
          throw new CatalogActivationGuardError(
            `Activation blocked: phase 1 is incomplete or invalid for ${input.catalogVersionId}.`,
          );
        }

        const runtimeState = await tx.catalogRuntimeState.findUnique({ where: { id: 1 } });
        if (runtimeState?.activeCatalogVersionId === input.catalogVersionId) {
          await tx.catalogVersion.update({
            where: { id: input.catalogVersionId },
            data: { activatedAt: new Date() },
          });
          return;
        }

        await tx.catalogActivationEvent.create({
          data: {
            fromCatalogVersionId: runtimeState?.activeCatalogVersionId ?? null,
            toCatalogVersionId: input.catalogVersionId,
            runId: input.runId,
            activatedByUserId: input.activatedByUserId ?? null,
            reason: input.reason ?? null,
          },
        });

        await tx.catalogRuntimeState.upsert({
          where: { id: 1 },
          create: {
            id: 1,
            activeCatalogVersionId: input.catalogVersionId,
            dataIntegrityMode: "strict",
          },
          update: {
            activeCatalogVersionId: input.catalogVersionId,
          },
        });

        await tx.catalogVersion.update({
          where: { id: input.catalogVersionId },
          data: { activatedAt: new Date() },
        });
      });
    },
  };
}

export { PAYLOAD_JSON_LIMIT_BYTES, toPayloadOverflowIssues };
