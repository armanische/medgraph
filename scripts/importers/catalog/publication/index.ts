import { pathToFileURL } from "node:url";

export * from "./types.ts";
export * from "./publication-builder.ts";
export * from "./publication-summary.ts";
export * from "./publication-validator.ts";
export * from "./publisher.ts";

import { auditPublication, publishCatalog } from "./publisher.ts";

async function runCli() {
  const mode = process.argv[2] ?? "build";
  if (mode === "audit") {
    const result = await auditPublication();
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
    return;
  }
  if (mode !== "build") throw new Error(`Unknown publication mode: ${mode}`);
  const result = await publishCatalog();
  console.log(JSON.stringify(result.catalog.kpi, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
