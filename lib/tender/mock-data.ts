import { evaluateTenderCompliance } from "./engine.ts";
import type {
  ComplianceEvidence,
  PublishedTenderProduct,
  TenderProductValue,
  TenderRequirement,
} from "./types.ts";

const hamiltonT1Evidence: ComplianceEvidence = {
  source: {
    id: "source_hamilton_t1_specs",
    title: "Hamilton Medical HAMILTON-T1 technical specifications",
    url: "https://www.hamilton-medical.com/de_CH/Prehospital-transport/Products/HAMILTON-T1.html",
    type: "manufacturer_document",
  },
  documentVersion: {
    id: "document_version_51a8c9f1f4ffad3e93b6e47a",
    title: "HAMILTON-T1 Technische Spezifikation",
    version: "sha256:51a8c9f1f4ff",
  },
  evidenceIds: ["evidence_hamilton_t1_tender_specs"],
  lastUpdated: "2026-07-09",
};

export const ventilatorTenderRequirements: TenderRequirement[] = [
  {
    requirementId: "battery_hours",
    label: "Автономная работа",
    category: "Питание",
    operator: "numeric_gte",
    expectedValue: 4,
    unit: "ч",
  },
  {
    requirementId: "display_size",
    label: "Экран",
    category: "Интерфейс",
    operator: "numeric_gte",
    expectedValue: 10,
    unit: "inch",
  },
  {
    requirementId: "niv_support",
    label: "Поддержка NIV",
    category: "Режимы вентиляции",
    operator: "boolean",
    expectedValue: true,
    unit: null,
  },
  {
    requirementId: "weight",
    label: "Масса",
    category: "Физические параметры",
    operator: "numeric_lte",
    expectedValue: 7,
    unit: "kg",
  },
];

export const hamiltonT1TenderValues: TenderProductValue[] = [
  {
    characteristicKey: "battery_hours",
    label: "Автономная работа",
    value: 5.5,
    unit: "ч",
    sourceKind: "publication_ready_report",
    evidence: hamiltonT1Evidence,
  },
  {
    characteristicKey: "display_size",
    label: "Экран",
    value: 8.4,
    unit: "inch",
    sourceKind: "publication_ready_report",
    evidence: hamiltonT1Evidence,
  },
  {
    characteristicKey: "niv_support",
    label: "Поддержка NIV",
    value: true,
    unit: null,
    sourceKind: "publication_ready_report",
    evidence: hamiltonT1Evidence,
  },
  {
    characteristicKey: "weight",
    label: "Масса",
    value: 6.5,
    unit: "kg",
    sourceKind: "publication_ready_report",
    evidence: hamiltonT1Evidence,
  },
];

function evidenceFor(input: {
  id: string;
  title: string;
  url: string;
  documentTitle: string;
  date: string;
}): ComplianceEvidence {
  return {
    source: {
      id: `source_${input.id}`,
      title: input.title,
      url: input.url,
      type: "manufacturer_document",
    },
    documentVersion: {
      id: `document_version_${input.id}`,
      title: input.documentTitle,
      version: `sha256:${input.id}`,
    },
    evidenceIds: [`evidence_${input.id}`],
    lastUpdated: input.date,
  };
}

const hamiltonC1Evidence = evidenceFor({
  id: "hamilton_c1_specs",
  title: "Hamilton Medical HAMILTON-C1 technical specifications",
  url: "https://www.hamilton-medical.com/en/Products/HAMILTON-C1.html",
  documentTitle: "HAMILTON-C1 Technical specification",
  date: "2026-07-09",
});

const mindrayA5Evidence = evidenceFor({
  id: "mindray_a5_safety",
  title: "Mindray A5 safety and performance information",
  url: "https://www.mindray.com/en/products/anesthesia/a5",
  documentTitle: "A5/A3/A1 Safety and Performance Information",
  date: "2026-07-10",
});

const mindrayA7Evidence = evidenceFor({
  id: "mindray_a7_safety",
  title: "Mindray A7 safety and performance information",
  url: "https://www.mindray.com/en/products/anesthesia/a7",
  documentTitle: "A7 Safety and Performance Information",
  date: "2026-07-10",
});

const fs510Evidence = evidenceFor({
  id: "ambu_fs510_catalog",
  title: "CyberMedica FS510 publication projection",
  url: "https://cybermedica.local/knowledge/fs510",
  documentTitle: "FS510 knowledge projection",
  date: "2026-07-09",
});

