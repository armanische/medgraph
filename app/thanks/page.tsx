import Link from "next/link";

export default function ThanksPage() {
  return (
    <main className="min-h-[70vh] bg-cm-canvas">
      <section className="cm-container py-16">
        <div className="mx-auto max-w-xl cm-card p-8 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-[var(--cm-verified-border)] bg-cm-verified-soft text-cm-verified">
            ✓
          </div>
          <div className="cm-label mt-5 !text-cm-verified">Запрос зарегистрирован</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.025em]">
            Запрос принят
          </h1>

          <p className="mt-3 text-[13px] leading-6 text-cm-slate">
            Мы получили заявку. Менеджер свяжется с вами для подготовки коммерческого предложения.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link href="/" className="cm-button-primary">
              На главную
            </Link>

            <Link href="/catalog" className="cm-button-secondary">
              В каталог
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
