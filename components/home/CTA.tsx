import Link from "next/link";

export default function CTA() {
  return (
    <section className="border-t border-[var(--cm-rule)] bg-white">
      <div className="cm-container flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-[38rem]">
          <h2 className="text-base font-bold tracking-[-0.01em]">Не нашли нужное изделие?</h2>
          <p className="mt-2 text-[13px] leading-6 text-cm-slate">
            Опишите задачу — специалист проверит документы, параметры и доступные варианты.
          </p>
        </div>
        <Link href="/request" className="cm-button-primary shrink-0">Запросить КП</Link>
      </div>
    </section>
  );
}
