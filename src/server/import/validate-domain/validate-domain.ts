import type {
  NormalizedDataSource,
  ParserDiagnostic,
  ValidateDomainResult,
} from "@/server/import/parser-types";
import type { DataIntegrityMode } from "@/server/ports/rules-catalog";
import {
  compareGeneratedSpellSourceLookupSemanticParity,
  compareGeneratedSubclassLookupSemanticParity,
  type SemanticComparisonResult,
} from "@/server/import/validate-domain/generated-parity-semantic";

const STAGE = "validate_domain";

function resolveMismatchSeverity(integrityMode: DataIntegrityMode): "error" | "warn" {
  return integrityMode === "strict" ? "error" : "warn";
}

function shapeDiffEnabled(): boolean {
  return process.env.PARSER_PARITY_DEBUG_SHAPE_DIFF === "1";
}

function firstGrantTypeFromSamples(
  samples: Array<{ grantType?: string }> | undefined,
): string | undefined {
  if (!samples || samples.length === 0) {
    return undefined;
  }

  const unique = [
    ...new Set(
      samples
        .map((sample) => sample.grantType)
        .filter((grantType): grantType is string => typeof grantType === "string"),
    ),
  ];

  if (unique.length === 0) {
    return undefined;
  }

  if (unique.length === 1) {
    return unique[0];
  }

  return "mixed";
}

function pushGeneratedMismatchDiagnostic(args: {
  diagnostics: ParserDiagnostic[];
  severity: "error" | "warn";
  filePath: string;
  message: string;
  details: Record<string, unknown>;
}): void {
  args.diagnostics.push({
    stage: STAGE,
    severity: args.severity,
    code: "PARSER_GENERATED_LOOKUP_MISMATCH",
    message: args.message,
    filePath: args.filePath,
    details: args.details,
  });
}

function pushUnmodeledSemanticCaseDiagnostic(args: {
  diagnostics: ParserDiagnostic[];
  severity: "error" | "warn";
  filePath: string;
  message: string;
  details: Record<string, unknown>;
}): void {
  args.diagnostics.push({
    stage: STAGE,
    severity: args.severity,
    code: "PARSER_UNMODELED_SEMANTIC_CASE",
    message: args.message,
    filePath: args.filePath,
    details: args.details,
  });
}

