import type {
  NormalizedDataSource,
  ParserDiagnostic,
  ValidateDomainResult,
} from "@/server/import/parser-types";
import type { DataIntegrityMode } from "@/server/ports/rules-catalog";

const STAGE = "validate_domain";

function slug(value: string): string {
  return value.trim().toLowerCase();
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sortObject(entry));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sortedEntries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, childValue]) => [key, sortObject(childValue)]);

  return Object.fromEntries(sortedEntries);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

function buildExpectedSubclassLookup(normalized: NormalizedDataSource): Record<string, unknown> {
  const lookup: Record<string, unknown> = {};

  for (const entity of normalized.entities) {
    if (entity.kind !== "subclass") {
      continue;
    }

    const className =
      typeof entity.payload.className === "string" ? entity.payload.className.trim() : undefined;
    const classSource =
      typeof entity.payload.classSource === "string" ? entity.payload.classSource.trim() : "PHB";
    const shortName =
      typeof entity.payload.shortName === "string" ? entity.payload.shortName.trim() : undefined;

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

function buildExpectedSpellSourceLookup(normalized: NormalizedDataSource): Record<string, unknown> {
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
      subclassSourceBucket[subclassShortName] = { name: edge.ownerName };
      continue;
    }

    const grantBucket = (spellBucket[edge.grantType] ??= {}) as Record<string, unknown>;
    const ownerSourceBucket = (grantBucket[edge.ownerSource] ??= {}) as Record<string, unknown>;
    ownerSourceBucket[edge.ownerName] = true;
  }

  return lookup;
}

function pushGeneratedMismatchDiagnostic(args: {
  diagnostics: ParserDiagnostic[];
  integrityMode: DataIntegrityMode;
  filePath: string;
  message: string;
  expected: unknown;
  actual: unknown;
}): void {
  const severity = args.integrityMode === "strict" ? "error" : "warn";

  args.diagnostics.push({
    stage: STAGE,
    severity,
    code: "PARSER_GENERATED_LOOKUP_MISMATCH",
    message: args.message,
    filePath: args.filePath,
    details: {
      expected: args.expected,
      actual: args.actual,
    },
  });
}

function validateGeneratedParity(args: {
  normalized: NormalizedDataSource;
  diagnostics: ParserDiagnostic[];
  integrityMode: DataIntegrityMode;
}): void {
  if (args.integrityMode === "off") {
    return;
  }

  if (args.normalized.generatedSubclassLookup !== undefined) {
    const expected = buildExpectedSubclassLookup(args.normalized);
    const actual = args.normalized.generatedSubclassLookup;

    if (stableStringify(expected) !== stableStringify(actual)) {
      pushGeneratedMismatchDiagnostic({
        diagnostics: args.diagnostics,
        integrityMode: args.integrityMode,
        filePath: "generated/gendata-subclass-lookup.json",
        message: "Generated subclass lookup does not match resolved subclass data.",
        expected,
        actual,
      });
    }
  }

  if (args.normalized.generatedSpellSourceLookup !== undefined) {
    const expected = buildExpectedSpellSourceLookup(args.normalized);
    const actual = args.normalized.generatedSpellSourceLookup;

    if (stableStringify(expected) !== stableStringify(actual)) {
      pushGeneratedMismatchDiagnostic({
        diagnostics: args.diagnostics,
        integrityMode: args.integrityMode,
        filePath: "generated/gendata-spell-source-lookup.json",
        message: "Generated spell-source lookup does not match resolved spell-source edges.",
        expected,
        actual,
      });
    }
  }
}

export function validateDomain(
  normalized: NormalizedDataSource,
  integrityMode: DataIntegrityMode,
): ValidateDomainResult {
  const diagnostics: ParserDiagnostic[] = [];

  for (const unresolvedReference of normalized.unresolvedReferences) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_UNRESOLVED_REFERENCE",
      message: `Unresolved ${unresolvedReference.referenceKind} reference '${unresolvedReference.reference}'.`,
      filePath: unresolvedReference.filePath,
      details: { ...unresolvedReference },
    });
  }

  for (const unsupported of normalized.unsupportedAdditionalSpells) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_UNSUPPORTED_ADDITIONAL_SPELLS_SHAPE",
      message: `Unsupported additionalSpells structure for ${unsupported.ownerKind} ${unsupported.ownerName}|${unsupported.ownerSource}.`,
      filePath: unsupported.filePath,
      details: { ...unsupported },
    });
  }

  const seenIdentities = new Set<string>();
  for (const entity of normalized.entities) {
    if (seenIdentities.has(entity.identity)) {
      diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_IDENTITY_COLLISION",
        message: `Duplicate identity collision for ${entity.identity}.`,
        filePath: undefined,
      });
      continue;
    }

    seenIdentities.add(entity.identity);
  }

  validateGeneratedParity({
    normalized,
    diagnostics,
    integrityMode,
  });

  return {
    diagnostics,
  };
}
