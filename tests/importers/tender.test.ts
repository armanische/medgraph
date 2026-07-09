import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateRequirement,
  evaluateTenderCompliance,
} from "../../lib/tender/engine.ts";
import {
  hamiltonT1TenderValues,
  ventilatorTenderRequirements,
} from "../../lib/tender/mock-data.ts";
import type {
  ComplianceEvidence,
  TenderProductValue,
  TenderRequirement,
} from "../../lib/tender/types.ts";

const evidence: ComplianceEvidence = {
  source: {
    id: "source_test",
    title: "Test source",
    url: "https://example.org/doc.pdf",
    type: "manufacturer_document",
  },
  documentVersion: {
    id: "document_version_test",
    title: "Test document",
    version: "sha256:test",
  },
  evidenceIds: ["evidence_test"],
  lastUpdated: "2026-07-09",
};

function requirement(
  overrides: Partial<TenderRequirement> = {},
): TenderRequirement {
  return {
    requirementId: "test",
    label: "Test",
    category: "Test",
    operator: "numeric_gte",
    expectedValue: 4,
    unit: "ч",
    ...overrides,
  };
}

function value(overrides: Partial<TenderProductValue> = {}): TenderProductValue {
  return {
    characteristicKey: "test",
    label: "Test",
    value: 5,
    unit: "ч",
    sourceKind: "publication_ready_report",
    evidence,
    ...overrides,
  };
}

test("tender numeric comparison works", () => {
  assert.equal(
    evaluateRequirement({
      requirement: requirement({ operator: "numeric_gte", expectedValue: 4 }),
      productValue: value({ value: 5 }),
    }).status,
    "matches",
  );
  assert.equal(
    evaluateRequirement({
      requirement: requirement({ operator: "numeric_lte", expectedValue: 4 }),
      productValue: value({ value: 5 }),
    }).status,
    "does_not_match",
  );
});

test("tender boolean comparison works", () => {
  assert.equal(
    evaluateRequirement({
      requirement: requirement({
        operator: "boolean",
        expectedValue: true,
        unit: null,
      }),
      productValue: value({ value: true, unit: null }),
    }).status,
    "matches",
  );
});

test("tender enum comparison works", () => {
  assert.equal(
    evaluateRequirement({
      requirement: requirement({
        operator: "enum",
        expectedValue: ["NIV", "CPAP"],
        unit: null,
      }),
      productValue: value({ value: "NIV", unit: null }),
    }).status,
    "matches",
  );
});

test("tender missing value becomes not verified", () => {
  assert.equal(
    evaluateRequirement({
      requirement: requirement(),
      productValue: null,
    }).status,
    "not_verified",
  );
});

test("tender evidence is required", () => {
  assert.equal(
    evaluateRequirement({
      requirement: requirement(),
      productValue: value({ evidence: null }),
    }).status,
    "not_verified",
  );
});

test("tender ignores Candidate Claims", () => {
  const result = evaluateRequirement({
    requirement: requirement(),
    productValue: value({ sourceKind: "candidate_claim" }),
  });

  assert.equal(result.status, "not_verified");
  assert.equal(result.evidence, null);
});

test("tender compliance result is deterministic", () => {
  const input = {
    tenderTitle: "Аппарат ИВЛ",
    product: {
      slug: "hamilton-t1",
      title: "Hamilton T1",
      manufacturer: "Hamilton Medical",
      category: "Аппараты ИВЛ",
    },
    requirements: ventilatorTenderRequirements,
    productValues: hamiltonT1TenderValues,
  };

  assert.deepEqual(
    evaluateTenderCompliance(input),
    evaluateTenderCompliance(input),
  );
});

test("tender pilot produces expected Hamilton T1 outcomes", () => {
  const result = evaluateTenderCompliance({
    tenderTitle: "Аппарат ИВЛ",
    product: {
      slug: "hamilton-t1",
      title: "Hamilton T1",
      manufacturer: "Hamilton Medical",
      category: "Аппараты ИВЛ",
    },
    requirements: ventilatorTenderRequirements,
    productValues: hamiltonT1TenderValues,
  });

  assert.equal(result.summary.totalRequirements, 4);
  assert.equal(result.summary.matches, 3);
  assert.equal(result.summary.doesNotMatch, 1);
});
