import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { normalizeDataSource } from "@/server/import/normalize/normalize-data-source";
import { resolveDataSource } from "@/server/import/resolve/resolve-data-source";
import { runImportPipeline } from "@/server/import/run-import-pipeline";
import { validateDomain } from "@/server/import/validate-domain/validate-domain";
import { validateDataSource } from "@/server/import/validate-source/validate-data-source";

interface FixtureData {
  classDoc?: Record<string, unknown>;
  spellsDoc?: Record<string, unknown>;
  spellSourcesDoc?: Record<string, unknown>;
  racesDoc?: Record<string, unknown>;
  backgroundsDoc?: Record<string, unknown>;
  featsDoc?: Record<string, unknown>;
  optionalfeaturesDoc?: Record<string, unknown>;
  generatedSubclassLookup?: Record<string, unknown>;
  generatedSpellSourceLookup?: Record<string, unknown>;
}

async function writeJson(rootPath: string, relativePath: string, value: unknown): Promise<void> {
  const absolutePath = path.join(rootPath, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, JSON.stringify(value, null, 2), "utf8");
}

async function createFixtureRoot(data: FixtureData = {}): Promise<string> {
  const rootPath = await mkdtemp(path.join(tmpdir(), "dcm-parser-"));

  const classDoc =
    data.classDoc ??
    ({
      _meta: { internalCopies: ["subclass", "subclassFeature"] },
      class: [
        {
          name: "Wizard",
          source: "PHB",
          classFeatures: ["Arcane Study|Wizard||1"],
        },
      ],
      subclass: [
        {
          name: "School of Test",
          shortName: "Test",
          source: "PHB",
          className: "Wizard",
          classSource: "PHB",
          subclassFeatures: ["Subclass Test|Wizard||Test||1"],
        },
      ],
      classFeature: [
        {
          name: "Arcane Study",
          source: "PHB",
          className: "Wizard",
          classSource: "PHB",
          level: 1,
        },
      ],
      subclassFeature: [
        {
          name: "Subclass Test",
          source: "PHB",
          className: "Wizard",
          classSource: "PHB",
          subclassShortName: "Test",
          subclassSource: "PHB",
          level: 1,
        },
      ],
    } satisfies Record<string, unknown>);

  const spellsDoc =
    data.spellsDoc ??
    ({
      spell: [
        { name: "Magic Missile", source: "PHB", level: 1, school: "E" },
        { name: "Shield", source: "PHB", level: 1, school: "A" },
        { name: "Mage Armor", source: "PHB", level: 1, school: "A" },
      ],
    } satisfies Record<string, unknown>);

  const spellSourcesDoc =
    data.spellSourcesDoc ??
    ({
      PHB: {
        "Magic Missile": {
          class: [{ name: "Wizard", source: "PHB", definedInSource: "PHB" }],
        },
        Shield: {
          class: [{ name: "Wizard", source: "PHB" }],
        },
        "Mage Armor": {
          class: [{ name: "Wizard", source: "PHB" }],
        },
      },
    } satisfies Record<string, unknown>);

  await writeJson(rootPath, "class/index.json", { core: "class-core.json" });
  await writeJson(rootPath, "class/class-core.json", classDoc);
  await writeJson(rootPath, "spells/index.json", { PHB: "spells-phb.json" });
  await writeJson(rootPath, "spells/spells-phb.json", spellsDoc);
  await writeJson(rootPath, "spells/sources.json", spellSourcesDoc);
  await writeJson(rootPath, "races.json", data.racesDoc ?? { race: [] });
  await writeJson(rootPath, "backgrounds.json", data.backgroundsDoc ?? { background: [] });
  await writeJson(rootPath, "feats.json", data.featsDoc ?? { feat: [] });
  await writeJson(
    rootPath,
    "optionalfeatures.json",
    data.optionalfeaturesDoc ?? { optionalfeature: [] },
  );

  if (data.generatedSubclassLookup) {
    await writeJson(
      rootPath,
      "generated/gendata-subclass-lookup.json",
      data.generatedSubclassLookup,
    );
  }

  if (data.generatedSpellSourceLookup) {
    await writeJson(
      rootPath,
      "generated/gendata-spell-source-lookup.json",
      data.generatedSpellSourceLookup,
    );
  }

  return rootPath;
}

async function runParserStages(rootPath: string) {
  const validatedResult = await validateDataSource(rootPath);
  assert.ok(validatedResult.validatedDataSource, "fixture should pass validate_source stage");

  const resolved = await resolveDataSource(validatedResult.validatedDataSource);
  const normalized = normalizeDataSource(resolved);
  const domainValidation = validateDomain(normalized, "strict");

  return {
    validatedResult,
    resolved,
    normalized,
    domainValidation,
  };
}

