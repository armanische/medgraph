import { NextRequest, NextResponse } from "next/server";
import { listCatalogAdminProducts } from "@/lib/catalog-admin/server";
import type { CatalogAdminFilter, CatalogAdminSort } from "@/lib/catalog-admin";
import { catalogAdminError, catalogAdminUnavailable, noStoreHeaders } from "../_shared";

const filters = new Set<CatalogAdminFilter>(["all","needs_review","missing_manufacturer","missing_category","missing_registration","missing_documents","blocked"]);
const sorts = new Set<CatalogAdminSort>(["updated","name","warnings"]);
export async function GET(request: NextRequest) {
  const unavailable = catalogAdminUnavailable(); if (unavailable) return unavailable;
  const filter = request.nextUrl.searchParams.get("filter") ?? "all";
  const sort = request.nextUrl.searchParams.get("sort") ?? "updated";
  if (!filters.has(filter as CatalogAdminFilter) || !sorts.has(sort as CatalogAdminSort)) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  try {
    const result = await listCatalogAdminProducts({ search: request.nextUrl.searchParams.get("search") ?? "", filter: filter as CatalogAdminFilter, sort: sort as CatalogAdminSort });
    return NextResponse.json(result, { headers: noStoreHeaders });
  } catch (error) { return catalogAdminError(error); }
}
