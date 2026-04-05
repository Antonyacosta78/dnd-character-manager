import type {
  ParserDiagnostic,
  ResolveAdditionalSpellsFailure,
  ResolveUnresolvedReference,
  ResolvedDataSource,
  ResolvedFeatureReference,
  ResolvedSpellSourceEdge,
  SourceEntity,
  SourceEntityKind,
  SpellAdditionType,
  SpellGrantType,
  ValidatedDataSource,
} from "@/server/import/parser-types";

const STAGE = "resolve";
const DEFAULT_SOURCE = "PHB";

type JsonObject = Record<string, unknown>;

interface FeatureUidParts {
  uid: string;
  name: string;
  source: string;
  className: string;
  classSource: string;
  level: number;
  subclassShortName?: string;
  subclassSource?: string;
}

interface FeatureLookupEntry {
  entity: SourceEntity;
  parts: FeatureUidParts;
}

interface FeatureLookup {
  byUid: Map<string, FeatureLookupEntry[]>;
  entries: FeatureLookupEntry[];
}

interface ResolvedFeatureCandidate {
  entry: FeatureLookupEntry;
  strategy: "exact" | "normalized_equivalent" | "stable_identity";
  requestedUid: string;
  equivalentUids?: string[];
}

interface AdditionalSpellContext {
  ownerKind: SpellGrantType;
  ownerName: string;
  ownerSource: string;
  ownerClassName?: string;
  ownerClassSource?: string;
  ownerSubclassShortName?: string;
  additionType?: SpellAdditionType;
  filePath: string;
  definedInSource?: string;
  definedInSources?: string[];
}

interface SpellRecord {
  entity: SourceEntity;
  spellName: string;
  spellSource: string;
  additionalSources: string[];
  level?: number;
  school?: string;
  ritual: boolean;
  spellAttack: string[];
  damageTypes: string[];
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

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

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeRaceOwnerName(value: JsonObject): string | undefined {
  const name = normalizeName(value.name);
  if (!name) {
    return undefined;
  }

  const source = normalizeSource(value.source, normalizeSource(value.raceSource));

  if (source === "SCAG") {
    const raceName = normalizeName(value.raceName);
    if (raceName === "Half-Elf") {
      const variantParts = name
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

      if (variantParts.length >= 2 && slug(variantParts[0]) === "variant") {
        return `Half-Elf (${variantParts[0]}; ${variantParts[1]})`;
      }
    }

    const halfElfVariantMatch = /^Half-Elf \(Variant; ([^;()]+); ([^)]+)\)$/.exec(name);
    if (halfElfVariantMatch) {
      const baseVariant = normalizeName(halfElfVariantMatch[1]);
      if (baseVariant) {
        return `Half-Elf (Variant; ${baseVariant})`;
      }
    }
  }

  if (!normalizeName(value.raceName)) {
    if (source === "MPMM" && name.includes(";")) {
      const [baseName] = name.split(";");
      const collapsed = normalizeName(baseName);
      if (collapsed) {
        return collapsed;
      }
    }

    return name;
  }

  const raceName = normalizeName(value.raceName);
  if (!raceName) {
    return name;
  }

  const normalizedRacePrefix = `${slug(raceName)} (`;
  const normalizedName = slug(name);

  if (normalizedName === slug(raceName) || normalizedName.startsWith(normalizedRacePrefix)) {
    return name;
  }

  const parentheticalMatch = /^(.+) \((.+)\)$/.exec(raceName);
  if (parentheticalMatch) {
    const baseRaceName = normalizeName(parentheticalMatch[1]);
    const parentRaceSuffix = normalizeName(parentheticalMatch[2]);

    if (baseRaceName && parentRaceSuffix) {
      return `${baseRaceName} (${parentRaceSuffix}; ${name})`;
    }
  }

  return `${raceName} (${name})`;
}

function normalizeRaceOwnerSource(value: JsonObject): string {
  return normalizeSource(value.source, normalizeSource(value.raceSource));
}

function slug(value: string): string {
  return value.trim().toLowerCase();
}

function deepClone<T>(value: T): T {
  return structuredClone(value);
}

function deepMerge(baseValue: unknown, patchValue: unknown): unknown {
  if (!isObject(baseValue) || !isObject(patchValue)) {
    return deepClone(patchValue);
  }

  const merged: JsonObject = deepClone(baseValue);

  for (const [key, patchChild] of Object.entries(patchValue)) {
    const baseChild = merged[key];

    if (isObject(baseChild) && isObject(patchChild)) {
      merged[key] = deepMerge(baseChild, patchChild);
      continue;
    }

    merged[key] = deepClone(patchChild);
  }

  return merged;
}

function applyTemplateVariables(value: unknown, variables: Record<string, string>): unknown {
  if (typeof value === "string") {
    return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
      return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : "";
    });
  }

  if (Array.isArray(value)) {
    return value.map((entry) => applyTemplateVariables(entry, variables));
  }

  if (!isObject(value)) {
    return value;
  }

  const next: JsonObject = {};

  for (const [key, childValue] of Object.entries(value)) {
    next[key] = applyTemplateVariables(childValue, variables);
  }

  return next;
}

function entityIdentity(kind: SourceEntityKind, value: JsonObject): string | undefined {
  const name = normalizeName(value.name);
  if (!name) {
    return undefined;
  }

  const source = normalizeSource(value.source);

  switch (kind) {
    case "subclass": {
      const className = normalizeName(value.className);
      const shortName = normalizeName(value.shortName);

      if (!className || !shortName) {
        return undefined;
      }

      const classSource = normalizeSource(value.classSource);
      return `${slug(name)}|${slug(source)}|${slug(className)}|${slug(classSource)}|${slug(shortName)}`;
    }

    case "classFeature": {
      const className = normalizeName(value.className);
      const level = typeof value.level === "number" ? value.level : Number(value.level);

      if (!className || Number.isNaN(level)) {
        return undefined;
      }

      const classSource = normalizeSource(value.classSource);
      return `${slug(name)}|${slug(source)}|${slug(className)}|${slug(classSource)}|${level}`;
    }

    case "subrace": {
      const raceName = normalizeName(value.raceName);
      const raceSource = normalizeSource(value.raceSource);

      if (!raceName) {
        return undefined;
      }

      return `${slug(name)}|${slug(source)}|${slug(raceName)}|${slug(raceSource)}`;
    }

    case "subclassFeature": {
      const className = normalizeName(value.className);
      const subclassShortName =
        normalizeName(value.subclassShortName) ?? normalizeName(value.subclassName);
      const level = typeof value.level === "number" ? value.level : Number(value.level);

      if (!className || !subclassShortName || Number.isNaN(level)) {
        return undefined;
      }

      const classSource = normalizeSource(value.classSource);
      const subclassSource = normalizeSource(value.subclassSource, classSource);

      return `${slug(name)}|${slug(source)}|${slug(className)}|${slug(classSource)}|${slug(subclassShortName)}|${slug(subclassSource)}|${level}`;
    }

    default:
      return `${slug(name)}|${slug(source)}`;
  }
}

function copyReferenceIdentity(
  kind: SourceEntityKind,
  copyValue: JsonObject,
  childValue: JsonObject,
): string | undefined {
  const pseudo: JsonObject = {
    ...childValue,
    ...copyValue,
  };

  if (!pseudo.source && copyValue.source) {
    pseudo.source = copyValue.source;
  }

  return entityIdentity(kind, pseudo);
}

function normalizeReplaceItems(items: unknown): unknown[] {
  if (Array.isArray(items)) {
    return items.map((item) => deepClone(item));
  }

  return [deepClone(items)];
}

function entryName(entry: unknown): string | undefined {
  if (typeof entry === "string") {
    return entry;
  }

  if (isObject(entry) && typeof entry.name === "string") {
    return entry.name;
  }

  return undefined;
}

function replaceTextDeep(value: unknown, pattern: RegExp, withValue: string): unknown {
  if (typeof value === "string") {
    return value.replace(pattern, withValue);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceTextDeep(entry, pattern, withValue));
  }

  if (!isObject(value)) {
    return value;
  }

  const next: JsonObject = {};

  for (const [key, childValue] of Object.entries(value)) {
    next[key] = replaceTextDeep(childValue, pattern, withValue);
  }

  return next;
}

