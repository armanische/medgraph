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
    <section className="cm-card p-6">
      <div className="cm-label mb-2">Technical Record</div>
      <h2 className="mb-5 text-base font-bold">
        Технические характеристики
      </h2>

      <div className="divide-y divide-[var(--cm-rule)] border-y border-[var(--cm-rule)]">
        {specs.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-6 py-2.5 text-xs"
          >
            <span className="text-cm-slate">
              {label}
            </span>

            <span className="text-right font-mono text-[10px] font-semibold">
              {value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
