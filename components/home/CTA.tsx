import Link from "next/link";

export default function CTA() {
  return (
    <section className="border-t border-[var(--cm-rule)] bg-white">
      <div className="cm-container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-bold">Не нашли нужное изделие?</h2>
          <p className="mt-1 text-[13px] text-cm-slate">
            Опишите задачу — специалист проверит документы, параметры и доступные варианты.
          </p>
        </div>
        <Link href="/request" className="cm-button-primary shrink-0">Запросить КП</Link>
      </div>
    </section>
  );
}
