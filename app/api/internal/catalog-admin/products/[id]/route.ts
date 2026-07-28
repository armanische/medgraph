import { NextRequest, NextResponse } from "next/server";
import { getCatalogAdminProduct, patchCatalogAdminProduct } from "@/lib/catalog-admin/server";
import type { CatalogAdminPatch } from "@/lib/catalog-admin";
import { catalogAdminError, catalogAdminUnavailable, noStoreHeaders } from "../../_shared";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const editable = new Set(["title","model","shortDescription","description","seoTitle","seoDescription","manufacturerId","categoryId","applicationAreaId"]);
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: NextRequest, context: Context) {
  const unavailable = catalogAdminUnavailable(); if (unavailable) return unavailable;
  const { id } = await context.params; if (!uuid.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try { const product = await getCatalogAdminProduct(id); return product ? NextResponse.json(product, { headers: noStoreHeaders }) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
  catch (error) { return catalogAdminError(error); }
}
export async function PATCH(request: NextRequest, context: Context) {
  const unavailable = catalogAdminUnavailable(); if (unavailable) return unavailable;
  const { id } = await context.params; if (!uuid.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  let patch: CatalogAdminPatch;
  try { patch = await request.json() as CatalogAdminPatch; } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!patch || typeof patch !== "object" || Array.isArray(patch) || Object.keys(patch).some((key) => !editable.has(key))) return NextResponse.json({ error: "Only editable catalog fields are accepted" }, { status: 400 });
  try { return NextResponse.json(await patchCatalogAdminProduct(id, patch), { headers: noStoreHeaders }); }
  catch (error) { return catalogAdminError(error); }
}
