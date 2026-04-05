import { createHash } from "node:crypto";

import type { NormalizedDataSource } from "@/server/import/parser-types";
import {
  classifySpellMarkerKey,
  classifySubclassMarkerKey,
  isKnownLineageKey,
  isKnownSpellGrantType,
  type GeneratedParityCaseTier,
} from "@/server/import/validate-domain/generated-parity-case-registry";

const DEFAULT_SOURCE = "PHB";
const SAMPLE_LIMIT = 25;

type GrantFamily = "subclass_lookup" | "spell_source_lookup";

type NextAction = "classify" | "model" | "debug_only";

type MismatchCategory = "missing" | "extra" | "lineage" | "unmodeled_case";

interface SemanticLineage {
  definedInSource?: string;
  definedInSources?: string[];
}

interface SemanticEdge {
  key: string;
  grantFamily: GrantFamily;
  grantType: string;
  sourceFamily: string;
  lineage: SemanticLineage;
}

interface SemanticCaseDiagnostic {
  category: "unmodeled_case";
  grantFamily: GrantFamily;
  grantType?: string;
  tier: GeneratedParityCaseTier;
  path: string;
  reason: string;
  recommendedNextAction: NextAction;
}

interface StructuralDiffSummary {
  expectedHash: string;
  actualHash: string;
  expectedBytes: number;
  actualBytes: number;
  expectedTopLevelKeys: string[];
  actualTopLevelKeys: string[];
}

interface SemanticComparisonResult {
  comparisonMode: "semantic";
  missingCount: number;
  extraCount: number;
  lineageMismatchCount: number;
  missingSamples: SemanticEdge[];
  extraSamples: SemanticEdge[];
  lineageSamples: Array<{
    grantFamily: GrantFamily;
    grantType: string;
    edgeKey: string;
    expectedLineage: SemanticLineage;
    actualLineage: SemanticLineage;
  }>;
  unmodeledSemanticCases: SemanticCaseDiagnostic[];
  decorativeCases: SemanticCaseDiagnostic[];
  inventory: {
    mismatchCategoryCounts: Record<MismatchCategory, number>;
    grantTypeCounts: Record<MismatchCategory, Array<{ key: string; count: number }>>;
    sourceFamilyCounts: Record<MismatchCategory, Array<{ key: string; count: number }>>;
  };
  shapeDiffSummary?: StructuralDiffSummary;
}

interface BuildSemanticEdgeSetResult {
  edges: Map<string, SemanticEdge>;
  unmodeledSemanticCases: SemanticCaseDiagnostic[];
  decorativeCases: SemanticCaseDiagnostic[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function slug(value: string): string {
  return value.trim().toLowerCase();
}

function canonicalSource(value: unknown, fallback: string = DEFAULT_SOURCE): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function canonicalName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function canonicalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => slug(entry))
    .filter((entry) => entry.length > 0);

  if (normalized.length === 0) {
    return undefined;
  }

  return [...new Set(normalized)].sort();
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortObject(entry));
  }

  if (!isObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortObject(child)]),
  );
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

function summarizeTopLevelKeys(value: unknown): string[] {
  if (!isObject(value)) {
    return [];
  }

  return Object.keys(value).sort((left, right) => left.localeCompare(right)).slice(0, SAMPLE_LIMIT);
}

function summarizeShapeDiff(expected: unknown, actual: unknown): StructuralDiffSummary {
  const expectedString = stableStringify(expected);
  const actualString = stableStringify(actual);

  return {
    expectedHash: createHash("sha256").update(expectedString).digest("hex").slice(0, 16),
    actualHash: createHash("sha256").update(actualString).digest("hex").slice(0, 16),
    expectedBytes: expectedString.length,
    actualBytes: actualString.length,
    expectedTopLevelKeys: summarizeTopLevelKeys(expected),
    actualTopLevelKeys: summarizeTopLevelKeys(actual),
  };
}

function effectiveDefinedInSource(lineage: SemanticLineage): string | undefined {
  if (lineage.definedInSource) {
    return lineage.definedInSource;
  }

  if (lineage.definedInSources && lineage.definedInSources.length === 1) {
    return lineage.definedInSources[0];
  }

  return undefined;
}

function effectiveDefinedInSources(lineage: SemanticLineage): string[] | undefined {
  const values: string[] = [];

  if (lineage.definedInSource) {
    values.push(lineage.definedInSource);
  }

  if (lineage.definedInSources) {
    values.push(...lineage.definedInSources);
  }

  if (values.length === 0) {
    return undefined;
  }

  return [...new Set(values)].sort();
}

