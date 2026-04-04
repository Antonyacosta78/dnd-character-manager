import { readAppConfig } from "@/server/composition/app-config";
import { runImportPipeline } from "@/server/import/run-import-pipeline";

async function main(): Promise<void> {
  const config = readAppConfig();

  const summary = await runImportPipeline({
    dataRootPath: config.externalDataPath,
    importerVersion: config.importerVersion,
    integrityMode: config.dataIntegrityMode,
    triggerKind: "manual",
  });

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (summary.outcome !== "succeeded") {
    process.exitCode = 1;
  }
}

void main();
