import { readAppConfig } from "@/server/composition/app-config";
import { createPrismaCatalogImportRunRepository } from "@/server/adapters/prisma/catalog-import-run-repository";
import { createPrismaCatalogPublishRepository } from "@/server/adapters/prisma/catalog-publish-repository";
import { runImportPipeline } from "@/server/import/run-import-pipeline";

async function main(): Promise<void> {
  const config = readAppConfig();
  const importRunRepository = createPrismaCatalogImportRunRepository();
  const catalogPublishRepository = createPrismaCatalogPublishRepository();

  const summary = await runImportPipeline({
    dataRootPath: config.externalDataPath,
    importerVersion: config.importerVersion,
    integrityMode: config.dataIntegrityMode,
    triggerKind: "manual",
  },
  {
    importRunRepository,
    catalogPublishRepository,
  });

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (summary.outcome !== "succeeded") {
    process.exitCode = 1;
  }
}

void main();
