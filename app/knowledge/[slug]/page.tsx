import { notFound } from "next/navigation";

import Hero from "@/components/knowledge/Hero";
import Specifications from "@/components/knowledge/Specifications";
import Documents from "@/components/knowledge/Documents";
import Compatibility from "@/components/knowledge/Compatibility";
import Analogs from "@/components/knowledge/Analogs";
import RelatedProducts from "@/components/knowledge/RelatedProducts";

import { getProduct } from "@/lib/products";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

        <div className="grid gap-8 lg:grid-cols-2">
          <Compatibility product={product} />
          <Analogs product={product} />
        </div>

        <RelatedProducts product={product} />

      </div>
    </main>
  );
}