function parseReplaceTxtProps(
  propsValue: unknown,
  diagnostics: ParserDiagnostic[],
  filePath: string,
  targetPath: string,
): Array<string | null> | undefined {
  if (propsValue === undefined) {
    return [null, "entries", "headerEntries", "footerEntries"];
  }

  if (typeof propsValue === "string") {
    return [propsValue];
  }

  if (!Array.isArray(propsValue)) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_COPY_RESOLUTION_FAILED",
      message: `replaceTxt has unsupported props shape at '${targetPath}'.`,
      filePath,
      details: {
        targetPath,
        propsType: typeof propsValue,
      },
    });
    return undefined;
  }

  const unsupportedEntry = propsValue.find(
    (entry) => entry !== null && typeof entry !== "string",
  );

  if (unsupportedEntry !== undefined) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_COPY_RESOLUTION_FAILED",
      message: `replaceTxt has unsupported props entry at '${targetPath}'.`,
      filePath,
      details: {
        targetPath,
        props: propsValue,
      },
    });
    return undefined;
  }

  return propsValue as Array<string | null>;
}

function applyReplaceTxt(args: {
  targetObject: JsonObject;
  targetPath: string;
  operation: JsonObject;
  diagnostics: ParserDiagnostic[];
  filePath: string;
}): void {
  const { targetObject, targetPath, operation, diagnostics, filePath } = args;
  const currentValue = targetObject[targetPath];

  if (currentValue === undefined || currentValue === null) {
    return;
  }

  if (typeof operation.replace !== "string" || typeof operation.with !== "string") {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_COPY_RESOLUTION_FAILED",
      message: `replaceTxt for '${targetPath}' must include string replace/with values.`,
      filePath,
    });
    return;
  }

  const props = parseReplaceTxtProps(operation.props, diagnostics, filePath, targetPath);
  if (!props) {
    return;
  }

  const rawFlags = typeof operation.flags === "string" ? operation.flags : "";
  const flags = rawFlags.includes("g") ? rawFlags : `g${rawFlags}`;

  let pattern: RegExp;

  try {
    pattern = new RegExp(operation.replace, flags);
  } catch (error) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_COPY_RESOLUTION_FAILED",
      message: `replaceTxt has invalid pattern for '${targetPath}'.`,
      filePath,
      details: {
        error: error instanceof Error ? error.message : "Unknown pattern error.",
      },
    });
    return;
  }

  if (typeof currentValue === "string") {
    targetObject[targetPath] = currentValue.replace(pattern, operation.with);
    return;
  }

  const includeSelfStrings = props.includes(null);
  const nestedProps = props.filter((entry): entry is string => typeof entry === "string");

  if (Array.isArray(currentValue)) {
    const nextValue = currentValue.map((entry) => {
      if (typeof entry === "string") {
        return includeSelfStrings ? entry.replace(pattern, operation.with as string) : entry;
      }

      if (!isObject(entry)) {
        return entry;
      }

      const nextEntry = deepClone(entry);

      for (const prop of nestedProps) {
        if (nextEntry[prop] !== undefined) {
          nextEntry[prop] = replaceTextDeep(nextEntry[prop], pattern, operation.with as string);
        }
      }

      if (includeSelfStrings && nestedProps.length === 0) {
        return replaceTextDeep(nextEntry, pattern, operation.with as string);
      }

      return nextEntry;
    });

    targetObject[targetPath] = nextValue;
    return;
  }

  if (isObject(currentValue)) {
    const nextValue = deepClone(currentValue);

    for (const prop of nestedProps) {
      if (nextValue[prop] !== undefined) {
        nextValue[prop] = replaceTextDeep(nextValue[prop], pattern, operation.with as string);
      }
    }

    if (includeSelfStrings && nestedProps.length === 0) {
      targetObject[targetPath] = replaceTextDeep(nextValue, pattern, operation.with as string);
      return;
    }

    targetObject[targetPath] = nextValue;
    return;
  }

  diagnostics.push({
    stage: STAGE,
    severity: "error",
    code: "PARSER_COPY_RESOLUTION_FAILED",
    message: `replaceTxt cannot be applied to unsupported path '${targetPath}'.`,
    filePath,
    details: {
      targetPath,
      valueType: typeof currentValue,
    },
  });
}

function applySingleModOperation(args: {
  targetObject: JsonObject;
  targetPath: string;
  operation: JsonObject;
  diagnostics: ParserDiagnostic[];
  filePath: string;
}): void {
  const { targetObject, targetPath, operation, diagnostics, filePath } = args;
  const mode = operation.mode;

  if (typeof mode !== "string") {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_COPY_RESOLUTION_FAILED",
      message: `Unsupported _mod operation without mode for '${targetPath}'.`,
      filePath,
      details: { targetPath },
    });
    return;
  }

  const currentValue = targetObject[targetPath];

  if (
    mode === "appendArr" ||
    mode === "prependArr" ||
    mode === "insertArr" ||
    mode === "replaceArr" ||
    mode === "removeArr"
  ) {
    if (!Array.isArray(currentValue)) {
      diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_COPY_RESOLUTION_FAILED",
        message: `Cannot apply _mod '${mode}' to non-array path '${targetPath}'.`,
        filePath,
      });
      return;
    }
  }

  switch (mode) {
    case "appendArr": {
      const arrayValue = currentValue as unknown[];
      targetObject[targetPath] = [...arrayValue, ...normalizeReplaceItems(operation.items)];
      return;
    }

    case "prependArr": {
      const arrayValue = currentValue as unknown[];
      targetObject[targetPath] = [...normalizeReplaceItems(operation.items), ...arrayValue];
      return;
    }

    case "insertArr": {
      const index = Number(operation.index);

      if (!Number.isInteger(index)) {
        diagnostics.push({
          stage: STAGE,
          severity: "error",
          code: "PARSER_COPY_RESOLUTION_FAILED",
          message: `insertArr for '${targetPath}' requires an integer index.`,
          filePath,
        });
        return;
      }

      const items = normalizeReplaceItems(operation.items);
      const arrayValue = currentValue as unknown[];
      const before = arrayValue.slice(0, index);
      const after = arrayValue.slice(index);
      targetObject[targetPath] = [...before, ...items, ...after];
      return;
    }

    case "removeArr": {
      const namesValue = operation.names;
      const names = new Set(
        toArray(typeof namesValue === "string" ? [namesValue] : (namesValue as unknown[]))
          .flat()
          .filter((value): value is string => typeof value === "string")
          .map((value) => slug(value)),
      );

      const arrayValue = currentValue as unknown[];

      targetObject[targetPath] = arrayValue.filter((entry: unknown) => {
        const name = entryName(entry);
        return !name || !names.has(slug(name));
      });
      return;
    }

    case "replaceArr": {
      const replaceValue = operation.replace;
      const replaceItems = normalizeReplaceItems(operation.items);
      let targetIndex = -1;
      const arrayValue = currentValue as unknown[];

      if (typeof replaceValue === "string") {
        targetIndex = arrayValue.findIndex((entry: unknown) => {
          const name = entryName(entry);
          return Boolean(name && slug(name) === slug(replaceValue));
        });
      } else if (isObject(replaceValue) && Number.isInteger(replaceValue.index)) {
        targetIndex = replaceValue.index as number;
      }

      if (targetIndex < 0 || targetIndex >= arrayValue.length) {
        diagnostics.push({
          stage: STAGE,
          severity: "error",
          code: "PARSER_COPY_RESOLUTION_FAILED",
          message: `replaceArr could not find replacement target in '${targetPath}'.`,
          filePath,
          details: { replace: replaceValue },
        });
        return;
      }

      const before = arrayValue.slice(0, targetIndex);
      const after = arrayValue.slice(targetIndex + 1);
      targetObject[targetPath] = [...before, ...replaceItems, ...after];
      return;
    }

    case "replaceTxt": {
      applyReplaceTxt({
        targetObject,
        targetPath,
        operation,
        diagnostics,
        filePath,
      });
      return;
    }

    default:
      diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_COPY_RESOLUTION_FAILED",
        message: `Unsupported _mod mode '${mode}' on path '${targetPath}'.`,
        filePath,
      });
  }
}

