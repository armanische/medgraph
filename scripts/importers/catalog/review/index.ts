import { pathToFileURL } from "node:url";

export * from "./types.ts";
export * from "./state-machine.ts";
export * from "./snapshot.ts";
export * from "./publication-policy.ts";
export * from "./loader.ts";
export * from "./decision-store.ts";
export * from "./review-service.ts";
export * from "./review-summary.ts";
export * from "./fixtures.ts";

import { auditHumanReview, writeHumanReviewSummary } from "./review-summary.ts";

async function runCli() {
  const mode = process.argv[2] ?? "summary";
  if (mode === "summary") {
    console.log(JSON.stringify(await writeHumanReviewSummary(), null, 2));
    return;
  }
  if (mode === "audit") {
    const result = await auditHumanReview();
    console.log(JSON.stringify(result, null, 2));
    if (!result.valid) process.exitCode = 1;
    return;
  }
  throw new Error(`Unknown review command: ${mode}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
