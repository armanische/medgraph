import type {
  ComplianceEvidence,
  ComplianceResult,
  ComplianceStatus,
  TenderRequirementDraft,
  TenderWorkflowAnalysisInput,
  RequirementResult,
  PublishedTenderProduct,
  TenderProductValue,
  TenderRequirement,
  TenderRiskLevel,
  TenderValue,
} from "./types.ts";

function hasEvidence(evidence: ComplianceEvidence | null) {
  return Boolean(
    evidence &&
      evidence.evidenceIds.length > 0 &&
      evidence.source.url &&
      evidence.documentVersion.id,
  );
}

function isAllowedPublishedSource(value: TenderProductValue) {
  return (
    value.sourceKind === "published_knowledge" ||
    value.sourceKind === "publication_ready_report"
  );
}

function normalize(value: TenderValue | null) {
  if (value === null) return "";
  return Array.isArray(value)
    ? value.join(" ").toLocaleLowerCase("ru-RU")
    : String(value).toLocaleLowerCase("ru-RU").trim();
}

function numericValue(value: TenderValue | null) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatValue(value: TenderValue | null, unit: string | null) {
  if (value === null) return "Нет подтверждённых данных";
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  return `${display}${unit ? ` ${unit}` : ""}`;
}

function parseExpectedValue(input: {
  operator: TenderRequirement["operator"];
  value: string;
}): TenderValue {
  const trimmed = input.value.trim();
  if (input.operator === "boolean") {
    return /^(true|yes|да|есть|поддерживается|1)$/iu.test(trimmed);
  }
  if (
    input.operator === "numeric_gte" ||
    input.operator === "numeric_lte" ||
    input.operator === "numeric_eq"
  ) {
    const numeric = Number(trimmed.replace(",", "."));
    return Number.isFinite(numeric) ? numeric : trimmed;
  }
  if (input.operator === "enum") {
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return trimmed;
}

export function parseTenderRequirementDrafts(
  drafts: TenderRequirementDraft[],
): TenderRequirement[] {
  return drafts
    .filter((draft) => draft.label.trim() && draft.expectedValueInput.trim())
    .slice(0, 10)
    .map((draft, index) => ({
      requirementId: draft.characteristicKey.trim() || stableRequirementId(draft.label, index),
      label: draft.label.trim(),
      category: draft.category.trim() || "Требование ТЗ",
      operator: draft.operator,
      expectedValue: parseExpectedValue({
        operator: draft.operator,
        value: draft.expectedValueInput,
      }),
      unit: draft.unit?.trim() || null,
    }));
}

function stableRequirementId(label: string, index: number) {
  return label
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-я0-9]+/giu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 48) || `requirement_${index + 1}`;
}

function statusForRule(
  requirement: TenderRequirement,
  productValue: TenderProductValue,
): { status: ComplianceStatus; notes: string[] } {
  if (requirement.unit && productValue.unit && requirement.unit !== productValue.unit) {
    return {
      status: "unknown",
      notes: ["Единицы измерения различаются; автоматическое приведение не выполняется."],
    };
  }

  if (
    requirement.operator === "numeric_gte" ||
    requirement.operator === "numeric_lte" ||
    requirement.operator === "numeric_eq"
  ) {
    const actual = numericValue(productValue.value);
    const expected = numericValue(requirement.expectedValue);
    if (actual === null || expected === null) {
      return {
        status: "unknown",
        notes: ["Числовое значение не удалось проверить детерминированным правилом."],
      };
    }
    if (requirement.operator === "numeric_gte") {
      return {
        status: actual >= expected ? "matches" : "does_not_match",
        notes: [],
      };
    }
    if (requirement.operator === "numeric_lte") {
      return {
        status: actual <= expected ? "matches" : "does_not_match",
        notes: [],
      };
    }
    return {
      status: actual === expected ? "matches" : "does_not_match",
      notes: [],
    };
  }

  if (requirement.operator === "boolean") {
    return {
      status:
        Boolean(productValue.value) === Boolean(requirement.expectedValue)
          ? "matches"
          : "does_not_match",
      notes: [],
    };
  }

  if (requirement.operator === "enum") {
    const allowed = Array.isArray(requirement.expectedValue)
      ? requirement.expectedValue.map(normalize)
      : [normalize(requirement.expectedValue)];
    return {
      status: allowed.includes(normalize(productValue.value))
        ? "matches"
        : "does_not_match",
      notes: [],
    };
  }

  if (requirement.operator === "string_exact") {
    const actual = normalize(productValue.value);
    const expected = normalize(requirement.expectedValue);
    if (actual === expected) return { status: "matches", notes: [] };
    if (actual.includes(expected) || expected.includes(actual)) {
      return {
        status: "partially_matches",
        notes: ["Текст совпадает частично; требуется экспертная проверка формулировки."],
      };
    }
    return { status: "does_not_match", notes: [] };
  }

  if (requirement.operator === "string_contains") {
    const actual = normalize(productValue.value);
    const expected = normalize(requirement.expectedValue);
    return {
      status: actual.includes(expected) ? "matches" : "does_not_match",
      notes: [],
    };
  }

  return {
    status: "unknown",
    notes: ["Правило не поддерживается текущей версией движка."],
  };
}

