export interface ProductHighlight {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  name: string;
  manufacturer: string;
  category: string;
  description: string;

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

  compatibility: string[];
  analogs: string[];
  images: string[];

  documents: {
    title: string;
    url: string;
  }[];
}