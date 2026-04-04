import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  ClassDefinition,
  DatasetVersion,
  RulesCatalog,
  RulesRef,
} from "@/server/ports/rules-catalog";

function createClass(ref: RulesRef): ClassDefinition {
  return {
    ref,
    payload: {},
  };
}

function createContractFixtureCatalog(): RulesCatalog {
  const classes = [
    createClass({ name: "Bard", source: "PHB" }),
    createClass({ name: "Cleric", source: "PHB" }),
  ];

  const datasetVersion: DatasetVersion = {
    provider: "derived",
    fingerprint: "sha256:fixture",
  };

  return {
    classes: {
      async get(ref) {
        return (
          classes.find(
            (candidate) =>
              candidate.ref.name === ref.name && candidate.ref.source === ref.source,
          ) ?? null
        );
      },
      async list() {
        return classes;
      },
    },
    subclasses: {
      async get() {
        return null;
      },
      async listByClass() {
        return [];
      },
    },
    races: {
      async get() {
        return null;
      },
      async list() {
        return [];
      },
    },
    backgrounds: {
      async get() {
        return null;
      },
      async list() {
        return [];
      },
    },
    spells: {
      async get() {
        return null;
      },
      async list() {
        return [];
      },
    },
    feats: {
      async get() {
        return null;
      },
      async list() {
        return [];
      },
    },
    features: {
      async resolve() {
        return null;
      },
    },
    async getDatasetVersion() {
      return datasetVersion;
    },
  };
}

describe("RulesCatalog contract", () => {
  it("returns null for missing entities", async () => {
    const catalog = createContractFixtureCatalog();

    const result = await catalog.classes.get({
      name: "Druid",
      source: "PHB",
    });

    assert.equal(result, null);
  });

  it("returns deterministic dataset metadata", async () => {
    const catalog = createContractFixtureCatalog();

    const firstVersion = await catalog.getDatasetVersion();
    const secondVersion = await catalog.getDatasetVersion();

    assert.deepEqual(firstVersion, secondVersion);
    assert.equal(firstVersion.provider, "derived");
  });
});
