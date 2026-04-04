import path from "node:path";

import { readAppConfig } from "@/server/composition/app-config";
import { createResponseMeta } from "@/server/cli/response-meta";
import {
  DatasetFingerprintError,
  computeDatasetFingerprint,
} from "@/server/import/fingerprint/compute-dataset-fingerprint";

async function main(): Promise<void> {
  const config = readAppConfig();
  const inputPath = process.argv[2];
  const dataRootPath = path.resolve(inputPath ?? config.externalDataPath);

  try {
    const fingerprint = await computeDatasetFingerprint(dataRootPath);

    process.stdout.write(
      `${JSON.stringify(
        {
          data: {
            dataRootPath,
            fingerprint: fingerprint.fingerprint,
            fileCount: fingerprint.files.length,
          },
          meta: createResponseMeta(),
        },
        null,
        2,
      )}\n`,
    );
  } catch (error) {
    const errorCode =
      error instanceof DatasetFingerprintError
        ? "REQUEST_VALIDATION_FAILED"
        : "INTERNAL_ERROR";

    const message =
      error instanceof Error ? error.message : "Failed to compute dataset fingerprint.";

    process.stderr.write(
      `${JSON.stringify(
        {
          error: {
            code: errorCode,
            message,
            exitCode: errorCode === "REQUEST_VALIDATION_FAILED" ? 1 : 3,
          },
          meta: createResponseMeta(),
        },
        null,
        2,
      )}\n`,
    );

    process.exitCode = errorCode === "REQUEST_VALIDATION_FAILED" ? 1 : 3;
  }
}

void main();
