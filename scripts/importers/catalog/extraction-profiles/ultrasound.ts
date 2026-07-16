import { BaseCategoryExtractionProfile } from "./base.ts";
import type { CategoryExtractionRule } from "./base.ts";

export class UltrasoundExtractionProfile extends BaseCategoryExtractionProfile {
  readonly name = "ultrasound" as const;
  readonly categoryMatchers = [/узи|ultrasound|sonography/iu];
  readonly expectedFields = ["channels", "probe_ports", "doppler", "elastography", "3d_4d"];
  readonly rules: CategoryExtractionRule[] = [
    { fieldKey: "channels", category: "interfaces", label: "Каналы", synonyms: ["Channels"], pattern: /(?:channels?|канал[а-я]*)\s*[:–-]?\s*([0-9]+)/giu, confidence: 0.78 },
    { fieldKey: "probe_ports", category: "interfaces", label: "Порты датчиков", synonyms: ["Probe ports", "Transducer ports"], pattern: /(?:probe ports?|transducer ports?|порты датчиков)\s*[:–-]?\s*([0-9]+)/giu, confidence: 0.84 },
    { fieldKey: "doppler", category: "operatingModes", label: "Doppler", synonyms: ["Doppler", "Color Doppler"], pattern: /\b(color doppler|power doppler|doppler)\b/giu, confidence: 0.76 },
    { fieldKey: "elastography", category: "operatingModes", label: "Эластография", synonyms: ["Elastography"], pattern: /\b(elastography|эластограф[^\n;]{0,80})\b/giu, confidence: 0.76 },
    { fieldKey: "3d_4d", category: "operatingModes", label: "3D/4D", synonyms: ["3D", "4D"], pattern: /\b(3d\/4d|3d|4d)\b/giu, confidence: 0.74 },
  ];
}
