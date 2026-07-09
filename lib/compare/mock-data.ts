import type {
  ComparisonCharacteristic,
  ComparisonEvidence,
  ComparisonProduct,
} from "./types";

function evidence(input: {
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string;
  documentVersionId: string;
  documentTitle: string;
  sha256: string;
  evidenceIds: string[];
  confidence: number;
  lastUpdated: string;
}): ComparisonEvidence {
  return {
    source: {
      id: input.sourceId,
      title: input.sourceTitle,
      url: input.sourceUrl,
      type: "manufacturer_document",
    },
    documentVersion: {
      id: input.documentVersionId,
      title: input.documentTitle,
      version: `sha256:${input.sha256.slice(0, 12)}`,
      sha256: input.sha256,
    },
    evidenceIds: input.evidenceIds,
    confidence: input.confidence,
    lastUpdated: input.lastUpdated,
  };
}

function characteristic(input: {
  key: string;
  label: string;
  group: string;
  value: string | number | boolean;
  unit?: string;
  status: "published" | "publication_ready" | "verified";
  evidence: ComparisonEvidence;
}): ComparisonCharacteristic {
  return {
    key: input.key,
    label: input.label,
    group: input.group,
    value: {
      value: input.value,
      unit: input.unit ?? null,
      status: input.status,
      source: input.evidence.source,
      documentVersion: input.evidence.documentVersion,
      evidenceIds: input.evidence.evidenceIds,
      confidence: input.evidence.confidence,
      lastUpdated: input.evidence.lastUpdated,
    },
  };
}

const hamiltonT1Specs = evidence({
  sourceId: "source_hamilton_t1_specs",
  sourceTitle: "Hamilton Medical HAMILTON-T1 technical specifications",
  sourceUrl:
    "https://www.hamilton-medical.com/de_CH/Prehospital-transport/Products/HAMILTON-T1.html",
  documentVersionId: "document_version_51a8c9f1f4ffad3e93b6e47a",
  documentTitle: "HAMILTON-T1 Technische Spezifikation",
  sha256: "51a8c9f1f4ffad3e93b6e47a51a8c9f1f4ffad3e93b6e47a51a8c9f1",
  evidenceIds: ["evidence_hamilton_t1_specs"],
  confidence: 0.86,
  lastUpdated: "2026-07-09",
});

const hamiltonC1Specs = evidence({
  sourceId: "source_hamilton_c1_specs",
  sourceTitle: "Hamilton Medical HAMILTON-C1 technical specifications",
  sourceUrl:
    "https://www.hamilton-medical.com/en_INT/Products/Mechanical-ventilators/HAMILTON-C1.html",
  documentVersionId: "document_version_hamilton_c1_specs",
  documentTitle: "HAMILTON-C1 Technical specifications",
  sha256: "c1a8c9f1f4ffad3e93b6e47ac1a8c9f1f4ffad3e93b6e47ac1a8c9f1",
  evidenceIds: ["evidence_hamilton_c1_specs"],
  confidence: 0.84,
  lastUpdated: "2026-07-09",
});

export const comparisonProducts: ComparisonProduct[] = [
  {
    productId: "compare_hamilton_t1",
    slug: "apparat-ivl-hamilton-t1",
    title: "Hamilton T1",
    manufacturer: "Hamilton Medical",
    model: "HAMILTON-T1",
    category: "Аппараты ИВЛ",
    dataSource: "publication_ready_report",
    characteristics: [
      characteristic({
        key: "device_type",
        label: "Тип изделия",
        group: "Идентификация",
        value: "Транспортный аппарат ИВЛ",
        status: "publication_ready",
        evidence: hamiltonT1Specs,
      }),
      characteristic({
        key: "display_size",
        label: "Экран",
        group: "Интерфейс",
        value: 8.4,
        unit: "inch",
        status: "publication_ready",
        evidence: hamiltonT1Specs,
      }),
      characteristic({
        key: "battery_operation",
        label: "Работа от аккумулятора",
        group: "Питание",
        value: "Да",
        status: "publication_ready",
        evidence: hamiltonT1Specs,
      }),
      characteristic({
        key: "intended_use",
        label: "Назначение",
        group: "Клиническое применение",
        value: "Транспорт и интенсивная терапия",
        status: "publication_ready",
        evidence: hamiltonT1Specs,
      }),
    ],
  },
  {
    productId: "compare_hamilton_c1",
    slug: "apparat-ivl-hamilton-c1",
    title: "Hamilton C1",
    manufacturer: "Hamilton Medical",
    model: "HAMILTON-C1",
    category: "Аппараты ИВЛ",
    dataSource: "publication_ready_report",
    characteristics: [
      characteristic({
        key: "device_type",
        label: "Тип изделия",
        group: "Идентификация",
        value: "Компактный аппарат ИВЛ",
        status: "publication_ready",
        evidence: hamiltonC1Specs,
      }),
      characteristic({
        key: "display_size",
        label: "Экран",
        group: "Интерфейс",
        value: 8.4,
        unit: "inch",
        status: "publication_ready",
        evidence: hamiltonC1Specs,
      }),
      characteristic({
        key: "battery_operation",
        label: "Работа от аккумулятора",
        group: "Питание",
        value: "Да",
        status: "publication_ready",
        evidence: hamiltonC1Specs,
      }),
      characteristic({
        key: "intended_use",
        label: "Назначение",
        group: "Клиническое применение",
        value: "Интенсивная терапия и внутрибольничный транспорт",
        status: "publication_ready",
        evidence: hamiltonC1Specs,
      }),
      characteristic({
        key: "neonatal_support",
        label: "Неонатальный режим",
        group: "Вентиляция",
        value: "Доступен по конфигурации",
        status: "publication_ready",
        evidence: hamiltonC1Specs,
      }),
    ],
  },
];

export function getComparisonProduct(slug: string) {
  return comparisonProducts.find((product) => product.slug === slug) ?? null;
}

export function getHamiltonPilotComparisonProducts() {
  return {
    left: getComparisonProduct("apparat-ivl-hamilton-t1"),
    right: getComparisonProduct("apparat-ivl-hamilton-c1"),
  };
}
