import { Product } from "@/types/product";

export const products: Product[] = [
  {
    slug: "fs510",
    name: "Тепловлагообменный фильтр FS510",
    manufacturer: "Alba Healthcare",
    category: "Анестезиология и реанимация",
    description:
      "Тепловлагообменный фильтр HMEF с электростатическим бактериально-вирусным фильтром для использования в дыхательном контуре со стороны пациента.",

    highlights: [
      {
        label: "Эффективность фильтрации",
        value: "≥99.999%",
      },
      {
        label: "Использование",
        value: "24 часа",
      },
      {
        label: "Дыхательный объем",
        value: "100–2000 мл",
      },
      {
        label: "Вес изделия",
        value: "27 г",
      },
    ],

    specifications: {
      vt: "100–2000 мл",
      filtration: "≥99.999%",
      humidity: ">30 мл H₂O/л",
      resistance: "<1.8 см H₂O при 60 л/мин",
      weight: "27 г",
      deadSpace: "<28 мл",
      ru: "ФСЗ 2009/04992",
      country: "США",
    },

    analogs: ["FS500", "DAR Adult HMEF", "Hygrobac S", "Clear-Guard 3"],

    compatibility: [
      "Hamilton C1",
      "Hamilton C3",
      "Hamilton T1",
      "Servo-i",
      "Servo-u",
      "Mindray SV300",
      "Mindray SV600",
      "Puritan Bennett 840",
      "Dräger Evita Infinity V500",
      "GE Carestation",
    ],

    images: ["/products/fs510/photo.jpg"],

    documents: [
      {
        title: "Регистрационное удостоверение",
        url: "/products/fs510/ru.pdf",
      },
      {
        title: "Инструкция",
        url: "/products/fs510/manual.pdf",
      },
    ],
  },
];