import * as Sentry from "@sentry/nextjs";

function resolveEnvironment(): string {
  const explicit = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT?.trim();

  if (explicit) {
    return explicit;
  }

  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();

  if (appEnv === "staging" || appEnv === "production" || appEnv === "development") {
    return appEnv;
  }

  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function isObservabilityEnabled(environment: string): boolean {
  const explicit = process.env.NEXT_PUBLIC_OBSERVABILITY_ENABLED?.trim().toLowerCase();

  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  return environment === "staging" || environment === "production";
}

const environment = resolveEnvironment();
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn && isObservabilityEnabled(environment)) {
  Sentry.init({
    dsn,
    environment,
    release:
      process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() ||
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.trim(),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
