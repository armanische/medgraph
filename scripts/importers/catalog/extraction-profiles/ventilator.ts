import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class VentilatorExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "ventilator" as const;
  readonly categoryMatchers = [/ивл|ventilator|ventilation|respiratory/iu];
  readonly expectedFields = [
    "weight",
    "screen",
    "battery_runtime",
    "modes",
    "niv",
    "neonatal",
    "adult",
    "pediatric",
    "turbine",
    "oxygen",
  ];
  readonly rules: CategoryExtractionRule[] = [
    {
      fieldKey: "weight",
      category: "weight",
      label: "Вес",
      synonyms: ["Mass", "Weight", "Device Weight", "Weight kg", "масса"],
      pattern: /(?:mass|weight|device weight|масса|вес)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(kg|кг|g|г)\b/giu,
      confidence: 0.9,
      unitGroup: 2,
    },
    {
      fieldKey: "screen",
      category: "display",
      label: "Экран",
      synonyms: ["Screen", "Display", "TFT display", "экран"],
      pattern: /(?:screen|display|экран|дисплей)\s*[:–-]?\s*([0-9]+(?:[.,][0-9]+)?)\s*(inch|inches|in|")/giu,
      confidence: 0.88,
      unitGroup: 2,
    },
    {
      fieldKey: "battery_runtime",
      category: "battery",
      label: "Время автономной работы",
      synonyms: ["Battery Runtime", "Operating Time", "Battery Duration", "battery life"],
      pattern: /(?:battery runtime|operating time|battery duration|battery life|время автономной работы)\s*[:–-]?\s*(?:up to\s*)?([0-9]+(?:[.,][0-9]+)?)\s*(hours?|hrs?|h|ч|мин|min)/giu,
      confidence: 0.88,
      unitGroup: 2,
    },
    {
      fieldKey: "modes",
      category: "operatingModes",
      label: "Режимы вентиляции",
      synonyms: ["Modes", "Ventilation Modes", "режимы"],
      pattern: /(?:ventilation modes?|modes|режимы вентиляции)\s*[:–-]\s*([^\n;]{2,220})/giu,
      confidence: 0.82,
    },
    {
      fieldKey: "niv",
      category: "operatingModes",
      label: "NIV",
      synonyms: ["NIV", "Non-invasive ventilation"],
      pattern: /\b(NIV|non-invasive ventilation|неинвазивн(?:ая|ой) вентиляц[^\n;]{0,80})\b/giu,
      confidence: 0.78,
    },
    {
      fieldKey: "neonatal",
      category: "patientGroup",
      label: "Неонатальные пациенты",
      synonyms: ["Neonatal", "Neonate", "новорожденные"],
      pattern: /\b(neonatal|neonate|newborn|новорожденн[^\n;]{0,80})\b/giu,
      confidence: 0.76,
    },
    {
      fieldKey: "adult",
      category: "patientGroup",
      label: "Взрослые пациенты",
      synonyms: ["Adult", "взрослые"],
      pattern: /\b(adult patients?|adults|взросл[^\n;]{0,80})\b/giu,
      confidence: 0.74,
    },
    {
      fieldKey: "pediatric",
      category: "patientGroup",
      label: "Педиатрические пациенты",
      synonyms: ["Pediatric", "Paediatric", "дети"],
      pattern: /\b(pediatric|paediatric|children|детск[^\n;]{0,80})\b/giu,
      confidence: 0.74,
    },
    {
      fieldKey: "turbine",
      category: "power",
      label: "Турбина",
      synonyms: ["Turbine", "integrated turbine"],
      pattern: /\b(turbine|турбин[^\n;]{0,100})\b/giu,
      confidence: 0.72,
    },
    {
      fieldKey: "oxygen",
      category: "measurementRanges",
      label: "Кислород",
      synonyms: ["Oxygen", "FiO2", "O2"],
      pattern: /(?:oxygen|fio2|o2|кислород)\s*[:–-]?\s*([0-9]{1,3}(?:[.,][0-9]+)?)\s*(%|percent)/giu,
      confidence: 0.82,
      unitGroup: 2,
    },
  ];
}
