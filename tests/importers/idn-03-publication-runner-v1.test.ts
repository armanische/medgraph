import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import vm from "node:vm";

const manifestSha = "a6952b62ee09192f3d0935af9e9a769b70bc88c067442602c4f22edab80c3b1e";

test("IDN-03 publication manifest is exact and immutable", async () => {
  const source = await readFile("lib/operations/idn-03-publication-manifest.ts", "utf8");
  assert.match(source, /^import "server-only";/u);
  assert.match(source, new RegExp(manifestSha, "u"));
  assert.equal((source.match(/productId: "/gu) ?? []).length, 1);
  assert.equal((source.match(/revisionId: "/gu) ?? []).length, 1);
  assert.match(source, /idn-03-approval-v1/u);
  assert.match(source, /idn-03-publication-v1/u);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|Authorization|Bearer/u);

  const runnable = ts.transpileModule(source.replace(/^import "server-only";\n/u, ""), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleValue = { exports: {} as Record<string, unknown> };
  vm.runInNewContext(runnable, {
    exports: moduleValue.exports,
    module: moduleValue,
    require: (specifier: string) => {
      assert.equal(specifier, "node:crypto");
      return { createHash };
    },
    Object,
    JSON,
  });
  assert.equal(
    (moduleValue.exports.calculateIdn03PublicationManifestSha256 as () => string)(),
    manifestSha,
  );
});

test("IDN-03 runner is narrow, replay-safe and service-only", async () => {
  const runner = await readFile("lib/operations/idn-03-publication-runner.ts", "utf8");
  assert.match(runner, /^import "server-only";/u);
  assert.match(runner, /createProjectBoundSupabaseServerClient/u);
  assert.match(runner, /approveProductPublicationRevision/u);
  assert.match(runner, /publishProduct/u);
  assert.match(runner, /already_complete/u);
  assert.match(runner, /approval_replay_failed/u);
  assert.match(runner, /publication_replay_failed/u);
  assert.match(runner, /afterProjection\.products\.length !== 71/u);
  assert.doesNotMatch(runner, /insert into|update cloud\.|delete from/iu);
  assert.doesNotMatch(runner, /SUPABASE_SERVICE_ROLE_KEY|Authorization|Bearer/u);
});

test("IDN-03 operation route re-authorizes corporate admin and exact body", async () => {
  const route = await readFile("app/internal/operations/idn-03-publication/route.ts", "utf8");
  assert.match(route, /process\.env\.VERCEL_ENV !== "production"/u);
  assert.match(route, /readActiveTrustedReviewer/u);
  assert.match(route, /APPROVED_REVIEWER\.userId/u);
  assert.match(route, /APPROVED_REVIEWER\.email/u);
  assert.match(route, /same_origin_required/u);
  assert.match(route, /validateIdn03PublicationOperationRequest/u);
});
