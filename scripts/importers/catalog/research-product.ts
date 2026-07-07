import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { runSingleProductResearch } from "./research.ts";

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    throw new Error(
      'Pass a product query, for example: npm run research:product -- "Hamilton C1"',
    );
  }
  const result = await runSingleProductResearch(query);
  process.stdout.write(
    `${JSON.stringify(
      {
        productSlug: result.product.slug,
        researchStatus: result.report.researchStatus,
        sources: result.report.sourcesFound,
        documents: result.report.documentsFound,
        artifacts: result.report.uniqueArtifacts,
        characteristics: result.report.characteristicsExtracted,
        candidateClaims: result.report.candidateClaimsCreated,
        conflicts: result.report.conflicts.length,
        missing: result.report.missingCharacteristics,
        warnings: result.report.warnings,
      },
      null,
      2,
    )}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  void main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Product research failed."}\n`,
    );
    process.exitCode = 1;
  });
}
