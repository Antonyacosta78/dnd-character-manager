import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

import type {
  CanonicalDataSourceFiles,
  DataSourceFile,
  ParserDiagnostic,
  ValidatedDataSource,
} from "@/server/import/parser-types";

const STAGE = "validate_source";

interface ValidateDataSourceResult {
  validatedDataSource?: ValidatedDataSource;
  diagnostics: ParserDiagnostic[];
}

function buildFile(dataRootPath: string, relativePath: string): DataSourceFile {
  return {
    relativePath,
    absolutePath: path.join(dataRootPath, relativePath),
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(
  file: DataSourceFile,
  diagnostics: ParserDiagnostic[],
): Promise<unknown | undefined> {
  try {
    const fileContents = await readFile(file.absolutePath, "utf8");
    return JSON.parse(fileContents) as unknown;
  } catch (error) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_SOURCE_JSON_PARSE_FAILED",
      message: `Failed to parse JSON in ${file.relativePath}.`,
      filePath: file.relativePath,
      details: {
        error: error instanceof Error ? error.message : "Unknown JSON parse failure.",
      },
    });
    return undefined;
  }
}

async function requireFile(
  dataRootPath: string,
  relativePath: string,
  diagnostics: ParserDiagnostic[],
): Promise<DataSourceFile | undefined> {
  const file = buildFile(dataRootPath, relativePath);

  if (!(await fileExists(file.absolutePath))) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_SOURCE_FILE_MISSING",
      message: `Required Data Source file is missing: ${relativePath}.`,
      filePath: relativePath,
    });
    return undefined;
  }

  return file;
}

async function optionalFile(
  dataRootPath: string,
  relativePath: string,
): Promise<DataSourceFile | undefined> {
  const file = buildFile(dataRootPath, relativePath);
  return (await fileExists(file.absolutePath)) ? file : undefined;
}

async function discoverFiles(
  dataRootPath: string,
  relativeDirectory: string,
  matcher: RegExp,
): Promise<DataSourceFile[]> {
  const directoryPath = path.join(dataRootPath, relativeDirectory);
  const entries = await readdir(directoryPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && matcher.test(entry.name))
    .map((entry) => buildFile(dataRootPath, `${relativeDirectory}/${entry.name}`))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function parseIndexReferences(
  filePath: string,
  indexJson: unknown,
  diagnostics: ParserDiagnostic[],
): Set<string> {
  if (!indexJson || typeof indexJson !== "object" || Array.isArray(indexJson)) {
    diagnostics.push({
      stage: STAGE,
      severity: "error",
      code: "PARSER_SOURCE_INDEX_INVALID",
      message: `Index file ${filePath} must contain an object map of references.`,
      filePath,
    });
    return new Set();
  }

  const references = new Set<string>();

  for (const [key, value] of Object.entries(indexJson)) {
    if (typeof value !== "string" || value.trim().length === 0) {
      diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_SOURCE_INDEX_INVALID",
        message: `Index entry '${key}' in ${filePath} must reference a relative file path string.`,
        filePath,
      });
      continue;
    }

    references.add(value.trim());
  }

  return references;
}

async function validateIndexCoverage(args: {
  dataRootPath: string;
  indexFilePath: string;
  indexReferences: Set<string>;
  discoveredFiles: DataSourceFile[];
  prefixPath: string;
  diagnostics: ParserDiagnostic[];
}): Promise<void> {
  const discoveredByName = new Set(
    args.discoveredFiles.map((file) => file.relativePath.slice(args.prefixPath.length + 1)),
  );

  for (const reference of args.indexReferences) {
    const referencePath = `${args.prefixPath}/${reference}`;
    const absoluteReferencePath = path.join(args.dataRootPath, referencePath);

    if (!(await fileExists(absoluteReferencePath))) {
      args.diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_SOURCE_INDEX_REFERENCE_MISSING",
        message: `Index ${args.indexFilePath} references missing file ${referencePath}.`,
        filePath: args.indexFilePath,
        details: { reference: referencePath },
      });
      continue;
    }

    if (!discoveredByName.has(reference)) {
      args.diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_SOURCE_INDEX_REFERENCE_UNEXPECTED",
        message: `Index ${args.indexFilePath} references unsupported file ${referencePath}.`,
        filePath: args.indexFilePath,
        details: { reference: referencePath },
      });
    }
  }

  for (const discoveredFile of args.discoveredFiles) {
    const discoveredName = discoveredFile.relativePath.slice(args.prefixPath.length + 1);

    if (!args.indexReferences.has(discoveredName)) {
      args.diagnostics.push({
        stage: STAGE,
        severity: "error",
        code: "PARSER_SOURCE_INDEX_REFERENCE_MISSING",
        message: `Discovered file ${discoveredFile.relativePath} is missing from ${args.indexFilePath}.`,
        filePath: args.indexFilePath,
        details: { reference: discoveredFile.relativePath },
      });
    }
  }
}

