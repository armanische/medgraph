import { Product } from "@/types/product";

interface SpecificationsProps {
  product: Product;
}

export default function Specifications({
  product,
}: SpecificationsProps) {
  const specs = [
    ["Производитель", product.manufacturer],
    ["Дыхательный объем", product.specifications.vt],
    ["Эффективность фильтрации", product.specifications.filtration],
    ["Степень увлажнения", product.specifications.humidity],
    ["Сопротивление потоку", product.specifications.resistance],
    ["Мертвое пространство", product.specifications.deadSpace],
    ["Вес", product.specifications.weight],
    ["Регистрационное удостоверение", product.specifications.ru],
    ["Страна происхождения", product.specifications.country],
  ];

  return (
    <section className="rounded-3xl border bg-white p-10 shadow-sm">
      <h2 className="mb-8 text-3xl font-bold">
        Технические характеристики
      </h2>

      <div className="divide-y">
        {specs.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-8 py-4"
          >
            <span className="text-gray-500">
              {label}
            </span>

            <span className="text-right font-semibold">
              {value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}