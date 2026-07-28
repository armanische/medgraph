import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import CatalogAdminEditor from "@/components/internal/CatalogAdminEditor";
import { catalogAdminEnabled, internalRouteMetadata } from "@/lib/internal-access";
import { getCatalogAdminProduct, getCatalogAdminReferences } from "@/lib/catalog-admin/server";
export async function generateMetadata():Promise<Metadata>{await connection();return internalRouteMetadata(catalogAdminEnabled(),"Редактор товара");}
export default async function CatalogAdminProductPage({params}:{params:Promise<{id:string}>}){await connection();if(!catalogAdminEnabled())notFound();const {id}=await params;const [product,manufacturers,categories,applicationAreas]=await Promise.all([getCatalogAdminProduct(id),getCatalogAdminReferences("manufacturers"),getCatalogAdminReferences("categories"),getCatalogAdminReferences("application-areas")]);if(!product)notFound();return <main className="min-h-screen bg-slate-50"><section className="mx-auto max-w-[96rem] px-6 py-10 sm:px-8"><div className="mb-8"><div className="font-mono text-xs font-semibold uppercase tracking-wide text-teal-700">Catalog Admin · draft</div><h1 className="mt-3 text-3xl font-semibold text-slate-950">{product.title}</h1><p className="mt-2 font-mono text-sm text-slate-500">{product.slug}</p></div><CatalogAdminEditor initialProduct={product} references={{manufacturers,categories,applicationAreas}}/></section></main>}
