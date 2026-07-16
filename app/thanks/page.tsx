import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Заявка принята",
  description:
    "CyberMedica получила заявку и подготовит ответ по изделию, документам или коммерческому предложению.",
  alternates: {
    canonical: "/thanks",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThanksPage() {
  return (
    <main className="min-h-[70vh] bg-cm-canvas">
      <section className="cm-container py-16">
        <div className="mx-auto max-w-2xl cm-card p-8 text-center sm:p-10">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-[var(--cm-verified-border)] bg-cm-verified-soft text-cm-verified">
            ✓
          </div>
          <div className="cm-label mt-5 !text-cm-verified">Заявка зарегистрирована</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.025em]">
            Спасибо, заявка принята
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-[13px] leading-7 text-cm-slate">
            Мы получили запрос. Специалист уточнит задачу, проверит документы и
            подготовит ответ по изделию, аналогам или коммерческому предложению.
          </p>

          <div className="mx-auto mt-7 grid max-w-lg gap-2 text-left text-xs text-cm-slate sm:grid-cols-3">
            {["Проверим параметры", "Сопоставим документы", "Вернёмся с ответом"].map((item) => (
              <div key={item} className="rounded-md border border-[var(--cm-rule)] bg-cm-surface-low/70 p-3">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Link href="/catalog" className="cm-button-secondary">
              Каталог
            </Link>
            <Link href="/knowledge/fs510" className="cm-button-secondary">
              База знаний
            </Link>
            <Link href="/" className="cm-button-primary">
              Главная
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
