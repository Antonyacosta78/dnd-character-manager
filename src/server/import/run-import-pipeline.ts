import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { performance } from "node:perf_hooks";

import type {
  CatalogImportRunRepository,
  CatalogImportTriggerKind,
} from "@/server/ports/catalog-import-run-repository";
import type {
  CatalogPublishRepository,
} from "@/server/ports/catalog-publish-repository";
import {
  CatalogActivationGuardError,
  CatalogPayloadOverflowError,
  CatalogVersionLockError,
} from "@/server/ports/catalog-publish-repository";
import type { DataIntegrityMode } from "@/server/ports/rules-catalog";
import type {
  NormalizedDataSource,
  ParserDiagnostic,
} from "@/server/import/parser-types";
import {
  IMPORT_STAGES,
  createEmptyIssueCounts,
  createEmptyStageDurations,
  type ImportIssue,
  type ImportRunSummary,
  type ImportStage,
} from "@/server/import/types";
import {
  DatasetFingerprintError,
  computeDatasetFingerprint,
} from "@/server/import/fingerprint/compute-dataset-fingerprint";
import { normalizeDataSource } from "@/server/import/normalize/normalize-data-source";
import { resolveDataSource } from "@/server/import/resolve/resolve-data-source";
import { validateDomain } from "@/server/import/validate-domain/validate-domain";
import { validateDataSource } from "@/server/import/validate-source/validate-data-source";

export interface RunImportPipelineArgs {
  dataRootPath: string;
  importerVersion: string;
  integrityMode: DataIntegrityMode;
  triggerKind?: CatalogImportTriggerKind;
  requestedByUserId?: string | null;
  runId?: string;
}

export interface RunImportPipelineOptions {
  importRunRepository?: CatalogImportRunRepository;
  catalogPublishRepository?: CatalogPublishRepository;
  now?: () => Date;
}

class ImportPipelineStageError extends Error {
  readonly stage: ImportStage;
  readonly stageIssues: ImportIssue[];

  constructor(stage: ImportStage, stageIssues: ImportIssue[]) {
    super(stageIssues[0]?.message ?? `Import stage ${stage} failed.`);
    this.name = "ImportPipelineStageError";
    this.stage = stage;
    this.stageIssues = stageIssues;
  }
}

function parserDiagnosticToIssue(diagnostic: ParserDiagnostic): ImportIssue {
  return {
    stage: diagnostic.stage,
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
    filePath: diagnostic.filePath,
    details: diagnostic.details,
  };
}

function countIssues(issues: ImportIssue[]): ReturnType<typeof createEmptyIssueCounts> {
  const issueCounts = createEmptyIssueCounts();

  for (const issue of issues) {
    issueCounts[issue.severity] += 1;
  }

  return issueCounts;
}

