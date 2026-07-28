"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CatalogAdminFilter, CatalogAdminListItem, CatalogAdminSort } from "@/lib/catalog-admin";

const filterLabels: Array<[CatalogAdminFilter,string]> = [["all","Все"],["needs_review","Needs Review"],["missing_manufacturer","Без производителя"],["missing_category","Без категории"],["missing_registration","Без регистрации"],["missing_documents","Без документов"],["blocked","Blocked"]];
export default function CatalogAdminList({ initialItems }: { initialItems: CatalogAdminListItem[] }) {
  const [items,setItems]=useState(initialItems); const [search,setSearch]=useState("");
  const [filter,setFilter]=useState<CatalogAdminFilter>("all"); const [sort,setSort]=useState<CatalogAdminSort>("updated");
  const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  useEffect(()=>{ const controller=new AbortController(); const timer=setTimeout(async()=>{setLoading(true);setError("");try{const query=new URLSearchParams({search,filter,sort});const response=await fetch(`/api/internal/catalog-admin/products?${query}`,{signal:controller.signal});if(!response.ok)throw new Error("Не удалось загрузить каталог");const data=await response.json() as {items:CatalogAdminListItem[]};setItems(data.items);}catch(value){if(!controller.signal.aborted)setError(value instanceof Error?value.message:"Ошибка");}finally{if(!controller.signal.aborted)setLoading(false);}},250);return()=>{clearTimeout(timer);controller.abort();};},[search,filter,sort]);
  return <div>
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="text-sm font-medium text-slate-700">Поиск по названию или slug<input aria-label="Поиск товаров" value={search} onChange={e=>setSearch(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-teal-600" placeholder="Введите название или slug" /></label>
        <label className="text-sm font-medium text-slate-700">Сортировка<select value={sort} onChange={e=>setSort(e.target.value as CatalogAdminSort)} className="mt-2 block rounded-lg border border-slate-300 px-3 py-2"><option value="updated">Обновлено</option><option value="name">Название</option><option value="warnings">Warnings</option></select></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Фильтры каталога">{filterLabels.map(([value,label])=><button key={value} type="button" onClick={()=>setFilter(value)} className={`rounded-full px-3 py-1.5 text-sm ${filter===value?"bg-slate-950 text-white":"bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{label}</button>)}</div>
    </section>
    <div className="mt-4 min-h-6 text-sm text-slate-500" aria-live="polite">{loading?"Обновление…":error||`${items.length} карточек`}</div>
    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Название","Производитель","Категория","Область применения","Review State","Warnings","Обновлено"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{items.map(item=><tr key={item.id} className="hover:bg-slate-50"><td className="px-4 py-3"><Link className="font-semibold text-teal-700 hover:underline" href={`/internal/catalog-admin/${item.id}`}>{item.name}</Link><div className="font-mono text-xs text-slate-400">{item.slug}</div></td><td className="px-4 py-3">{item.manufacturer??<Missing/>}</td><td className="px-4 py-3">{item.category??<Missing/>}</td><td className="px-4 py-3">{item.applicationArea??<Missing/>}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{item.blocked?"blocked":item.reviewState}</span></td><td className="px-4 py-3 font-semibold text-amber-700">{item.warningsCount}</td><td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt).toLocaleDateString("ru-RU")}</td></tr>)}</tbody></table>{!items.length&&!loading?<div className="p-8 text-center text-slate-500">По выбранным условиям товары не найдены.</div>:null}</div>
  </div>;
}
function Missing(){return <span className="text-rose-600">Не указано</span>}
