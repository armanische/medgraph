import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompatibilityResult,
  createCompatibilityRecord,
  filterCompatibilityRecords,
} from "../../lib/compatibility/engine.ts";
import { compatibilityRecords } from "../../lib/compatibility/mock-data.ts";
import type { CompatibilityRecord } from "../../lib/compatibility/types.ts";

const baseRecord: CompatibilityRecord = {
  compatibilityId: "test_compatibility",
  productA: {
    slug: "fs510",
    title: "FS510",
    manufacturer: "Alba Healthcare",
    category: "Расходные материалы",
  },
  productB: {
    slug: "hamilton-t1",
    title: "Hamilton T1",
    manufacturer: "Hamilton Medical",
    category: "Аппараты ИВЛ",
  },
  compatibilityType: "consumable_device",
  status: "compatible",
  evidence: {
    evidenceIds: ["evidence_test"],
    sourceUrls: ["/products/fs510/manual.pdf"],
    documentVersionIds: ["document_version_test"],
    reviewStatus: "reviewed",
    lastUpdated: "2026-07-09",
    notes: ["Evidence-backed compatibility record."],
  },
};

test("compatibility record requires evidence", () => {
  const record = createCompatibilityRecord(baseRecord);

  assert.equal(record.compatibilityId, baseRecord.compatibilityId);
  assert.equal(record.evidence.evidenceIds.length, 1);
});

test("compatibility record without evidence is rejected", () => {
  assert.throws(
    () =>
      createCompatibilityRecord({
        ...baseRecord,
        evidence: {
          ...baseRecord.evidence,
          evidenceIds: [],
        },
      }),
    /requires evidence/,
  );
});

test("compatibility engine does not use Candidate Claims", () => {
  const result = buildCompatibilityResult({
    productSlug: "fs510",
    records: compatibilityRecords,
  });

  assert.ok(
    result.warnings.some((warning) => warning.includes("Candidate Claims")),
  );
  assert.doesNotMatch(JSON.stringify(result), /claimCandidateId|candidateClaims/i);
});

test("not verified compatibility remains explicit", () => {
  const result = buildCompatibilityResult({
    productSlug: "fs510",
    records: compatibilityRecords,
  });
  const records = result.groups.flatMap((group) => group.records);
  const notVerified = records.find((record) => record.status === "not_verified");

  assert.ok(notVerified);
  assert.equal(notVerified.evidence.reviewStatus, "not_verified");
});

test("compatibility filtering works", () => {
  assert.equal(
    filterCompatibilityRecords(compatibilityRecords, "confirmed").every(
      (record) => record.status === "compatible",
    ),
    true,
  );
  assert.equal(
    filterCompatibilityRecords(compatibilityRecords, "conditions").every(
      (record) => record.status === "compatible_with_conditions",
    ),
    true,
  );
  assert.equal(
    filterCompatibilityRecords(compatibilityRecords, "not_verified").every(
      (record) => record.status === "not_verified" || record.status === "unknown",
    ),
    true,
  );
});

test("compatibility engine is deterministic and idempotent", () => {
  const input = {
    productSlug: "fs510",
    records: compatibilityRecords,
  };

  assert.deepEqual(buildCompatibilityResult(input), buildCompatibilityResult(input));
});
