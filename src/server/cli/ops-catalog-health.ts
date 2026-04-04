import { createResponseMeta } from "@/server/cli/response-meta";

function main(): void {
  process.stderr.write(
    `${JSON.stringify(
      {
        error: {
          code: "RULES_CATALOG_UNAVAILABLE",
          message:
            "Catalog health command is not wired yet. Implement get-rules-catalog-health use-case next.",
          exitCode: 2,
        },
        meta: createResponseMeta(),
      },
      null,
      2,
    )}\n`,
  );

  process.exitCode = 2;
}

main();
