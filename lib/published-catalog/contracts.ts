import { z } from "zod";

import { isApprovedPublicMediaUrl } from "../public-media-policy.ts";

const publicIdentifierSchema = z.string().trim().min(1).regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "Public identifiers must be stable slugs",
);
const publicTextSchema = z.string().trim().min(1);
const nullablePublicTextSchema = publicTextSchema.nullable();
const timestampSchema = z.iso.datetime({ offset: true });
const httpsUrlSchema = z.url().refine(
  (value) => new URL(value).protocol === "https:",
  "Public external URLs must use HTTPS",
);
const approvedPublicMediaUrlSchema = httpsUrlSchema.refine(
  isApprovedPublicMediaUrl,
  "Public media URL must use an approved HTTPS origin",
);

const publishedReferenceSchema = z.object({
  id: publicIdentifierSchema,
  slug: publicIdentifierSchema,
  name: publicTextSchema,
  description: nullablePublicTextSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).strict();

export const publishedManufacturerSchema = publishedReferenceSchema.extend({
  countryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
  website: httpsUrlSchema.nullable(),
}).strict();

export const publishedCategorySchema = publishedReferenceSchema.extend({
  position: z.number().int().nonnegative(),
}).strict();

export const publishedApplicationAreaSchema = publishedReferenceSchema;

export const publishedProductSchema = z.object({
  id: publicIdentifierSchema,
  slug: publicIdentifierSchema,
  title: publicTextSchema,
  model: publicTextSchema,
  shortDescription: nullablePublicTextSchema,
  description: nullablePublicTextSchema,
  manufacturerId: publicIdentifierSchema,
  categoryId: publicIdentifierSchema,
  status: z.literal("active"),
  applicationAreas: z.array(z.object({
    id: publicIdentifierSchema,
    name: publicTextSchema,
  }).strict()),
  keyFeatures: z.array(z.object({
    text: publicTextSchema,
    sortOrder: z.number().int().nonnegative(),
  }).strict()),
  characteristicGroups: z.array(z.object({
    key: publicTextSchema,
    title: publicTextSchema,
    sortOrder: z.number().int().nonnegative(),
    items: z.array(z.object({
      label: publicTextSchema,
      value: publicTextSchema,
      unit: nullablePublicTextSchema,
      sortOrder: z.number().int().nonnegative(),
    }).strict()),
  }).strict()),
  media: z.array(z.object({
    url: approvedPublicMediaUrlSchema,
    role: z.enum(["primary", "gallery"]),
    format: nullablePublicTextSchema,
    sortOrder: z.number().int().nonnegative(),
  }).strict()),
  documents: z.array(z.object({
    title: publicTextSchema,
    kind: z.enum([
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
    ]),
    publicUrl: httpsUrlSchema,
    language: publicTextSchema,
    isOfficial: z.boolean(),
  }).strict()),
  registrations: z.array(z.object({
    registrationNumber: nullablePublicTextSchema,
    status: z.enum([
      "no_data",
      "legacy_claim_only",
      "candidate_number",
      "requires_external_verification",
      "verified_exact",
      "verified_family",
    ]),
    sourceUrl: z.null(),
  }).strict()),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
}).strict().refine(
  (product) => product.id === product.slug,
  { message: "Published Product id must equal its stable public slug", path: ["id"] },
);

export const publishedCatalogProjectionSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: timestampSchema,
  products: z.array(publishedProductSchema),
  manufacturers: z.array(publishedManufacturerSchema),
  categories: z.array(publishedCategorySchema),
  applicationAreas: z.array(publishedApplicationAreaSchema),
  summary: z.object({
    productCount: z.number().int().nonnegative(),
    manufacturerCount: z.number().int().nonnegative(),
    categoryCount: z.number().int().nonnegative(),
    applicationAreaCount: z.number().int().nonnegative(),
  }).strict(),
}).strict().superRefine((catalog, context) => {
  function requireUnique(
    values: readonly string[],
    path: "products" | "manufacturers" | "categories" | "applicationAreas",
    field: "id" | "slug",
  ) {
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (seen.has(value)) {
        context.addIssue({
          code: "custom",
          message: `Published catalog contains a duplicate ${path} ${field}`,
          path: [path, index, field],
        });
      }
      seen.add(value);
    });
  }

  requireUnique(catalog.products.map(({ id }) => id), "products", "id");
  requireUnique(catalog.products.map(({ slug }) => slug), "products", "slug");
  requireUnique(catalog.manufacturers.map(({ id }) => id), "manufacturers", "id");
  requireUnique(catalog.manufacturers.map(({ slug }) => slug), "manufacturers", "slug");
  requireUnique(catalog.categories.map(({ id }) => id), "categories", "id");
  requireUnique(catalog.categories.map(({ slug }) => slug), "categories", "slug");
  requireUnique(catalog.applicationAreas.map(({ id }) => id), "applicationAreas", "id");
  requireUnique(catalog.applicationAreas.map(({ slug }) => slug), "applicationAreas", "slug");

  const manufacturerIds = new Set(catalog.manufacturers.map(({ id }) => id));
  const categoryIds = new Set(catalog.categories.map(({ id }) => id));
  const applicationAreasById = new Map(
    catalog.applicationAreas.map(({ id, name }) => [id, name]),
  );

  if (catalog.summary.productCount !== catalog.products.length
      || catalog.summary.manufacturerCount !== catalog.manufacturers.length
      || catalog.summary.categoryCount !== catalog.categories.length
      || catalog.summary.applicationAreaCount !== catalog.applicationAreas.length) {
    context.addIssue({ code: "custom", message: "Published catalog summary counts are inconsistent" });
  }

  catalog.products.forEach((product, index) => {
    if (!manufacturerIds.has(product.manufacturerId)) {
      context.addIssue({
        code: "custom",
        message: "Published Product references a missing manufacturer",
        path: ["products", index, "manufacturerId"],
      });
    }
    if (!categoryIds.has(product.categoryId)) {
      context.addIssue({
        code: "custom",
        message: "Published Product references a missing category",
        path: ["products", index, "categoryId"],
      });
    }
    const productApplicationAreaIds = new Set<string>();
    product.applicationAreas.forEach((area, areaIndex) => {
      const canonicalName = applicationAreasById.get(area.id);
      if (canonicalName === undefined) {
        context.addIssue({
          code: "custom",
          message: "Published Product references a missing application area",
          path: ["products", index, "applicationAreas", areaIndex, "id"],
        });
      }
      if (canonicalName !== undefined && canonicalName !== area.name) {
        context.addIssue({
          code: "custom",
          message: "Published Product application area name conflicts with its canonical reference",
          path: ["products", index, "applicationAreas", areaIndex, "name"],
        });
      }
      if (productApplicationAreaIds.has(area.id)) {
        context.addIssue({
          code: "custom",
          message: "Published Product contains a duplicate application area reference",
          path: ["products", index, "applicationAreas", areaIndex, "id"],
        });
      }
      productApplicationAreaIds.add(area.id);
    });
  });
});

export type PublishedCatalogProjection = z.infer<typeof publishedCatalogProjectionSchema>;

export function parsePublishedCatalogProjection(value: unknown): PublishedCatalogProjection {
  return publishedCatalogProjectionSchema.parse(value);
}
