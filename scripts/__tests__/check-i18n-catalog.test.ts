import assert from "node:assert/strict";
import { describe, it } from "bun:test";

import {
  collectMessageKeys,
  validateCatalogParity,
} from "../check-i18n-catalog";

describe("collectMessageKeys", () => {
  it("flattens nested message objects into dot-path keys", () => {
    const keys = collectMessageKeys({
      home: {
        title: "Hello",
        subtitle: "World",
      },
      appName: "Test",
    });

    assert.deepEqual([...keys].sort(), ["appName", "home.subtitle", "home.title"]);
  });
});

describe("validateCatalogParity", () => {
  const requiredNamespaces = ["common"] as const;

  it("reports missing keys against default locale", () => {
    const issues = validateCatalogParity(
      {
        en: {
          common: {
            appName: "App",
            homeTitle: "Title",
          },
        },
        es: {
          common: {
            appName: "Aplicación",
          },
        },
      },
      "en",
      requiredNamespaces,
    );

    assert.deepEqual(issues, ["[es/common] missing keys: homeTitle"]);
  });

  it("reports extra keys relative to default locale", () => {
    const issues = validateCatalogParity(
      {
        en: {
          common: {
            appName: "App",
          },
        },
        es: {
          common: {
            appName: "Aplicación",
            bonus: "Extra",
          },
        },
      },
      "en",
      requiredNamespaces,
    );

    assert.deepEqual(issues, ["[es/common] extra keys: bonus"]);
  });
});
