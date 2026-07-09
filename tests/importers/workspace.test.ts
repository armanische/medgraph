import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { createWorkspaceSession } from "../../lib/workspace/mock-data.ts";

test("workspace session is created", () => {
  const session = createWorkspaceSession();

  assert.equal(session.sessionId, "workspace_pilot_fs510");
  assert.equal(session.selection.primaryProductSlug, "fs510");
  assert.ok(session.search.total > 0);
  assert.ok(session.comparison.summary.totalCharacteristics > 0);
  assert.ok(session.compatibility.totalRecords > 0);
  assert.ok(session.tender.summary.totalRequirements > 0);
});

test("workspace insights use only allowed engine results", () => {
  const session = createWorkspaceSession();

  assert.ok(session.insights.length > 0);
  assert.ok(
    session.insights.every((insight) =>
      ["search", "compare", "compatibility", "tender"].includes(
        insight.sourcePanel,
      ),
    ),
  );
  assert.doesNotMatch(JSON.stringify(session.insights), /LLM|AI считает/i);
});

test("workspace recommendations are deterministic", () => {
  assert.deepEqual(createWorkspaceSession(), createWorkspaceSession());
});

test("workspace does not include Candidate Claims", () => {
  const session = createWorkspaceSession();

  assert.doesNotMatch(
    JSON.stringify(session),
    /claimCandidateId|candidateClaims|ReviewQueueItem/i,
  );
});

test("workspace layer does not import Supabase or Review Queue", async () => {
  const sources = await Promise.all(
    [
      "lib/workspace/types.ts",
      "lib/workspace/mock-data.ts",
      "components/workspace/WorkspaceDashboard.tsx",
      "app/workspace/page.tsx",
    ].map((file) => readFile(resolve(process.cwd(), file), "utf8")),
  );
  const source = sources.join("\n");

  assert.doesNotMatch(source, /supabase|public_api|service_role/i);
  assert.doesNotMatch(source, /internal-review-queue|ReviewQueue|ReviewDecision/i);
});