export const publishedTenderProducts: PublishedTenderProduct[] = [
  {
    slug: "hamilton-t1",
    title: "Hamilton T1",
    manufacturer: "Hamilton Medical",
    category: "Аппараты ИВЛ",
    status: "published_projection",
    values: hamiltonT1TenderValues,
  },
  {
    slug: "hamilton-c1",
    title: "Hamilton C1",
    manufacturer: "Hamilton Medical",
    category: "Аппараты ИВЛ",
    status: "published_projection",
    values: [
      {
        characteristicKey: "battery_hours",
        label: "Автономная работа",
        value: 4,
        unit: "ч",
        sourceKind: "publication_ready_report",
        evidence: hamiltonC1Evidence,
      },
      {
        characteristicKey: "display_size",
        label: "Экран",
        value: 8.4,
        unit: "inch",
        sourceKind: "publication_ready_report",
        evidence: hamiltonC1Evidence,
      },
      {
        characteristicKey: "niv_support",
        label: "Поддержка NIV",
        value: true,
        unit: null,
        sourceKind: "publication_ready_report",
        evidence: hamiltonC1Evidence,
      },
      {
        characteristicKey: "weight",
        label: "Масса",
        value: 9.5,
        unit: "kg",
        sourceKind: "publication_ready_report",
        evidence: hamiltonC1Evidence,
      },
    ],
  },
  {
    slug: "mindray-a5",
    title: "Mindray A5",
    manufacturer: "Mindray",
    category: "Наркозно-дыхательные аппараты",
    status: "published_projection",
    values: [
      {
        characteristicKey: "battery_hours",
        label: "Автономная работа",
        value: null,
        unit: "ч",
        sourceKind: "publication_ready_report",
        evidence: null,
      },
      {
        characteristicKey: "display_size",
        label: "Экран",
        value: 15,
        unit: "inch",
        sourceKind: "publication_ready_report",
        evidence: mindrayA5Evidence,
      },
      {
        characteristicKey: "niv_support",
        label: "Поддержка NIV",
        value: false,
        unit: null,
        sourceKind: "publication_ready_report",
        evidence: mindrayA5Evidence,
      },
      {
        characteristicKey: "weight",
        label: "Масса",
        value: null,
        unit: "kg",
        sourceKind: "publication_ready_report",
        evidence: null,
      },
    ],
  },
  {
    slug: "mindray-a7",
    title: "Mindray A7",
    manufacturer: "Mindray",
    category: "Наркозно-дыхательные аппараты",
    status: "published_projection",
    values: [
      {
        characteristicKey: "battery_hours",
        label: "Автономная работа",
        value: null,
        unit: "ч",
        sourceKind: "publication_ready_report",
        evidence: null,
      },
      {
        characteristicKey: "display_size",
        label: "Экран",
        value: 15,
        unit: "inch",
        sourceKind: "publication_ready_report",
        evidence: mindrayA7Evidence,
      },
      {
        characteristicKey: "niv_support",
        label: "Поддержка NIV",
        value: false,
        unit: null,
        sourceKind: "publication_ready_report",
        evidence: mindrayA7Evidence,
      },
      {
        characteristicKey: "weight",
        label: "Масса",
        value: null,
        unit: "kg",
        sourceKind: "publication_ready_report",
        evidence: null,
      },
    ],
  },
  {
    slug: "fs510",
    title: "FS510",
    manufacturer: "Ambu",
    category: "Расходные материалы",
    status: "published_projection",
    values: [
      {
        characteristicKey: "battery_hours",
        label: "Автономная работа",
        value: null,
        unit: "ч",
        sourceKind: "published_knowledge",
        evidence: null,
      },
      {
        characteristicKey: "display_size",
        label: "Экран",
        value: null,
        unit: "inch",
        sourceKind: "published_knowledge",
        evidence: null,
      },
      {
        characteristicKey: "niv_support",
        label: "Поддержка NIV",
        value: false,
        unit: null,
        sourceKind: "published_knowledge",
        evidence: fs510Evidence,
      },
      {
        characteristicKey: "weight",
        label: "Масса",
        value: null,
        unit: "kg",
        sourceKind: "published_knowledge",
        evidence: null,
      },
    ],
  },
];

export function getPublishedTenderProduct(slug: string) {
  return publishedTenderProducts.find((product) => product.slug === slug) ?? null;
}

export function getHamiltonT1TenderCompliance() {
  const product = getPublishedTenderProduct("hamilton-t1")!;
  return evaluateTenderCompliance({
    tenderTitle: "Аппарат ИВЛ — пример технического задания",
    product,
    requirements: ventilatorTenderRequirements,
    productValues: product.values,
  });
}