function lineageEquals(left: SemanticLineage, right: SemanticLineage): boolean {
  return stableStringify({
    definedInSource: effectiveDefinedInSource(left),
    definedInSources: effectiveDefinedInSources(left),
  }) ===
    stableStringify({
      definedInSource: effectiveDefinedInSource(right),
      definedInSources: effectiveDefinedInSources(right),
    });
}

function parseMarkerLineage(args: {
  markerValue: unknown;
  grantFamily: GrantFamily;
  grantType: string;
  path: string;
  classifyKey: (key: string) => GeneratedParityCaseTier | undefined;
}): {
  lineage: SemanticLineage;
  unmodeledSemanticCases: SemanticCaseDiagnostic[];
  decorativeCases: SemanticCaseDiagnostic[];
  markerSupported: boolean;
} {
  const unmodeledSemanticCases: SemanticCaseDiagnostic[] = [];
  const decorativeCases: SemanticCaseDiagnostic[] = [];

  if (args.markerValue === true) {
    return {
      lineage: {},
      unmodeledSemanticCases,
      decorativeCases,
      markerSupported: true,
    };
  }

  if (!isObject(args.markerValue)) {
    unmodeledSemanticCases.push({
      category: "unmodeled_case",
      grantFamily: args.grantFamily,
      grantType: args.grantType,
      tier: "availability_critical",
      path: args.path,
      reason: `Expected boolean or object marker, got '${typeof args.markerValue}'.`,
      recommendedNextAction: "model",
    });

    return {
      lineage: {},
      unmodeledSemanticCases,
      decorativeCases,
      markerSupported: false,
    };
  }

  const lineage: SemanticLineage = {};

  for (const [markerKey, markerChild] of Object.entries(args.markerValue)) {
    const markerKeyTier = args.classifyKey(markerKey);

    if (markerKey === "definedInSource") {
      if (typeof markerChild !== "string" || markerChild.trim().length === 0) {
        unmodeledSemanticCases.push({
          category: "unmodeled_case",
          grantFamily: args.grantFamily,
          grantType: args.grantType,
          tier: "lineage_critical",
          path: `${args.path}.${markerKey}`,
          reason: "definedInSource must be a non-empty string when present.",
          recommendedNextAction: "model",
        });
        continue;
      }

      lineage.definedInSource = slug(markerChild);
      continue;
    }

    if (markerKey === "definedInSources") {
      const values = canonicalStringArray(markerChild);

      if (!values) {
        unmodeledSemanticCases.push({
          category: "unmodeled_case",
          grantFamily: args.grantFamily,
          grantType: args.grantType,
          tier: "lineage_critical",
          path: `${args.path}.${markerKey}`,
          reason: "definedInSources must be a non-empty string array when present.",
          recommendedNextAction: "model",
        });
        continue;
      }

      lineage.definedInSources = values;
      continue;
    }

    if (markerKeyTier === "decorative") {
      continue;
    }

    if (!markerKeyTier && isKnownLineageKey(markerKey)) {
      unmodeledSemanticCases.push({
        category: "unmodeled_case",
        grantFamily: args.grantFamily,
        grantType: args.grantType,
        tier: "lineage_critical",
        path: `${args.path}.${markerKey}`,
        reason: `Unmodeled lineage-critical marker key '${markerKey}'.`,
        recommendedNextAction: "classify",
      });
      continue;
    }

    if (!markerKeyTier && markerKey.toLowerCase().startsWith("definedin")) {
      unmodeledSemanticCases.push({
        category: "unmodeled_case",
        grantFamily: args.grantFamily,
        grantType: args.grantType,
        tier: "lineage_critical",
        path: `${args.path}.${markerKey}`,
        reason: `Unmodeled lineage-like marker key '${markerKey}'.`,
        recommendedNextAction: "classify",
      });
      continue;
    }

    if (!markerKeyTier) {
      decorativeCases.push({
        category: "unmodeled_case",
        grantFamily: args.grantFamily,
        grantType: args.grantType,
        tier: "decorative",
        path: `${args.path}.${markerKey}`,
        reason: `Unmodeled decorative marker key '${markerKey}'.`,
        recommendedNextAction: "debug_only",
      });
    }
  }

  return {
    lineage,
    unmodeledSemanticCases,
    decorativeCases,
    markerSupported: true,
  };
}

