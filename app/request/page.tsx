import type { Metadata } from "next";

import RequestForm from "@/components/request/RequestForm";
import { getProduct } from "@/lib/products";

export const metadata: Metadata = {
  title: "Запросить коммерческое предложение | CyberMedica",
  description:
    "Отправьте запрос на медицинское изделие, аналог, документы или подбор совместимости.",
};

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; query?: string }>;
}) {
  const { product: productSlug, query } = await searchParams;
  const product = productSlug ? getProduct(productSlug) : undefined;
  const initialMessage = product
    ? `Нужно коммерческое предложение на «${product.name}». Количество: `
    : query
      ? `Необходимо подобрать: ${query}`
      : "";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-3xl px-8 py-20">
        <div className="rounded-3xl border bg-white p-8 shadow-sm md:p-10">
          <div className="text-sm font-semibold text-blue-600">
            Коммерческое предложение
          </div>
          <h1 className="mt-4 text-4xl font-bold">Запросить КП</h1>
          <p className="mt-4 leading-7 text-gray-600">
            Опишите задачу — мы проверим изделие, аналоги, документы и
            совместимость, затем подготовим предложение.
          </p>
          <RequestForm initialMessage={initialMessage} />
        </div>
      </section>
    </main>
  );
}
