export const PRODUCT_STATUSES = [
  "active",
  "on_request",
  "discontinued",
  "hidden",
  "preview_draft",
] as const;

export const CLOUD_PREVIEW_UNKNOWN_MANUFACTURER_ID = "cloud-preview-manufacturer-unassigned";
export const CLOUD_PREVIEW_UNKNOWN_CATEGORY_ID = "cloud-preview-category-unassigned";
export const CATALOG_QUALITY_STATUSES = ["READY", "REQUIRES_EDITOR_REVIEW"] as const;

export const MANUFACTURER_STATUSES = ["active", "hidden"] as const;
export const CATEGORY_STATUSES = ["active", "hidden"] as const;

export const PRODUCT_MEDIA_TYPES = ["image", "video"] as const;

export const PRODUCT_DOCUMENT_KINDS = [
  "brochure",
  "datasheet",
  "technical_specification",
  "ifu",
  "operator_manual",
  "quick_guide",
  "software",
  "clinical_information",
  "accessories",
  "compatibility",
  "service_documentation",
  "registration",
  "certificate",
  "other",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type ManufacturerStatus = (typeof MANUFACTURER_STATUSES)[number];
export type CategoryStatus = (typeof CATEGORY_STATUSES)[number];
export type ProductMediaType = (typeof PRODUCT_MEDIA_TYPES)[number];
export type ProductDocumentKind = (typeof PRODUCT_DOCUMENT_KINDS)[number];
export type CatalogQualityStatus = (typeof CATALOG_QUALITY_STATUSES)[number];

export interface Manufacturer {
  id: string;
  slug: string;
  name: string;
  country: string;
  shortDescription: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  status: ManufacturerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  parentId: string | null;
  imageUrl: string | null;
  position: number;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpecification {
  group: string;
  label: string;
  value: string;
  unit: string | null;
  position: number;
}

export interface ProductMedia {
  type: ProductMediaType;
  url: string;
  alt: string;
  position: number;
}

export interface ProductDocument {
  title: string;
  kind: ProductDocumentKind;
  publicUrl: string;
  language: string;
  isOfficial: boolean;
}

export interface ProductCompatibility {
  compatibleProductId: string | null;
  label: string;
  note: string;
}

export interface ProductRegistration {
  number: string | null;
  status: string;
  sourceUrl: string | null;
}

export interface Product {
  id: string;
  slug: string;
  manufacturerId: string;
  categoryId: string;
  name: string;
  model: string;
  shortDescription: string;
  description: string;
  status: ProductStatus;
  catalogQualityStatus?: CatalogQualityStatus;
  featured: boolean;
  applicationAreas: string[];
  keyFeatures: string[];
  specifications: ProductSpecification[];
  media: ProductMedia[];
  documents: ProductDocument[];
  registrationRecords?: ProductRegistration[];
  compatibility: ProductCompatibility[];
  relatedProductIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogSummary {
  schemaVersion: 1;
  generatedAt: string;
  productCount: number;
  activeProductCount: number;
  manufacturerCount: number;
  categoryCount: number;
}

export interface StorefrontCatalog {
  products: Product[];
  manufacturers: Manufacturer[];
  categories: Category[];
  summary: CatalogSummary;
}

export const PUBLIC_PRODUCT_STATUSES: ReadonlySet<ProductStatus> = new Set([
  "active",
  "on_request",
]);
