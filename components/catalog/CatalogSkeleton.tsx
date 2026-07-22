const SKELETON_CARDS = 8;

export default function CatalogSkeleton() {
  return (
    <main className="min-h-screen bg-cm-canvas" aria-busy="true" aria-label="Загрузка каталога">
      <header className="border-b border-[var(--cm-rule)] bg-white">
        <div className="cm-container cm-page-intro">
          <div className="h-3 w-28 animate-pulse rounded bg-cm-surface-low" />
          <div className="mt-3 h-9 max-w-xl animate-pulse rounded-lg bg-cm-surface-low" />
          <div className="mt-3 h-4 max-w-2xl animate-pulse rounded bg-cm-surface-low" />
        </div>
      </header>
      <div className="cm-container py-6">
        <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
          <div className="hidden h-64 animate-pulse rounded-xl bg-white lg:block" />
          <div className="min-w-0">
            <div className="h-12 animate-pulse rounded-xl bg-white" />
            <div className="mt-4 grid gap-3 md:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: SKELETON_CARDS }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-[var(--cm-rule)] bg-white"
                  aria-hidden="true"
                >
                  <div className="aspect-[16/6.5] animate-pulse bg-cm-surface-low" />
                  <div className="space-y-3 p-3">
                    <div className="h-3 w-2/5 animate-pulse rounded bg-cm-surface-low" />
                    <div className="h-5 animate-pulse rounded bg-cm-surface-low" />
                    <div className="h-4 w-3/5 animate-pulse rounded bg-cm-surface-low" />
                    <div className="h-8 animate-pulse rounded bg-cm-surface-low" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Каталог загружается</span>
    </main>
  );
}