function hasErrorIssues(issues: ImportIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

function countEntitiesByKind(normalized: NormalizedDataSource | undefined): Record<string, number> {
  if (!normalized) {
    return {};
  }

  const counts: Record<string, number> = {
    spellSourceEdges: normalized.spellSourceEdges.length,
    featureReferences: normalized.featureReferences.length,
  };

  for (const entity of normalized.entities) {
    counts[entity.kind] = (counts[entity.kind] ?? 0) + 1;
  }

  return counts;
}

export async function runImportPipeline(
  args: RunImportPipelineArgs,
  options: RunImportPipelineOptions = {},
): Promise<ImportRunSummary> {
  const runId = args.runId ?? randomUUID();
  const now = options.now ?? (() => new Date());
  const stageDurations = createEmptyStageDurations();
  const issues: ImportIssue[] = [];
  let currentStage: ImportStage = "sync";
  let datasetFingerprint: string | null = null;
  let normalizedData: NormalizedDataSource | undefined;
  let catalogVersionId: string | null = null;

  if (options.importRunRepository) {
    await options.importRunRepository.createRun({
      id: runId,
      triggerKind: args.triggerKind ?? "manual",
      requestedByUserId: args.requestedByUserId ?? null,
      integrityMode: args.integrityMode,
      currentStage,
    });
  }

  const runStage = async <T>(stage: ImportStage, action: () => Promise<T>): Promise<T> => {
    currentStage = stage;

    if (options.importRunRepository) {
      await options.importRunRepository.updateRunStage({ runId, stage });
    }

    const stageStartedAt = performance.now();

    try {
      return await action();
    } finally {
      stageDurations[stage] = Math.round(performance.now() - stageStartedAt);
    }
  };

  try {
    await runStage("sync", async () => {
      let directoryStats;

      try {
        directoryStats = await stat(args.dataRootPath);
      } catch {
        throw new DatasetFingerprintError(
          "SOURCE_PATH_MISSING",
          `Dataset root does not exist: ${args.dataRootPath}`,
        );
      }

      if (!directoryStats.isDirectory()) {
        throw new DatasetFingerprintError(
          "SOURCE_PATH_NOT_DIRECTORY",
          `Dataset root is not a directory: ${args.dataRootPath}`,
        );
      }
    });

    const fingerprint = await runStage("fingerprint", async () =>
      computeDatasetFingerprint(args.dataRootPath),
    );

    datasetFingerprint = fingerprint.fingerprint;

    if (options.importRunRepository) {
      await options.importRunRepository.setObservedFingerprint({
        runId,
        datasetFingerprintObserved: fingerprint.fingerprint,
      });
    }

    const validatedDataSource = await runStage("validate_source", async () => {
      const result = await validateDataSource(args.dataRootPath);
      const stageIssues = result.diagnostics.map(parserDiagnosticToIssue);
      issues.push(...stageIssues);

      if (!result.validatedDataSource || hasErrorIssues(stageIssues)) {
        throw new ImportPipelineStageError("validate_source", stageIssues);
      }

      return result.validatedDataSource;
    });

    const resolvedDataSource = await runStage("resolve", async () => {
      const result = await resolveDataSource(validatedDataSource);
      const stageIssues = result.diagnostics.map(parserDiagnosticToIssue);
      issues.push(...stageIssues);

      if (hasErrorIssues(stageIssues)) {
        throw new ImportPipelineStageError("resolve", stageIssues);
      }

      return result;
    });

    normalizedData = await runStage("normalize", async () => {
      const result = normalizeDataSource(resolvedDataSource);
      const stageIssues = result.diagnostics.map(parserDiagnosticToIssue);
      issues.push(...stageIssues);

      if (hasErrorIssues(stageIssues)) {
        throw new ImportPipelineStageError("normalize", stageIssues);
      }

      return result;
    });

    const normalizedForValidation = normalizedData;

    await runStage("validate_domain", async () => {
      const result = validateDomain(normalizedForValidation, args.integrityMode);
      const stageIssues = result.diagnostics.map(parserDiagnosticToIssue);
      issues.push(...stageIssues);

      if (hasErrorIssues(stageIssues)) {
        throw new ImportPipelineStageError("validate_domain", stageIssues);
      }
    });

    await runStage("publish", async () => {
      if (!options.catalogPublishRepository) {
        throw new Error("Catalog publish repository is not configured.");
      }

      if (!normalizedData || !datasetFingerprint) {
        throw new Error("Publish stage requires normalized data and dataset fingerprint.");
      }

      await options.catalogPublishRepository.recoverPendingActivation({
        runId,
        reason: "AUTO_RECOVER_ON_PUBLISH",
      });

      const phase1 = await options.catalogPublishRepository.publishPhase1({
        providerKind: "derived",
        datasetFingerprint,
        importerVersion: args.importerVersion,
        normalized: normalizedData,
        runId,
      });

      catalogVersionId = phase1.catalogVersionId;

      await options.catalogPublishRepository.activatePublishedCatalog({
        catalogVersionId: phase1.catalogVersionId,
        datasetFingerprint,
        runId,
        reason: "IMPORT_PIPELINE_PUBLISH",
      });
    });

    const entityCounts = countEntitiesByKind(normalizedData);
    const issueCounts = countIssues(issues);

    if (options.importRunRepository) {
      if (issues.length > 0) {
        await options.importRunRepository.appendIssues(runId, issues);
      }

      await options.importRunRepository.finalizeRun({
        runId,
        outcome: "succeeded",
        currentStage: "publish",
        catalogVersionId,
        stageMetrics: {
          stageDurationsMs: stageDurations,
          entityCounts,
          importerVersion: args.importerVersion,
          issueCounts,
        },
        finishedAt: now(),
      });
    }

    return {
      runId,
      outcome: "succeeded",
      catalogVersionId,
      datasetFingerprint,
      metrics: {
        stageDurationsMs: stageDurations,
        entityCounts,
        issueCounts,
      },
      issues,
    };
  } catch (error) {
    if (error instanceof CatalogPayloadOverflowError) {
      issues.push(...error.issues);
    } else if (error instanceof ImportPipelineStageError) {
      if (error.stageIssues.length === 0) {
        issues.push({
          stage: error.stage,
          severity: "error",
          code: "IMPORT_STAGE_FAILED",
          message: error.message,
        });
      }
    } else {
      const issue = toImportIssue(error, currentStage);
      issues.push(issue);
    }

    const errorIssue = issues.find((issue) => issue.severity === "error");
    const entityCounts = countEntitiesByKind(normalizedData);

    if (options.importRunRepository) {
      await options.importRunRepository.appendIssues(runId, issues);
      await options.importRunRepository.finalizeRun({
        runId,
        outcome: "failed",
        currentStage,
        catalogVersionId,
        stageMetrics: {
          stageDurationsMs: stageDurations,
          entityCounts,
          importerVersion: args.importerVersion,
          issueCounts: countIssues(issues),
        },
        errorSummary: errorIssue?.message ?? "Import pipeline failed.",
        finishedAt: now(),
      });
    }

    const issueCounts = countIssues(issues);

    return {
      runId,
      outcome: "failed",
      catalogVersionId,
      datasetFingerprint,
      metrics: {
        stageDurationsMs: stageDurations,
        entityCounts,
        issueCounts,
      },
      issues,
    };
  }
}

function toImportIssue(error: unknown, stage: ImportStage): ImportIssue {
  if (error instanceof CatalogPayloadOverflowError) {
    return {
      stage,
      severity: "error",
      code: "PUBLISH_PAYLOAD_JSON_TOO_LARGE",
      message: `${error.issues.length} canonical payloadJson row(s) exceed the 2MB limit.`,
    };
  }

  if (error instanceof CatalogActivationGuardError) {
    return {
      stage,
      severity: "error",
      code: "PUBLISH_ACTIVATION_GUARD_FAILED",
      message: error.message,
    };
  }

  if (error instanceof CatalogVersionLockError) {
    return {
      stage,
      severity: "error",
      code: "PUBLISH_VERSION_LOCK_CONFLICT",
      message: error.message,
    };
  }

  if (error instanceof DatasetFingerprintError) {
    return {
      stage,
      severity: "error",
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      stage,
      severity: "error",
      code: "IMPORT_STAGE_FAILED",
      message: error.message,
    };
  }

  return {
    stage,
    severity: "error",
    code: "IMPORT_STAGE_FAILED",
    message: "Unknown import pipeline failure.",
  };
}

export function isImportStage(value: string): value is ImportStage {
  return IMPORT_STAGES.includes(value as ImportStage);
}
