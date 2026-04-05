import path from "node:path";

import type {
  DataIntegrityMode,
  RulesProviderKind,
} from "@/server/ports/rules-catalog";
import packageJson from "../../../package.json";

export type NodeEnv = "development" | "test" | "production";

export interface AppConfig {
  rulesProvider: RulesProviderKind;
  dataIntegrityMode: DataIntegrityMode;
  nodeEnv: NodeEnv;
  databaseUrl: string;
  externalDataPath: string;
  importerVersion: string;
  observability: ObservabilityConfig;
}

export interface ObservabilityConfig {
  enabled: boolean;
  environment: string;
  release: string;
  sentry: {
    dsn?: string;
    clientDsn?: string;
    serverCaptureEnabled: boolean;
    clientCaptureEnabled: boolean;
  };
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

function parseBooleanEnv(value: string | undefined, key: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new AppConfigError(
    "REQUEST_VALIDATION_FAILED",
    `Invalid ${key} value '${value}'. Expected one of: true, false.`,
  );
}

function parseOptionalUrl(value: string | undefined, key: string): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmed);
  } catch {
    throw new AppConfigError(
      "REQUEST_VALIDATION_FAILED",
      `Invalid ${key} value '${value}'. Expected a valid URL.`,
    );
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new AppConfigError(
      "REQUEST_VALIDATION_FAILED",
      `Invalid ${key} protocol '${parsedUrl.protocol}'. Expected http or https.`,
    );
  }

  return trimmed;
}

function resolveObservabilityEnvironment(env: AppEnvironment, nodeEnv: NodeEnv): string {
  const explicit = env.SENTRY_ENVIRONMENT?.trim();

  if (explicit) {
    return explicit;
  }

  const appEnv = env.APP_ENV?.trim().toLowerCase();

  if (appEnv === "staging" || appEnv === "production" || appEnv === "development" || appEnv === "test") {
    return appEnv;
  }

  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnv === "preview") {
    return "staging";
  }

  if (vercelEnv === "production") {
    return "production";
  }

  if (vercelEnv === "development") {
    return "development";
  }

  return nodeEnv;
}

function resolveObservabilityEnabled(
  explicitValue: boolean | undefined,
  environment: string,
): boolean {
  if (explicitValue !== undefined) {
    return explicitValue;
  }

  return environment === "staging" || environment === "production";
}

function resolveObservabilityRelease(env: AppEnvironment): string {
  const explicitRelease = env.SENTRY_RELEASE?.trim();

  if (explicitRelease) {
    return explicitRelease;
  }

  const commitSha = env.VERCEL_GIT_COMMIT_SHA?.trim() || env.GIT_COMMIT_SHA?.trim();

  if (commitSha) {
    return commitSha;
  }

  return packageJson.version;
}

export function readObservabilityConfig(
  env: AppEnvironment = process.env,
  nodeEnv: NodeEnv = parseNodeEnv(env.NODE_ENV),
): ObservabilityConfig {
  const environment = resolveObservabilityEnvironment(env, nodeEnv);
  const explicitEnabled = parseBooleanEnv(env.OBSERVABILITY_ENABLED, "OBSERVABILITY_ENABLED");
  const enabled = resolveObservabilityEnabled(explicitEnabled, environment);
  const dsn = parseOptionalUrl(env.SENTRY_DSN, "SENTRY_DSN");
  const clientDsn = parseOptionalUrl(env.NEXT_PUBLIC_SENTRY_DSN, "NEXT_PUBLIC_SENTRY_DSN");

  return {
    enabled,
    environment,
    release: resolveObservabilityRelease(env),
    sentry: {
      dsn,
      clientDsn,
      serverCaptureEnabled: enabled && Boolean(dsn),
      clientCaptureEnabled: enabled && Boolean(clientDsn),
    },
  };
}

export function readAppConfig(env: AppEnvironment = process.env): AppConfig {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const databaseUrl = requireEnv(env, "DATABASE_URL");
  const externalDataPath = requireEnv(env, "EXTERNAL_DATA_PATH");
  const importerVersion = requireEnv(env, "IMPORTER_VERSION");

  return {
    rulesProvider: parseRulesProvider(env.RULES_PROVIDER),
    dataIntegrityMode: parseDataIntegrityMode(env.DATA_INTEGRITY_MODE),
    nodeEnv,
    databaseUrl,
    externalDataPath: path.resolve(externalDataPath),
    importerVersion,
    observability: readObservabilityConfig(env, nodeEnv),
  };
}
