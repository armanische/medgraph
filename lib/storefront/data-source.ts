export type StorefrontDataSource = "static" | "cloud_preview";

export function getStorefrontDataSource(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): StorefrontDataSource {
  const value = environment.CATALOG_DATA_SOURCE?.trim() || "static";
  if (value !== "static" && value !== "cloud_preview") {
    throw new Error(`Unsupported Storefront CATALOG_DATA_SOURCE: ${value}`);
  }
  if (value === "cloud_preview" && environment.VERCEL_ENV === "production") {
    throw new Error("cloud_preview is forbidden in the Vercel Production environment.");
  }
  return value;
}

export function isCloudPreviewCatalog(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return getStorefrontDataSource(environment) === "cloud_preview";
}
