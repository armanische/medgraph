import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import CatalogAdminList from "@/components/internal/CatalogAdminList";
import { catalogAdminEnabled, internalRouteMetadata } from "@/lib/internal-access";
import { listCatalogAdminProducts } from "@/lib/catalog-admin/server";
export async function generateMetadata():Promise<Metadata>{await connection();return internalRouteMetadata(catalogAdminEnabled(),"Catalog Admin");}
export default async function CatalogAdminPage(){await connection();if(!catalogAdminEnabled())notFound();const {items}=await listCatalogAdminProducts();return <main className="min-h-screen bg-slate-50"><section className="mx-auto max-w-[96rem] px-6 py-10 sm:px-8"><div className="mb-8"><div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">Internal · staging drafts</div><h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Catalog Admin</h1><p className="mt-3 max-w-3xl text-slate-600">Ручная коррекция импортированных draft-карточек. Не является CMS, review workflow или публикацией.</p><p className="mt-2 text-sm text-amber-800">Env gate не заменяет authentication. Для Preview обязательна Deployment Protection.</p></div><CatalogAdminList initialItems={items}/></section></main>}