function addEdge(args: {
  edges: Map<string, SemanticEdge>;
  edge: SemanticEdge;
  path: string;
  unmodeledSemanticCases: SemanticCaseDiagnostic[];
}): void {
  const existing = args.edges.get(args.edge.key);

  if (!existing) {
    args.edges.set(args.edge.key, args.edge);
    return;
  }

  if (lineageEquals(existing.lineage, args.edge.lineage)) {
    return;
  }

  args.unmodeledSemanticCases.push({
    category: "unmodeled_case",
    grantFamily: args.edge.grantFamily,
    grantType: args.edge.grantType,
    tier: "lineage_critical",
    path: args.path,
    reason: "Conflicting lineage metadata for identical semantic edge.",
    recommendedNextAction: "model",
  });
}

function buildExpectedSubclassEdges(normalized: NormalizedDataSource): BuildSemanticEdgeSetResult {
  const edges = new Map<string, SemanticEdge>();
  const unmodeledSemanticCases: SemanticCaseDiagnostic[] = [];

  for (const entity of normalized.entities) {
    if (entity.kind !== "subclass") {
      continue;
    }

    const className = canonicalName(entity.payload.className);
    const classSource = canonicalSource(entity.payload.classSource, DEFAULT_SOURCE);
    const subclassShortName = canonicalName(entity.payload.shortName);

    if (!className || !subclassShortName) {
      unmodeledSemanticCases.push({
        category: "unmodeled_case",
        grantFamily: "subclass_lookup",
        grantType: "subclass",
        tier: "availability_critical",
        path: `normalized.entities[${entity.identity}]`,
        reason: "Subclass entity is missing semantic identity fields for parity projection.",
        recommendedNextAction: "model",
      });
      continue;
    }

    const edge: SemanticEdge = {
      key: [
        slug(classSource),
        slug(className),
        slug(entity.source),
        slug(subclassShortName),
      ].join("|"),
      grantFamily: "subclass_lookup",
      grantType: "subclass",
      sourceFamily: slug(classSource),
      lineage: {},
    };

    addEdge({
      edges,
      edge,
      path: `normalized.entities[${entity.identity}]`,
      unmodeledSemanticCases,
    });
  }

  return {
    edges,
    unmodeledSemanticCases,
    decorativeCases: [],
  };
}

function buildActualSubclassEdges(actual: unknown): BuildSemanticEdgeSetResult {
  const edges = new Map<string, SemanticEdge>();
  const unmodeledSemanticCases: SemanticCaseDiagnostic[] = [];
  const decorativeCases: SemanticCaseDiagnostic[] = [];

  if (!isObject(actual)) {
    unmodeledSemanticCases.push({
      category: "unmodeled_case",
      grantFamily: "subclass_lookup",
      grantType: "subclass",
      tier: "availability_critical",
      path: "generated.gendata-subclass-lookup",
      reason: "Generated subclass lookup root must be an object.",
      recommendedNextAction: "model",
    });
    return { edges, unmodeledSemanticCases, decorativeCases };
  }

  for (const [classSource, classBucket] of Object.entries(actual)) {
    if (!isObject(classBucket)) {
      unmodeledSemanticCases.push({
        category: "unmodeled_case",
        grantFamily: "subclass_lookup",
        grantType: "subclass",
        tier: "availability_critical",
        path: `generated.gendata-subclass-lookup.${classSource}`,
        reason: "Class-source bucket must be an object.",
        recommendedNextAction: "model",
      });
      continue;
    }

    for (const [className, subclassSourceBucket] of Object.entries(classBucket)) {
      if (!isObject(subclassSourceBucket)) {
        unmodeledSemanticCases.push({
          category: "unmodeled_case",
          grantFamily: "subclass_lookup",
          grantType: "subclass",
          tier: "availability_critical",
          path: `generated.gendata-subclass-lookup.${classSource}.${className}`,
          reason: "Class-name bucket must be an object.",
          recommendedNextAction: "model",
        });
        continue;
      }

      for (const [subclassSource, subclassBucket] of Object.entries(subclassSourceBucket)) {
        if (!isObject(subclassBucket)) {
          unmodeledSemanticCases.push({
            category: "unmodeled_case",
            grantFamily: "subclass_lookup",
            grantType: "subclass",
            tier: "availability_critical",
            path: `generated.gendata-subclass-lookup.${classSource}.${className}.${subclassSource}`,
            reason: "Subclass-source bucket must be an object.",
            recommendedNextAction: "model",
          });
          continue;
        }

        for (const [subclassShortName, markerValue] of Object.entries(subclassBucket)) {
          const path =
            `generated.gendata-subclass-lookup.${classSource}.${className}.` +
            `${subclassSource}.${subclassShortName}`;

          const parsedMarker = parseMarkerLineage({
            markerValue,
            grantFamily: "subclass_lookup",
            grantType: "subclass",
            path,
            classifyKey: classifySubclassMarkerKey,
          });

          unmodeledSemanticCases.push(...parsedMarker.unmodeledSemanticCases);
          decorativeCases.push(...parsedMarker.decorativeCases);

          if (!parsedMarker.markerSupported) {
            continue;
          }

          addEdge({
            edges,
            edge: {
              key: [
                slug(classSource),
                slug(className),
                slug(subclassSource),
                slug(subclassShortName),
              ].join("|"),
              grantFamily: "subclass_lookup",
              grantType: "subclass",
              sourceFamily: slug(classSource),
              lineage: parsedMarker.lineage,
            },
            path,
            unmodeledSemanticCases,
          });
        }
      }
    }
  }

  return { edges, unmodeledSemanticCases, decorativeCases };
}

