import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { resolveLocale } from "@/i18n/resolve-locale";

describe("resolveLocale", () => {
  it("returns cookie locale when cookie value is supported", () => {
    const result = resolveLocale({
      cookieLocale: "es",
      clientStoredLocale: "en",
      acceptLanguageHeader: "en-US,en;q=0.8",
    });

    assert.deepEqual(result, {
      locale: "es",
      source: "cookie",
    });
  });

  it("falls back to localStorage when cookie locale is invalid", () => {
    const result = resolveLocale({
      cookieLocale: "fr",
      clientStoredLocale: "es",
      acceptLanguageHeader: "en-US,en;q=0.8",
    });

    assert.deepEqual(result, {
      locale: "es",
      source: "localStorage",
    });
  });

  it("ignores regional cookie values because persisted values must match allowlist", () => {
    const result = resolveLocale({
      cookieLocale: "es-MX",
      clientStoredLocale: null,
      acceptLanguageHeader: null,
    });

    assert.deepEqual(result, {
      locale: DEFAULT_LOCALE,
      source: "default",
    });
  });

  it("uses best Accept-Language match when persisted values are absent", () => {
    const result = resolveLocale({
      acceptLanguageHeader: "fr-CA;q=0.8, es-MX;q=0.9, en-US;q=0.7",
    });

    assert.deepEqual(result, {
      locale: "es",
      source: "accept-language",
    });
  });

  it("returns default locale for unsupported or malformed header", () => {
    const malformedResult = resolveLocale({
      acceptLanguageHeader: "fr;q=abc,en;q=oops",
    });

    assert.deepEqual(malformedResult, {
      locale: DEFAULT_LOCALE,
      source: "default",
    });

    const unsupportedResult = resolveLocale({
      acceptLanguageHeader: "fr-CA, de-DE;q=0.8",
    });

    assert.deepEqual(unsupportedResult, {
      locale: DEFAULT_LOCALE,
      source: "default",
    });
  });
});
