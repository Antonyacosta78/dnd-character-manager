export const IMPORT_STAGES = [
  "sync",
  "fingerprint",
  "validate_source",
  "resolve",
  "normalize",
  "validate_domain",
  "publish",
] as const;

export type ImportStage = (typeof IMPORT_STAGES)[number];

export type ImportOutcome = "running" | "succeeded" | "failed" | "cancelled";

export type ImportIssueSeverity = "info" | "warn" | "error";

export const PARSER_REASON_CODES = [
  "PARSER_UNRESOLVED_REFERENCE",
  "PARSER_UNSUPPORTED_ADDITIONAL_SPELLS_SHAPE",
  "PARSER_META_DIRECTIVE_UNSUPPORTED",
  "PARSER_COPY_RESOLUTION_FAILED",
  "PARSER_GENERATED_LOOKUP_MISMATCH",
  "PARSER_IDENTITY_COLLISION",
] as const;

export type ParserReasonCode = (typeof PARSER_REASON_CODES)[number];

export interface ImportIssueDetails {
  [key: string]: unknown;
}

export interface ImportIssue {
  stage: ImportStage;
  severity: ImportIssueSeverity;
  code: string;
  message: string;
  filePath?: string;
  details?: ImportIssueDetails;
}

export type ImportStageDurations = Record<ImportStage, number>;

export type ImportIssueCounts = Record<ImportIssueSeverity, number>;

export interface ImportMetrics {
  stageDurationsMs: ImportStageDurations;
  entityCounts: Record<string, number>;
  issueCounts: ImportIssueCounts;
}

export interface ImportRunSummary {
  runId: string;
  outcome: ImportOutcome;
  catalogVersionId: string | null;
  datasetFingerprint: string | null;
  metrics: ImportMetrics;
  issues: ImportIssue[];
}

export function createEmptyStageDurations(): ImportStageDurations {
  return {
    sync: 0,
    fingerprint: 0,
    validate_source: 0,
    resolve: 0,
    normalize: 0,
    validate_domain: 0,
    publish: 0,
  };
}

export function createEmptyIssueCounts(): ImportIssueCounts {
  return {
    info: 0,
    warn: 0,
    error: 0,
  };
}
