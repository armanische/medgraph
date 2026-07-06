export default function ProductLoading() {
  return (
    <main className="min-h-screen bg-cm-canvas" aria-busy="true" aria-label="Загрузка карточки FS510">
      <div className="cm-container py-7">
        <div className="cm-skeleton h-3 w-44 rounded" />
        <div className="mt-5 cm-card overflow-hidden">
          <div className="cm-skeleton h-10 border-b border-[var(--cm-rule)]" />
          <div className="grid lg:grid-cols-[22.5rem_1fr]">
            <div className="cm-skeleton min-h-80" />
            <div className="p-7">
              <div className="cm-skeleton h-5 w-36 rounded" />
              <div className="cm-skeleton mt-5 h-9 w-4/5 rounded" />
              <div className="cm-skeleton mt-3 h-4 w-full rounded" />
              <div className="cm-skeleton mt-2 h-4 w-2/3 rounded" />
              <div className="cm-skeleton mt-8 h-28 w-full rounded" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