function buildExpectedSpellSourceEdges(normalized: NormalizedDataSource): BuildSemanticEdgeSetResult {
  const edges = new Map<string, SemanticEdge>();
  const unmodeledSemanticCases: SemanticCaseDiagnostic[] = [];

  for (let index = 0; index < normalized.spellSourceEdges.length; index += 1) {
    const edge = normalized.spellSourceEdges[index];
    const grantType = edge.grantType;
    const baseParts = [slug(edge.spellSource), slug(edge.spellName), grantType];
    const lineage: SemanticLineage = {};

    if (typeof edge.definedInSource === "string" && edge.definedInSource.trim().length > 0) {
      lineage.definedInSource = slug(edge.definedInSource);
    }

    const definedInSources = canonicalStringArray(edge.definedInSources);
    if (definedInSources) {
      lineage.definedInSources = definedInSources;
    }

    if (grantType === "subclass") {
      const ownerClassSource = canonicalName(edge.ownerClassSource) ?? DEFAULT_SOURCE;
      const ownerClassName = canonicalName(edge.ownerClassName);
      const ownerSubclassShortName = canonicalName(edge.ownerSubclassShortName);

      if (!ownerClassName || !ownerSubclassShortName) {
        unmodeledSemanticCases.push({
          category: "unmodeled_case",
          grantFamily: "spell_source_lookup",
          grantType,
          tier: "availability_critical",
          path: `normalized.spellSourceEdges[${index}]`,
          reason: "Subclass spell edge missing class/subclass owner identity fields.",
          recommendedNextAction: "model",
        });
        continue;
      }

      addEdge({
        edges,
        edge: {
          key: [
            ...baseParts,
            slug(ownerClassSource),
            slug(ownerClassName),
            slug(edge.ownerSource),
            slug(ownerSubclassShortName),
          ].join("|"),
          grantFamily: "spell_source_lookup",
          grantType,
          sourceFamily: slug(edge.spellSource),
          lineage,
        },
        path: `normalized.spellSourceEdges[${index}]`,
        unmodeledSemanticCases,
      });

      continue;
    }

    if (!isKnownSpellGrantType(grantType)) {
      unmodeledSemanticCases.push({
        category: "unmodeled_case",
        grantFamily: "spell_source_lookup",
        grantType,
        tier: "availability_critical",
        path: `normalized.spellSourceEdges[${index}]`,
        reason: `Unknown grant type '${grantType}' in normalized spell-source edges.`,
        recommendedNextAction: "classify",
      });
      continue;
    }

    addEdge({
      edges,
      edge: {
        key: [...baseParts, slug(edge.ownerSource), slug(edge.ownerName)].join("|"),
        grantFamily: "spell_source_lookup",
        grantType,
        sourceFamily: slug(edge.spellSource),
        lineage,
      },
      path: `normalized.spellSourceEdges[${index}]`,
      unmodeledSemanticCases,
    });
  }

  return {
    edges,
    unmodeledSemanticCases,
    decorativeCases: [],
  };
}

