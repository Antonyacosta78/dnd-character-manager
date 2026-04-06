import * as Sentry from "@sentry/nextjs";

const environment = process.env.SENTRY_ENVIRONMENT?.trim() || process.env.VERCEL_ENV?.trim() || "development";
const dsn = process.env.SENTRY_DSN?.trim();
const enabled =
  process.env.OBSERVABILITY_ENABLED?.trim().toLowerCase() === "true" ||
  (!(process.env.OBSERVABILITY_ENABLED?.trim()) && (environment === "staging" || environment === "production"));

if (dsn && enabled) {
  Sentry.init({
    dsn,
    environment,
    release:
      process.env.SENTRY_RELEASE?.trim() ||
      process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
      process.env.GIT_COMMIT_SHA?.trim(),
  });
}
