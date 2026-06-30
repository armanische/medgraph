import type { Manufacturer } from "@/types/manufacturer";

export const manufacturers: Manufacturer[] = [
  {
    slug: "alba-healthcare",
    name: "Alba Healthcare",
    country: "США",
    description:
      "Производитель медицинских расходных материалов для анестезиологии и респираторной терапии.",
    categories: ["Анестезиология", "Реанимация", "Расходные материалы"],
  },
  {
    slug: "ambu",
    name: "Ambu",
    country: "Дания",
    description:
      "Медицинские решения для эндоскопии, анестезиологии и мониторинга.",
    categories: ["Эндоскопия", "Анестезиология"],
  },
  {
    slug: "hamilton-medical",
    name: "Hamilton Medical",
    country: "Швейцария",
    description: "Оборудование и технологии для искусственной вентиляции лёгких.",
    categories: ["ИВЛ", "Реанимация"],
  },
  {
    slug: "mindray",
    name: "Mindray",
    country: "Китай",
    description:
      "Диагностическое и реанимационное оборудование, мониторы и ультразвуковые системы.",
    categories: ["ИВЛ", "Мониторы", "УЗИ"],
  },
  {
    slug: "drager",
    name: "Dräger",
    country: "Германия",
    description: "Оборудование для интенсивной терапии, анестезии и мониторинга.",
    categories: ["ИВЛ", "Анестезиология", "Мониторы"],
  },
  {
    slug: "ge-healthcare",
    name: "GE HealthCare",
    country: "США",
    description: "Диагностические системы и оборудование для мониторинга пациентов.",
    categories: ["УЗИ", "Мониторы", "Диагностика"],
  },
  {
    slug: "medtronic",
    name: "Medtronic",
    country: "Ирландия",
    description: "Медицинские технологии, оборудование и расходные материалы.",
    categories: ["Хирургия", "Мониторинг", "Расходные материалы"],
  },
  {
    slug: "intersurgical",
    name: "Intersurgical",
    country: "Великобритания",
    description: "Дыхательные системы и расходные материалы для респираторной терапии.",
    categories: ["Анестезиология", "ИВЛ", "Расходные материалы"],
  },
];