function emitSemanticParityDiagnostics(args: {
  diagnostics: ParserDiagnostic[];
  integrityMode: DataIntegrityMode;
  filePath: string;
  messagePrefix: string;
  grantFamily: "subclass_lookup" | "spell_source_lookup";
  comparison: SemanticComparisonResult;
}): void {
  const blockingSeverity = resolveMismatchSeverity(args.integrityMode);

  if (args.comparison.missingCount > 0) {
    pushGeneratedMismatchDiagnostic({
      diagnostics: args.diagnostics,
      severity: blockingSeverity,
      filePath: args.filePath,
      message: `${args.messagePrefix} Missing semantic edges in generated lookup.`,
      details: {
        comparisonMode: "semantic",
        mismatchCategory: "missing",
        grantFamily: args.grantFamily,
        grantType: firstGrantTypeFromSamples(args.comparison.missingSamples),
        inventory: args.comparison.inventory,
        recommendedNextAction: "model",
        missingCount: args.comparison.missingCount,
        sampleEdges: args.comparison.missingSamples,
        ...(args.comparison.shapeDiffSummary
          ? { shapeDiffSummary: args.comparison.shapeDiffSummary }
          : {}),
      },
    });
  }

  if (args.comparison.extraCount > 0) {
    pushGeneratedMismatchDiagnostic({
      diagnostics: args.diagnostics,
      severity: blockingSeverity,
      filePath: args.filePath,
      message: `${args.messagePrefix} Extra semantic edges found in generated lookup.`,
      details: {
        comparisonMode: "semantic",
        mismatchCategory: "extra",
        grantFamily: args.grantFamily,
        grantType: firstGrantTypeFromSamples(args.comparison.extraSamples),
        inventory: args.comparison.inventory,
        recommendedNextAction: "model",
        extraCount: args.comparison.extraCount,
        sampleEdges: args.comparison.extraSamples,
        ...(args.comparison.shapeDiffSummary
          ? { shapeDiffSummary: args.comparison.shapeDiffSummary }
          : {}),
      },
    });
  }

  if (args.comparison.lineageMismatchCount > 0) {
    pushGeneratedMismatchDiagnostic({
      diagnostics: args.diagnostics,
      severity: blockingSeverity,
      filePath: args.filePath,
      message: `${args.messagePrefix} Lineage metadata mismatches detected.`,
      details: {
        comparisonMode: "semantic",
        mismatchCategory: "lineage",
        grantFamily: args.grantFamily,
        grantType: firstGrantTypeFromSamples(args.comparison.lineageSamples),
        inventory: args.comparison.inventory,
        recommendedNextAction: "model",
        lineageMismatchCount: args.comparison.lineageMismatchCount,
        sampleEdges: args.comparison.lineageSamples,
        ...(args.comparison.shapeDiffSummary
          ? { shapeDiffSummary: args.comparison.shapeDiffSummary }
          : {}),
      },
    });
  }

  if (args.comparison.unmodeledSemanticCases.length > 0) {
    pushGeneratedMismatchDiagnostic({
      diagnostics: args.diagnostics,
      severity: blockingSeverity,
      filePath: args.filePath,
      message: `${args.messagePrefix} Unmodeled semantic-critical generated lookup cases detected.`,
      details: {
        comparisonMode: "semantic",
        mismatchCategory: "unmodeled_case",
        grantFamily: args.grantFamily,
        grantType: firstGrantTypeFromSamples(args.comparison.unmodeledSemanticCases),
        inventory: args.comparison.inventory,
        recommendedNextAction: "classify",
        unmodeledCaseCount: args.comparison.unmodeledSemanticCases.length,
        sampleCases: args.comparison.unmodeledSemanticCases,
        ...(args.comparison.shapeDiffSummary
          ? { shapeDiffSummary: args.comparison.shapeDiffSummary }
          : {}),
      },
    });

    pushUnmodeledSemanticCaseDiagnostic({
      diagnostics: args.diagnostics,
      severity: blockingSeverity,
      filePath: args.filePath,
      message: `${args.messagePrefix} Unmodeled semantic-critical generated lookup cases detected.`,
      details: {
        comparisonMode: "semantic",
        mismatchCategory: "unmodeled_case",
        grantFamily: args.grantFamily,
        grantType: firstGrantTypeFromSamples(args.comparison.unmodeledSemanticCases),
        inventory: args.comparison.inventory,
        recommendedNextAction: "classify",
        unmodeledCaseCount: args.comparison.unmodeledSemanticCases.length,
        sampleCases: args.comparison.unmodeledSemanticCases,
        ...(args.comparison.shapeDiffSummary
          ? { shapeDiffSummary: args.comparison.shapeDiffSummary }
          : {}),
      },
    });
  }

  if (args.comparison.decorativeCases.length > 0) {
    pushGeneratedMismatchDiagnostic({
      diagnostics: args.diagnostics,
      severity: "warn",
      filePath: args.filePath,
      message: `${args.messagePrefix} Unmodeled decorative metadata detected (non-blocking).`,
      details: {
        comparisonMode: "semantic",
        mismatchCategory: "unmodeled_case",
        grantFamily: args.grantFamily,
        grantType: firstGrantTypeFromSamples(args.comparison.decorativeCases),
        inventory: args.comparison.inventory,
        recommendedNextAction: "debug_only",
        unmodeledDecorativeCount: args.comparison.decorativeCases.length,
        sampleCases: args.comparison.decorativeCases,
        ...(args.comparison.shapeDiffSummary
          ? { shapeDiffSummary: args.comparison.shapeDiffSummary }
          : {}),
      },
    });
  }
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
    const comparison = compareGeneratedSubclassLookupSemanticParity({
      normalized: args.normalized,
      actualGeneratedLookup: args.normalized.generatedSubclassLookup,
      includeShapeDiffSummary: shapeDiffEnabled(),
    });

    emitSemanticParityDiagnostics({
      diagnostics: args.diagnostics,
      integrityMode: args.integrityMode,
      filePath: "generated/gendata-subclass-lookup.json",
      messagePrefix: "Generated subclass lookup does not match resolved subclass data.",
      grantFamily: "subclass_lookup",
      comparison,
    });
  }

  if (args.normalized.generatedSpellSourceLookup !== undefined) {
    const comparison = compareGeneratedSpellSourceLookupSemanticParity({
      normalized: args.normalized,
      actualGeneratedLookup: args.normalized.generatedSpellSourceLookup,
      includeShapeDiffSummary: shapeDiffEnabled(),
    });

    emitSemanticParityDiagnostics({
      diagnostics: args.diagnostics,
      integrityMode: args.integrityMode,
      filePath: "generated/gendata-spell-source-lookup.json",
      messagePrefix: "Generated spell-source lookup does not match resolved spell-source edges.",
      grantFamily: "spell_source_lookup",
      comparison,
    });
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
