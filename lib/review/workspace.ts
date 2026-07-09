import type {
  ReviewerCandidateFact,
  ReviewerDecisionDraft,
  ReviewerDraftDecisionValue,
  ReviewerFilter,
  ReviewerProductQueueItem,
  ReviewerWorkspaceModel,
  ReviewerWorkspaceStats,
} from "./types.ts";

const hamiltonFacts: ReviewerCandidateFact[] = [
  createFact({
    factId: "review_fact_hamilton_t1_battery",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Автономная работа",
    value: "до 9 часов",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_ifu_2024_01",
    evidence: "Battery operating time listed in operator manual.",
    status: "pending",
    priority: "high",
    risk: "high",
    locator: "стр. 42, таблица питания",
  }),
  createFact({
    factId: "review_fact_hamilton_t1_screen",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Экран",
    value: "8.4 дюйма",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_datasheet_2024_01",
    evidence: "Display size in technical datasheet.",
    status: "ready",
    priority: "medium",
    risk: "medium",
    locator: "стр. 2, технические данные",
  }),
  createFact({
    factId: "review_fact_hamilton_t1_niv",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Поддержка NIV",
    value: "есть",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_ifu_2024_01",
    evidence: "Ventilation modes include NIV.",
    status: "pending",
    priority: "high",
    risk: "high",
    locator: "стр. 89, режимы вентиляции",
  }),
  createFact({
    factId: "review_fact_hamilton_t1_weight",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Масса",
    value: "6.5 кг",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_datasheet_2024_01",
    evidence: "Weight without trolley in datasheet.",
    status: "ready",
    priority: "medium",
    risk: "medium",
    locator: "стр. 2, physical specifications",
  }),
  createFact({
    factId: "review_fact_hamilton_t1_o2",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Подача кислорода",
    value: "низкое и высокое давление",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_ifu_2024_01",
    evidence: "Oxygen inlet options listed in manual.",
    status: "needs_evidence",
    priority: "high",
    risk: "high",
    locator: "стр. 31, подключение газа",
  }),
  createFact({
    factId: "review_fact_hamilton_t1_modes",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Режимы вентиляции",
    value: "PCV+, PSIMV+, NIV, nCPAP",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_ifu_2024_01",
    evidence: "Mode list requires reviewer confirmation.",
    status: "pending",
    priority: "high",
    risk: "high",
    locator: "стр. 91, список режимов",
  }),
  createFact({
    factId: "review_fact_hamilton_t1_transport",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Транспортное применение",
    value: "внутрибольничная и межбольничная транспортировка",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_brochure_2024_01",
    evidence: "Transport use described in brochure; needs stronger source.",
    status: "needs_evidence",
    priority: "medium",
    risk: "medium",
    locator: "стр. 1, назначение",
  }),
  createFact({
    factId: "review_fact_hamilton_t1_patient",
    productSlug: "apparat-ivl-hamilton-t1",
    characteristic: "Группы пациентов",
    value: "взрослые, дети, новорождённые",
    source: "Hamilton Medical",
    documentVersion: "docver_hamilton_t1_ifu_2024_01",
    evidence: "Patient groups conflict with short datasheet wording.",
    status: "conflict",
    priority: "critical",
    risk: "high",
    locator: "стр. 15, назначение",
  }),
];

const fs510Facts: ReviewerCandidateFact[] = [
  createFact({
    factId: "review_fact_fs510_type",
    productSlug: "fs510",
    characteristic: "Тип изделия",
    value: "дыхательный фильтр HMEF",
    source: "Ambu",
    documentVersion: "docver_fs510_ifu_2024_01",
    evidence: "Product type listed in IFU.",
    status: "ready",
    priority: "medium",
    risk: "medium",
    locator: "стр. 1, назначение изделия",
  }),
  createFact({
    factId: "review_fact_fs510_single_use",
    productSlug: "fs510",
    characteristic: "Одноразовое применение",
    value: "да",
    source: "Ambu",
    documentVersion: "docver_fs510_ifu_2024_01",
    evidence: "Single-use statement found in IFU.",
    status: "pending",
    priority: "high",
    risk: "high",
    locator: "стр. 2, warnings",
  }),
  createFact({
    factId: "review_fact_fs510_compatibility",
    productSlug: "fs510",
    characteristic: "Совместимость",
    value: "аппараты ИВЛ с 22 мм контуром",
    source: "Ambu",
    documentVersion: "docver_fs510_datasheet_2024_01",
    evidence: "Connector compatibility needs document cross-check.",
    status: "needs_evidence",
    priority: "high",
    risk: "high",
    locator: "стр. 1, connection specification",
  }),
];

