import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { checkSupabaseConnection } from "../../lib/supabase/health.ts";

function unquote(value: string): string {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

export async function loadLocalEnvironment(
  filePath = path.resolve(process.cwd(), ".env.local"),
): Promise<void> {
  let source: string;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return;
    throw error;
  }
  for (const line of source.split(/\r?\n/u)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/u);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = unquote(match[2].trim());
  }
}

export async function runSupabaseHealthCheck(): Promise<void> {
  await loadLocalEnvironment();
  const result = await checkSupabaseConnection();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSupabaseHealthCheck().catch((error: unknown) => {
    process.stderr.write(`Supabase health check failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