function buildActualSpellSourceEdges(actual: unknown): BuildSemanticEdgeSetResult {
  const edges = new Map<string, SemanticEdge>();
  const unmodeledSemanticCases: SemanticCaseDiagnostic[] = [];
  const decorativeCases: SemanticCaseDiagnostic[] = [];

  if (!isObject(actual)) {
    unmodeledSemanticCases.push({
      category: "unmodeled_case",
      grantFamily: "spell_source_lookup",
      tier: "availability_critical",
      path: "generated.gendata-spell-source-lookup",
      reason: "Generated spell-source lookup root must be an object.",
      recommendedNextAction: "model",
    });
    return { edges, unmodeledSemanticCases, decorativeCases };
  }

  for (const [spellSource, spellBucket] of Object.entries(actual)) {
    if (!isObject(spellBucket)) {
      unmodeledSemanticCases.push({
        category: "unmodeled_case",
        grantFamily: "spell_source_lookup",
        tier: "availability_critical",
        path: `generated.gendata-spell-source-lookup.${spellSource}`,
        reason: "Spell-source bucket must be an object.",
        recommendedNextAction: "model",
      });
      continue;
    }

    for (const [spellName, grantFamilies] of Object.entries(spellBucket)) {
      if (!isObject(grantFamilies)) {
        unmodeledSemanticCases.push({
          category: "unmodeled_case",
          grantFamily: "spell_source_lookup",
          tier: "availability_critical",
          path: `generated.gendata-spell-source-lookup.${spellSource}.${spellName}`,
          reason: "Spell-name bucket must be an object.",
          recommendedNextAction: "model",
        });
        continue;
      }

      for (const [grantType, grantPayload] of Object.entries(grantFamilies)) {
        if (!isKnownSpellGrantType(grantType)) {
          unmodeledSemanticCases.push({
            category: "unmodeled_case",
            grantFamily: "spell_source_lookup",
            grantType,
            tier: "availability_critical",
            path: `generated.gendata-spell-source-lookup.${spellSource}.${spellName}.${grantType}`,
            reason: `Unmodeled spell-source grant type '${grantType}'.`,
            recommendedNextAction: "classify",
          });
          continue;
        }

        const basePath =
          `generated.gendata-spell-source-lookup.${spellSource}.${spellName}.${grantType}`;
        const baseParts = [slug(spellSource), slug(spellName), grantType];

        if (!isObject(grantPayload)) {
          unmodeledSemanticCases.push({
            category: "unmodeled_case",
            grantFamily: "spell_source_lookup",
            grantType,
            tier: "availability_critical",
            path: basePath,
            reason: "Grant-type bucket must be an object.",
            recommendedNextAction: "model",
          });
          continue;
        }

        if (grantType === "subclass") {
          for (const [ownerClassSource, classBucket] of Object.entries(grantPayload)) {
            if (!isObject(classBucket)) {
              unmodeledSemanticCases.push({
                category: "unmodeled_case",
                grantFamily: "spell_source_lookup",
                grantType,
                tier: "availability_critical",
                path: `${basePath}.${ownerClassSource}`,
                reason: "Subclass class-source bucket must be an object.",
                recommendedNextAction: "model",
              });
              continue;
            }

            for (const [ownerClassName, subclassSourceBucket] of Object.entries(classBucket)) {
              if (!isObject(subclassSourceBucket)) {
                unmodeledSemanticCases.push({
                  category: "unmodeled_case",
                  grantFamily: "spell_source_lookup",
                  grantType,
                  tier: "availability_critical",
                  path: `${basePath}.${ownerClassSource}.${ownerClassName}`,
                  reason: "Subclass class-name bucket must be an object.",
                  recommendedNextAction: "model",
                });
                continue;
              }

              for (const [ownerSource, shortNameBucket] of Object.entries(subclassSourceBucket)) {
                if (!isObject(shortNameBucket)) {
                  unmodeledSemanticCases.push({
                    category: "unmodeled_case",
                    grantFamily: "spell_source_lookup",
                    grantType,
                    tier: "availability_critical",
                    path: `${basePath}.${ownerClassSource}.${ownerClassName}.${ownerSource}`,
                    reason: "Subclass source bucket must be an object.",
                    recommendedNextAction: "model",
                  });
                  continue;
                }

                for (const [ownerSubclassShortName, markerValue] of Object.entries(shortNameBucket)) {
                  const path =
                    `${basePath}.${ownerClassSource}.${ownerClassName}.` +
                    `${ownerSource}.${ownerSubclassShortName}`;

                  const parsedMarker = parseMarkerLineage({
                    markerValue,
                    grantFamily: "spell_source_lookup",
                    grantType,
                    path,
                    classifyKey: classifySpellMarkerKey,
                  });

                  unmodeledSemanticCases.push(...parsedMarker.unmodeledSemanticCases);
                  decorativeCases.push(...parsedMarker.decorativeCases);

                  if (!parsedMarker.markerSupported) {
                    continue;
                  }

                  addEdge({
                    edges,
                    edge: {
                      key: [
                        ...baseParts,
                        slug(ownerClassSource),
                        slug(ownerClassName),
                        slug(ownerSource),
                        slug(ownerSubclassShortName),
                      ].join("|"),
                      grantFamily: "spell_source_lookup",
                      grantType,
                      sourceFamily: slug(spellSource),
                      lineage: parsedMarker.lineage,
                    },
                    path,
                    unmodeledSemanticCases,
                  });
                }
              }
            }
          }

          continue;
        }

        for (const [ownerSource, ownerBucket] of Object.entries(grantPayload)) {
          if (!isObject(ownerBucket)) {
            unmodeledSemanticCases.push({
              category: "unmodeled_case",
              grantFamily: "spell_source_lookup",
              grantType,
              tier: "availability_critical",
              path: `${basePath}.${ownerSource}`,
              reason: "Owner-source bucket must be an object.",
              recommendedNextAction: "model",
            });
            continue;
          }

          for (const [ownerName, markerValue] of Object.entries(ownerBucket)) {
            const path = `${basePath}.${ownerSource}.${ownerName}`;
            const parsedMarker = parseMarkerLineage({
              markerValue,
              grantFamily: "spell_source_lookup",
              grantType,
              path,
              classifyKey: classifySpellMarkerKey,
            });

            unmodeledSemanticCases.push(...parsedMarker.unmodeledSemanticCases);
            decorativeCases.push(...parsedMarker.decorativeCases);

            if (!parsedMarker.markerSupported) {
              continue;
            }

            addEdge({
              edges,
              edge: {
                key: [...baseParts, slug(ownerSource), slug(ownerName)].join("|"),
                grantFamily: "spell_source_lookup",
                grantType,
                sourceFamily: slug(spellSource),
                lineage: parsedMarker.lineage,
              },
              path,
              unmodeledSemanticCases,
            });
          }
        }
      }
    }
  }

  return { edges, unmodeledSemanticCases, decorativeCases };
}

