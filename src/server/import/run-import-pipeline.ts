import { randomUUID } from "node:crypto";
import { stat } from "node:fs/promises";
import { performance } from "node:perf_hooks";

import type {
  CatalogImportRunRepository,
  CatalogImportTriggerKind,
} from "@/server/ports/catalog-import-run-repository";
import type { DataIntegrityMode } from "@/server/ports/rules-catalog";
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

// Foundation skeleton stages kept to preserve stage order, metrics shape,
// and repository progression until full pipeline logic is implemented.
// TODO(ai-agent): Replace each NOOP stage with real validate/resolve/normalize/publish behavior.
const NOOP_STAGES: ImportStage[] = [
  "validate_source",
  "resolve",
  "normalize",
  "validate_domain",
  "publish",
];

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
  now?: () => Date;
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

    // TODO(ai-agent): Remove this NOOP loop once real stage implementations are wired.
    for (const stage of NOOP_STAGES) {
      await runStage(stage, async () => undefined);
    }

    const issueCounts = createEmptyIssueCounts();

    if (options.importRunRepository) {
      await options.importRunRepository.finalizeRun({
        runId,
        outcome: "succeeded",
        currentStage: "publish",
        catalogVersionId: null,
        stageMetrics: {
          stageDurationsMs: stageDurations,
          importerVersion: args.importerVersion,
          issueCounts,
        },
        finishedAt: now(),
      });
    }

    return {
      runId,
      outcome: "succeeded",
      catalogVersionId: null,
      datasetFingerprint,
      metrics: {
        stageDurationsMs: stageDurations,
        entityCounts: {},
        issueCounts,
      },
      issues,
    };
  } catch (error) {
    const issue = toImportIssue(error, currentStage);
    issues.push(issue);

    if (options.importRunRepository) {
      await options.importRunRepository.appendIssues(runId, issues);
      await options.importRunRepository.finalizeRun({
        runId,
        outcome: "failed",
        currentStage,
        catalogVersionId: null,
        stageMetrics: {
          stageDurationsMs: stageDurations,
          importerVersion: args.importerVersion,
        },
        errorSummary: issue.message,
        finishedAt: now(),
      });
    }

    const issueCounts = createEmptyIssueCounts();
    issueCounts.error = issues.length;

    return {
      runId,
      outcome: "failed",
      catalogVersionId: null,
      datasetFingerprint,
      metrics: {
        stageDurationsMs: stageDurations,
        entityCounts: {},
        issueCounts,
      },
      issues,
    };
  }
}

function toImportIssue(error: unknown, stage: ImportStage): ImportIssue {
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