export function evaluateRequirement(input: {
  requirement: TenderRequirement;
  productValue: TenderProductValue | null;
}): RequirementResult {
  const { requirement, productValue } = input;
  const expectedValueLabel = formatValue(
    requirement.expectedValue,
    requirement.unit,
  );

  if (
    !productValue ||
    productValue.value === null ||
    !isAllowedPublishedSource(productValue) ||
    !hasEvidence(productValue.evidence)
  ) {
    return {
      requirement,
      productValue,
      status: "not_verified",
      actualValueLabel: "Нет подтверждённых данных",
      expectedValueLabel,
      evidence: null,
      notes: ["Без подтверждающего источника требование не считается проверенным."],
    };
  }

  const evaluated = statusForRule(requirement, productValue);
  return {
    requirement,
    productValue,
    status: evaluated.status,
    actualValueLabel: formatValue(productValue.value, productValue.unit),
    expectedValueLabel,
    evidence: productValue.evidence,
    notes: evaluated.notes,
  };
}

export function calculateTenderRisk(summary: {
  totalRequirements: number;
  doesNotMatch: number;
  notVerified: number;
  unknown: number;
}): TenderRiskLevel {
  if (summary.doesNotMatch > 0) return "High";
  const missing = summary.notVerified + summary.unknown;
  if (summary.totalRequirements === 0) return "High";
  if (missing / summary.totalRequirements >= 0.4) return "High";
  if (missing > 0) return "Medium";
  return "Low";
}

export function evaluateTenderCompliance(input: {
  tenderTitle: string;
  product: ComplianceResult["product"] | PublishedTenderProduct;
  requirements: TenderRequirement[];
  productValues: TenderProductValue[];
}): ComplianceResult {
  const values = new Map(
    input.productValues.map((value) => [value.characteristicKey, value]),
  );
  const results = input.requirements.map((requirement) =>
    evaluateRequirement({
      requirement,
      productValue: values.get(requirement.requirementId) ?? null,
    }),
  );

  const summary = {
    totalRequirements: results.length,
    matches: results.filter((result) => result.status === "matches").length,
    doesNotMatch: results.filter((result) => result.status === "does_not_match")
      .length,
    partiallyMatches: results.filter(
      (result) => result.status === "partially_matches",
    ).length,
    notVerified: results.filter((result) => result.status === "not_verified")
      .length,
    unknown: results.filter((result) => result.status === "unknown").length,
  };

  return {
    tenderTitle: input.tenderTitle,
    product: input.product,
    results,
    summary: {
      ...summary,
      riskLevel: calculateTenderRisk(summary),
    },
    warnings: [
      "Tender Compliance Engine is deterministic and does not use LLM.",
      "Candidate Claims are ignored and cannot satisfy tender requirements.",
      "Results are not published and do not change Verification or Publication state.",
    ],
  };
}

export function analyzeTenderWorkflow(input: {
  workflow: TenderWorkflowAnalysisInput;
  products: PublishedTenderProduct[];
}): ComplianceResult {
  const product = input.products.find(
    (item) =>
      item.slug === input.workflow.productSlug &&
      item.status === "published_projection",
  );
  const requirements = parseTenderRequirementDrafts(input.workflow.drafts);
  if (!product) {
    return {
      tenderTitle: input.workflow.tenderTitle,
      product: {
        slug: input.workflow.productSlug,
        title: "Изделие не выбрано",
        manufacturer: "Нет данных",
        category: "Нет данных",
      },
      results: [],
      summary: {
        totalRequirements: 0,
        matches: 0,
        doesNotMatch: 0,
        partiallyMatches: 0,
        notVerified: 0,
        unknown: 0,
        riskLevel: "High",
      },
      warnings: [
        "Выберите изделие из опубликованной проекции перед анализом.",
        "Candidate Claims are ignored and cannot satisfy tender requirements.",
      ],
    };
  }
  return evaluateTenderCompliance({
    tenderTitle: input.workflow.tenderTitle,
    product,
    requirements,
    productValues: product.values,
  });
}
