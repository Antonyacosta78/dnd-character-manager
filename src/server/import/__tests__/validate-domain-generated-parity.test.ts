import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  NormalizedDataSource,
  ResolvedSpellSourceEdge,
} from "@/server/import/parser-types";
import { validateDomain } from "@/server/import/validate-domain/validate-domain";

function createNormalizedFixture(args: {
  spellSourceEdges?: ResolvedSpellSourceEdge[];
  generatedSubclassLookup?: unknown;
  generatedSpellSourceLookup?: unknown;
}): NormalizedDataSource {
  return {
    entities: [],
    spellSourceEdges: args.spellSourceEdges ?? [],
    featureReferences: [],
    unresolvedReferences: [],
    unsupportedAdditionalSpells: [],
    generatedSubclassLookup: args.generatedSubclassLookup,
    generatedSpellSourceLookup: args.generatedSpellSourceLookup,
    diagnostics: [],
  };
}

function baseClassEdge(lineage?: {
  definedInSource?: string;
  definedInSources?: string[];
}): ResolvedSpellSourceEdge {
  return {
    spellName: "Magic Missile",
    spellSource: "PHB",
    grantType: "class",
    ownerName: "Wizard",
    ownerSource: "PHB",
    provenanceFilePath: "spells/sources.json",
    ...(lineage?.definedInSource ? { definedInSource: lineage.definedInSource } : {}),
    ...(lineage?.definedInSources ? { definedInSources: lineage.definedInSources } : {}),
  };
}

describe("validate_domain generated semantic parity", () => {
  it("treats boolean and object markers as semantic equivalents", () => {
    const normalized = createNormalizedFixture({
      spellSourceEdges: [baseClassEdge()],
      generatedSpellSourceLookup: {
        phb: {
          "magic missile": {
            class: {
              PHB: {
                Wizard: {
                  name: "Wizard",
                },
              },
            },
          },
        },
      },
    });

    const result = validateDomain(normalized, "strict");

    assert.equal(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" ||
          diagnostic.code === "PARSER_UNMODELED_SEMANTIC_CASE",
      ),
      false,
    );
  });

  it("keeps decorative metadata-only unknown keys non-blocking", () => {
    const normalized = createNormalizedFixture({
      spellSourceEdges: [baseClassEdge()],
      generatedSpellSourceLookup: {
        phb: {
          "magic missile": {
            class: {
              PHB: {
                Wizard: {
                  displayName: "The Wizard",
                },
              },
            },
          },
        },
      },
    });

    const result = validateDomain(normalized, "strict");

    assert.equal(
      result.diagnostics.some((diagnostic) => diagnostic.severity === "error"),
      false,
    );

    const decorative = result.diagnostics.find(
      (diagnostic) =>
        diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" &&
        diagnostic.details?.mismatchCategory === "unmodeled_case" &&
        diagnostic.details?.recommendedNextAction === "debug_only",
    );

    assert.ok(decorative);
  });

  it("fails strict mode on missing semantic edges", () => {
    const normalized = createNormalizedFixture({
      spellSourceEdges: [baseClassEdge()],
      generatedSpellSourceLookup: {
        phb: {
          "magic missile": {
            class: {
              PHB: {},
            },
          },
        },
      },
    });

    const result = validateDomain(normalized, "strict");
    const mismatch = result.diagnostics.find(
      (diagnostic) =>
        diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" &&
        diagnostic.details?.mismatchCategory === "missing",
    );

    assert.ok(mismatch);
    assert.equal(mismatch.severity, "error");
  });

  it("fails strict mode on extra semantic edges", () => {
    const normalized = createNormalizedFixture({
      generatedSpellSourceLookup: {
        phb: {
          "magic missile": {
            class: {
              PHB: {
                Wizard: true,
              },
            },
          },
        },
      },
    });

    const result = validateDomain(normalized, "strict");
    const mismatch = result.diagnostics.find(
      (diagnostic) =>
        diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" &&
        diagnostic.details?.mismatchCategory === "extra",
    );

    assert.ok(mismatch);
    assert.equal(mismatch.severity, "error");
  });

  it("fails strict mode on lineage mismatch when lineage fields are present", () => {
    const normalized = createNormalizedFixture({
      spellSourceEdges: [
        baseClassEdge({
          definedInSource: "PHB",
          definedInSources: ["PHB", "XGE"],
        }),
      ],
      generatedSpellSourceLookup: {
        phb: {
          "magic missile": {
            class: {
              PHB: {
                Wizard: {
                  definedInSource: "PHB",
                  definedInSources: ["PHB"],
                },
              },
            },
          },
        },
      },
    });

    const result = validateDomain(normalized, "strict");
    const mismatch = result.diagnostics.find(
      (diagnostic) =>
        diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" &&
        diagnostic.details?.mismatchCategory === "lineage",
    );

    assert.ok(mismatch);
    assert.equal(mismatch.severity, "error");
  });

  it("emits dedicated unmodeled semantic-critical case code and blocks strict mode", () => {
    const normalized = createNormalizedFixture({
      generatedSpellSourceLookup: {
        phb: {
          "magic missile": {
            mysteryGrant: {
              PHB: {
                Wizard: true,
              },
            },
          },
        },
      },
    });

    const result = validateDomain(normalized, "strict");

    assert.ok(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PARSER_UNMODELED_SEMANTIC_CASE" && diagnostic.severity === "error",
      ),
    );
    assert.ok(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" &&
          diagnostic.details?.mismatchCategory === "unmodeled_case",
      ),
    );
  });

  it("honors strict/warn/off integrity mode behavior for semantic parity", () => {
    const normalized = createNormalizedFixture({
      spellSourceEdges: [baseClassEdge()],
      generatedSpellSourceLookup: {
        phb: {
          "magic missile": {
            class: {
              PHB: {},
            },
          },
        },
      },
    });

    const strictResult = validateDomain(normalized, "strict");
    const warnResult = validateDomain(normalized, "warn");
    const offResult = validateDomain(normalized, "off");

    assert.ok(
      strictResult.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" && diagnostic.severity === "error",
      ),
    );

    assert.ok(
      warnResult.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" && diagnostic.severity === "warn",
      ),
    );

    assert.equal(
      offResult.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" ||
          diagnostic.code === "PARSER_UNMODELED_SEMANTIC_CASE",
      ),
      false,
    );
  });

  it("adds structural debug summary only when PARSER_PARITY_DEBUG_SHAPE_DIFF=1", () => {
    const previous = process.env.PARSER_PARITY_DEBUG_SHAPE_DIFF;
    process.env.PARSER_PARITY_DEBUG_SHAPE_DIFF = "1";

    try {
      const normalized = createNormalizedFixture({
        spellSourceEdges: [baseClassEdge()],
        generatedSpellSourceLookup: {
          phb: {
            "magic missile": {
              class: {
                PHB: {},
              },
            },
          },
        },
      });

      const result = validateDomain(normalized, "warn");
      const mismatch = result.diagnostics.find(
        (diagnostic) =>
          diagnostic.code === "PARSER_GENERATED_LOOKUP_MISMATCH" &&
          diagnostic.details?.mismatchCategory === "missing",
      );

      assert.ok(mismatch);
      assert.ok(mismatch.details?.shapeDiffSummary);
    } finally {
      if (previous === undefined) {
        delete process.env.PARSER_PARITY_DEBUG_SHAPE_DIFF;
      } else {
        process.env.PARSER_PARITY_DEBUG_SHAPE_DIFF = previous;
      }
    }
  });
});
