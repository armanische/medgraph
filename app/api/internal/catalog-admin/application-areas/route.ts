import { NextResponse } from "next/server";
import { getCatalogAdminReferences } from "@/lib/catalog-admin/server";
import { catalogAdminError, catalogAdminUnavailable, noStoreHeaders } from "../_shared";
export async function GET() { const unavailable=catalogAdminUnavailable(); if(unavailable)return unavailable; try{return NextResponse.json(await getCatalogAdminReferences("application-areas"),{headers:noStoreHeaders});}catch(error){return catalogAdminError(error);} }
