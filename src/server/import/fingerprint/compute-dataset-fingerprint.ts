import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

export type DatasetFingerprintErrorCode =
  | "SOURCE_PATH_MISSING"
  | "SOURCE_PATH_NOT_DIRECTORY";

export class DatasetFingerprintError extends Error {
  readonly code: DatasetFingerprintErrorCode;

  constructor(code: DatasetFingerprintErrorCode, message: string) {
    super(message);
    this.name = "DatasetFingerprintError";
    this.code = code;
  }
}

export interface DatasetFingerprintFile {
  relativePath: string;
  hash: string;
  sizeBytes: number;
}

export interface DatasetFingerprintResult {
  fingerprint: string;
  files: DatasetFingerprintFile[];
}

function compareByName(a: string, b: string): number {
  if (a === b) {
    return 0;
  }

  return a < b ? -1 : 1;
}

async function collectRelativeFiles(
  rootPath: string,
  relativeDir: string = "",
): Promise<string[]> {
  const directoryPath = relativeDir.length > 0 ? path.join(rootPath, relativeDir) : rootPath;
  const entries = await readdir(directoryPath, { withFileTypes: true });

  entries.sort((left, right) => compareByName(left.name, right.name));

  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = relativeDir.length > 0 ? `${relativeDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const nestedFiles = await collectRelativeFiles(rootPath, relativePath);
      files.push(...nestedFiles);
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function hashFile(absolutePath: string): Promise<string> {
  const fileBytes = await readFile(absolutePath);
  return createHash("sha256").update(fileBytes).digest("hex");
}

export async function computeDatasetFingerprint(
  rootPath: string,
): Promise<DatasetFingerprintResult> {
  let sourceStats;

  try {
    sourceStats = await stat(rootPath);
  } catch {
    throw new DatasetFingerprintError(
      "SOURCE_PATH_MISSING",
      `Dataset root does not exist: ${rootPath}`,
    );
  }

  if (!sourceStats.isDirectory()) {
    throw new DatasetFingerprintError(
      "SOURCE_PATH_NOT_DIRECTORY",
      `Dataset root is not a directory: ${rootPath}`,
    );
  }

  const normalizedRootPath = path.resolve(rootPath);
  const relativeFiles = await collectRelativeFiles(normalizedRootPath);
  const files: DatasetFingerprintFile[] = [];

  for (const relativePath of relativeFiles) {
    const absolutePath = path.join(normalizedRootPath, relativePath);
    const [hash, fileStats] = await Promise.all([hashFile(absolutePath), stat(absolutePath)]);

    files.push({
      relativePath,
      hash,
      sizeBytes: fileStats.size,
    });
  }

  const fingerprintHash = createHash("sha256");

  for (const file of files) {
    fingerprintHash.update(file.relativePath);
    fingerprintHash.update("\0");
    fingerprintHash.update(file.hash);
    fingerprintHash.update("\0");
  }

  return {
    fingerprint: `sha256:${fingerprintHash.digest("hex")}`,
    files,
  };
}