function applyCopyModifications(args: {
  targetObject: JsonObject;
  copyValue: JsonObject;
  diagnostics: ParserDiagnostic[];
  filePath: string;
}): void {
  const modValue = args.copyValue._mod;

  if (!isObject(modValue)) {
    return;
  }

  for (const [targetPath, operationValue] of Object.entries(modValue)) {
    if (Array.isArray(operationValue)) {
      for (const operationEntry of operationValue) {
        if (!isObject(operationEntry)) {
          args.diagnostics.push({
            stage: STAGE,
            severity: "error",
            code: "PARSER_COPY_RESOLUTION_FAILED",
            message: `Unsupported _mod operation array entry for '${targetPath}'.`,
            filePath: args.filePath,
          });
          continue;
        }

        applySingleModOperation({
          targetObject: args.targetObject,
          targetPath,
          operation: operationEntry,
          diagnostics: args.diagnostics,
          filePath: args.filePath,
        });
      }

      continue;
    }

    if (!isObject(operationValue)) {
      args.diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_COPY_RESOLUTION_FAILED",
        message: `Unsupported _mod operation shape for '${targetPath}'.`,
        filePath: args.filePath,
      });
      continue;
    }

    applySingleModOperation({
      targetObject: args.targetObject,
      targetPath,
      operation: operationValue,
      diagnostics: args.diagnostics,
      filePath: args.filePath,
    });
  }
}

function parseMetaDirectives(
  filePath: string,
  document: unknown,
  diagnostics: ParserDiagnostic[],
): void {
  if (!isObject(document) || !isObject(document._meta)) {
    return;
  }

  const meta = document._meta;

  const validateStringArray = (value: unknown, directive: string): void => {
    if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
      diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_META_DIRECTIVE_UNSUPPORTED",
        message: `Unsupported _meta.${directive} shape in ${filePath}.`,
        filePath,
      });
    }
  };

  const validateObjectOfStringArrays = (value: unknown, directive: string): void => {
    if (!isObject(value)) {
      diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_META_DIRECTIVE_UNSUPPORTED",
        message: `Unsupported _meta.${directive} shape in ${filePath}.`,
        filePath,
      });
      return;
    }

    for (const [key, entry] of Object.entries(value)) {
      if (!Array.isArray(entry) || !entry.every((item) => typeof item === "string")) {
        diagnostics.push({
          stage: STAGE,
          severity: "error",
          code: "PARSER_META_DIRECTIVE_UNSUPPORTED",
          message: `Unsupported _meta.${directive}.${key} shape in ${filePath}.`,
          filePath,
        });
      }
    }
  };

  if (meta.dependencies !== undefined) {
    validateObjectOfStringArrays(meta.dependencies, "dependencies");
  }

  if (meta.includes !== undefined) {
    validateObjectOfStringArrays(meta.includes, "includes");
  }

  if (meta.otherSources !== undefined) {
    validateObjectOfStringArrays(meta.otherSources, "otherSources");
  }

  if (meta.internalCopies !== undefined) {
    validateStringArray(meta.internalCopies, "internalCopies");
  }
}

function explodeVersions(rawValue: JsonObject): JsonObject[] {
  const versions = rawValue._versions;
  const base = deepClone(rawValue);
  delete base._versions;

  if (!Array.isArray(versions)) {
    return [base];
  }

  const results: JsonObject[] = [base];

  const materializeVersion = (versionTemplate: JsonObject): JsonObject => {
    const merged = deepMerge(base, versionTemplate) as JsonObject;

    if (isObject(versionTemplate._mod)) {
      const copyShape: JsonObject = {
        _mod: versionTemplate._mod,
      };
      applyCopyModifications({
        targetObject: merged,
        copyValue: copyShape,
        diagnostics: [],
        filePath: "_versions",
      });
    }

    delete merged._mod;
    delete merged._abstract;
    delete merged._implementations;
    delete merged._variables;

    return merged;
  };

  for (const versionEntry of versions) {
    if (!isObject(versionEntry)) {
      continue;
    }

    if (isObject(versionEntry._abstract) && Array.isArray(versionEntry._implementations)) {
      for (const implementation of versionEntry._implementations) {
        if (!isObject(implementation)) {
          continue;
        }

        const variables = isObject(implementation._variables)
          ? Object.fromEntries(
              Object.entries(implementation._variables)
                .filter((entry): entry is [string, string] => typeof entry[1] === "string")
                .map(([key, value]) => [key, value]),
            )
          : {};

        const mergedTemplate = deepMerge(versionEntry._abstract, implementation);
        const withVariables = applyTemplateVariables(mergedTemplate, variables) as JsonObject;
        results.push(materializeVersion(withVariables));
      }

      continue;
    }

    results.push(materializeVersion(versionEntry));
  }

  return results;
}

function collectEntities(
  validated: ValidatedDataSource,
  diagnostics: ParserDiagnostic[],
): SourceEntity[] {
  const entities: SourceEntity[] = [];

  for (const [filePath, document] of validated.documents.entries()) {
    parseMetaDirectives(filePath, document, diagnostics);
  }

  const appendEntities = (
    filePath: string,
    kind: SourceEntityKind,
    values: unknown,
  ): void => {
    if (!Array.isArray(values)) {
      return;
    }

    for (const entry of values) {
      if (!isObject(entry)) {
        continue;
      }

      for (const exploded of explodeVersions(entry)) {
        if (kind === "subrace" && !normalizeName(exploded.name)) {
          continue;
        }

        entities.push({
          kind,
          filePath,
          value: exploded,
        });
      }
    }
  };

  for (const classFile of validated.files.classFiles) {
    const document = validated.documents.get(classFile.relativePath);
    if (!isObject(document)) {
      continue;
    }

    appendEntities(classFile.relativePath, "class", document.class);
    appendEntities(classFile.relativePath, "subclass", document.subclass);
    appendEntities(classFile.relativePath, "classFeature", document.classFeature);
    appendEntities(classFile.relativePath, "subclassFeature", document.subclassFeature);
  }

  for (const spellFile of validated.files.spellFiles) {
    const document = validated.documents.get(spellFile.relativePath);
    if (!isObject(document)) {
      continue;
    }

    appendEntities(spellFile.relativePath, "spell", document.spell);
  }

  const rootEntityFileDefinitions: Array<[SourceEntityKind, string, string]> = [
    ["race", validated.files.races.relativePath, "race"],
    ["subrace", validated.files.races.relativePath, "subrace"],
    ["background", validated.files.backgrounds.relativePath, "background"],
    ["feat", validated.files.feats.relativePath, "feat"],
    ["optionalfeature", validated.files.optionalfeatures.relativePath, "optionalfeature"],
  ];

  if (validated.files.optionalCharcreationoptions) {
    rootEntityFileDefinitions.push([
      "charoption",
      validated.files.optionalCharcreationoptions.relativePath,
      "charoption",
    ]);
  }

  if (validated.files.optionalRewards) {
    rootEntityFileDefinitions.push([
      "reward",
      validated.files.optionalRewards.relativePath,
      "reward",
    ]);
  }

  for (const [kind, filePath, rootKey] of rootEntityFileDefinitions) {
    const document = validated.documents.get(filePath);
    if (!isObject(document)) {
      continue;
    }

    appendEntities(filePath, kind, document[rootKey]);
  }

  return entities;
}

