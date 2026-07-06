import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-cm-ink text-white">
      <div className="cm-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="flex size-6 items-center justify-center rounded-md bg-white/8">
              <span className="size-1.5 rounded-full bg-white/50" />
            </span>
            CyberMedica
          </div>
          <p className="mt-3 max-w-xs text-xs leading-6 text-white/40">
            Платформа доказательных данных о медицинских изделиях. Каждый
            опубликованный факт прослеживается до источника.
          </p>
        </div>

        <div>
          <div className="cm-label !text-white/25">Платформа</div>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-white/45">
            <Link href="/catalog" className="hover:text-white">Каталог</Link>
            <Link href="/products/fs510" className="hover:text-white">База знаний</Link>
            <Link href="/manufacturers" className="hover:text-white">Производители</Link>
          </div>
        </div>

        <div>
          <div className="cm-label !text-white/25">Специалистам</div>
          <div className="mt-4 flex flex-col gap-2.5 text-xs text-white/45">
            <Link href="/request" className="hover:text-white">Закупщикам</Link>
            <Link href="/request" className="hover:text-white">Поставщикам</Link>
            <Link href="/request" className="hover:text-white">Запросить КП</Link>
          </div>
        </div>

        <div>
          <div className="cm-label !text-white/25">Принцип данных</div>
          <p className="mt-4 text-xs leading-6 text-white/40">
            Источник → Документ → Доказательство → Проверка → Публикация.
          </p>
        </div>
      </div>
      <div className="border-t border-white/6">
        <div className="cm-container flex flex-col gap-2 py-4 font-mono text-[9px] text-white/25 sm:flex-row sm:justify-between">
          <span>© 2026 CyberMedica. Все права защищены.</span>
          <span>Актуальность сведений проверяйте по первичным источникам.</span>
        </div>
      </div>
    </footer>
  );
}
