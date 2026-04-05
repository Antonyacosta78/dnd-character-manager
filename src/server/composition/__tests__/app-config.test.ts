import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import { AppConfigError, readAppConfig } from "@/server/composition/app-config";

const REQUIRED_ENV = {
  DATABASE_URL: "file:./prisma/dev.db",
  EXTERNAL_DATA_PATH: "./external/5etools/data",
  IMPORTER_VERSION: "foundation-v1",
};

describe("readAppConfig", () => {
  it("reads required environment variables", () => {
    const config = readAppConfig(REQUIRED_ENV);

    assert.equal(config.rulesProvider, "derived");
    assert.equal(config.dataIntegrityMode, "strict");
    assert.equal(config.databaseUrl, "file:./prisma/dev.db");
    assert.match(config.externalDataPath, /external/);
    assert.match(config.externalDataPath, /5etools/);
    assert.equal(config.importerVersion, "foundation-v1");
    assert.equal(config.observability.enabled, false);
    assert.equal(config.observability.environment, "development");
    assert.equal(config.observability.sentry.serverCaptureEnabled, false);
    assert.equal(config.observability.sentry.clientCaptureEnabled, false);
    assert.ok(config.observability.release.length > 0);
  });

  it("defaults observability enabled in staging and production", () => {
    const staging = readAppConfig({
      ...REQUIRED_ENV,
      APP_ENV: "staging",
    });
    const production = readAppConfig({
      ...REQUIRED_ENV,
      NODE_ENV: "production",
      VERCEL_ENV: "production",
    });

    assert.equal(staging.observability.enabled, true);
    assert.equal(staging.observability.environment, "staging");
    assert.equal(production.observability.enabled, true);
    assert.equal(production.observability.environment, "production");
  });

  it("uses commit SHA as release when available", () => {
    const config = readAppConfig({
      ...REQUIRED_ENV,
      VERCEL_GIT_COMMIT_SHA: "abc123",
    });

    assert.equal(config.observability.release, "abc123");
  });

  it("rejects invalid OBSERVABILITY_ENABLED values", () => {
    assert.throws(
      () =>
        readAppConfig({
          ...REQUIRED_ENV,
          OBSERVABILITY_ENABLED: "maybe",
        }),
      AppConfigError,
    );
  });

  it("rejects invalid Sentry DSN values", () => {
    assert.throws(
      () =>
        readAppConfig({
          ...REQUIRED_ENV,
          OBSERVABILITY_ENABLED: "true",
          SENTRY_DSN: "not-a-url",
        }),
      AppConfigError,
    );
  });

  it("throws when required environment variables are missing", () => {
    assert.throws(() => readAppConfig({}), AppConfigError);

    try {
      readAppConfig({});
    } catch (error) {
      if (!(error instanceof AppConfigError)) {
        throw error;
      }

      assert.equal(error.code, "REQUEST_VALIDATION_FAILED");
      assert.equal(error.message, "Missing required environment variable: DATABASE_URL.");
    }
  });

  it("rejects unsupported raw provider", () => {
    assert.throws(
      () => readAppConfig({ ...REQUIRED_ENV, RULES_PROVIDER: "raw" }),
      AppConfigError,
    );

    try {
      readAppConfig({ ...REQUIRED_ENV, RULES_PROVIDER: "raw" });
    } catch (error) {
      if (!(error instanceof AppConfigError)) {
        throw error;
      }

      assert.equal(error.code, "RULES_PROVIDER_UNSUPPORTED");
    }
  });

  it("rejects invalid data integrity mode", () => {
    assert.throws(
      () =>
      readAppConfig({
        ...REQUIRED_ENV,
        DATA_INTEGRITY_MODE: "casual-mode",
      }),
      AppConfigError,
    );
  });
});
