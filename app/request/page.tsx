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
    <main className="min-h-screen bg-cm-canvas">
      <section className="cm-container grid gap-6 py-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="pt-4">
          <div className="cm-label !text-cm-teal">
            Коммерческое предложение
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em]">Запросить КП</h1>
          <p className="mt-4 max-w-md text-[13px] leading-7 text-cm-slate">
            Опишите задачу — мы проверим изделие, аналоги, документы и
            совместимость, затем подготовим предложение.
          </p>
          <div className="mt-8 space-y-3 border-t border-[var(--cm-rule)] pt-6 text-xs text-cm-slate">
            {["Запрос не влияет на статус проверки данных", "Ответ направляется указанному контактному лицу", "Персональные данные используются только для ответа"].map((item) => (
              <div key={item} className="flex gap-2"><span className="text-cm-teal">✓</span>{item}</div>
            ))}
          </div>
        </div>
        <div className="cm-card p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-[var(--cm-rule)] pb-4">
            <span className="cm-label">Request Form</span>
            <span className="font-mono text-[9px] text-cm-dim">152-ФЗ</span>
          </div>
          <RequestForm initialMessage={initialMessage} />
        </div>
      </section>
    </main>
  );
}
