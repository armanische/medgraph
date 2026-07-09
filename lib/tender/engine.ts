import type {
  ComplianceEvidence,
  ComplianceResult,
  ComplianceStatus,
  RequirementResult,
  TenderProductValue,
  TenderRequirement,
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
    productValue.sourceKind === "candidate_claim" ||
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

export function evaluateTenderCompliance(input: {
  tenderTitle: string;
  product: ComplianceResult["product"];
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

  return {
    tenderTitle: input.tenderTitle,
    product: input.product,
    results,
    summary: {
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
    },
    warnings: [
      "Tender Compliance Engine is deterministic and does not use LLM.",
      "Candidate Claims are ignored and cannot satisfy tender requirements.",
      "Results are not published and do not change Verification or Publication state.",
    ],
  };
}