function resolveCopies(
  entities: SourceEntity[],
  diagnostics: ParserDiagnostic[],
  unresolvedReferences: ResolveUnresolvedReference[],
): SourceEntity[] {
  const groups = new Map<SourceEntityKind, SourceEntity[]>();

  for (const entity of entities) {
    const group = groups.get(entity.kind) ?? [];
    group.push(entity);
    groups.set(entity.kind, group);
  }

  const resolvedEntities: SourceEntity[] = [];

  for (const [kind, group] of groups.entries()) {
    const keyToIndices = new Map<string, number[]>();

    group.forEach((entity, index) => {
      const key = entityIdentity(kind, entity.value);
      if (!key) {
        return;
      }

      const values = keyToIndices.get(key) ?? [];
      values.push(index);
      keyToIndices.set(key, values);
    });

    const cache = new Map<number, JsonObject>();
    const active = new Set<number>();

    const resolveIndex = (index: number): JsonObject => {
      if (cache.has(index)) {
        return cache.get(index) as JsonObject;
      }

      if (active.has(index)) {
        const entity = group[index];
        const entityName = normalizeName(entity.value.name) ?? "(unnamed)";
        const entitySource = normalizeSource(entity.value.source);

        diagnostics.push({
          stage: STAGE,
          severity: "error",
          code: "PARSER_COPY_RESOLUTION_FAILED",
          message: `Detected recursive _copy cycle for ${entityName}|${entitySource}.`,
          filePath: entity.filePath,
        });

        return deepClone(entity.value);
      }

      active.add(index);
      const entity = group[index];
      let resolved = deepClone(entity.value);

      if (isObject(entity.value._copy)) {
        const copyValue = entity.value._copy;
        const lookupKey = copyReferenceIdentity(kind, copyValue, entity.value);

        if (!lookupKey) {
          diagnostics.push({
            stage: STAGE,
            severity: "error",
            code: "PARSER_COPY_RESOLUTION_FAILED",
            message: `Unable to compute _copy identity for ${normalizeName(entity.value.name) ?? "(unnamed)"}.`,
            filePath: entity.filePath,
          });
        } else {
          const candidates = (keyToIndices.get(lookupKey) ?? []).filter((value) => value !== index);

          if (candidates.length === 0) {
            const ownerName = normalizeName(entity.value.name) ?? "(unnamed)";
            const ownerSource = normalizeSource(entity.value.source);

            diagnostics.push({
              stage: STAGE,
              severity: "error",
              code: "PARSER_COPY_RESOLUTION_FAILED",
              message: `Unresolved _copy reference '${lookupKey}' for ${ownerName}|${ownerSource}.`,
              filePath: entity.filePath,
            });

            unresolvedReferences.push({
              referenceKind: "copy",
              reference: lookupKey,
              ownerKind: entity.kind,
              ownerName,
              ownerSource,
              filePath: entity.filePath,
            });
          } else {
            const parentValue = resolveIndex(candidates[0]);
            resolved = deepClone(parentValue);

            applyCopyModifications({
              targetObject: resolved,
              copyValue,
              diagnostics,
              filePath: entity.filePath,
            });

            const childOverlay = deepClone(entity.value);
            delete childOverlay._copy;
            resolved = deepMerge(resolved, childOverlay) as JsonObject;

            if (isObject(copyValue._preserve)) {
              for (const [preserveKey, preserveValue] of Object.entries(copyValue._preserve)) {
                if (preserveValue !== true) {
                  continue;
                }

                if (resolved[preserveKey] === undefined && parentValue[preserveKey] !== undefined) {
                  resolved[preserveKey] = deepClone(parentValue[preserveKey]);
                }
              }
            }
          }
        }

        delete resolved._copy;
      }

      active.delete(index);
      cache.set(index, resolved);
      return resolved;
    };

    group.forEach((entity, index) => {
      resolvedEntities.push({
        ...entity,
        value: resolveIndex(index),
      });
    });
  }

  return resolvedEntities;
}

function parseClassFeatureUid(
  uidValue: string,
  classSourceDefault: string = DEFAULT_SOURCE,
): FeatureUidParts | undefined {
  const parts = uidValue.split("|");

  if (parts.length < 4) {
    return undefined;
  }

  const [nameRaw, classNameRaw, classSourceRaw, levelRaw, sourceRaw] = parts;
  const name = normalizeName(nameRaw);
  const className = normalizeName(classNameRaw);
  const classSource = normalizeSource(classSourceRaw, classSourceDefault);
  const level = Number(levelRaw);

  if (!name || !className || Number.isNaN(level)) {
    return undefined;
  }

  const source = normalizeSource(sourceRaw, classSource);
  const uid = `${name}|${className}|${classSource}|${level}|${source}`;

  return {
    uid,
    name,
    source,
    className,
    classSource,
    level,
  };
}

function parseSubclassFeatureUid(args: {
  uidValue: string;
  classSourceDefault?: string;
  subclassSourceDefault?: string;
}): FeatureUidParts | undefined {
  const classSourceDefault = args.classSourceDefault ?? DEFAULT_SOURCE;
  const subclassSourceDefault = args.subclassSourceDefault ?? DEFAULT_SOURCE;
  const uidValue = args.uidValue;
  const parts = uidValue.split("|");

  if (parts.length < 6) {
    return undefined;
  }

  const [
    nameRaw,
    classNameRaw,
    classSourceRaw,
    subclassShortNameRaw,
    subclassSourceRaw,
    levelRaw,
    sourceRaw,
  ] = parts;

  const name = normalizeName(nameRaw);
  const className = normalizeName(classNameRaw);
  const subclassShortName = normalizeName(subclassShortNameRaw);
  const classSource = normalizeSource(classSourceRaw, classSourceDefault);
  const subclassSource = normalizeSource(subclassSourceRaw, subclassSourceDefault);
  const level = Number(levelRaw);

  if (!name || !className || !subclassShortName || Number.isNaN(level)) {
    return undefined;
  }

  const source = normalizeSource(sourceRaw, subclassSource);
  const uid = `${name}|${className}|${classSource}|${subclassShortName}|${subclassSource}|${level}|${source}`;

  return {
    uid,
    name,
    source,
    className,
    classSource,
    subclassShortName,
    subclassSource,
    level,
  };
}

function createFeatureUidLookup(
  entities: SourceEntity[],
  kind: "classFeature" | "subclassFeature",
): FeatureLookup {
  const byUid = new Map<string, FeatureLookupEntry[]>();
  const entries: FeatureLookupEntry[] = [];

  const addEntry = (parts: FeatureUidParts, entity: SourceEntity): void => {
    const key = slug(parts.uid);
    const existing = byUid.get(key);
    const entry: FeatureLookupEntry = {
      entity,
      parts,
    };

    if (existing) {
      existing.push(entry);
    } else {
      byUid.set(key, [entry]);
    }

    entries.push(entry);
  };

  for (const entity of entities) {
    if (entity.kind !== kind) {
      continue;
    }

    const name = normalizeName(entity.value.name);
    const className = normalizeName(entity.value.className);
    const classSource = normalizeSource(entity.value.classSource, DEFAULT_SOURCE);
    const source = normalizeSource(entity.value.source, classSource);
    const level = typeof entity.value.level === "number" ? entity.value.level : Number(entity.value.level);

    if (!name || !className || Number.isNaN(level)) {
      continue;
    }

    if (kind === "classFeature") {
      addEntry(
        {
          uid: `${name}|${className}|${classSource}|${level}|${source}`,
          name,
          source,
          className,
          classSource,
          level,
        },
        entity,
      );
      continue;
    }

    const subclassShortName =
      normalizeName(entity.value.subclassShortName) ?? normalizeName(entity.value.subclassName);
    const subclassSource = normalizeSource(entity.value.subclassSource, DEFAULT_SOURCE);

    if (!subclassShortName) {
      continue;
    }

    addEntry(
      {
        uid: `${name}|${className}|${classSource}|${subclassShortName}|${subclassSource}|${level}|${source}`,
        name,
        source,
        className,
        classSource,
        subclassShortName,
        subclassSource,
        level,
      },
      entity,
    );
  }

  return {
    byUid,
    entries,
  };
}

function buildNormalizedFeatureUidCandidates(args: {
  featureKind: "classFeature" | "subclassFeature";
  uidValue: string;
  ownerDefaultSource: string;
}): FeatureUidParts[] {
  const candidates: FeatureUidParts[] = [];

  const addCandidate = (candidate: FeatureUidParts | undefined): void => {
    if (!candidate) {
      return;
    }

    if (candidates.some((value) => slug(value.uid) === slug(candidate.uid))) {
      return;
    }

    candidates.push(candidate);
  };

  if (args.featureKind === "classFeature") {
    addCandidate(parseClassFeatureUid(args.uidValue, DEFAULT_SOURCE));
    addCandidate(parseClassFeatureUid(args.uidValue, args.ownerDefaultSource));
    return candidates;
  }

  addCandidate(
    parseSubclassFeatureUid({
      uidValue: args.uidValue,
      classSourceDefault: DEFAULT_SOURCE,
      subclassSourceDefault: DEFAULT_SOURCE,
    }),
  );

  const legacyParsed = parseSubclassFeatureUid({
    uidValue: args.uidValue,
    classSourceDefault: args.ownerDefaultSource,
    subclassSourceDefault: args.ownerDefaultSource,
  });

  addCandidate(legacyParsed);

  if (legacyParsed) {
    addCandidate(
      parseSubclassFeatureUid({
        uidValue: args.uidValue,
        classSourceDefault: args.ownerDefaultSource,
        subclassSourceDefault: legacyParsed.classSource,
      }),
    );
  }

  return candidates;
}

function hasMatchingStableIdentity(
  reference: FeatureUidParts,
  candidate: FeatureUidParts,
  featureKind: "classFeature" | "subclassFeature",
): boolean {
  if (
    slug(reference.name) !== slug(candidate.name) ||
    slug(reference.className) !== slug(candidate.className) ||
    slug(reference.classSource) !== slug(candidate.classSource) ||
    slug(reference.source) !== slug(candidate.source)
  ) {
    return false;
  }

  if (featureKind === "classFeature") {
    return true;
  }

  return (
    reference.subclassShortName !== undefined &&
    candidate.subclassShortName !== undefined &&
    reference.subclassSource !== undefined &&
    candidate.subclassSource !== undefined &&
    slug(reference.subclassShortName) === slug(candidate.subclassShortName) &&
    slug(reference.subclassSource) === slug(candidate.subclassSource)
  );
}

