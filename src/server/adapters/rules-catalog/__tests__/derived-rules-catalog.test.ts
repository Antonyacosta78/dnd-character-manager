import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createDerivedRulesCatalog } from "@/server/adapters/rules-catalog/derived-rules-catalog";

describe("createDerivedRulesCatalog", () => {
  it("invalidates process-local cache when active fingerprint changes", async () => {
    let runtime = {
      activeCatalogVersion: {
        id: "v1",
        datasetFingerprint: "sha256:one",
        datasetLabel: null,
        publishedAt: null,
      },
    };

    let entityReads = 0;

    const db = {
      catalogRuntimeState: {
        async findUnique() {
          return runtime;
        },
      },
      catalogEntity: {
        async findMany(args: { where: { catalogVersionId: string } }) {
          entityReads += 1;

          if (args.where.catalogVersionId === "v1") {
            return [
              {
                name: "Bard",
                source: "PHB",
                payloadJson: JSON.stringify({ name: "Bard", source: "PHB" }),
              },
            ];
          }

          return [
            {
              name: "Cleric",
              source: "PHB",
              payloadJson: JSON.stringify({ name: "Cleric", source: "PHB" }),
            },
          ];
        },
        async findFirst() {
          return null;
        },
      },
      catalogSpellSourceEdge: {
        async findMany() {
          return [];
        },
      },
    };

    const catalog = createDerivedRulesCatalog(db as never);

    const first = await catalog.classes.list();
    const second = await catalog.classes.list();

    assert.equal(first[0]?.ref.name, "Bard");
    assert.equal(second[0]?.ref.name, "Bard");
    assert.equal(entityReads, 1);

    runtime = {
      activeCatalogVersion: {
        id: "v2",
        datasetFingerprint: "sha256:two",
        datasetLabel: null,
        publishedAt: null,
      },
    };

    const third = await catalog.classes.list();
    assert.equal(third[0]?.ref.name, "Cleric");
    assert.equal(entityReads, 2);
  });

  it("returns empty list when classRefs filter resolves to no spell edges", async () => {
    const db = {
      catalogRuntimeState: {
        async findUnique() {
          return {
            activeCatalogVersion: {
              id: "v1",
              datasetFingerprint: "sha256:one",
              datasetLabel: null,
              publishedAt: null,
            },
          };
        },
      },
      catalogEntity: {
        async findMany() {
          return [
            {
              name: "Magic Missile",
              source: "PHB",
              payloadJson: JSON.stringify({
                name: "Magic Missile",
                source: "PHB",
                level: 1,
              }),
            },
          ];
        },
        async findFirst() {
          return null;
        },
      },
      catalogSpellSourceEdge: {
        async findMany() {
          return [];
        },
      },
    };

    const catalog = createDerivedRulesCatalog(db as never);
    const spells = await catalog.spells.list({
      classRefs: [{ name: "Nope", source: "PHB" }],
    });

    assert.equal(spells.length, 0);
  });
});
