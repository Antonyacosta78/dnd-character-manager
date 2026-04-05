import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/server/adapters/prisma/prisma-client";
import type {
  ActivateCatalogVersionInput,
  CatalogActivationEventRecord,
  CatalogRuntimeStateRecord,
  CatalogVersionRecord,
  CatalogVersionRepository,
  CreateCatalogVersionInput,
  RecordCatalogActivationEventInput,
  SetCatalogRuntimeStateInput,
  UpdateCatalogVersionStatusInput,
} from "@/server/ports/catalog-version-repository";

function parseMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  return JSON.parse(value) as Record<string, unknown>;
}

function toVersionRecord(
  row: Awaited<ReturnType<PrismaClient["catalogVersion"]["create"]>>,
): CatalogVersionRecord {
  return {
    id: row.id,
    providerKind: row.providerKind as CatalogVersionRecord["providerKind"],
    datasetFingerprint: row.datasetFingerprint,
    datasetLabel: row.datasetLabel,
    sourceRef: row.sourceRef,
    importerVersion: row.importerVersion,
    status: row.status as CatalogVersionRecord["status"],
    metadata: parseMetadata(row.metadataJson),
    createdAt: row.createdAt,
    validatedAt: row.validatedAt,
    publishedAt: row.publishedAt,
  };
}

function toRuntimeStateRecord(
  row: Awaited<ReturnType<PrismaClient["catalogRuntimeState"]["upsert"]>>,
): CatalogRuntimeStateRecord {
  return {
    id: 1,
    activeCatalogVersionId: row.activeCatalogVersionId,
    lastIntegrityCheckAt: row.lastIntegrityCheckAt,
    lastIntegrityStatus: row.lastIntegrityStatus as CatalogRuntimeStateRecord["lastIntegrityStatus"],
    lastIntegrityMessage: row.lastIntegrityMessage,
    dataIntegrityMode: row.dataIntegrityMode as CatalogRuntimeStateRecord["dataIntegrityMode"],
    updatedAt: row.updatedAt,
  };
}

function toActivationRecord(
  row: Awaited<ReturnType<PrismaClient["catalogActivationEvent"]["create"]>>,
): CatalogActivationEventRecord {
  return {
    id: row.id,
    fromCatalogVersionId: row.fromCatalogVersionId,
    toCatalogVersionId: row.toCatalogVersionId,
    runId: row.runId,
    activatedByUserId: row.activatedByUserId,
    reason: row.reason,
    createdAt: row.createdAt,
  };
}

export function createPrismaCatalogVersionRepository(
  db: PrismaClient = defaultPrisma,
): CatalogVersionRepository {
  return {
    async findByLineage(args) {
      const row = await db.catalogVersion.findUnique({
        where: {
          providerKind_datasetFingerprint_importerVersion: {
            providerKind: args.providerKind,
            datasetFingerprint: args.datasetFingerprint,
            importerVersion: args.importerVersion,
          },
        },
      });

      return row ? toVersionRecord(row) : null;
    },

    async createVersion(input: CreateCatalogVersionInput) {
      const row = await db.catalogVersion.create({
        data: {
          id: input.id,
          providerKind: input.providerKind,
          datasetFingerprint: input.datasetFingerprint,
          datasetLabel: input.datasetLabel ?? null,
          sourceRef: input.sourceRef ?? null,
          importerVersion: input.importerVersion,
          status: input.status ?? "draft",
          metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
        },
      });

      return toVersionRecord(row);
    },

    async updateVersionStatus(input: UpdateCatalogVersionStatusInput) {
      const row = await db.catalogVersion.update({
        where: { id: input.versionId },
        data: {
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : undefined,
        },
      });

      return toVersionRecord(row);
    },

    async getRuntimeState() {
      const row = await db.catalogRuntimeState.findUnique({ where: { id: 1 } });
      if (!row) {
        return null;
      }

      return toRuntimeStateRecord(row);
    },

    async setRuntimeState(input: SetCatalogRuntimeStateInput) {
      const row = await db.catalogRuntimeState.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          activeCatalogVersionId: input.activeCatalogVersionId,
          lastIntegrityCheckAt: input.lastIntegrityCheckAt ?? null,
          lastIntegrityStatus: input.lastIntegrityStatus ?? null,
          lastIntegrityMessage: input.lastIntegrityMessage ?? null,
          dataIntegrityMode: input.dataIntegrityMode ?? "strict",
        },
        update: {
          activeCatalogVersionId: input.activeCatalogVersionId,
          lastIntegrityCheckAt: input.lastIntegrityCheckAt,
          lastIntegrityStatus: input.lastIntegrityStatus,
          lastIntegrityMessage: input.lastIntegrityMessage,
          dataIntegrityMode: input.dataIntegrityMode,
        },
      });

      return toRuntimeStateRecord(row);
    },

    async recordActivationEvent(input: RecordCatalogActivationEventInput) {
      const row = await db.catalogActivationEvent.create({
        data: {
          id: input.id,
          fromCatalogVersionId: input.fromCatalogVersionId,
          toCatalogVersionId: input.toCatalogVersionId,
          runId: input.runId ?? null,
          activatedByUserId: input.activatedByUserId ?? null,
          reason: input.reason ?? null,
        },
      });

      return toActivationRecord(row);
    },

    async activateCatalogVersion(input: ActivateCatalogVersionInput) {
      return db.$transaction(async (tx) => {
        const runtime = await tx.catalogRuntimeState.findUnique({ where: { id: 1 } });
        const event = await tx.catalogActivationEvent.create({
          data: {
            fromCatalogVersionId: runtime?.activeCatalogVersionId ?? null,
            toCatalogVersionId: input.toCatalogVersionId,
            runId: input.runId ?? null,
            activatedByUserId: input.activatedByUserId ?? null,
            reason: input.reason ?? null,
          },
        });

        await tx.catalogRuntimeState.upsert({
          where: { id: 1 },
          create: {
            id: 1,
            activeCatalogVersionId: input.toCatalogVersionId,
            dataIntegrityMode: "strict",
          },
          update: {
            activeCatalogVersionId: input.toCatalogVersionId,
          },
        });

        return toActivationRecord(event);
      });
    },
  };
}
