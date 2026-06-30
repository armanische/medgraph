import type { Product } from "@/types/product";

interface KnowledgeDetailsProps {
  product: Product;
}

function ListCard({
  title,
  items,
  tone = "blue",
}: {
  title: string;
  items: string[];
  tone?: "blue" | "amber" | "green";
}) {
  const marker = {
    blue: "bg-blue-100 text-blue-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  }[tone];

  return (
    <section className="rounded-3xl border bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold">{title}</h2>
      <ul className="mt-6 space-y-4">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 leading-7 text-gray-700">
            <span
              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${marker}`}
            >
              {index + 1}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function KnowledgeDetails({
  product,
}: KnowledgeDetailsProps) {
  const identifiers = [
    ["Регистрационное удостоверение", product.identifiers.registration],
    ["КТРУ", product.identifiers.ktru],
    ["НКМИ", product.identifiers.nkmi],
    ["ОКПД2", product.identifiers.okpd2],
  ];

  return (
    <>
      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <div className="text-sm font-bold uppercase tracking-widest text-blue-600">
          Классификаторы
        </div>
        <h2 className="mt-3 text-3xl font-bold">РУ, КТРУ, НКМИ и ОКПД2</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {identifiers.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-gray-50 p-5">
              <div className="text-sm text-gray-500">{label}</div>
              <div className="mt-2 font-semibold">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <ListCard title="Применение" items={product.applications} tone="green" />
        <ListCard
          title="Отличия и подбор аналогов"
          items={product.analogDifferences}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ListCard
          title="Ошибки при выборе"
          items={product.selectionMistakes}
          tone="amber"
        />
        <ListCard
          title="Рекомендации по подбору"
          items={product.recommendations}
          tone="green"
        />
      </div>

      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-bold">Частые вопросы</h2>
        <div className="mt-6 divide-y">
          {product.faq.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold">
                {item.question}
                <span className="float-right text-blue-600 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-4xl leading-7 text-gray-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-bold">История закупок</h2>
        {product.procurementHistory.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-gray-50 p-5 text-gray-600">
            Данные о закупках готовятся к публикации. Для проверки конкретной
            закупки отправьте запрос — мы сопоставим характеристики и документы.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-sm text-gray-500">
                <tr>
                  <th className="pb-4">Заказчик</th>
                  <th className="pb-4">Дата</th>
                  <th className="pb-4">Количество</th>
                  <th className="pb-4">Цена</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {product.procurementHistory.map((record) => (
                  <tr key={`${record.customer}-${record.date}`}>
                    <td className="py-4">{record.customer}</td>
                    <td className="py-4">{record.date}</td>
                    <td className="py-4">{record.quantity}</td>
                    <td className="py-4">{record.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
