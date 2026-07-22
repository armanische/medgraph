"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProductPageNavigation() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setShowScrollTop(window.scrollY > 560);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <>
      <nav aria-label="Навигация по каталогу">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 rounded-lg px-1 py-2 text-xs font-semibold text-cm-slate transition hover:text-cm-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal"
        >
          <span aria-hidden="true">←</span>
          Назад к каталогу
        </Link>
      </nav>
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-40 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--cm-rule)] bg-white/95 px-4 text-xs font-bold text-cm-ink shadow-[0_12px_35px_rgba(11,19,32,0.18)] backdrop-blur transition hover:-translate-y-0.5 hover:border-cm-teal hover:text-cm-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal"
          aria-label="Наверх"
        >
          <span aria-hidden="true">↑</span>
          Наверх
        </button>
      )}
    </>
  );
}
