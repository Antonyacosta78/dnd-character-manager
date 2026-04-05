import type { NormalizedDataSource } from "@/server/import/parser-types";
import type { ImportIssue } from "@/server/import/types";
import type { RulesProviderKind } from "@/server/ports/rules-catalog";

export interface PublishCatalogPhase1Input {
  providerKind: RulesProviderKind;
  datasetFingerprint: string;
  importerVersion: string;
  normalized: NormalizedDataSource;
  runId: string;
}

export interface PublishCatalogPhase1Result {
  catalogVersionId: string;
}

export interface ActivatePublishedCatalogInput {
  catalogVersionId: string;
  datasetFingerprint: string;
  runId: string;
  activatedByUserId?: string | null;
  reason?: string | null;
}

export interface RecoverPendingActivationInput {
  runId: string;
  activatedByUserId?: string | null;
  reason?: string | null;
}

export interface CatalogPublishRepository {
  recoverPendingActivation(
    input: RecoverPendingActivationInput,
  ): Promise<{ catalogVersionId: string } | null>;
  publishPhase1(input: PublishCatalogPhase1Input): Promise<PublishCatalogPhase1Result>;
  activatePublishedCatalog(input: ActivatePublishedCatalogInput): Promise<void>;
}

export class CatalogPayloadOverflowError extends Error {
  readonly issues: ImportIssue[];

  constructor(issues: ImportIssue[]) {
    super("One or more canonical rows exceed payloadJson size limit.");
    this.name = "CatalogPayloadOverflowError";
    this.issues = issues;
  }
}

export class CatalogActivationGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogActivationGuardError";
  }
}

export class CatalogVersionLockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogVersionLockError";
  }
}
