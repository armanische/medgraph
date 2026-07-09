import { evaluateTenderCompliance } from "./engine.ts";
import type {
  ComplianceEvidence,
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

export function getHamiltonT1TenderCompliance() {
  return evaluateTenderCompliance({
    tenderTitle: "Аппарат ИВЛ — пример технического задания",
    product: {
      slug: "hamilton-t1",
      title: "Hamilton T1",
      manufacturer: "Hamilton Medical",
      category: "Аппараты ИВЛ",
    },
    requirements: ventilatorTenderRequirements,
    productValues: hamiltonT1TenderValues,
  });
}
