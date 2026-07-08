import Link from "next/link";

const categories = [
  ["Анестезиология и реанимация", "Контуры, фильтры, маски, трубки, аспирация, ИВЛ.", "30+ групп"],
  ["Гибкая эндоскопия", "Эндоскопы, расходники, принадлежности и совместимость.", "20+ групп"],
  ["Неонатология", "Оборудование и расходные материалы для новорождённых.", "15+ групп"],
  ["Операционный блок", "Светильники, столы, коагуляторы, аспираторы.", "25+ групп"],
];

export default function Categories() {
  return (
    <section className="border-y border-[var(--cm-rule)] bg-white py-16">
      <div className="cm-container">
        <div className="flex items-end justify-between gap-5">
          <div>
            <div className="cm-label">Классификация</div>
            <h2 className="mt-2 text-[1.35rem] font-extrabold tracking-[-0.018em]">Категории изделий</h2>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-cm-teal transition hover:text-cm-teal-dark">Весь каталог →</Link>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(([title, description, count], index) => (
            <Link
              href="/catalog"
              key={title}
              className="cm-card group p-5"
            >
              <div className="flex size-8 items-center justify-center rounded-md border border-cm-teal/15 bg-cm-teal-soft font-mono text-[10px] font-bold text-cm-teal">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-4 text-[13px] font-bold leading-5 tracking-[-0.01em]">{title}</h3>
              <p className="mt-2 max-w-[16rem] text-[11px] leading-5 text-cm-slate">{description}</p>
              <div className="mt-4 font-mono text-[9px] text-cm-dim">{count}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
