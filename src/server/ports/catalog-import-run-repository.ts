import type { ImportIssue, ImportOutcome, ImportStage } from "@/server/import/types";
import type { DataIntegrityMode } from "@/server/ports/rules-catalog";

export type CatalogImportTriggerKind = "manual" | "ci" | "startup_guard" | "admin";

export interface CatalogImportRunRecord {
  id: string;
  catalogVersionId: string | null;
  triggerKind: CatalogImportTriggerKind;
  requestedByUserId: string | null;
  integrityMode: DataIntegrityMode;
  outcome: ImportOutcome;
  currentStage: ImportStage;
  datasetFingerprintObserved: string | null;
  sourceManifest: Record<string, unknown> | null;
  stageMetrics: Record<string, unknown> | null;
  errorSummary: string | null;
  startedAt: Date;
  finishedAt: Date | null;
}

export interface CreateCatalogImportRunInput {
  id?: string;
  triggerKind: CatalogImportTriggerKind;
  requestedByUserId?: string | null;
  integrityMode: DataIntegrityMode;
  currentStage: ImportStage;
}

export interface UpdateCatalogImportRunStageInput {
  runId: string;
  stage: ImportStage;
}

export interface SetObservedFingerprintInput {
  runId: string;
  datasetFingerprintObserved: string;
}

export interface FinalizeCatalogImportRunInput {
  runId: string;
  outcome: ImportOutcome;
  currentStage: ImportStage;
  catalogVersionId?: string | null;
  stageMetrics?: Record<string, unknown>;
  errorSummary?: string | null;
  finishedAt?: Date;
}

export interface CatalogImportRunRepository {
  createRun(input: CreateCatalogImportRunInput): Promise<CatalogImportRunRecord>;
  updateRunStage(input: UpdateCatalogImportRunStageInput): Promise<void>;
  setObservedFingerprint(input: SetObservedFingerprintInput): Promise<void>;
  appendIssues(runId: string, issues: ImportIssue[]): Promise<void>;
  finalizeRun(
    input: FinalizeCatalogImportRunInput,
  ): Promise<CatalogImportRunRecord>;
}
