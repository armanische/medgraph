import type {
  CandidateCharacteristic,
  CharacteristicCategory,
  CharacteristicExtractionInput,
  CharacteristicExtractor,
} from "./types.ts";

interface ExtractionRule {
  category: CharacteristicCategory;
  label: string;
  pattern: RegExp;
  confidence: number;
  unitGroup?: number;
}

const RULES: ExtractionRule[] = [
  {
    category: "manufacturer",
    label: "Производитель",
    pattern: /(?:manufacturer|производитель)\s*[:–-]\s*([^\n;]{2,160})/giu,
    confidence: 0.86,
  },
  {
    category: "model",
    label: "Модель",
    pattern: /(?:model|модель)\s*[:–-]\s*([^\n;]{1,100})/giu,
    confidence: 0.86,
  },
  {
    category: "deviceType",
    label: "Тип изделия",
    pattern: /(?:device type|тип изделия)\s*[:–-]\s*([^\n;]{2,160})/giu,
    confidence: 0.82,
  },
  {
    category: "country",
    label: "Страна производства",
    pattern: /(?:country of origin|страна производства)\s*[:–-]\s*([^\n;]{2,100})/giu,
    confidence: 0.84,
  },
  {
    category: "registrationNumber",
    label: "Регистрационный номер",
    pattern:
      /(?:registration (?:number|no\.?)|регистрационн(?:ый|ого) номер)\s*[:№–-]\s*([^\n;]{3,100})/giu,
    confidence: 0.9,
  },
  {
    category: "weight",
    label: "Вес",
    pattern:
      /(?:weight|масса|вес)\s*[:–-]\s*([0-9]+(?:[.,][0-9]+)?)\s*(kg|кг|g|г)\b/giu,
    confidence: 0.88,
    unitGroup: 2,
  },
  {
    category: "dimensions",
    label: "Габариты",
    pattern:
      /(?:dimensions|габарит(?:ы|ные размеры))\s*[:–-]\s*([0-9.,\s×xх*]+)\s*(mm|мм|cm|см)\b/giu,
    confidence: 0.86,
    unitGroup: 2,
  },
  {
    category: "display",
    label: "Дисплей",
    pattern: /(?:display|дисплей|экран)\s*[:–-]\s*([^\n;]{2,120})/giu,
    confidence: 0.78,
  },
  {
    category: "power",
    label: "Питание",
    pattern: /(?:power supply|питание)\s*[:–-]\s*([^\n;]{2,120})/giu,
    confidence: 0.8,
  },
  {
    category: "battery",
    label: "Аккумулятор",
    pattern:
      /(?:battery(?: life)?|аккумулятор|время автономной работы)\s*[:–-]\s*([^\n;]{2,140})/giu,
    confidence: 0.8,
  },
  {
    category: "operatingModes",
    label: "Режимы работы",
    pattern: /(?:operating modes|режимы работы)\s*[:–-]\s*([^\n]{2,240})/giu,
    confidence: 0.78,
  },
  {
    category: "measurementRanges",
    label: "Диапазон измерений",
    pattern:
      /(?:measurement range|диапазон измерений)\s*[:–-]\s*([^\n]{2,180})/giu,
    confidence: 0.82,
  },
  {
    category: "accuracy",
    label: "Точность",
    pattern: /(?:accuracy|точность)\s*[:–-]\s*([^\n]{2,140})/giu,
    confidence: 0.82,
  },
  {
    category: "interfaces",
    label: "Интерфейсы",
    pattern: /(?:interfaces?|интерфейсы)\s*[:–-]\s*([^\n]{2,180})/giu,
    confidence: 0.78,
  },
  {
    category: "compatibility",
    label: "Совместимость",
    pattern: /(?:compatibility|совместимость)\s*[:–-]\s*([^\n]{2,200})/giu,
    confidence: 0.76,
  },
  {
    category: "consumables",
    label: "Расходные материалы",
    pattern: /(?:consumables|расходные материалы)\s*[:–-]\s*([^\n]{2,220})/giu,
    confidence: 0.76,
  },
  {
    category: "accessories",
    label: "Принадлежности",
    pattern: /(?:accessories|принадлежности)\s*[:–-]\s*([^\n]{2,220})/giu,
    confidence: 0.76,
  },
  {
    category: "safetyFeatures",
    label: "Функции безопасности",
    pattern:
      /(?:safety features|функции безопасности)\s*[:–-]\s*([^\n]{2,240})/giu,
    confidence: 0.8,
  },
  {
    category: "warnings",
    label: "Предупреждения",
    pattern: /(?:warnings?|предупреждения)\s*[:–-]\s*([^\n]{2,260})/giu,
    confidence: 0.82,
  },
  {
    category: "contraindications",
    label: "Противопоказания",
    pattern:
      /(?:contraindications?|противопоказания)\s*[:–-]\s*([^\n]{2,260})/giu,
    confidence: 0.86,
  },
  {
    category: "intendedUse",
    label: "Назначение",
    pattern:
      /(?:intended use|intended purpose|назначение)\s*[:–-]\s*([^\n]{2,260})/giu,
    confidence: 0.84,
  },
  {
    category: "patientGroup",
    label: "Группа пациентов",
    pattern:
      /(?:patient (?:group|population)|группа пациентов)\s*[:–-]\s*([^\n]{2,180})/giu,
    confidence: 0.8,
  },
  {
    category: "environment",
    label: "Условия эксплуатации",
    pattern:
      /(?:operating environment|environmental conditions|условия эксплуатации)\s*[:–-]\s*([^\n]{2,220})/giu,
    confidence: 0.78,
  },
  {
    category: "storage",
    label: "Условия хранения",
    pattern:
      /(?:storage conditions|условия хранения)\s*[:–-]\s*([^\n]{2,220})/giu,
    confidence: 0.8,
  },
  {
    category: "maintenance",
    label: "Техническое обслуживание",
    pattern: /(?:maintenance|техническое обслуживание)\s*[:–-]\s*([^\n]{2,220})/giu,
    confidence: 0.78,
  },
  {
    category: "serviceInterval",
    label: "Межсервисный интервал",
    pattern:
      /(?:service interval|межсервисный интервал)\s*[:–-]\s*([^\n]{2,160})/giu,
    confidence: 0.78,
  },
  {
    category: "softwareVersion",
    label: "Версия программного обеспечения",
    pattern:
      /(?:software version|версия программного обеспечения)\s*[:–-]\s*([^\n]{1,120})/giu,
    confidence: 0.82,
  },
  {
    category: "warrantyService",
    label: "Гарантия и сервис",
    pattern:
      /(?:warranty|service life|гарантия|срок службы)\s*[:–-]\s*([^\n]{2,180})/giu,
    confidence: 0.74,
  },
];

