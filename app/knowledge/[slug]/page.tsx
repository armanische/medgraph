import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) notFound();

  const specs = [
    ["Производитель", product.manufacturer],
    ["Дыхательный объем", product.specifications.vt],
    ["Эффективность фильтрации", product.specifications.filtration],
    ["Влагоудержание", product.specifications.humidity],
    ["Сопротивление", product.specifications.resistance],
    ["Мертвое пространство", product.specifications.deadSpace],
    ["Вес", product.specifications.weight],
    ["Регистрационное удостоверение", product.specifications.ru],
    ["Страна", product.specifications.country],
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="text-sm font-semibold text-blue-600">
              {product.category}
            </div>

            <h1 className="mt-4 text-5xl font-bold">{product.name}</h1>

            <p className="mt-6 text-xl leading-8 text-gray-600">
              {product.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={product.documents[0]?.url}
                target="_blank"
                className="rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold"
              >
                Скачать РУ
              </a>

              <a
                href={product.documents[1]?.url}
                target="_blank"
                className="rounded-xl border bg-white px-6 py-3 font-semibold"
              >
                Инструкция
              </a>

              <button className="rounded-xl border bg-white px-6 py-3 font-semibold">
                Получить КП
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-10 shadow-sm border">
            <div className="overflow-hidden rounded-2xl border bg-white">
              <Image
                src={product.images[0]}
                alt={product.name}
                width={700}
                height={700}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-8">
          <div className="rounded-3xl bg-white p-8 shadow-sm border">
            <h2 className="text-2xl font-bold mb-6">Характеристики</h2>

            {specs.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-8 border-b py-3"
              >
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm border">
            <h2 className="text-2xl font-bold mb-6">Аналоги</h2>

            <div className="space-y-3">
              {product.analogs.map((item) => (
                <div key={item} className="rounded-xl border p-4">
                  {item}
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mt-10 mb-6">Совместимость</h2>

            <div className="space-y-3">
              {product.compatibility.map((item) => (
                <div key={item} className="rounded-xl border p-4">
                  ✅ {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}