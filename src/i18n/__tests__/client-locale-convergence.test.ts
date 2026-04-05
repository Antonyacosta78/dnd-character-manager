import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import {
  determineLocaleConvergence,
  getCookieValue,
  syncClientLocalePreference,
} from "@/i18n/client-locale-convergence";

describe("determineLocaleConvergence", () => {
  it("returns cookie update when localStorage locale is valid and differs", () => {
    const result = determineLocaleConvergence({
      cookieLocale: "en",
      localStorageLocale: "es",
    });

    assert.deepEqual(result, {
      nextCookieLocale: "es",
      shouldUpdateCookie: true,
    });
  });

  it("does not update when localStorage locale matches cookie", () => {
    const result = determineLocaleConvergence({
      cookieLocale: "es",
      localStorageLocale: "es",
    });

    assert.deepEqual(result, {
      nextCookieLocale: null,
      shouldUpdateCookie: false,
    });
  });

  it("does not update when localStorage locale is invalid", () => {
    const result = determineLocaleConvergence({
      cookieLocale: "en",
      localStorageLocale: "fr",
    });

    assert.deepEqual(result, {
      nextCookieLocale: null,
      shouldUpdateCookie: false,
    });
  });
});

describe("syncClientLocalePreference", () => {
  it("writes localStorage locale into cookie when mismatch exists", () => {
    let writtenLocale: string | null = null;

    const result = syncClientLocalePreference({
      getCookieHeader: () => "dcm-locale=en; session=abc",
      getLocalStorageLocale: () => "es",
      setCookieLocale: (locale) => {
        writtenLocale = locale;
      },
    });

    assert.equal(writtenLocale, "es");
    assert.deepEqual(result, {
      nextCookieLocale: "es",
      shouldUpdateCookie: true,
    });
  });

  it("does not write cookie when convergence says no update", () => {
    let writeCount = 0;

    const result = syncClientLocalePreference({
      getCookieHeader: () => "dcm-locale=es",
      getLocalStorageLocale: () => "es",
      setCookieLocale: () => {
        writeCount += 1;
      },
    });

    assert.equal(writeCount, 0);
    assert.equal(result.shouldUpdateCookie, false);
  });
});

describe("getCookieValue", () => {
  it("returns cookie value when key exists", () => {
    const cookieValue = getCookieValue("session=abc; dcm-locale=es", "dcm-locale");

    assert.equal(cookieValue, "es");
  });

  it("returns null when cookie key is absent", () => {
    const cookieValue = getCookieValue("session=abc", "dcm-locale");

    assert.equal(cookieValue, null);
  });
});
