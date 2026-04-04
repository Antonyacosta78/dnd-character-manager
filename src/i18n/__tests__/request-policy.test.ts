import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyMissingKeyPolicy,
  logResolvedRequestLocale,
} from "@/i18n/request-policy";

describe("applyMissingKeyPolicy", () => {
  it("throws in development when localized catalog is missing keys", () => {
    assert.throws(() =>
      applyMissingKeyPolicy({
        locale: "es",
        source: "accept-language",
        namespace: "common",
        localeMessages: {
          appName: "Aplicación",
        },
        defaultMessages: {
          appName: "App",
          homeTitle: "Home",
        },
        isProduction: false,
      }),
    );
  });

  it("falls back to default locale keys in production and emits diagnostics", () => {
    const diagnostics: string[] = [];

    const result = applyMissingKeyPolicy({
      locale: "es",
      source: "cookie",
      namespace: "common",
      localeMessages: {
        appName: "Aplicación",
      },
      defaultMessages: {
        appName: "App",
        homeTitle: "Home",
      },
      isProduction: true,
      logDiagnostic: (input) => {
        diagnostics.push(JSON.stringify(input));
      },
    });

    assert.deepEqual(result, {
      appName: "Aplicación",
      homeTitle: "Home",
    });
    assert.equal(diagnostics.length, 1);
  });
});

describe("logResolvedRequestLocale", () => {
  it("logs a structured locale resolution payload", () => {
    let loggedMessage = "";

    logResolvedRequestLocale({
      locale: "es",
      source: "cookie",
      log: (message) => {
        loggedMessage = message;
      },
    });

    assert.equal(
      loggedMessage,
      JSON.stringify({
        event: "i18n.locale.resolved",
        locale: "es",
        source: "cookie",
      }),
    );
  });
});
