export type CatalogAdminFilter = "all" | "needs_review" | "missing_manufacturer" | "missing_category" | "missing_registration" | "missing_documents" | "blocked";
export type CatalogAdminSort = "updated" | "name" | "warnings";

export interface CatalogAdminReference { id: string; name: string }
export interface CatalogAdminListItem {
  id: string; slug: string; name: string; manufacturer: string | null;
  category: string | null; applicationArea: string | null; reviewState: string;
  warningsCount: number; updatedAt: string; blocked: boolean;
  flags: Record<string, boolean>;
}
export interface CatalogAdminProduct {
  id: string; slug: string; title: string; model: string | null; sourceUrl: string | null;
  shortDescription: string | null; description: string | null; seoTitle: string | null;
  seoDescription: string | null; manufacturerId: string | null; categoryId: string | null;
  applicationAreaId: string | null; publicationStatus: "draft"; published: false;
  reviewState: string; needsReview: boolean; reviewReasons: string[]; updatedAt: string;
  catalogQualityStatus: "READY" | "REQUIRES_EDITOR_REVIEW";
  catalogQualityReasons: string[];
  updatedBy: string | null; qualityFlags: Record<string, boolean>;
  characteristics: Array<{ name: string; value: string; unit: string | null }>;
  media: Array<{ url: string; role: string; format: string | null }>;
  warnings: Array<{ code: string; message: string; severity: string }>;
  immutable: { sourceUid: string; sourceChecksum: string; snapshotVersion: string; importBatchKey: string; rawSnapshot: unknown; importMetadata: unknown };
}
export type CatalogAdminPatch = Partial<Pick<CatalogAdminProduct, "title" | "model" | "shortDescription" | "description" | "seoTitle" | "seoDescription" | "manufacturerId" | "categoryId" | "applicationAreaId">>;
