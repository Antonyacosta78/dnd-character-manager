import path from "node:path";

import type {
  DataIntegrityMode,
  RulesProviderKind,
} from "@/server/ports/rules-catalog";

export type NodeEnv = "development" | "test" | "production";

export interface AppConfig {
  rulesProvider: RulesProviderKind;
  dataIntegrityMode: DataIntegrityMode;
  nodeEnv: NodeEnv;
  databaseUrl: string;
  externalDataPath: string;
  importerVersion: string;
}

export type AppEnvironment = Readonly<Record<string, string | undefined>>;

export type AppConfigErrorCode =
  | "REQUEST_VALIDATION_FAILED"
  | "RULES_PROVIDER_UNSUPPORTED";

export class AppConfigError extends Error {
  readonly code: AppConfigErrorCode;

  constructor(code: AppConfigErrorCode, message: string) {
    super(message);
    this.name = "AppConfigError";
    this.code = code;
  }
}

const VALID_DATA_INTEGRITY_MODES: DataIntegrityMode[] = ["strict", "warn", "off"];

function requireEnv(
  env: AppEnvironment,
  key: "DATABASE_URL" | "EXTERNAL_DATA_PATH" | "IMPORTER_VERSION",
): string {
  const value = env[key]?.trim();

  if (!value) {
    throw new AppConfigError(
      "REQUEST_VALIDATION_FAILED",
      `Missing required environment variable: ${key}.`,
    );
  }

  return value;
}

function parseRulesProvider(value: string | undefined): RulesProviderKind {
  const provider = (value ?? "derived").toLowerCase();

  if (provider === "raw") {
    throw new AppConfigError(
      "RULES_PROVIDER_UNSUPPORTED",
      "RULES_PROVIDER=raw is not supported in foundation v1. Use RULES_PROVIDER=derived.",
    );
  }

  if (provider !== "derived") {
    throw new AppConfigError(
      "REQUEST_VALIDATION_FAILED",
      `Invalid RULES_PROVIDER value '${value}'. Expected: derived.`,
    );
  }

  return provider;
}

function parseDataIntegrityMode(value: string | undefined): DataIntegrityMode {
  const mode = (value ?? "strict").toLowerCase();

  if (!VALID_DATA_INTEGRITY_MODES.includes(mode as DataIntegrityMode)) {
    throw new AppConfigError(
      "REQUEST_VALIDATION_FAILED",
      `Invalid DATA_INTEGRITY_MODE value '${value}'. Expected one of: strict, warn, off.`,
    );
  }

  return mode as DataIntegrityMode;
}

function parseNodeEnv(value: string | undefined): NodeEnv {
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }

  return "development";
}

export function readAppConfig(env: AppEnvironment = process.env): AppConfig {
  const databaseUrl = requireEnv(env, "DATABASE_URL");
  const externalDataPath = requireEnv(env, "EXTERNAL_DATA_PATH");
  const importerVersion = requireEnv(env, "IMPORTER_VERSION");

  return {
    rulesProvider: parseRulesProvider(env.RULES_PROVIDER),
    dataIntegrityMode: parseDataIntegrityMode(env.DATA_INTEGRITY_MODE),
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    databaseUrl,
    externalDataPath: path.resolve(externalDataPath),
    importerVersion,
  };
}
