import { compareProducts } from "../compare/engine.ts";
import { getHamiltonPilotComparisonProducts } from "../compare/mock-data.ts";
import { getCompatibilityResult } from "../compatibility/mock-data.ts";
import { searchMedicalDevices } from "../search/index.ts";
import { getHamiltonT1TenderCompliance } from "../tender/mock-data.ts";
import type {
  WorkspaceInsight,
  WorkspaceRecommendation,
  WorkspaceSession,
} from "./types.ts";

function buildInsights(input: {
  searchTotal: number;
  comparisonDifferences: number;
  compatibilityNotVerified: number;
  tenderDoesNotMatch: number;
  tenderNotVerified: number;
}): WorkspaceInsight[] {
  const insights: WorkspaceInsight[] = [];

  insights.push({
    insightId: "search-results",
    severity: input.searchTotal > 0 ? "info" : "attention",
    title:
      input.searchTotal > 0
        ? "Поиск нашёл релевантные изделия"
        : "Поиск не нашёл подтверждённых результатов",
    description:
      input.searchTotal > 0
        ? `Найдено изделий: ${input.searchTotal}.`
        : "Нужно уточнить модель, производителя или регистрационный номер.",
    sourcePanel: "search",
  });

  if (input.comparisonDifferences > 0) {
    insights.push({
      insightId: "compare-differences",
      severity: "attention",
      title: "Есть различия между моделями",
      description: `Обнаружено различий: ${input.comparisonDifferences}.`,
      sourcePanel: "compare",
    });
  }

  if (input.compatibilityNotVerified > 0) {
    insights.push({
      insightId: "compatibility-not-verified",
      severity: "attention",
      title: "Совместимость требует проверки",
      description: `Связей без подтверждения: ${input.compatibilityNotVerified}.`,
      sourcePanel: "compatibility",
    });
  }

  if (input.tenderDoesNotMatch > 0 || input.tenderNotVerified > 0) {
    insights.push({
      insightId: "tender-gaps",
      severity: "warning",
      title: "Проверка ТЗ выявила ограничения",
      description: `Не соответствует: ${input.tenderDoesNotMatch}; нет подтверждения: ${input.tenderNotVerified}.`,
      sourcePanel: "tender",
    });
  }

  return insights;
}

function buildRecommendations(input: {
  hasSearchResults: boolean;
  hasComparisonDifferences: boolean;
  hasCompatibilityNotVerified: boolean;
  hasTenderGaps: boolean;
}): WorkspaceRecommendation[] {
  const recommendations: WorkspaceRecommendation[] = [];

  if (input.hasSearchResults) {
    recommendations.push({
      recommendationId: "open-product",
      label: "Открыть карточку изделия",
      href: "/products/fs510",
      reason: "В карточке доступны документы, источники и опубликованные факты.",
      priority: "high",
    });
  }

  if (input.hasComparisonDifferences) {
    recommendations.push({
      recommendationId: "review-comparison",
      label: "Посмотреть сравнение",
      href: "/compare",
      reason: "Различия между моделями влияют на закупочную проверку.",
      priority: "medium",
    });
  }

  if (input.hasCompatibilityNotVerified) {
    recommendations.push({
      recommendationId: "check-compatibility",
      label: "Проверить совместимость",
      href: "/products/fs510#compatibility",
      reason: "Есть связи без подтверждённых данных.",
      priority: "medium",
    });
  }

  if (input.hasTenderGaps) {
    recommendations.push({
      recommendationId: "review-tender",
      label: "Разобрать требования ТЗ",
      href: "/tender",
      reason: "Проверка выявила несоответствие или отсутствие подтверждения.",
      priority: "high",
    });
  }

  recommendations.push({
    recommendationId: "request-quote",
    label: "Отправить запрос КП",
    href: "/request?product=fs510",
    reason: "Можно запросить цену, срок поставки и ручную проверку документов.",
    priority: "medium",
  });

  return recommendations;
}

export function createWorkspaceSession(): WorkspaceSession {
  const search = searchMedicalDevices("FS510");
  const comparisonProducts = getHamiltonPilotComparisonProducts();
  if (!comparisonProducts.left) {
    throw new Error("Workspace comparison pilot requires a left product.");
  }
  const comparison = compareProducts({
    left: comparisonProducts.left,
    right: comparisonProducts.right,
  });
  const compatibility = getCompatibilityResult("fs510");
  const tender = getHamiltonT1TenderCompliance();
  const compatibilityRecords = compatibility.groups.flatMap((group) => group.records);
  const compatibilityNotVerified = compatibilityRecords.filter(
    (record) => record.status === "not_verified" || record.status === "unknown",
  ).length;

  const insights = buildInsights({
    searchTotal: search.total,
    comparisonDifferences: comparison.summary.differences,
    compatibilityNotVerified,
    tenderDoesNotMatch: tender.summary.doesNotMatch,
    tenderNotVerified: tender.summary.notVerified,
  });
  const recommendations = buildRecommendations({
    hasSearchResults: search.total > 0,
    hasComparisonDifferences: comparison.summary.differences > 0,
    hasCompatibilityNotVerified: compatibilityNotVerified > 0,
    hasTenderGaps:
      tender.summary.doesNotMatch > 0 || tender.summary.notVerified > 0,
  });

  return {
    sessionId: "workspace_pilot_fs510",
    createdAt: "2026-07-09",
    selection: {
      primaryProductSlug: "fs510",
      comparedProductSlugs: ["hamilton-t1", "hamilton-c1"],
      searchQuery: "FS510",
      tenderTitle: tender.tenderTitle,
    },
    search,
    comparison,
    compatibility,
    tender,
    insights,
    recommendations,
    warnings: [
      "Workspace uses deterministic engines and mock/report data only.",
      "LLM is not connected.",
      "Candidate Claims and Review Queue are not read by Workspace.",
    ],
  };
}
