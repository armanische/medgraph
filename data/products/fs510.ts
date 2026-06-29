import { Product } from "@/types/product";

export const fs510: Product = {
  slug: "fs510",
  name: "Тепловлагообменный фильтр FS510",
  manufacturer: "Alba Healthcare",
  category: "Анестезиология и реанимация",
  description:
    "Тепловлагообменный фильтр HMEF с электростатическим бактериально-вирусным фильтром для использования в дыхательном контуре со стороны пациента.",

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
};