function createCounterRecord(): Record<MismatchCategory, Map<string, number>> {
  return {
    missing: new Map<string, number>(),
    extra: new Map<string, number>(),
    lineage: new Map<string, number>(),
    unmodeled_case: new Map<string, number>(),
  };
}

function incrementCounter(counter: Map<string, number>, key: string): void {
  counter.set(key, (counter.get(key) ?? 0) + 1);
}

function summarizeCounter(counter: Map<string, number>): Array<{ key: string; count: number }> {
  return [...counter.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, SAMPLE_LIMIT)
    .map(([key, count]) => ({ key, count }));
}

function sourceFamilyFromCasePath(path: string): string {
  const spellPrefix = "generated.gendata-spell-source-lookup.";
  const subclassPrefix = "generated.gendata-subclass-lookup.";

  if (path.startsWith(spellPrefix)) {
    const remainder = path.slice(spellPrefix.length);
    const [sourceFamily] = remainder.split(".");
    return sourceFamily ? slug(sourceFamily) : "unknown";
  }

  if (path.startsWith(subclassPrefix)) {
    const remainder = path.slice(subclassPrefix.length);
    const [sourceFamily] = remainder.split(".");
    return sourceFamily ? slug(sourceFamily) : "unknown";
  }

  return "unknown";
}