function resolveFeatureReferenceCandidate(args: {
  lookup: FeatureLookup;
  featureKind: "classFeature" | "subclassFeature";
  uidValue: string;
  ownerDefaultSource: string;
}): ResolvedFeatureCandidate | undefined {
  const normalizedCandidates = buildNormalizedFeatureUidCandidates({
    featureKind: args.featureKind,
    uidValue: args.uidValue,
    ownerDefaultSource: args.ownerDefaultSource,
  });

  if (normalizedCandidates.length === 0) {
    return undefined;
  }

  const [requested] = normalizedCandidates;
  const requestedKey = slug(requested.uid);
  const exactMatches = args.lookup.byUid.get(requestedKey) ?? [];

  if (exactMatches.length === 1) {
    return {
      entry: exactMatches[0],
      strategy: "exact",
      requestedUid: requested.uid,
    };
  }

  const equivalentMatches = new Map<string, FeatureLookupEntry>();

  for (const candidate of normalizedCandidates.slice(1)) {
    const matches = args.lookup.byUid.get(slug(candidate.uid)) ?? [];

    for (const match of matches) {
      equivalentMatches.set(slug(match.parts.uid), match);
    }
  }

  if (equivalentMatches.size === 1) {
    const [entry] = equivalentMatches.values();
    return {
      entry,
      strategy: "normalized_equivalent",
      requestedUid: requested.uid,
      equivalentUids: normalizedCandidates.map((candidate) => candidate.uid),
    };
  }

  if (equivalentMatches.size > 1) {
    return undefined;
  }

  const stableIdentityMatches = new Map<string, FeatureLookupEntry>();

  for (const reference of normalizedCandidates) {
    for (const entry of args.lookup.entries) {
      if (!hasMatchingStableIdentity(reference, entry.parts, args.featureKind)) {
        continue;
      }

      stableIdentityMatches.set(slug(entry.parts.uid), entry);
    }
  }

  if (stableIdentityMatches.size !== 1) {
    return undefined;
  }

  const [entry] = stableIdentityMatches.values();
  return {
    entry,
    strategy: "stable_identity",
    requestedUid: requested.uid,
    equivalentUids: normalizedCandidates.map((candidate) => candidate.uid),
  };
}

function resolveFeatureReferences(args: {
  entities: SourceEntity[];
  unresolvedReferences: ResolveUnresolvedReference[];
  diagnostics: ParserDiagnostic[];
}): ResolvedFeatureReference[] {
  const classFeatureLookup = createFeatureUidLookup(args.entities, "classFeature");
  const subclassFeatureLookup = createFeatureUidLookup(args.entities, "subclassFeature");
  const references: ResolvedFeatureReference[] = [];

  const handleReference = (
    owner: SourceEntity,
    referenceValue: unknown,
    featureKind: "classFeature" | "subclassFeature",
    ownerDefaultSource: string,
  ): void => {
    let uidValue: string | undefined;
    let flags: Record<string, unknown> | undefined;

    if (typeof referenceValue === "string") {
      uidValue = referenceValue;
    } else if (isObject(referenceValue)) {
      const key = featureKind === "classFeature" ? "classFeature" : "subclassFeature";

      if (typeof referenceValue[key] === "string") {
        uidValue = referenceValue[key] as string;
        const clonedFlags = deepClone(referenceValue);
        delete clonedFlags[key];
        flags = clonedFlags;
      }
    }

    if (!uidValue) {
      return;
    }

    const parsed =
      featureKind === "classFeature"
        ? parseClassFeatureUid(uidValue, DEFAULT_SOURCE)
        : parseSubclassFeatureUid({
            uidValue,
            classSourceDefault: DEFAULT_SOURCE,
            subclassSourceDefault: DEFAULT_SOURCE,
          });

    if (!parsed) {
      args.unresolvedReferences.push({
        referenceKind: featureKind,
        reference: uidValue,
        ownerKind: owner.kind,
        ownerName: normalizeName(owner.value.name) ?? "(unnamed)",
        ownerSource: normalizeSource(owner.value.source),
        filePath: owner.filePath,
      });
      return;
    }

    const lookup = featureKind === "classFeature" ? classFeatureLookup : subclassFeatureLookup;
    const resolved = resolveFeatureReferenceCandidate({
      lookup,
      featureKind,
      uidValue,
      ownerDefaultSource,
    });

    if (!resolved) {
      args.unresolvedReferences.push({
        referenceKind: featureKind,
        reference: parsed.uid,
        ownerKind: owner.kind,
        ownerName: normalizeName(owner.value.name) ?? "(unnamed)",
        ownerSource: normalizeSource(owner.value.source),
        filePath: owner.filePath,
      });
      return;
    }

    if (resolved.strategy !== "exact") {
      args.diagnostics.push({
        stage: STAGE,
        severity: "warn",
        code: "PARSER_FEATURE_REFERENCE_FALLBACK",
        message: `Resolved ${featureKind} reference '${resolved.requestedUid}' via ${resolved.strategy}.`,
        filePath: owner.filePath,
        details: {
          featureKind,
          strategy: resolved.strategy,
          ownerKind: owner.kind,
          ownerName: normalizeName(owner.value.name) ?? "(unnamed)",
          ownerSource: normalizeSource(owner.value.source),
          requestedUid: resolved.requestedUid,
          resolvedUid: resolved.entry.parts.uid,
          requestedLevel: parsed.level,
          resolvedLevel: resolved.entry.parts.level,
          equivalentUids: resolved.equivalentUids,
        },
      });
    }

    references.push({
      ownerKind: owner.kind as "class" | "subclass",
      ownerName: normalizeName(owner.value.name) ?? "(unnamed)",
      ownerSource: normalizeSource(owner.value.source),
      ownerClassName: normalizeName(owner.value.className),
      ownerClassSource: normalizeName(owner.value.classSource),
      featureKind,
      featureUid: resolved.entry.parts.uid,
      featureName: normalizeName(resolved.entry.entity.value.name),
      featureSource: normalizeSource(resolved.entry.entity.value.source),
      flags,
    });
  };

  for (const entity of args.entities) {
    if (entity.kind === "class" && Array.isArray(entity.value.classFeatures)) {
      for (const featureReference of entity.value.classFeatures) {
        handleReference(entity, featureReference, "classFeature", normalizeSource(entity.value.source));
      }
    }

    if (entity.kind === "subclass" && Array.isArray(entity.value.subclassFeatures)) {
      for (const featureReference of entity.value.subclassFeatures) {
        handleReference(
          entity,
          featureReference,
          "subclassFeature",
          normalizeSource(entity.value.classSource),
        );
      }
    }
  }

  return references;
}

function normalizeSpellUid(uidValue: string): { name: string; source?: string } | undefined {
  const withoutHash = uidValue.split("#")[0].trim();
  if (!withoutHash) {
    return undefined;
  }

  const [nameRaw, sourceRaw] = withoutHash.split("|");
  const name = normalizeName(nameRaw);

  if (!name) {
    return undefined;
  }

  return {
    name,
    source:
      typeof sourceRaw === "string" && sourceRaw.trim().length > 0
        ? sourceRaw.trim()
        : undefined,
  };
}

function spellKey(name: string, source: string): string {
  return `${slug(name)}|${slug(source)}`;
}

function buildSpellRecords(entities: SourceEntity[]): Map<string, SpellRecord> {
  const records = new Map<string, SpellRecord>();

  for (const entity of entities) {
    if (entity.kind !== "spell") {
      continue;
    }

    const spellName = normalizeName(entity.value.name);
    const spellSource = normalizeSource(entity.value.source);

    if (!spellName) {
      continue;
    }

    const level =
      typeof entity.value.level === "number"
        ? entity.value.level
        : Number.isFinite(Number(entity.value.level))
          ? Number(entity.value.level)
          : undefined;

    const school = normalizeName(entity.value.school);

    const ritual =
      isObject(entity.value.meta) &&
      (entity.value.meta.ritual === true || entity.value.meta.ritual === "true");

    const spellAttack = Array.isArray(entity.value.spellAttack)
      ? entity.value.spellAttack
          .filter((value): value is string => typeof value === "string")
          .map((value) => slug(value))
      : [];

    const damageTypes = Array.isArray(entity.value.damageInflict)
      ? entity.value.damageInflict
          .filter((value): value is string => typeof value === "string")
          .map((value) => slug(value))
      : [];

    const additionalSources = Array.isArray(entity.value.otherSources)
      ? entity.value.otherSources
          .filter(
            (entry): entry is JsonObject =>
              isObject(entry) && typeof entry.source === "string" && entry.source.trim().length > 0,
          )
          .map((entry) => slug(entry.source as string))
      : [];

    records.set(spellKey(spellName, spellSource), {
      entity,
      spellName,
      spellSource,
      additionalSources,
      level,
      school,
      ritual,
      spellAttack,
      damageTypes,
    });
  }

  return records;
}

