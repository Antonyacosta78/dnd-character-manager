import type {
  DataIntegrityMode,
  RulesProviderKind,
} from "@/server/ports/rules-catalog";

export type CatalogVersionStatus =
  | "draft"
  | "validated"
  | "published"
  | "failed"
  | "retired";

export type CatalogIntegrityStatus = "ok" | "warn" | "mismatch";

export interface CatalogVersionRecord {
  id: string;
  providerKind: RulesProviderKind;
  datasetFingerprint: string;
  datasetLabel: string | null;
  sourceRef: string | null;
  importerVersion: string;
  status: CatalogVersionStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  validatedAt: Date | null;
  publishedAt: Date | null;
}

export interface CatalogRuntimeStateRecord {
  id: 1;
  activeCatalogVersionId: string | null;
  lastIntegrityCheckAt: Date | null;
  lastIntegrityStatus: CatalogIntegrityStatus | null;
  lastIntegrityMessage: string | null;
  dataIntegrityMode: DataIntegrityMode;
  updatedAt: Date;
}

export interface CatalogActivationEventRecord {
  id: string;
  fromCatalogVersionId: string | null;
  toCatalogVersionId: string;
  runId: string | null;
  activatedByUserId: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface CreateCatalogVersionInput {
  id?: string;
  providerKind: RulesProviderKind;
  datasetFingerprint: string;
  datasetLabel?: string | null;
  sourceRef?: string | null;
  importerVersion: string;
  status?: CatalogVersionStatus;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateCatalogVersionStatusInput {
  versionId: string;
  status: CatalogVersionStatus;
}

export interface SetCatalogRuntimeStateInput {
  activeCatalogVersionId: string | null;
  lastIntegrityCheckAt?: Date | null;
  lastIntegrityStatus?: CatalogIntegrityStatus | null;
  lastIntegrityMessage?: string | null;
  dataIntegrityMode?: DataIntegrityMode;
}

export interface RecordCatalogActivationEventInput {
  id?: string;
  fromCatalogVersionId: string | null;
  toCatalogVersionId: string;
  runId?: string | null;
  activatedByUserId?: string | null;
  reason?: string | null;
}

export interface ActivateCatalogVersionInput {
  toCatalogVersionId: string;
  runId?: string | null;
  activatedByUserId?: string | null;
  reason?: string | null;
}

export interface CatalogVersionRepository {
  findByLineage(args: {
    providerKind: RulesProviderKind;
    datasetFingerprint: string;
    importerVersion: string;
  }): Promise<CatalogVersionRecord | null>;
  createVersion(input: CreateCatalogVersionInput): Promise<CatalogVersionRecord>;
  updateVersionStatus(
    input: UpdateCatalogVersionStatusInput,
  ): Promise<CatalogVersionRecord>;
  getRuntimeState(): Promise<CatalogRuntimeStateRecord | null>;
  setRuntimeState(
    input: SetCatalogRuntimeStateInput,
  ): Promise<CatalogRuntimeStateRecord>;
  recordActivationEvent(
    input: RecordCatalogActivationEventInput,
  ): Promise<CatalogActivationEventRecord>;
  activateCatalogVersion(
    input: ActivateCatalogVersionInput,
  ): Promise<CatalogActivationEventRecord>;
}
