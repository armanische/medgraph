import type {
  ComparisonCharacteristic,
  ComparisonDataSource,
  ComparisonProduct,
  ComparisonResult,
  ComparisonRow,
  ComparisonValue,
} from "./types";

const ALLOWED_COMPARISON_SOURCES: ComparisonDataSource[] = [
  "published_knowledge",
  "publication_ready_report",
];

const emptyValue: ComparisonValue = {
  value: null,
  unit: null,
  status: "not_available",
  source: null,
  documentVersion: null,
  evidenceIds: [],
  confidence: null,
  lastUpdated: null,
};

function ensureAllowedProduct(product: ComparisonProduct) {
  if (!ALLOWED_COMPARISON_SOURCES.includes(product.dataSource)) {
    throw new Error(
      `Comparison source ${product.dataSource} is not allowed for ${product.slug}.`,
    );
  }
}

function normalizeValue(value: ComparisonValue) {
  if (value.value === null) return null;
  return String(value.value).trim().toLocaleLowerCase("ru");
}

function characteristicMap(product: ComparisonProduct) {
  return new Map(
    product.characteristics.map((characteristic) => [
      characteristic.key,
      characteristic,
    ]),
  );
}

function rowFor(
  key: string,
  leftCharacteristic: ComparisonCharacteristic | undefined,
  rightCharacteristic: ComparisonCharacteristic | undefined,
): ComparisonRow {
  const left = leftCharacteristic?.value ?? emptyValue;
  const right = rightCharacteristic?.value ?? emptyValue;
  const label =
    leftCharacteristic?.label ?? rightCharacteristic?.label ?? "Характеристика";
  const group = leftCharacteristic?.group ?? rightCharacteristic?.group ?? "Общее";
  const notes: string[] = [];

  if (left.status === "not_available" || right.status === "not_available") {
    notes.push("Для этой характеристики пока нет подтверждённых данных.");
    return {
      characteristicKey: key,
      label,
      group,
      left,
      right,
      differenceType: "missing",
      hasDifference: false,
      notes,
    };
  }

  if (left.unit !== right.unit) {
    notes.push("Единицы измерения различаются и не приводятся автоматически.");
    return {
      characteristicKey: key,
      label,
      group,
      left,
      right,
      differenceType: "unit_mismatch",
      hasDifference: true,
      notes,
    };
  }

  if (left.status !== right.status) {
    notes.push("Статусы проверки различаются.");
    return {
      characteristicKey: key,
      label,
      group,
      left,
      right,
      differenceType: "status_mismatch",
      hasDifference: true,
      notes,
    };
  }

  const differenceType =
    normalizeValue(left) === normalizeValue(right) ? "same" : "different";

  return {
    characteristicKey: key,
    label,
    group,
    left,
    right,
    differenceType,
    hasDifference: differenceType === "different",
    notes,
  };
}

export function compareProducts(input: {
  left: ComparisonProduct;
  right: ComparisonProduct | null;
}): ComparisonResult {
  ensureAllowedProduct(input.left);

  if (!input.right) {
    return {
      products: input,
      rows: [],
      summary: {
        totalCharacteristics: 0,
        comparableCharacteristics: 0,
        differences: 0,
        missingValues: 0,
        unitMismatches: 0,
        statusMismatches: 0,
      },
      warnings: ["Выберите второе изделие для сравнения."],
    };
  }

  ensureAllowedProduct(input.right);

  const leftMap = characteristicMap(input.left);
  const rightMap = characteristicMap(input.right);
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort();
  const rows = keys.map((key) => rowFor(key, leftMap.get(key), rightMap.get(key)));

  return {
    products: input,
    rows,
    summary: {
      totalCharacteristics: rows.length,
      comparableCharacteristics: rows.filter(
        (row) => row.differenceType !== "missing",
      ).length,
      differences: rows.filter((row) => row.hasDifference).length,
      missingValues: rows.filter((row) => row.differenceType === "missing").length,
      unitMismatches: rows.filter((row) => row.differenceType === "unit_mismatch")
        .length,
      statusMismatches: rows.filter(
        (row) => row.differenceType === "status_mismatch",
      ).length,
    },
    warnings: [
      "Comparison uses only published or publication-ready knowledge.",
      "Candidate Claims are not valid comparison input.",
    ],
  };
}
