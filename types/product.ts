export interface ProductHighlight {
  label: string;
  value: string;
}

export interface ProductDocument {
  title: string;
  url: string;
  kind: "registration" | "manual" | "declaration" | "other";
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProcurementRecord {
  customer: string;
  date: string;
  quantity: string;
  price: string;
}

export interface Product {
  slug: string;
  name: string;
  manufacturer: string;
  manufacturerSlug: string;
  category: string;
  description: string;
  searchTerms: string[];

  highlights: ProductHighlight[];

  specifications: {
    vt: string;
    filtration: string;
    humidity: string;
    resistance: string;
    weight: string;
    deadSpace: string;
    ru: string;
    country: string;
  };

  identifiers: {
    registration: string;
    ktru: string;
    nkmi: string;
    okpd2: string;
  };

  compatibility: string[];
  analogs: string[];
  analogDifferences: string[];
  applications: string[];
  selectionMistakes: string[];
  recommendations: string[];
  faq: ProductFaq[];
  procurementHistory: ProcurementRecord[];
  images: string[];
  documents: ProductDocument[];
}
