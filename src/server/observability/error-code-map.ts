export const API_ERROR_CODES = [
  "AUTH_UNAUTHENTICATED",
  "AUTH_FORBIDDEN",
  "REQUEST_VALIDATION_FAILED",
  "RULES_CATALOG_UNAVAILABLE",
  "RULES_CATALOG_DATASET_MISMATCH",
  "RULES_PROVIDER_UNSUPPORTED",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof API_ERROR_CODES)[number];

const ERROR_CODE_SET = new Set<string>(API_ERROR_CODES);

export function normalizeErrorCode(candidate: unknown): ErrorCode {
  if (typeof candidate === "string" && ERROR_CODE_SET.has(candidate)) {
    return candidate as ErrorCode;
  }

  return "INTERNAL_ERROR";
}
