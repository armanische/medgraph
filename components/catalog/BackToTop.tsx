"use client";

import { useEffect, useState } from "react";

const VISIBILITY_THRESHOLD = 480;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY >= VISIBILITY_THRESHOLD);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      }}
      className="fixed bottom-5 right-4 z-40 grid size-11 place-items-center rounded-full border border-[var(--cm-rule)] bg-white/95 text-lg font-bold text-cm-slate shadow-[0_10px_30px_rgba(11,19,32,0.16)] backdrop-blur transition hover:border-cm-teal hover:text-cm-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal sm:bottom-6 sm:right-6"
      aria-label="Наверх"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