function cleanValue(value: string) {
  return value.replace(/\s+/g, " ").trim().replace(/[.,;:]$/, "");
}

function locatorFor(text: string, index: number) {
  const preceding = text.slice(0, index);
  const page = preceding.split("\f").length;
  const paragraph = preceding.split(/\n\s*\n|\n/).length;
  return {
    page,
    section: null,
    heading: null,
    table: null,
    paragraph,
  };
}

export function validateCandidateCharacteristic(
  value: CandidateCharacteristic,
) {
  if (!value.sourceUrl || !value.sourceTitle) {
    throw new Error(
      "Candidate characteristic requires sourceUrl and sourceTitle.",
    );
  }
  return value;
}

export class RuleBasedCharacteristicExtractor
  implements CharacteristicExtractor
{
  extract(input: CharacteristicExtractionInput) {
    const output: CandidateCharacteristic[] = [];
    const seen = new Set<string>();
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      for (const match of input.text.matchAll(rule.pattern)) {
        const value = cleanValue(match[1] ?? "");
        if (!value) continue;
        const unit = rule.unitGroup
          ? cleanValue(match[rule.unitGroup] ?? "") || null
          : null;
        const key = `${rule.category}:${value}:${unit ?? ""}`.toLocaleLowerCase(
          "ru-RU",
        );
        if (seen.has(key)) continue;
        seen.add(key);
        output.push(
          validateCandidateCharacteristic({
            category: rule.category,
            label: rule.label,
            value,
            unit,
            rawText: cleanValue(match[0]),
            sourceUrl: input.source.sourceUrl,
            sourceTitle: input.source.sourceTitle,
            documentTitle: input.document?.title ?? null,
            documentType: input.document?.documentType ?? null,
            documentSha256: input.document?.sha256 ?? null,
            documentVersion: input.document?.sha256
              ? `sha256:${input.document.sha256}`
              : null,
            locator: locatorFor(input.text, match.index ?? 0),
            extractionMethod: input.extractionMethod,
            confidence: rule.confidence,
            status: "unverified",
            needsReview: true,
          }),
        );
      }
    }
    return output;
  }
}
