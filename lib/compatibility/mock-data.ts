import {
  buildCompatibilityResult,
  createCompatibilityRecord,
} from "./engine.ts";
import type {
  CompatibilityProductRef,
  CompatibilityRecord,
  CompatibilityStatus,
} from "./types.ts";

const fs510: CompatibilityProductRef = {
  slug: "fs510",
  title: "Тепловлагообменный фильтр FS510",
  manufacturer: "Alba Healthcare",
  category: "Расходные материалы",
};

const products: Record<string, CompatibilityProductRef> = {
  "hamilton-t1": {
    slug: "hamilton-t1",
    title: "Hamilton T1",
    manufacturer: "Hamilton Medical",
    category: "Аппараты ИВЛ",
  },
  "hamilton-c1": {
    slug: "hamilton-c1",
    title: "Hamilton C1",
    manufacturer: "Hamilton Medical",
    category: "Аппараты ИВЛ",
  },
  "mindray-a8": {
    slug: "mindray-a8",
    title: "Mindray A8",
    manufacturer: "Mindray",
    category: "Наркозно-дыхательные аппараты",
  },
  "wato-ex-35": {
    slug: "wato-ex-35",
    title: "WATO EX-35",
    manufacturer: "Mindray",
    category: "Наркозно-дыхательные аппараты",
  },
};

function record(input: {
  id: string;
  productB: CompatibilityProductRef;
  status: CompatibilityStatus;
  notes: string[];
  documentVersionId: string;
  sourceUrl: string;
}) {
  return createCompatibilityRecord({
    compatibilityId: input.id,
    productA: fs510,
    productB: input.productB,
    compatibilityType: "consumable_device",
    status: input.status,
    evidence: {
      evidenceIds: [`evidence_${input.id}`],
      sourceUrls: [input.sourceUrl],
      documentVersionIds: [input.documentVersionId],
      reviewStatus:
        input.status === "compatible" || input.status === "compatible_with_conditions"
          ? "reviewed"
          : "not_verified",
      lastUpdated: "2026-07-09",
      notes: input.notes,
    },
  });
}

export const compatibilityRecords: CompatibilityRecord[] = [
  record({
    id: "fs510_hamilton_t1",
    productB: products["hamilton-t1"],
    status: "compatible",
    documentVersionId: "document_version_fs510_manual",
    sourceUrl: "/products/fs510/manual.pdf",
    notes: [
      "Совместимость подтверждается только в границах дыхательного контура и параметров, указанных в инструкции.",
    ],
  }),
  record({
    id: "fs510_hamilton_c1",
    productB: products["hamilton-c1"],
    status: "compatible_with_conditions",
    documentVersionId: "document_version_fs510_manual",
    sourceUrl: "/products/fs510/manual.pdf",
    notes: [
      "Перед применением необходимо сверить дыхательный объем, схему контура и требования учреждения.",
    ],
  }),
  record({
    id: "fs510_mindray_a8",
    productB: products["mindray-a8"],
    status: "compatible_with_conditions",
    documentVersionId: "document_version_fs510_manual",
    sourceUrl: "/products/fs510/manual.pdf",
    notes: [
      "Требуется проверка параметров контура и сопротивления при рабочем потоке.",
    ],
  }),
  record({
    id: "fs510_wato_ex_35",
    productB: products["wato-ex-35"],
    status: "not_verified",
    documentVersionId: "document_version_fs510_manual",
    sourceUrl: "/products/fs510/manual.pdf",
    notes: ["Нет подтвержденных документов для публичного вывода совместимости."],
  }),
];

export function getCompatibilityResult(productSlug: string) {
  return buildCompatibilityResult({
    productSlug,
    records: compatibilityRecords,
  });
}
