import { createHash } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import type { HumanReviewDecision, ReviewDecisionStore } from "./types.ts";

export const DEFAULT_DECISION_ROOT = resolve(process.cwd(), "data/review-decisions");

function safeSegment(value: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/u.test(value)) {
    throw new Error("Unsafe decision store key.");
  }
  return value.replace(/[:]/gu, "-");
}

async function writeJsonAtomic(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.part`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

export function createDecisionId(input: {
  reviewItemId: string;
  reviewerId: string;
  idempotencyKey: string;
}) {
  return `review_decision_${createHash("sha256")
    .update(`${input.reviewItemId}\u001f${input.reviewerId}\u001f${input.idempotencyKey}`)
    .digest("hex")
    .slice(0, 24)}`;
}

export class FileReviewDecisionStore implements ReviewDecisionStore {
  readonly root: string;

  constructor(root = DEFAULT_DECISION_ROOT) {
    this.root = root;
  }

  async list() {
    const directory = join(this.root, "decisions");
    try {
      const files = (await readdir(directory))
        .filter((file) => file.endsWith(".json") && !file.includes(" 2."))
        .sort();
      const decisions = await Promise.all(
        files.map(async (file) =>
          JSON.parse(await readFile(join(directory, file), "utf8")) as HumanReviewDecision,
        ),
      );
      return decisions.sort((left, right) =>
        `${left.reviewedAt}:${left.id}`.localeCompare(`${right.reviewedAt}:${right.id}`),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async append(decision: HumanReviewDecision) {
    safeSegment(decision.id);
    safeSegment(decision.reviewItemId);
    safeSegment(decision.reviewerId);
    safeSegment(decision.idempotencyKey);
    const existing = (await this.list()).find(
      (candidate) => candidate.idempotencyKey === decision.idempotencyKey,
    );
    if (existing) {
      if (existing.id !== decision.id) throw new Error("Duplicate idempotency key.");
      return { decision: existing, created: false };
    }
    const path = join(this.root, "decisions", `${decision.id}.json`);
    await mkdir(dirname(path), { recursive: true });
    try {
      const handle = await open(path, "wx");
      try {
        await handle.writeFile(`${JSON.stringify(decision, null, 2)}\n`, "utf8");
      } finally {
        await handle.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const persisted = JSON.parse(await readFile(path, "utf8")) as HumanReviewDecision;
      if (persisted.idempotencyKey !== decision.idempotencyKey) {
        throw new Error("Decision ID collision.");
      }
      return { decision: persisted, created: false };
    }
    return { decision, created: true };
  }

  async withItemLock<T>(reviewItemId: string, operation: () => Promise<T>) {
    safeSegment(reviewItemId);
    const lockName = createHash("sha256").update(reviewItemId).digest("hex");
    const lockPath = join(this.root, "decisions", `.lock-${lockName}`);
    await mkdir(dirname(lockPath), { recursive: true });
    let handle;
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error("Review item is being modified. Retry after reloading.");
      }
      throw error;
    }
    try {
      return await operation();
    } finally {
      await handle.close();
      await unlink(lockPath).catch(() => undefined);
    }
  }

  async rebuildIndexes(decisions?: HumanReviewDecision[]) {
    const records = decisions ?? (await this.list());
    const byItem: Record<string, string[]> = {};
    const byProduct: Record<string, string[]> = {};
    const byReviewer: Record<string, string[]> = {};
    for (const decision of records) {
      byItem[decision.reviewItemId] = [...(byItem[decision.reviewItemId] ?? []), decision.id];
      byProduct[decision.productSlug] = [...(byProduct[decision.productSlug] ?? []), decision.id];
      byReviewer[decision.reviewerId] = [...(byReviewer[decision.reviewerId] ?? []), decision.id];
    }
    await Promise.all([
      writeJsonAtomic(join(this.root, "indexes/by-review-item.generated.json"), byItem),
      writeJsonAtomic(join(this.root, "indexes/by-product.generated.json"), byProduct),
      writeJsonAtomic(join(this.root, "indexes/by-reviewer.generated.json"), byReviewer),
    ]);
  }
}