function collectSpellSourceEdgesFromLookup(args: {
  validated: ValidatedDataSource;
  spellRecords: Map<string, SpellRecord>;
  unresolvedReferences: ResolveUnresolvedReference[];
  classMembershipBySpell: Map<string, Set<string>>;
}): ResolvedSpellSourceEdge[] {
  const edges: ResolvedSpellSourceEdge[] = [];
  const sourceLookup = args.validated.documents.get(args.validated.files.spellSources.relativePath);

  if (!isObject(sourceLookup)) {
    return edges;
  }

  for (const [spellSourceCode, spells] of Object.entries(sourceLookup)) {
    if (!isObject(spells)) {
      continue;
    }

    for (const [spellName, grants] of Object.entries(spells)) {
      if (!isObject(grants)) {
        continue;
      }

      const spellRecord = args.spellRecords.get(spellKey(spellName, spellSourceCode));

      if (!spellRecord) {
        args.unresolvedReferences.push({
          referenceKind: "spell",
          reference: `${spellName}|${spellSourceCode}`,
          ownerKind: "spell",
          ownerName: spellName,
          ownerSource: spellSourceCode,
          filePath: args.validated.files.spellSources.relativePath,
        });
        continue;
      }

      for (const [grantType, owners] of Object.entries(grants)) {
        if ((grantType !== "class" && grantType !== "classVariant") || !Array.isArray(owners)) {
          continue;
        }

        for (const owner of owners) {
          if (!isObject(owner)) {
            continue;
          }

          const ownerName = normalizeName(owner.name);
          if (!ownerName) {
            continue;
          }

          const ownerSource = normalizeSource(owner.source);

          edges.push({
            spellName: spellRecord.spellName,
            spellSource: spellRecord.spellSource,
            grantType,
            ownerName,
            ownerSource,
            definedInSource:
              typeof owner.definedInSource === "string" ? owner.definedInSource : undefined,
            definedInSources: Array.isArray(owner.definedInSources)
              ? owner.definedInSources.filter((value): value is string => typeof value === "string")
              : undefined,
            provenanceFilePath: args.validated.files.spellSources.relativePath,
          });

          if (grantType === "class" || grantType === "classVariant") {
            const members = args.classMembershipBySpell.get(
              spellKey(spellRecord.spellName, spellRecord.spellSource),
            ) ?? new Set<string>();
            members.add(slug(ownerName));
            args.classMembershipBySpell.set(
              spellKey(spellRecord.spellName, spellRecord.spellSource),
              members,
            );
          }
        }
      }
    }
  }

  return edges;
}

function parseFilterExpression(value: unknown):
  | { kind: "string"; terms: Array<{ field: string; values: string[] }> }
  | { kind: "object"; expression: JsonObject }
  | undefined {
  if (typeof value === "string") {
    const terms = value
      .split("|")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const equalIndex = part.indexOf("=");

        if (equalIndex < 0) {
          return undefined;
        }

        const field = part.slice(0, equalIndex).trim().toLowerCase();
        const values = part
          .slice(equalIndex + 1)
          .split(";")
          .map((entry) => entry.trim().toLowerCase())
          .filter((entry) => entry.length > 0);

        if (!field || values.length === 0) {
          return undefined;
        }

        return { field, values };
      });

    if (terms.some((term) => !term)) {
      return undefined;
    }

    return { kind: "string", terms: terms as Array<{ field: string; values: string[] }> };
  }

  if (isObject(value)) {
    return { kind: "object", expression: value };
  }

  return undefined;
}

function evaluateFilterTerm(args: {
  termField: string;
  termValues: string[];
  spell: SpellRecord;
  classMembershipBySpell: Map<string, Set<string>>;
}): boolean | undefined {
  const { termField, termValues, spell, classMembershipBySpell } = args;

  switch (termField) {
    case "level": {
      if (spell.level === undefined) {
        return false;
      }

      return termValues.some((entry) => Number(entry) === spell.level);
    }

    case "class": {
      const memberships = classMembershipBySpell.get(spellKey(spell.spellName, spell.spellSource));

      if (!memberships) {
        return false;
      }

      return termValues.some((value) => memberships.has(slug(value)));
    }

    case "school":
      return Boolean(spell.school && termValues.includes(slug(spell.school)));

    case "source":
      return termValues.some(
        (value) => value === slug(spell.spellSource) || spell.additionalSources.includes(value),
      );

    case "components & miscellaneous":
      return termValues.every((value) => {
        if (value === "ritual") {
          return spell.ritual;
        }

        return false;
      });

    case "spell attack":
      return termValues.some((value) => spell.spellAttack.includes(slug(value)));

    case "damage type":
      return termValues.some((value) => spell.damageTypes.includes(slug(value)));

    default:
      return undefined;
  }
}

function evaluateObjectFilter(args: {
  expression: JsonObject;
  spell: SpellRecord;
  classMembershipBySpell: Map<string, Set<string>>;
}): boolean | undefined {
  const { expression, spell, classMembershipBySpell } = args;

  if (Array.isArray(expression.and)) {
    const values = expression.and
      .map((entry) => (isObject(entry) ? evaluateObjectFilter({ expression: entry, spell, classMembershipBySpell }) : undefined))
      .filter((entry): entry is boolean => typeof entry === "boolean");

    if (values.length !== expression.and.length) {
      return undefined;
    }

    return values.every(Boolean);
  }

  if (Array.isArray(expression.or)) {
    const values = expression.or
      .map((entry) => (isObject(entry) ? evaluateObjectFilter({ expression: entry, spell, classMembershipBySpell }) : undefined))
      .filter((entry): entry is boolean => typeof entry === "boolean");

    if (values.length !== expression.or.length) {
      return undefined;
    }

    return values.some(Boolean);
  }

  if (isObject(expression.not)) {
    const nested = evaluateObjectFilter({
      expression: expression.not,
      spell,
      classMembershipBySpell,
    });

    return typeof nested === "boolean" ? !nested : undefined;
  }

  const entries = Object.entries(expression);
  if (entries.length === 0) {
    return undefined;
  }

  const results: boolean[] = [];

  for (const [key, rawValue] of entries) {
    const values = Array.isArray(rawValue)
      ? rawValue.filter((entry): entry is string => typeof entry === "string").map(slug)
      : typeof rawValue === "string"
        ? rawValue
            .split(";")
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0)
            .map(slug)
        : [];

    if (values.length === 0) {
      return undefined;
    }

    const result = evaluateFilterTerm({
      termField: slug(key),
      termValues: values,
      spell,
      classMembershipBySpell,
    });

    if (typeof result !== "boolean") {
      return undefined;
    }

    results.push(result);
  }

  return results.every(Boolean);
}

function evaluateFilterExpression(args: {
  expression: unknown;
  spell: SpellRecord;
  classMembershipBySpell: Map<string, Set<string>>;
}): boolean | undefined {
  const parsed = parseFilterExpression(args.expression);

  if (!parsed) {
    return undefined;
  }

  if (parsed.kind === "string") {
    const termResults: boolean[] = [];

    for (const term of parsed.terms) {
      const result = evaluateFilterTerm({
        termField: term.field,
        termValues: term.values,
        spell: args.spell,
        classMembershipBySpell: args.classMembershipBySpell,
      });

      if (typeof result !== "boolean") {
        return undefined;
      }

      termResults.push(result);
    }

    return termResults.every(Boolean);
  }

  return evaluateObjectFilter({
    expression: parsed.expression,
    spell: args.spell,
    classMembershipBySpell: args.classMembershipBySpell,
  });
}

