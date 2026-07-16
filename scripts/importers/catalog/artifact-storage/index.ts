import { spawnSync } from "node:child_process";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export { resolveArtifact, verifyArtifact } from "./local-artifact-store.ts";
export { createManifest, detectDuplicateGroups, validateManifest } from "./manifest.ts";
export * from "./types.ts";

import { createManifest, validateManifest } from "./manifest.ts";

const INVENTORY_PATH = resolve(
  process.cwd(),
  "data/research/integrity/artifact-inventory.generated.json",
);

function diskUsageBytes(path: string) {
  const result = spawnSync("du", ["-sk", path], { encoding: "utf8" });
  const kibibytes = Number.parseInt(result.stdout.trim().split(/\s+/)[0] ?? "", 10);
  return Number.isFinite(kibibytes) ? kibibytes * 1024 : null;
}

function gitObjectSizeBytes() {
  const result = spawnSync("git", ["count-objects", "-v"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status !== 0) return null;
  const values = Object.fromEntries(
    result.stdout
      .trim()
      .split("\n")
      .map((line) => line.split(": ")),
  );
  const looseKiB = Number.parseInt(values.size ?? "0", 10);
  const packedKiB = Number.parseInt(values["size-pack"] ?? "0", 10);
  return (looseKiB + packedKiB) * 1024;
}

async function writeInventory() {
  const manifest = await createManifest();
  const validation = validateManifest(manifest);
  if (!validation.valid) {
    throw new Error(`Generated manifest is invalid:\n${validation.errors.join("\n")}`);
  }
  await mkdir(dirname(INVENTORY_PATH), { recursive: true });
  const temporaryPath = `${INVENTORY_PATH}.writing`;
  await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(temporaryPath, INVENTORY_PATH);
  console.log(
    JSON.stringify(
      {
        inventoryPath: INVENTORY_PATH,
        repositorySizeBytes: diskUsageBytes(process.cwd()),
        gitObjectSizeBytes: gitObjectSizeBytes(),
        artifactDiskSizeBytes: diskUsageBytes(resolve(process.cwd(), manifest.artifactRoot)),
        ...manifest.summary,
      },
      null,
      2,
    ),
  );
  console.log("Top 50 largest artifacts:");
  manifest.topLargestFiles.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.sizeBytes} ${entry.relativePath}`);
  });
}

const isDirectRun =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isDirectRun) {
  if (process.argv[2] !== "audit") {
    console.error("Usage: node scripts/importers/catalog/artifact-storage/index.ts audit");
    process.exitCode = 1;
  } else {
    writeInventory().catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
  }
}
