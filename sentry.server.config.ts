import * as Sentry from "@sentry/nextjs";

function resolveEnvironment(): string {
  const explicit = process.env.SENTRY_ENVIRONMENT?.trim();

  if (explicit) {
    return explicit;
  }

  const appEnv = process.env.APP_ENV?.trim().toLowerCase();

  if (appEnv === "staging" || appEnv === "production" || appEnv === "development" || appEnv === "test") {
    return appEnv;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();

  if (vercelEnv === "preview") {
    return "staging";
  }

  if (vercelEnv === "production") {
    return "production";
  }

  if (vercelEnv === "development") {
    return "development";
  }

  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function isObservabilityEnabled(environment: string): boolean {
  const explicit = process.env.OBSERVABILITY_ENABLED?.trim().toLowerCase();

  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  return environment === "staging" || environment === "production";
}

const environment = resolveEnvironment();
const dsn = process.env.SENTRY_DSN?.trim();

if (dsn && isObservabilityEnabled(environment)) {
  Sentry.init({
    dsn,
    environment,
    release:
      process.env.SENTRY_RELEASE?.trim() ||
      process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
      process.env.GIT_COMMIT_SHA?.trim(),
  });
}