function collectAdditionalSpellReferences(args: {
  value: unknown;
  context: AdditionalSpellContext;
  spellRecords: Map<string, SpellRecord>;
  classMembershipBySpell: Map<string, Set<string>>;
  edges: ResolvedSpellSourceEdge[];
  unresolvedReferences: ResolveUnresolvedReference[];
  unsupportedAdditionalSpells: ResolveAdditionalSpellsFailure[];
  dedupe: Set<string>;
}): void {
  const pushEdge = (spellName: string, spellSource: string): void => {
    if (
      args.context.ownerKind === "subclass" &&
      (slug(spellSource) === "llk" || slug(spellSource) === "aitfr-avt")
    ) {
      const ownerClass = slug(args.context.ownerClassName ?? "");
      const ownerSubclass = slug(args.context.ownerSubclassShortName ?? "");
      const shouldSkip =
        (ownerClass === "fighter" && ownerSubclass === "eldritch knight") ||
        (ownerClass === "rogue" && ownerSubclass === "arcane trickster") ||
        (ownerClass === "sorcerer" && ownerSubclass === "divine soul");

      if (shouldSkip) {
        return;
      }
    }

    const dedupeKey = [
      slug(spellName),
      slug(spellSource),
      args.context.ownerKind,
      slug(args.context.ownerName),
      slug(args.context.ownerSource),
      args.context.ownerClassName ? slug(args.context.ownerClassName) : "",
      args.context.ownerClassSource ? slug(args.context.ownerClassSource) : "",
      args.context.ownerSubclassShortName ? slug(args.context.ownerSubclassShortName) : "",
      args.context.additionType ?? "",
      args.context.definedInSource ?? "",
      (args.context.definedInSources ?? []).map(slug).join(","),
    ].join("|");

    if (args.dedupe.has(dedupeKey)) {
      return;
    }

    args.dedupe.add(dedupeKey);

    args.edges.push({
      spellName,
      spellSource,
      grantType: args.context.ownerKind,
      ownerName: args.context.ownerName,
      ownerSource: args.context.ownerSource,
      ownerClassName: args.context.ownerClassName,
      ownerClassSource: args.context.ownerClassSource,
      ownerSubclassShortName: args.context.ownerSubclassShortName,
      additionType: args.context.additionType,
      definedInSource: args.context.definedInSource,
      definedInSources: args.context.definedInSources,
      provenanceFilePath: args.context.filePath,
    });
  };

  const pushUnsupported = (reason: string): void => {
    args.unsupportedAdditionalSpells.push({
      ownerKind: args.context.ownerKind,
      ownerName: args.context.ownerName,
      ownerSource: args.context.ownerSource,
      reason,
      filePath: args.context.filePath,
    });
  };

  const recurse = (value: unknown, context: AdditionalSpellContext): void => {
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === "string") {
      const parsed = normalizeSpellUid(value);

      if (!parsed) {
        pushUnsupported(`Invalid spell UID '${value}'.`);
        return;
      }

      const candidateSources = parsed.source
        ? [parsed.source]
        : [DEFAULT_SOURCE, context.ownerSource].filter(
            (source, index, values) => values.indexOf(source) === index,
          );

      let record: SpellRecord | undefined;

      for (const source of candidateSources) {
        record = args.spellRecords.get(spellKey(parsed.name, source));

        if (record) {
          break;
        }
      }

      if (!record) {
        const sameNameMatches = [...args.spellRecords.values()].filter(
          (spellRecord) => slug(spellRecord.spellName) === slug(parsed.name),
        );

        if (sameNameMatches.length === 1) {
          [record] = sameNameMatches;
        }
      }

      if (!record) {
        const unresolvedSource = parsed.source ?? candidateSources[0] ?? DEFAULT_SOURCE;

        args.unresolvedReferences.push({
          referenceKind: "spell",
          reference: `${parsed.name}|${unresolvedSource}`,
          ownerKind: context.ownerKind === "classVariant" ? "class" : context.ownerKind,
          ownerName: context.ownerName,
          ownerSource: context.ownerSource,
          filePath: context.filePath,
        });
        return;
      }

      pushEdge(record.spellName, record.spellSource);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => recurse(entry, context));
      return;
    }

    if (!isObject(value)) {
      pushUnsupported(`Unsupported additionalSpells value type '${typeof value}'.`);
      return;
    }

    const inheritedContext: AdditionalSpellContext = {
      ...context,
      definedInSource:
        typeof value.definedInSource === "string"
          ? value.definedInSource
          : context.definedInSource,
      definedInSources: Array.isArray(value.definedInSources)
        ? value.definedInSources.filter((entry): entry is string => typeof entry === "string")
        : context.definedInSources,
    };

    for (const additionType of ["innate", "known", "prepared", "expanded"] as const) {
      if (value[additionType] !== undefined) {
        recurse(value[additionType], {
          ...inheritedContext,
          additionType,
        });
      }
    }

    if (value.choose !== undefined) {
      if (typeof value.choose === "string") {
        const isLoreBroadChoiceFilter =
          inheritedContext.ownerKind === "subclass" &&
          slug(inheritedContext.ownerClassName ?? "") === "bard" &&
          slug(inheritedContext.ownerSubclassShortName ?? "") === "lore" &&
          /^level=\d+(;\d+)+$/i.test(value.choose.trim());

        if (isLoreBroadChoiceFilter) {
          return;
        }

        const matchedSpells = [...args.spellRecords.values()].filter((spellRecord) => {
          const result = evaluateFilterExpression({
            expression: value.choose,
            spell: spellRecord,
            classMembershipBySpell: args.classMembershipBySpell,
          });

          return result === true;
        });

        const unsupported = [...args.spellRecords.values()].some((spellRecord) => {
          const result = evaluateFilterExpression({
            expression: value.choose,
            spell: spellRecord,
            classMembershipBySpell: args.classMembershipBySpell,
          });

          return result === undefined;
        });

        if (unsupported) {
          pushUnsupported(`Unsupported choose filter expression '${value.choose}'.`);
          return;
        }

        matchedSpells.forEach((spellRecord) => pushEdge(spellRecord.spellName, spellRecord.spellSource));
      } else if (isObject(value.choose)) {
        const chooseValue = value.choose;
        const supportedChooseKeys = new Set([
          "from",
          "count",
          "amount",
          "filter",
          "fromFilter",
          "expression",
          "all",
        ]);

        const unsupportedKeys = Object.keys(chooseValue).filter(
          (key) => !supportedChooseKeys.has(key),
        );

        if (unsupportedKeys.length > 0) {
          pushUnsupported(
            `Unsupported choose object keys: ${unsupportedKeys.sort().join(", ")}.`,
          );
          return;
        }

        let handledChooseObjectShape = false;

        if (chooseValue.from !== undefined) {
          handledChooseObjectShape = true;
          recurse(chooseValue.from, inheritedContext);
        }

        const filterExpression =
          chooseValue.filter ?? chooseValue.fromFilter ?? chooseValue.expression ?? chooseValue.all;

        if (filterExpression !== undefined) {
          handledChooseObjectShape = true;
          const matchedSpells = [...args.spellRecords.values()].filter((spellRecord) => {
            const result = evaluateFilterExpression({
              expression: filterExpression,
              spell: spellRecord,
              classMembershipBySpell: args.classMembershipBySpell,
            });

            return result === true;
          });

          const unsupported = [...args.spellRecords.values()].some((spellRecord) => {
            const result = evaluateFilterExpression({
              expression: filterExpression,
              spell: spellRecord,
              classMembershipBySpell: args.classMembershipBySpell,
            });

            return result === undefined;
          });

          if (unsupported) {
            pushUnsupported("Unsupported choose filter expression shape.");
            return;
          }

          matchedSpells.forEach((spellRecord) =>
            pushEdge(spellRecord.spellName, spellRecord.spellSource),
          );
        }

        if (!handledChooseObjectShape) {
          pushUnsupported("Unsupported choose object shape in additionalSpells.");
          return;
        }
      } else {
        pushUnsupported("Unsupported choose structure in additionalSpells.");
      }
    }

    if (value.all !== undefined) {
      const filterExpression = value.all;
      const matchedSpells = [...args.spellRecords.values()].filter((spellRecord) => {
        const result = evaluateFilterExpression({
          expression: filterExpression,
          spell: spellRecord,
          classMembershipBySpell: args.classMembershipBySpell,
        });

        return result === true;
      });

      const unsupported = [...args.spellRecords.values()].some((spellRecord) => {
        const result = evaluateFilterExpression({
          expression: filterExpression,
          spell: spellRecord,
          classMembershipBySpell: args.classMembershipBySpell,
        });

        return result === undefined;
      });

      if (unsupported) {
        pushUnsupported("Unsupported all filter expression shape.");
        return;
      }

      matchedSpells.forEach((spellRecord) => pushEdge(spellRecord.spellName, spellRecord.spellSource));
    }

    const skipKeys = new Set([
      "innate",
      "known",
      "prepared",
      "expanded",
      "choose",
      "all",
      "count",
      "amount",
      "ability",
      "resourceName",
      "name",
      "definedInSource",
      "definedInSources",
    ]);

    for (const [key, nestedValue] of Object.entries(value)) {
      if (skipKeys.has(key)) {
        continue;
      }

      recurse(nestedValue, inheritedContext);
    }
  };

  recurse(args.value, args.context);
}

