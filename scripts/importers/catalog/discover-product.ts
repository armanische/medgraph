import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { runCatalogDiscovery } from "./discovery.ts";

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    throw new Error(
      'Pass a product query, for example: npm run discover:product -- "Hamilton T1"',
    );
  }
  const result = await runCatalogDiscovery({ query });
  process.stdout.write(
    `${JSON.stringify(
      {
        query,
        aggregateReportPath: result.aggregateReportPath,
        productReportsDirectory: result.productReportDirectory,
        productsProcessed: result.aggregate.productsProcessed,
        officialSourcesFound: result.aggregate.officialSourcesFound,
        documentsFound: result.aggregate.documentsFound,
        requiredDocumentsMissing: result.aggregate.requiredDocumentsMissing,
        productsReadyForExtraction: result.aggregate.productsReadyForExtraction,
        productsBlocked: result.aggregate.productsBlocked,
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
      `${error instanceof Error ? error.message : "Product discovery failed."}\n`,
    );
    process.exitCode = 1;
  });
}
