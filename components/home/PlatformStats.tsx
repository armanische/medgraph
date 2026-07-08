import { getPlatformStats } from "@/lib/platform-stats";

export default function PlatformStats() {
  const stats = getPlatformStats();
  const items = [
    ["Устройства", stats.devices],
    ["Производители", stats.manufacturers],
    ["Опубликованные записи", stats.publishedRecords],
    ["Исследования", stats.researchItems],
  ] as const;

  return (
    <section className="border-b border-[var(--cm-rule)] bg-white">
      <div className="cm-container py-5">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--cm-rule)] bg-cm-surface-low p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cm-teal/30 hover:bg-white"
            >
              <div className="font-mono text-2xl font-bold tracking-[-0.03em] text-cm-ink">
                {value}
              </div>
              <div className="mt-1 cm-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