function collectAdditionalSpellEdges(args: {
  entities: SourceEntity[];
  spellRecords: Map<string, SpellRecord>;
  classMembershipBySpell: Map<string, Set<string>>;
  unresolvedReferences: ResolveUnresolvedReference[];
  unsupportedAdditionalSpells: ResolveAdditionalSpellsFailure[];
}): ResolvedSpellSourceEdge[] {
  const edges: ResolvedSpellSourceEdge[] = [];
  const dedupe = new Set<string>();

  const supportedKinds = new Set<SourceEntityKind>([
    "subclass",
    "subrace",
    "background",
    "charoption",
    "feat",
    "optionalfeature",
    "race",
    "reward",
  ]);

  const raceEntitiesByIdentity = new Map<string, SourceEntity>();
  const subracesByRaceIdentity = new Map<string, SourceEntity[]>();
  const raceIdentityKey = (name: string, source: string): string =>
    `${slug(name)}|${slug(source)}`;

  for (const entity of args.entities) {
    if (entity.kind === "race") {
      const raceName = normalizeName(entity.value.name);
      const raceSource = normalizeSource(entity.value.source);

      if (raceName) {
        raceEntitiesByIdentity.set(raceIdentityKey(raceName, raceSource), entity);
      }

      continue;
    }

    if (entity.kind !== "subrace") {
      continue;
    }

    const raceName = normalizeName(entity.value.raceName);
    if (!raceName) {
      continue;
    }

    const raceSource = normalizeSource(entity.value.raceSource);
    const key = raceIdentityKey(raceName, raceSource);
    const grouped = subracesByRaceIdentity.get(key) ?? [];
    grouped.push(entity);
    subracesByRaceIdentity.set(key, grouped);
  }

  for (const entity of args.entities) {
    if (!supportedKinds.has(entity.kind)) {
      continue;
    }

    const ownerKind: SpellGrantType =
      entity.kind === "subrace" ? "race" : (entity.kind as SpellGrantType);
    const ownerName =
      (entity.kind === "race" || entity.kind === "subrace"
        ? normalizeRaceOwnerName(entity.value)
        : normalizeName(entity.value.name)) ?? "(unnamed)";
    const ownerSource =
      entity.kind === "race" || entity.kind === "subrace"
        ? normalizeRaceOwnerSource(entity.value)
        : normalizeSource(entity.value.source);

    const emitAdditionalSpells = (value: unknown): void => {
      if (
        ownerKind === "race" &&
        ownerSource === "SCAG" &&
        slug(ownerName) === "tiefling (variant; winged)"
      ) {
        return;
      }

      if (typeof value === "boolean") {
        args.unsupportedAdditionalSpells.push({
          ownerKind,
          ownerName,
          ownerSource,
          reason: "Unsupported boolean additionalSpells shape.",
          filePath: entity.filePath,
        });
        return;
      }

      collectAdditionalSpellReferences({
        value,
        context: {
          ownerKind,
          ownerName,
          ownerSource,
          ownerClassName: normalizeName(entity.value.className),
          ownerClassSource: normalizeName(entity.value.classSource),
          ownerSubclassShortName: normalizeName(entity.value.shortName),
          filePath: entity.filePath,
        },
        spellRecords: args.spellRecords,
        classMembershipBySpell: args.classMembershipBySpell,
        edges,
        unresolvedReferences: args.unresolvedReferences,
        unsupportedAdditionalSpells: args.unsupportedAdditionalSpells,
        dedupe,
      });
    };

    const baseAdditionalSpells = entity.value.additionalSpells;

    if (entity.kind === "race") {
      const raceName = normalizeName(entity.value.name);
      const raceSource = normalizeSource(entity.value.source);
      const relatedSubraces = raceName
        ? (subracesByRaceIdentity.get(raceIdentityKey(raceName, raceSource)) ?? [])
        : [];
      const namedSameSourceSubraces = relatedSubraces.filter((subraceEntity) => {
        const subraceName = normalizeName(subraceEntity.value.name);
        const subraceSource = normalizeSource(subraceEntity.value.source, raceSource);
        return Boolean(subraceName) && subraceSource === raceSource;
      });

      if (baseAdditionalSpells !== undefined && baseAdditionalSpells !== null) {
        if (namedSameSourceSubraces.length === 0) {
          emitAdditionalSpells(baseAdditionalSpells);
        }

        for (const subraceEntity of relatedSubraces) {
          if (Object.prototype.hasOwnProperty.call(subraceEntity.value, "additionalSpells")) {
            continue;
          }

          const inheritedSubraceSource = normalizeSource(subraceEntity.value.source, raceSource);
          if (inheritedSubraceSource === "SCAG") {
            continue;
          }

          const inheritedOwnerName = normalizeRaceOwnerName(subraceEntity.value) ?? "(unnamed)";
          const inheritedOwnerSource = normalizeRaceOwnerSource(subraceEntity.value);

          collectAdditionalSpellReferences({
            value: baseAdditionalSpells,
            context: {
              ownerKind: "race",
              ownerName: inheritedOwnerName,
              ownerSource: inheritedOwnerSource,
              filePath: subraceEntity.filePath,
            },
            spellRecords: args.spellRecords,
            classMembershipBySpell: args.classMembershipBySpell,
            edges,
            unresolvedReferences: args.unresolvedReferences,
            unsupportedAdditionalSpells: args.unsupportedAdditionalSpells,
            dedupe,
          });
        }
      }

      continue;
    }

    if (baseAdditionalSpells !== undefined && baseAdditionalSpells !== null) {
      emitAdditionalSpells(baseAdditionalSpells);
      continue;
    }

    if (entity.kind === "subrace") {
      const raceName = normalizeName(entity.value.raceName);
      const raceSource = normalizeSource(entity.value.raceSource);

      if (!raceName) {
        continue;
      }

      const parentRace = raceEntitiesByIdentity.get(raceIdentityKey(raceName, raceSource));
      const inheritedAdditionalSpells = parentRace?.value.additionalSpells;

      if (inheritedAdditionalSpells !== undefined && inheritedAdditionalSpells !== null) {
        emitAdditionalSpells(inheritedAdditionalSpells);
      }
    }
  }

  return edges;
}

export async function resolveDataSource(validated: ValidatedDataSource): Promise<ResolvedDataSource> {
  const diagnostics: ParserDiagnostic[] = [];
  const unresolvedReferences: ResolveUnresolvedReference[] = [];
  const unsupportedAdditionalSpells: ResolveAdditionalSpellsFailure[] = [];

  const rawEntities = collectEntities(validated, diagnostics);
  const resolvedEntities = resolveCopies(rawEntities, diagnostics, unresolvedReferences);

  const featureReferences = resolveFeatureReferences({
    entities: resolvedEntities,
    unresolvedReferences,
    diagnostics,
  });

  const spellRecords = buildSpellRecords(resolvedEntities);
  const classMembershipBySpell = new Map<string, Set<string>>();

  const spellSourceEdges = collectSpellSourceEdgesFromLookup({
    validated,
    spellRecords,
    unresolvedReferences,
    classMembershipBySpell,
  });

  const additionalSpellEdges = collectAdditionalSpellEdges({
    entities: resolvedEntities,
    spellRecords,
    classMembershipBySpell,
    unresolvedReferences,
    unsupportedAdditionalSpells,
  });

  const allSpellSourceEdges = [...spellSourceEdges, ...additionalSpellEdges];

  const generatedSubclassLookup = validated.files.generatedSubclassLookup
    ? validated.documents.get(validated.files.generatedSubclassLookup.relativePath)
    : undefined;

  const generatedSpellSourceLookup = validated.files.generatedSpellSourceLookup
    ? validated.documents.get(validated.files.generatedSpellSourceLookup.relativePath)
    : undefined;

  return {
    entities: resolvedEntities,
    featureReferences,
    spellSourceEdges: allSpellSourceEdges,
    unresolvedReferences,
    unsupportedAdditionalSpells,
    diagnostics,
    generatedSubclassLookup,
    generatedSpellSourceLookup,
  };
}
