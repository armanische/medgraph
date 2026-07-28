import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase";
import type { CatalogAdminFilter, CatalogAdminListItem, CatalogAdminPatch, CatalogAdminProduct, CatalogAdminReference, CatalogAdminSort } from "./types";

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const response = await createSupabaseServerClient({ access: "service_role" }).request(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      "Accept-Profile": "cloud_api",
      "Content-Profile": "cloud_api",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<T>;
}

export async function listCatalogAdminProducts(options: { search?: string; filter?: CatalogAdminFilter; sort?: CatalogAdminSort } = {}) {
  return rpc<{ items: CatalogAdminListItem[]; total: number }>("catalog_admin_products", {
    p_search: options.search ?? null, p_filter: options.filter ?? "all", p_sort: options.sort ?? "updated",
  });
}
export function getCatalogAdminProduct(id: string) { return rpc<CatalogAdminProduct | null>("catalog_admin_product", { p_id: id }); }
export function getCatalogAdminReferences(kind: "manufacturers" | "categories" | "application-areas") { return rpc<CatalogAdminReference[]>("catalog_admin_references", { p_kind: kind }); }
export function patchCatalogAdminProduct(id: string, patch: CatalogAdminPatch) {
  return rpc<CatalogAdminProduct>("catalog_admin_patch_product", { p_id: id, p_patch: patch, p_actor: process.env.CATALOG_ADMIN_ACTOR?.trim() || "catalog-admin-development" });
}