function compareEdgeSets(args: {
  expected: BuildSemanticEdgeSetResult;
  actual: BuildSemanticEdgeSetResult;
  expectedRaw: unknown;
  actualRaw: unknown;
  includeShapeDiffSummary: boolean;
}): SemanticComparisonResult {
  const missingKeys: string[] = [];
  const extraKeys: string[] = [];
  const lineageSamples: SemanticComparisonResult["lineageSamples"] = [];
  const grantTypeCounters = createCounterRecord();
  const sourceFamilyCounters = createCounterRecord();
  const mismatchCategoryCounts: Record<MismatchCategory, number> = {
    missing: 0,
    extra: 0,
    lineage: 0,
    unmodeled_case: 0,
  };

  for (const expectedKey of args.expected.edges.keys()) {
    if (!args.actual.edges.has(expectedKey)) {
      missingKeys.push(expectedKey);
    }
  }

  for (const actualKey of args.actual.edges.keys()) {
    if (!args.expected.edges.has(actualKey)) {
      extraKeys.push(actualKey);
    }
  }

  for (const [sharedKey, expectedEdge] of args.expected.edges.entries()) {
    const actualEdge = args.actual.edges.get(sharedKey);
    if (!actualEdge) {
      continue;
    }

    if (lineageEquals(expectedEdge.lineage, actualEdge.lineage)) {
      continue;
    }

    lineageSamples.push({
      grantFamily: expectedEdge.grantFamily,
      grantType: expectedEdge.grantType,
      edgeKey: sharedKey,
      expectedLineage: expectedEdge.lineage,
      actualLineage: actualEdge.lineage,
    });
  }

  const missingSamples = missingKeys
    .slice(0, SAMPLE_LIMIT)
    .map((key) => args.expected.edges.get(key))
    .filter((edge): edge is SemanticEdge => Boolean(edge));

  const extraSamples = extraKeys
    .slice(0, SAMPLE_LIMIT)
    .map((key) => args.actual.edges.get(key))
    .filter((edge): edge is SemanticEdge => Boolean(edge));

  for (const key of missingKeys) {
    const edge = args.expected.edges.get(key);
    if (!edge) {
      continue;
    }

    mismatchCategoryCounts.missing += 1;
    incrementCounter(grantTypeCounters.missing, edge.grantType);
    incrementCounter(sourceFamilyCounters.missing, edge.sourceFamily);
  }

  for (const key of extraKeys) {
    const edge = args.actual.edges.get(key);
    if (!edge) {
      continue;
    }

    mismatchCategoryCounts.extra += 1;
    incrementCounter(grantTypeCounters.extra, edge.grantType);
    incrementCounter(sourceFamilyCounters.extra, edge.sourceFamily);
  }

  for (const lineageSample of lineageSamples) {
    const edge = args.expected.edges.get(lineageSample.edgeKey);
    if (!edge) {
      continue;
    }

    mismatchCategoryCounts.lineage += 1;
    incrementCounter(grantTypeCounters.lineage, lineageSample.grantType);
    incrementCounter(sourceFamilyCounters.lineage, edge.sourceFamily);
  }

  const unmodeledCases = [
    ...args.expected.unmodeledSemanticCases,
    ...args.actual.unmodeledSemanticCases,
    ...args.expected.decorativeCases,
    ...args.actual.decorativeCases,
  ];

  for (const unmodeled of unmodeledCases) {
    mismatchCategoryCounts.unmodeled_case += 1;
    incrementCounter(grantTypeCounters.unmodeled_case, unmodeled.grantType ?? "unknown");
    incrementCounter(sourceFamilyCounters.unmodeled_case, sourceFamilyFromCasePath(unmodeled.path));
  }

  return {
    comparisonMode: "semantic",
    missingCount: missingKeys.length,
    extraCount: extraKeys.length,
    lineageMismatchCount: lineageSamples.length,
    missingSamples,
    extraSamples,
    lineageSamples: lineageSamples.slice(0, SAMPLE_LIMIT),
    unmodeledSemanticCases: [...args.expected.unmodeledSemanticCases, ...args.actual.unmodeledSemanticCases].slice(
      0,
      SAMPLE_LIMIT,
    ),
    decorativeCases: [...args.expected.decorativeCases, ...args.actual.decorativeCases].slice(
      0,
      SAMPLE_LIMIT,
    ),
    inventory: {
      mismatchCategoryCounts,
      grantTypeCounts: {
        missing: summarizeCounter(grantTypeCounters.missing),
        extra: summarizeCounter(grantTypeCounters.extra),
        lineage: summarizeCounter(grantTypeCounters.lineage),
        unmodeled_case: summarizeCounter(grantTypeCounters.unmodeled_case),
      },
      sourceFamilyCounts: {
        missing: summarizeCounter(sourceFamilyCounters.missing),
        extra: summarizeCounter(sourceFamilyCounters.extra),
        lineage: summarizeCounter(sourceFamilyCounters.lineage),
        unmodeled_case: summarizeCounter(sourceFamilyCounters.unmodeled_case),
      },
    },
    shapeDiffSummary: args.includeShapeDiffSummary
      ? summarizeShapeDiff(args.expectedRaw, args.actualRaw)
      : undefined,
  };
}

