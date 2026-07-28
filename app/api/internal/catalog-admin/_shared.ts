import { NextResponse } from "next/server";
import { catalogAdminEnabled } from "@/lib/internal-access";

export function catalogAdminUnavailable() {
  return catalogAdminEnabled() ? null : NextResponse.json({ error: "Not found" }, { status: 404 });
}
export function catalogAdminError(error: unknown) {
  console.error("Catalog Admin request failed", error instanceof Error ? error.message : error);
  return NextResponse.json({ error: "Catalog Admin request failed" }, { status: 500 });
}
export const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };
