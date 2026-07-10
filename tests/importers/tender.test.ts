import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeTenderWorkflow,
  calculateTenderRisk,
  evaluateRequirement,
  evaluateTenderCompliance,
  parseTenderRequirementDrafts,
} from "../../lib/tender/engine.ts";
import {
  hamiltonT1TenderValues,
  publishedTenderProducts,
  ventilatorTenderRequirements,
} from "../../lib/tender/mock-data.ts";
import type {
  ComplianceEvidence,
  TenderProductValue,
  TenderRequirement,
  TenderRequirementDraft,
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

test("tender workflow parses manual rule drafts", () => {
  const drafts: TenderRequirementDraft[] = [
    {
      characteristicKey: "battery_hours",
      label: "Автономная работа",
      category: "Питание",
      operator: "numeric_gte",
      expectedValueInput: "4,5",
      unit: "ч",
    },
    {
      characteristicKey: "niv_support",
      label: "NIV",
      category: "Режимы",
      operator: "boolean",
      expectedValueInput: "да",
      unit: null,
    },
    {
      characteristicKey: "mode",
      label: "Режим",
      category: "Режимы",
      operator: "enum",
      expectedValueInput: "NIV, CPAP",
      unit: null,
    },
  ];

  const parsed = parseTenderRequirementDrafts(drafts);

  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].expectedValue, 4.5);
  assert.equal(parsed[1].expectedValue, true);
  assert.deepEqual(parsed[2].expectedValue, ["NIV", "CPAP"]);
});

test("tender workflow limits manual requirements to ten", () => {
  const drafts: TenderRequirementDraft[] = Array.from({ length: 12 }, (_, index) => ({
    characteristicKey: `requirement_${index}`,
    label: `Требование ${index}`,
    category: "ТЗ",
    operator: "string_contains",
    expectedValueInput: "value",
    unit: null,
  }));

  assert.equal(parseTenderRequirementDrafts(drafts).length, 10);
});

test("tender summary and risk are calculated from workflow result", () => {
  const result = analyzeTenderWorkflow({
    workflow: {
      tenderTitle: "Аппарат ИВЛ",
      productSlug: "hamilton-t1",
      drafts: ventilatorTenderRequirements.map((item) => ({
        characteristicKey: item.requirementId,
        label: item.label,
        category: item.category,
        operator: item.operator,
        expectedValueInput: String(item.expectedValue),
        unit: item.unit,
      })),
    },
    products: publishedTenderProducts,
  });

  assert.equal(result.summary.matches, 3);
  assert.equal(result.summary.doesNotMatch, 1);
  assert.equal(result.summary.riskLevel, "High");
});

test("tender risk uses missing-data ratio", () => {
  assert.equal(
    calculateTenderRisk({
      totalRequirements: 5,
      doesNotMatch: 0,
      notVerified: 1,
      unknown: 0,
    }),
    "Medium",
  );
  assert.equal(
    calculateTenderRisk({
      totalRequirements: 5,
      doesNotMatch: 0,
      notVerified: 2,
      unknown: 0,
    }),
    "High",
  );
  assert.equal(
    calculateTenderRisk({
      totalRequirements: 5,
      doesNotMatch: 0,
      notVerified: 0,
      unknown: 0,
    }),
    "Low",
  );
});

test("tender workflow uses published products only", () => {
  const result = analyzeTenderWorkflow({
    workflow: {
      tenderTitle: "Unknown product",
      productSlug: "draft-product",
      drafts: [
        {
          characteristicKey: "battery_hours",
          label: "Автономная работа",
          category: "Питание",
          operator: "numeric_gte",
          expectedValueInput: "4",
          unit: "ч",
        },
      ],
    },
    products: [
      {
        slug: "draft-product",
        title: "Draft product",
        manufacturer: "Draft",
        category: "Draft",
        status: "published_projection",
        values: [
          value({
            characteristicKey: "battery_hours",
            sourceKind: "candidate_claim",
          }),
        ],
      },
    ],
  });

  assert.equal(result.summary.totalRequirements, 1);
  assert.equal(result.summary.notVerified, 1);
  assert.equal(result.results[0].evidence, null);
});
