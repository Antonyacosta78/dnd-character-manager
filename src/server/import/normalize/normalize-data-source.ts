import type {
  NormalizedDataSource,
  NormalizedEntity,
  ParserDiagnostic,
  ResolvedDataSource,
  SourceEntity,
  SourceEntityKind,
} from "@/server/import/parser-types";

const STAGE = "normalize";
const DEFAULT_SOURCE = "PHB";

function normalizeSource(source: unknown, fallback: string = DEFAULT_SOURCE): string {
  if (typeof source !== "string" || source.trim().length === 0) {
    return fallback;
  }

  return source.trim();
}

function normalizeName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const name = value.trim();
  return name.length > 0 ? name : undefined;
}

function slug(value: string): string {
  return value.trim().toLowerCase();
}

function createEntityIdentity(kind: SourceEntityKind, value: Record<string, unknown>): string | undefined {
  const name = normalizeName(value.name);
  if (!name) {
    return undefined;
  }

  const source = normalizeSource(value.source);

  switch (kind) {
    case "subclass": {
      const className = normalizeName(value.className);
      const classSource = normalizeSource(value.classSource);
      const shortName = normalizeName(value.shortName);

      if (!className || !shortName) {
        return undefined;
      }

      return `${kind}:${slug(name)}|${slug(source)}|${slug(className)}|${slug(classSource)}|${slug(shortName)}`;
    }

    case "classFeature": {
      const className = normalizeName(value.className);
      const classSource = normalizeSource(value.classSource);
      const level = typeof value.level === "number" ? value.level : Number(value.level);

      if (!className || Number.isNaN(level)) {
        return undefined;
      }

      return `${kind}:${slug(name)}|${slug(source)}|${slug(className)}|${slug(classSource)}|${level}`;
    }

    case "subclassFeature": {
      const className = normalizeName(value.className);
      const classSource = normalizeSource(value.classSource);
      const subclassShortName =
        normalizeName(value.subclassShortName) ?? normalizeName(value.subclassName);
      const subclassSource = normalizeSource(value.subclassSource, classSource);
      const level = typeof value.level === "number" ? value.level : Number(value.level);

      if (!className || !subclassShortName || Number.isNaN(level)) {
        return undefined;
      }

      return `${kind}:${slug(name)}|${slug(source)}|${slug(className)}|${slug(classSource)}|${slug(subclassShortName)}|${slug(subclassSource)}|${level}`;
    }

    default:
      return `${kind}:${slug(name)}|${slug(source)}`;
  }
}

function toNormalizedEntity(entity: SourceEntity): NormalizedEntity | undefined {
  const name = normalizeName(entity.value.name);

  if (!name) {
    return undefined;
  }

  const source = normalizeSource(entity.value.source);
  const identity = createEntityIdentity(entity.kind, entity.value);

  if (!identity) {
    return undefined;
  }

  return {
    kind: entity.kind,
    identity,
    name,
    source,
    payload: structuredClone(entity.value),
    edition: normalizeName(entity.value.edition),
    reprintedAs: entity.value.reprintedAs,
    otherSources: entity.value.otherSources,
  };
}

export function normalizeDataSource(resolved: ResolvedDataSource): NormalizedDataSource {
  const diagnostics: ParserDiagnostic[] = [];

  const entities = resolved.entities
    .map((entity) => {
      const normalized = toNormalizedEntity(entity);

      if (!normalized) {
        diagnostics.push({
          stage: STAGE,
          severity: "error",
          code: "PARSER_NORMALIZE_ENTITY_INVALID",
          message: `Unable to normalize ${entity.kind} from ${entity.filePath} due to missing identity fields.`,
          filePath: entity.filePath,
        });
      }

      return normalized;
    })
    .filter((entity): entity is NormalizedEntity => Boolean(entity));

  return {
    entities,
    spellSourceEdges: resolved.spellSourceEdges,
    featureReferences: resolved.featureReferences,
    unresolvedReferences: resolved.unresolvedReferences,
    unsupportedAdditionalSpells: resolved.unsupportedAdditionalSpells,
    generatedSubclassLookup: resolved.generatedSubclassLookup,
    generatedSpellSourceLookup: resolved.generatedSpellSourceLookup,
    diagnostics,
  };
}
