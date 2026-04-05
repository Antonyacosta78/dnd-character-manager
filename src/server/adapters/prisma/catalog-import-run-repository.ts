import type { PrismaClient } from "@prisma/client";

import { prisma as defaultPrisma } from "@/server/adapters/prisma/prisma-client";
import type {
  CatalogImportRunRecord,
  CatalogImportRunRepository,
  CreateCatalogImportRunInput,
  FinalizeCatalogImportRunInput,
} from "@/server/ports/catalog-import-run-repository";

function parseJson(value: string | null): Record<string, unknown> | null {
  if (!value) {
    return null;
  }

  return JSON.parse(value) as Record<string, unknown>;
}

function toRecord(row: Awaited<ReturnType<PrismaClient["catalogImportRun"]["create"]>>): CatalogImportRunRecord {
  return {
    id: row.id,
    catalogVersionId: row.catalogVersionId,
    triggerKind: row.triggerKind as CatalogImportRunRecord["triggerKind"],
    requestedByUserId: row.requestedByUserId,
    integrityMode: row.integrityMode as CatalogImportRunRecord["integrityMode"],
    outcome: row.outcome as CatalogImportRunRecord["outcome"],
    currentStage: row.currentStage as CatalogImportRunRecord["currentStage"],
    datasetFingerprintObserved: row.datasetFingerprintObserved,
    sourceManifest: parseJson(row.sourceManifestJson),
    stageMetrics: parseJson(row.stageMetricsJson),
    errorSummary: row.errorSummary,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
  };
}

export function createPrismaCatalogImportRunRepository(
  db: PrismaClient = defaultPrisma,
): CatalogImportRunRepository {
  return {
    async createRun(input: CreateCatalogImportRunInput): Promise<CatalogImportRunRecord> {
      const row = await db.catalogImportRun.create({
        data: {
          id: input.id,
          triggerKind: input.triggerKind,
          requestedByUserId: input.requestedByUserId ?? null,
          integrityMode: input.integrityMode,
          currentStage: input.currentStage,
        },
      });

      return toRecord(row);
    },

    async updateRunStage(input): Promise<void> {
      await db.catalogImportRun.update({
        where: { id: input.runId },
        data: { currentStage: input.stage },
      });
    },

    async setObservedFingerprint(input): Promise<void> {
      await db.catalogImportRun.update({
        where: { id: input.runId },
        data: {
          datasetFingerprintObserved: input.datasetFingerprintObserved,
        },
      });
    },

    async appendIssues(runId, issues): Promise<void> {
      if (issues.length === 0) {
        return;
      }

      await db.catalogImportIssue.createMany({
        data: issues.map((issue) => ({
          runId,
          stage: issue.stage,
          severity: issue.severity,
          code: issue.code,
          message: issue.message,
          filePath: issue.filePath ?? null,
          jsonPointer: null,
          detailsJson: issue.details ? JSON.stringify(issue.details) : null,
        })),
      });
    },

    async finalizeRun(input: FinalizeCatalogImportRunInput): Promise<CatalogImportRunRecord> {
      const row = await db.catalogImportRun.update({
        where: { id: input.runId },
        data: {
          outcome: input.outcome,
          currentStage: input.currentStage,
          catalogVersionId: input.catalogVersionId ?? null,
          stageMetricsJson: input.stageMetrics ? JSON.stringify(input.stageMetrics) : null,
          errorSummary: input.errorSummary ?? null,
          finishedAt: input.finishedAt ?? new Date(),
        },
      });

      return toRecord(row);
    },
  };
}
