import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Hero from "@/components/knowledge/Hero";
import Specifications from "@/components/knowledge/Specifications";
import Documents from "@/components/knowledge/Documents";
import Compatibility from "@/components/knowledge/Compatibility";
import Analogs from "@/components/knowledge/Analogs";
import KnowledgeDetails from "@/components/knowledge/KnowledgeDetails";

import { getProduct } from "@/lib/products";
import { products } from "@/data/products";

interface KnowledgePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: KnowledgePageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return {
      title: "Изделие не найдено | CyberMedica",
    };
  }

  return {
    title: `${product.name} — характеристики, РУ, аналоги и совместимость`,
    description: product.description,
  };
}

export default async function KnowledgePage({
  params,
}: KnowledgePageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-8 px-8 py-16">
        <Hero product={product} />

        <div className="grid gap-8 lg:grid-cols-2">
          <Specifications product={product} />
          <Documents product={product} />
        </div>

        <KnowledgeDetails product={product} />

        <div className="grid gap-8 lg:grid-cols-2">
          <Compatibility product={product} />
          <Analogs product={product} />
        </div>
      </div>
    </main>
  );
}