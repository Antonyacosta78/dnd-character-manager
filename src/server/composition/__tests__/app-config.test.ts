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