export async function validateDataSource(dataRootPath: string): Promise<ValidateDataSourceResult> {
  const diagnostics: ParserDiagnostic[] = [];

  const [
    classIndex,
    spellIndex,
    spellSources,
    races,
    backgrounds,
    feats,
    optionalfeatures,
  ] = await Promise.all([
    requireFile(dataRootPath, "class/index.json", diagnostics),
    requireFile(dataRootPath, "spells/index.json", diagnostics),
    requireFile(dataRootPath, "spells/sources.json", diagnostics),
    requireFile(dataRootPath, "races.json", diagnostics),
    requireFile(dataRootPath, "backgrounds.json", diagnostics),
    requireFile(dataRootPath, "feats.json", diagnostics),
    requireFile(dataRootPath, "optionalfeatures.json", diagnostics),
  ]);

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { diagnostics };
  }

  const classFiles = await discoverFiles(dataRootPath, "class", /^class-.*\.json$/i);
  const spellFiles = await discoverFiles(dataRootPath, "spells", /^spells-.*\.json$/i);

  const optionalCharcreationoptions = await optionalFile(
    dataRootPath,
    "charcreationoptions.json",
  );
  const optionalRewards = await optionalFile(dataRootPath, "rewards.json");

  const generatedSubclassLookup = await optionalFile(
    dataRootPath,
    "generated/gendata-subclass-lookup.json",
  );
  const generatedSpellSourceLookup = await optionalFile(
    dataRootPath,
    "generated/gendata-spell-source-lookup.json",
  );

  const files: CanonicalDataSourceFiles = {
    classIndex: classIndex as DataSourceFile,
    classFiles,
    spellIndex: spellIndex as DataSourceFile,
    spellFiles,
    spellSources: spellSources as DataSourceFile,
    races: races as DataSourceFile,
    backgrounds: backgrounds as DataSourceFile,
    feats: feats as DataSourceFile,
    optionalfeatures: optionalfeatures as DataSourceFile,
    optionalCharcreationoptions,
    optionalRewards,
    generatedSubclassLookup,
    generatedSpellSourceLookup,
  };

  const classIndexJson = await readJsonFile(files.classIndex, diagnostics);
  const spellIndexJson = await readJsonFile(files.spellIndex, diagnostics);

  const classIndexReferences = parseIndexReferences(
    files.classIndex.relativePath,
    classIndexJson,
    diagnostics,
  );
  const spellIndexReferences = parseIndexReferences(
    files.spellIndex.relativePath,
    spellIndexJson,
    diagnostics,
  );

  await validateIndexCoverage({
    dataRootPath,
    indexFilePath: files.classIndex.relativePath,
    indexReferences: classIndexReferences,
    discoveredFiles: files.classFiles,
    prefixPath: "class",
    diagnostics,
  });

  await validateIndexCoverage({
    dataRootPath,
    indexFilePath: files.spellIndex.relativePath,
    indexReferences: spellIndexReferences,
    discoveredFiles: files.spellFiles,
    prefixPath: "spells",
    diagnostics,
  });

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { diagnostics };
  }

  const documents = new Map<string, unknown>();

  const filesToParse: DataSourceFile[] = [
    files.classIndex,
    files.spellIndex,
    files.spellSources,
    files.races,
    files.backgrounds,
    files.feats,
    files.optionalfeatures,
    ...files.classFiles,
    ...files.spellFiles,
  ];

  if (files.optionalCharcreationoptions) {
    filesToParse.push(files.optionalCharcreationoptions);
  }

  if (files.optionalRewards) {
    filesToParse.push(files.optionalRewards);
  }

  if (files.generatedSubclassLookup) {
    filesToParse.push(files.generatedSubclassLookup);
  }

  if (files.generatedSpellSourceLookup) {
    filesToParse.push(files.generatedSpellSourceLookup);
  }

  for (const file of filesToParse) {
    const json = await readJsonFile(file, diagnostics);

    if (json !== undefined) {
      documents.set(file.relativePath, json);
    }
  }

  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { diagnostics };
  }

  return {
    diagnostics,
    validatedDataSource: {
      dataRootPath,
      files,
      documents,
    },
  };
}
