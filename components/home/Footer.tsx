import Link from "next/link";
import packageJson from "@/package.json";
import { catalogRepository } from "@/lib/storefront";

export default async function Footer() {
  const summary = await catalogRepository.getCatalogSummary();
  const updatedAt = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(summary.generatedAt));

  return (
    <footer className="bg-cm-ink text-white">
      <div className="cm-container border-b border-white/6 py-6">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="cm-label !text-white/30">Подбор оборудования</div>
            <div className="max-w-2xl text-xs leading-6 text-white/55">
              Производители, категории и технические характеристики в одном каталоге.
            </div>
          </div>
        </div>
      </div>
      <div className="cm-container grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="flex size-6 items-center justify-center rounded-md bg-white/8">
              <span className="size-1.5 rounded-full bg-white/50" />
            </span>
            CyberMedica
          </div>
          <p className="mt-3 max-w-xs text-xs leading-6 text-white/40">
            Каталог медицинского оборудования для клиник, инженеров и
            закупочных команд.
          </p>
        </div>

        <div>
          <div className="cm-label !text-white/25">Платформа</div>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-white/45">
            <Link href="/catalog" className="transition duration-200 hover:text-white">Каталог</Link>
            <Link href="/compare" className="transition duration-200 hover:text-white">Сравнение</Link>
            <Link href="/manufacturers" className="transition duration-200 hover:text-white">Производители</Link>
          </div>
        </div>

        <div>
          <div className="cm-label !text-white/25">Специалистам</div>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-white/45">
            <Link href="/request" className="transition duration-200 hover:text-white">Закупщикам</Link>
            <Link href="/request" className="transition duration-200 hover:text-white">Поставщикам</Link>
            <Link href="/request" className="transition duration-200 hover:text-white">Запросить КП</Link>
          </div>
        </div>

        <div>
          <div className="cm-label !text-white/25">Структура каталога</div>
          <p className="mt-4 text-xs leading-6 text-white/40">
            Производитель → Категория → Товар → Запрос КП.
          </p>
        </div>
      </div>
      <div>
        <div className="cm-container flex flex-col gap-2 py-4 font-mono text-[9px] text-white/25 sm:flex-row sm:justify-between">
          <span>© 2026 CyberMedica. Все права защищены.</span>
          <span>
            Version {packageJson.version} · Build preview · Данные обновлены {updatedAt}
          </span>
        </div>
      </div>
    </footer>
  );
}