export function compareGeneratedSubclassLookupSemanticParity(args: {
  normalized: NormalizedDataSource;
  actualGeneratedLookup: unknown;
  includeShapeDiffSummary: boolean;
}): SemanticComparisonResult {
  const expectedRaw = buildExpectedSubclassLookupForDebug(args.normalized);
  const expected = buildExpectedSubclassEdges(args.normalized);
  const actual = buildActualSubclassEdges(args.actualGeneratedLookup);

  return compareEdgeSets({
    expected,
    actual,
    expectedRaw,
    actualRaw: args.actualGeneratedLookup,
    includeShapeDiffSummary: args.includeShapeDiffSummary,
  });
}

export function compareGeneratedSpellSourceLookupSemanticParity(args: {
  normalized: NormalizedDataSource;
  actualGeneratedLookup: unknown;
  includeShapeDiffSummary: boolean;
}): SemanticComparisonResult {
  const expectedRaw = buildExpectedSpellSourceLookupForDebug(args.normalized);
  const expected = buildExpectedSpellSourceEdges(args.normalized);
  const actual = buildActualSpellSourceEdges(args.actualGeneratedLookup);

  return compareEdgeSets({
    expected,
    actual,
    expectedRaw,
    actualRaw: args.actualGeneratedLookup,
    includeShapeDiffSummary: args.includeShapeDiffSummary,
  });
}

function buildExpectedSubclassLookupForDebug(normalized: NormalizedDataSource): Record<string, unknown> {
  const lookup: Record<string, unknown> = {};

  for (const entity of normalized.entities) {
    if (entity.kind !== "subclass") {
      continue;
    }

    const className = canonicalName(entity.payload.className);
    const classSource = canonicalSource(entity.payload.classSource, DEFAULT_SOURCE);
    const shortName = canonicalName(entity.payload.shortName);

    if (!className || !shortName) {
      continue;
    }

    const classSourceBucket = (lookup[classSource] ??= {}) as Record<string, unknown>;
    const classBucket = (classSourceBucket[className] ??= {}) as Record<string, unknown>;
    const subclassSourceBucket = (classBucket[entity.source] ??= {}) as Record<string, unknown>;
    subclassSourceBucket[shortName] = { name: entity.name };
  }

  return lookup;
}

function buildExpectedSpellSourceLookupForDebug(normalized: NormalizedDataSource): Record<string, unknown> {
  const lookup: Record<string, unknown> = {};

  for (const edge of normalized.spellSourceEdges) {
    const sourceKey = slug(edge.spellSource);
    const spellKey = slug(edge.spellName);
    const sourceBucket = (lookup[sourceKey] ??= {}) as Record<string, unknown>;
    const spellBucket = (sourceBucket[spellKey] ??= {}) as Record<string, unknown>;

    if (edge.grantType === "subclass") {
      const classSource = edge.ownerClassSource ?? "PHB";
      const className = edge.ownerClassName;
      const subclassShortName = edge.ownerSubclassShortName ?? edge.ownerName;

      if (!className) {
        continue;
      }

      const grantBucket = (spellBucket.subclass ??= {}) as Record<string, unknown>;
      const classSourceBucket = (grantBucket[classSource] ??= {}) as Record<string, unknown>;
      const classBucket = (classSourceBucket[className] ??= {}) as Record<string, unknown>;
      const subclassSourceBucket = (classBucket[edge.ownerSource] ??= {}) as Record<string, unknown>;

      const payload: Record<string, unknown> = { name: edge.ownerName };
      if (edge.definedInSource) {
        payload.definedInSource = edge.definedInSource;
      }
      if (edge.definedInSources && edge.definedInSources.length > 0) {
        payload.definedInSources = edge.definedInSources;
      }

      subclassSourceBucket[subclassShortName] = payload;
      continue;
    }

    const grantBucket = (spellBucket[edge.grantType] ??= {}) as Record<string, unknown>;
    const ownerSourceBucket = (grantBucket[edge.ownerSource] ??= {}) as Record<string, unknown>;

    if (edge.definedInSource || (edge.definedInSources && edge.definedInSources.length > 0)) {
      ownerSourceBucket[edge.ownerName] = {
        ...(edge.definedInSource ? { definedInSource: edge.definedInSource } : {}),
        ...(edge.definedInSources && edge.definedInSources.length > 0
          ? { definedInSources: edge.definedInSources }
          : {}),
      };
    } else {
      ownerSourceBucket[edge.ownerName] = true;
    }
  }

  return lookup;
}

export type { MismatchCategory, SemanticComparisonResult, SemanticCaseDiagnostic, StructuralDiffSummary };