describe("Data Source parser pipeline", () => {
  it("flags unsupported _meta directive shapes", async () => {
    const rootPath = await createFixtureRoot({
      classDoc: {
        _meta: {
          dependencies: ["PHB"],
        },
        class: [],
        subclass: [],
        classFeature: [],
        subclassFeature: [],
      },
    });

    try {
      const { resolved } = await runParserStages(rootPath);
      assert.ok(
        resolved.diagnostics.some(
          (diagnostic) => diagnostic.code === "PARSER_META_DIRECTIVE_UNSUPPORTED",
        ),
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("resolves recursive _copy chains and inherited additionalSpells", async () => {
    const rootPath = await createFixtureRoot({
      backgroundsDoc: {
        _meta: { internalCopies: ["background"] },
        background: [
          {
            name: "Base Sage",
            source: "PHB",
            entries: ["Base"],
            additionalSpells: [
              {
                expanded: {
                  s1: ["magic missile"],
                },
              },
            ],
          },
          {
            name: "Copied Sage",
            source: "HB1",
            _copy: {
              name: "Base Sage",
              source: "PHB",
              _mod: {
                entries: {
                  mode: "appendArr",
                  items: ["Copied"],
                },
              },
            },
          },
          {
            name: "Copied Sage Again",
            source: "HB2",
            _copy: {
              name: "Copied Sage",
              source: "HB1",
            },
          },
        ],
      },
    });

    try {
      const { resolved, domainValidation } = await runParserStages(rootPath);
      assert.equal(
        domainValidation.diagnostics.filter((diagnostic) => diagnostic.severity === "error").length,
        0,
      );

      const owners = resolved.spellSourceEdges
        .filter((edge) => edge.grantType === "background" && edge.spellName === "Magic Missile")
        .map((edge) => `${edge.ownerName}|${edge.ownerSource}`)
        .sort();

      assert.deepEqual(owners, ["Base Sage|PHB", "Copied Sage Again|HB2", "Copied Sage|HB1"]);
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("dereferences class and subclass feature UIDs from string and object forms", async () => {
    const rootPath = await createFixtureRoot({
      classDoc: {
        class: [
          {
            name: "Wizard",
            source: "PHB",
            classFeatures: [
              "Arcane Study|Wizard||1",
              { classFeature: "Arcane Study Two|Wizard||2|PHB", gainSubclassFeature: true },
            ],
          },
        ],
        subclass: [
          {
            name: "School of Test",
            shortName: "Test",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            subclassFeatures: [
              "Subclass Feature One|Wizard||Test||1",
              { subclassFeature: "Subclass Feature Two|Wizard||Test||2", required: true },
            ],
          },
        ],
        classFeature: [
          {
            name: "Arcane Study",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            level: 1,
          },
          {
            name: "Arcane Study Two",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            level: 2,
          },
        ],
        subclassFeature: [
          {
            name: "Subclass Feature One",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            subclassShortName: "Test",
            subclassSource: "PHB",
            level: 1,
          },
          {
            name: "Subclass Feature Two",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            subclassShortName: "Test",
            subclassSource: "PHB",
            level: 2,
          },
        ],
      },
    });

    try {
      const { resolved } = await runParserStages(rootPath);

      assert.equal(resolved.featureReferences.length, 4);
      assert.equal(
        resolved.unresolvedReferences.filter(
          (reference) =>
            reference.referenceKind === "classFeature" ||
            reference.referenceKind === "subclassFeature",
        ).length,
        0,
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("resolves subclass feature references with source-default and level-mismatch fallback", async () => {
    const rootPath = await createFixtureRoot({
      classDoc: {
        class: [
          {
            name: "Barbarian",
            source: "XPHB",
            classFeatures: [],
          },
        ],
        subclass: [
          {
            name: "Path of Berserker",
            shortName: "Berserker",
            source: "XPHB",
            className: "Barbarian",
            classSource: "XPHB",
            subclassFeatures: ["Intimidating Presence|Barbarian||Berserker||10"],
          },
        ],
        classFeature: [],
        subclassFeature: [
          {
            name: "Intimidating Presence",
            source: "XPHB",
            className: "Barbarian",
            classSource: "XPHB",
            subclassShortName: "Berserker",
            subclassSource: "XPHB",
            level: 14,
          },
        ],
      },
    });

    try {
      const { resolved } = await runParserStages(rootPath);

      assert.equal(
        resolved.unresolvedReferences.filter((reference) => reference.referenceKind === "subclassFeature")
          .length,
        0,
      );

      assert.equal(resolved.featureReferences.length, 1);
      assert.equal(
        resolved.featureReferences[0]?.featureUid,
        "Intimidating Presence|Barbarian|XPHB|Berserker|XPHB|14|XPHB",
      );

      const fallbackDiagnostic = resolved.diagnostics.find(
        (diagnostic) => diagnostic.code === "PARSER_FEATURE_REFERENCE_FALLBACK",
      );

      assert.ok(fallbackDiagnostic);
      assert.equal(fallbackDiagnostic.details?.strategy, "stable_identity");
      assert.equal(fallbackDiagnostic.details?.requestedLevel, 10);
      assert.equal(fallbackDiagnostic.details?.resolvedLevel, 14);
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("fails closed when stable-identity feature fallback is ambiguous", async () => {
    const rootPath = await createFixtureRoot({
      classDoc: {
        class: [
          {
            name: "Barbarian",
            source: "XPHB",
            classFeatures: [],
          },
        ],
        subclass: [
          {
            name: "Path of Berserker",
            shortName: "Berserker",
            source: "XPHB",
            className: "Barbarian",
            classSource: "XPHB",
            subclassFeatures: ["Unstable Rage|Barbarian|XPHB|Berserker|XPHB|11|XPHB"],
          },
        ],
        classFeature: [],
        subclassFeature: [
          {
            name: "Unstable Rage",
            source: "XPHB",
            className: "Barbarian",
            classSource: "XPHB",
            subclassShortName: "Berserker",
            subclassSource: "XPHB",
            level: 10,
          },
          {
            name: "Unstable Rage",
            source: "XPHB",
            className: "Barbarian",
            classSource: "XPHB",
            subclassShortName: "Berserker",
            subclassSource: "XPHB",
            level: 14,
          },
        ],
      },
    });

    try {
      const { resolved } = await runParserStages(rootPath);

      assert.equal(resolved.featureReferences.length, 0);
      assert.equal(
        resolved.unresolvedReferences.filter((reference) => reference.referenceKind === "subclassFeature")
          .length,
        1,
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("reconstructs spell-source parity from direct and additionalSpells contributors", async () => {
    const rootPath = await createFixtureRoot({
      classDoc: {
        class: [
          {
            name: "Wizard",
            source: "PHB",
            classFeatures: ["Arcane Study|Wizard||1"],
          },
        ],
        subclass: [
          {
            name: "School of Test",
            shortName: "Test",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            additionalSpells: [
              {
                expanded: {
                  "1": [{ all: "level=1|class=Wizard" }],
                },
              },
            ],
            subclassFeatures: ["Subclass Test|Wizard||Test||1"],
          },
        ],
        classFeature: [
          {
            name: "Arcane Study",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            level: 1,
          },
        ],
        subclassFeature: [
          {
            name: "Subclass Test",
            source: "PHB",
            className: "Wizard",
            classSource: "PHB",
            subclassShortName: "Test",
            subclassSource: "PHB",
            level: 1,
          },
        ],
      },
      featsDoc: {
        feat: [
          {
            name: "Spell Gift",
            source: "PHB",
            additionalSpells: [
              {
                known: {
                  "1": [{ choose: "level=1|class=Wizard" }],
                },
              },
            ],
          },
        ],
      },
      optionalfeaturesDoc: {
        optionalfeature: [
          {
            name: "Invocation Test",
            source: "PHB",
            additionalSpells: [
              {
                innate: {
                  _: [
                    {
                      choose: {
                        from: ["shield", "mage armor"],
                        count: 1,
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    try {
      const { resolved } = await runParserStages(rootPath);

      assert.ok(
        resolved.spellSourceEdges.some(
          (edge) => edge.grantType === "class" && edge.definedInSource === "PHB",
        ),
      );
      assert.ok(
        resolved.spellSourceEdges.some(
          (edge) => edge.grantType === "subclass" && edge.ownerName === "School of Test",
        ),
      );
      assert.ok(
        resolved.spellSourceEdges.some(
          (edge) => edge.grantType === "feat" && edge.ownerName === "Spell Gift",
        ),
      );
      assert.ok(
        resolved.spellSourceEdges.some(
          (edge) => edge.grantType === "optionalfeature" && edge.ownerName === "Invocation Test",
        ),
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("handles _mod.replaceTxt for array-based entries content", async () => {
    const rootPath = await createFixtureRoot({
      racesDoc: {
        race: [
          {
            name: "Goblin",
            source: "VGM",
            entries: [
              "Goblins are quick and nimble.",
              {
                type: "entries",
                name: "Lore",
                entries: ["Many goblins survive by wit."],
              },
            ],
          },
          {
            name: "Goblin (Dankwood)",
            source: "AWM",
            _copy: {
              name: "Goblin",
              source: "VGM",
              _mod: {
                entries: [
                  {
                    mode: "replaceTxt",
                    replace: "Goblins",
                    with: "Dankwood goblins",
                    flags: "i",
                  },
                ],
              },
            },
          },
        ],
      },
    });

    try {
      const { resolved, domainValidation } = await runParserStages(rootPath);

      assert.equal(
        domainValidation.diagnostics.filter((diagnostic) => diagnostic.severity === "error").length,
        0,
      );

      const copiedRace = resolved.entities.find(
        (entity) =>
          entity.kind === "race" &&
          entity.value.name === "Goblin (Dankwood)" &&
          entity.value.source === "AWM",
      );

      assert.ok(copiedRace);
      const copiedEntries = copiedRace.value.entries as unknown[];

      assert.ok(
        typeof copiedEntries[0] === "string" && copiedEntries[0].includes("Dankwood goblins"),
      );

      const loreEntry = copiedEntries[1] as Record<string, unknown>;
      const loreEntryText = (loreEntry.entries as unknown[])[0] as string;

      assert.ok(loreEntryText.includes("Dankwood goblins"));
      assert.equal(
        resolved.diagnostics.some(
          (diagnostic) =>
            diagnostic.code === "PARSER_COPY_RESOLUTION_FAILED" &&
            diagnostic.message.includes("replaceTxt cannot be applied to non-string path 'entries'"),
        ),
        false,
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("fails closed for unsupported choose object keys in additionalSpells", async () => {
    const rootPath = await createFixtureRoot({
      featsDoc: {
        feat: [
          {
            name: "Broken Choose Shape",
            source: "PHB",
            additionalSpells: [
              {
                known: {
                  "1": [
                    {
                      choose: {
                        fromGeneric: ["magic missile", "shield"],
                        count: 1,
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    try {
      const summary = await runImportPipeline({
        dataRootPath: rootPath,
        importerVersion: "test",
        integrityMode: "strict",
      });

      assert.equal(summary.outcome, "failed");

      const unsupportedIssue = summary.issues.find(
        (issue) => issue.code === "PARSER_UNSUPPORTED_ADDITIONAL_SPELLS_SHAPE",
      );

      assert.ok(unsupportedIssue);
      assert.ok(
        typeof unsupportedIssue.details?.reason === "string" &&
          unsupportedIssue.details.reason.includes("fromGeneric"),
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("accepts numeric additionalSpells metadata keys without unsupported-shape issues", async () => {
    const rootPath = await createFixtureRoot({
      featsDoc: {
        feat: [
          {
            name: "Counted Spell Choice",
            source: "PHB",
            additionalSpells: [
              {
                known: {
                  _: [
                    {
                      choose: {
                        from: ["shield", "mage armor"],
                        count: 1,
                      },
                      count: 2,
                      amount: 1,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    try {
      const summary = await runImportPipeline({
        dataRootPath: rootPath,
        importerVersion: "test",
        integrityMode: "strict",
      });

      assert.equal(summary.outcome, "succeeded");
      assert.equal(
        summary.issues.some(
          (issue) => issue.code === "PARSER_UNSUPPORTED_ADDITIONAL_SPELLS_SHAPE",
        ),
        false,
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("fails strict mode when generated parity files diverge", async () => {
    const rootPath = await createFixtureRoot({
      generatedSubclassLookup: {},
      generatedSpellSourceLookup: {},
    });

    try {
      const summary = await runImportPipeline({
        dataRootPath: rootPath,
        importerVersion: "test",
        integrityMode: "strict",
      });

      assert.equal(summary.outcome, "failed");
      assert.ok(
        summary.issues.some((issue) => issue.code === "PARSER_GENERATED_LOOKUP_MISMATCH"),
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });

  it("fails closed on unsupported additionalSpells shape and unresolved references", async () => {
    const rootPath = await createFixtureRoot({
      classDoc: {
        class: [
          {
            name: "Wizard",
            source: "PHB",
            classFeatures: ["Missing Feature|Wizard||1"],
          },
        ],
        subclass: [],
        classFeature: [],
        subclassFeature: [],
      },
      featsDoc: {
        feat: [
          {
            name: "Broken Feat",
            source: "PHB",
            additionalSpells: [
              {
                known: {
                  "1": [{ choose: true }],
                },
              },
            ],
          },
        ],
      },
    });

    try {
      const summary = await runImportPipeline({
        dataRootPath: rootPath,
        importerVersion: "test",
        integrityMode: "strict",
      });

      assert.equal(summary.outcome, "failed");
      assert.ok(summary.issues.some((issue) => issue.code === "PARSER_UNRESOLVED_REFERENCE"));
      assert.ok(
        summary.issues.some(
          (issue) => issue.code === "PARSER_UNSUPPORTED_ADDITIONAL_SPELLS_SHAPE",
        ),
      );
    } finally {
      await rm(rootPath, { recursive: true, force: true });
    }
  });
});