function createFact(input: {
  factId: string;
  productSlug: string;
  characteristic: string;
  value: string;
  source: string;
  documentVersion: string;
  evidence: string;
  status: ReviewerCandidateFact["status"];
  priority: ReviewerCandidateFact["priority"];
  risk: ReviewerCandidateFact["risk"];
  locator: string;
}): ReviewerCandidateFact {
  return {
    ...input,
    lastUpdated: "2026-07-09",
    documentPreview: {
      documentTitle: input.documentVersion.includes("datasheet")
        ? "Technical Datasheet"
        : input.documentVersion.includes("brochure")
          ? "Manufacturer Brochure"
          : "Instructions for Use",
      documentVersion: input.documentVersion,
      documentHash: `sha256:${input.factId.slice(-12)}a91f04c2d7e8`,
      page: input.locator.split(",")[0] ?? "стр. 1",
      locator: input.locator,
      sourceUrl: `https://example.cybermedica.local/sources/${input.documentVersion}.pdf`,
    },
    history: [
      {
        eventId: `${input.factId}_created`,
        type: "creation",
        label: "Факт создан",
        actor: "import report",
        timestamp: "2026-07-09T09:00:00Z",
        notes: "Создан из подготовленного отчёта документов.",
      },
      {
        eventId: `${input.factId}_review`,
        type: "review",
        label: "Ожидает проверки",
        actor: "review queue",
        timestamp: "2026-07-09T09:10:00Z",
        notes: "Передан в рабочее пространство reviewer-а.",
      },
    ],
  };
}

function productSummary(
  product: Omit<ReviewerProductQueueItem, "factsCount" | "readyCount" | "pendingCount" | "needsEvidenceCount" | "conflictCount">,
  facts: ReviewerCandidateFact[],
): ReviewerProductQueueItem {
  return {
    ...product,
    factsCount: facts.length,
    readyCount: facts.filter((fact) => fact.status === "ready").length,
    pendingCount: facts.filter((fact) => fact.status === "pending").length,
    needsEvidenceCount: facts.filter((fact) => fact.status === "needs_evidence").length,
    conflictCount: facts.filter((fact) => fact.status === "conflict").length,
  };
}

export function createReviewerWorkspaceModel(): ReviewerWorkspaceModel {
  const facts = [...hamiltonFacts, ...fs510Facts];
  const products = [
    productSummary(
      {
        productSlug: "apparat-ivl-hamilton-t1",
        productTitle: "Hamilton T1",
        manufacturer: "Hamilton Medical",
        priority: "high",
        status: "pending",
      },
      hamiltonFacts,
    ),
    productSummary(
      {
        productSlug: "fs510",
        productTitle: "FS510",
        manufacturer: "Ambu",
        priority: "medium",
        status: "ready",
      },
      fs510Facts,
    ),
  ];
  return {
    generatedAt: "2026-07-09T10:00:00Z",
    products,
    facts,
    stats: calculateReviewerStats(facts, []),
    safetyBoundaries: [
      "Draft decision stays local to the browser session.",
      "No verified claim is created.",
      "No publication artifact is created.",
      "No Supabase write is performed.",
      "Candidate data is displayed but not modified.",
    ],
  };
}

export function filterReviewerFacts(
  facts: ReviewerCandidateFact[],
  filter: ReviewerFilter,
) {
  if (filter === "pending") return facts.filter((fact) => fact.status === "pending");
  if (filter === "high") {
    return facts.filter(
      (fact) => fact.priority === "high" || fact.priority === "critical",
    );
  }
  if (filter === "conflict") return facts.filter((fact) => fact.status === "conflict");
  if (filter === "needs_evidence") {
    return facts.filter((fact) => fact.status === "needs_evidence");
  }
  return facts;
}

export function createReviewerDecisionDraft(input: {
  factId: string;
  decision: ReviewerDraftDecisionValue;
  notes?: string;
}): ReviewerDecisionDraft {
  return {
    draftId: `draft_${input.factId}_${input.decision}`,
    factId: input.factId,
    decision: input.decision,
    reviewer: "local reviewer",
    notes: input.notes ?? "",
    createdAt: "2026-07-09T10:15:00Z",
    localOnly: true,
  };
}

export function calculateReviewerStats(
  facts: ReviewerCandidateFact[],
  drafts: ReviewerDecisionDraft[],
): ReviewerWorkspaceStats {
  return {
    pending: facts.filter((fact) => fact.status === "pending").length,
    highPriority: facts.filter(
      (fact) => fact.priority === "high" || fact.priority === "critical",
    ).length,
    ready: facts.filter((fact) => fact.status === "ready").length,
    rejectedDraft: drafts.filter((draft) => draft.decision === "reject").length,
    averageReviewTime: "18 мин",
  };
}
