"use client";

import { useRouter } from "next/navigation";

const CATALOG_RETURN_STORAGE_KEY = "cybermedica:catalog-return";
const MAX_SCROLL_RESTORE_FRAMES = 60;

interface CatalogReturnEntry {
  destination: string;
  historyLength: number;
  scrollRestoration: ScrollRestoration;
  scrollY: number;
  source: string;
}

export interface CatalogScrollRestore {
  scrollRestoration: ScrollRestoration;
  scrollY: number;
}

export function rememberCatalogReturn(destination: string) {
  if (typeof window === "undefined") return;

  const source = `${window.location.pathname}${window.location.search}`;
  if (!source.startsWith("/catalog")) return;

  const entry: CatalogReturnEntry = {
    destination,
    historyLength: window.history.length,
    scrollRestoration: window.history.scrollRestoration,
    scrollY: window.scrollY,
    source,
  };
  window.sessionStorage.setItem(CATALOG_RETURN_STORAGE_KEY, JSON.stringify(entry));
}

function readCatalogReturn(destination: string): CatalogReturnEntry | null {
  if (typeof window === "undefined") return null;
  const serialized = window.sessionStorage.getItem(CATALOG_RETURN_STORAGE_KEY);
  if (!serialized) return null;

  try {
    const entry = JSON.parse(serialized) as Partial<CatalogReturnEntry>;
    if (
      entry.destination !== destination ||
      typeof entry.historyLength !== "number" ||
      (entry.scrollRestoration !== "auto" && entry.scrollRestoration !== "manual") ||
      typeof entry.scrollY !== "number" ||
      typeof entry.source !== "string" ||
      !entry.source.startsWith("/catalog")
    ) {
      return null;
    }
    return entry as CatalogReturnEntry;
  } catch {
    return null;
  }
}

export function consumeCatalogScrollRestore(source: string): CatalogScrollRestore | null {
  if (typeof window === "undefined") return null;
  const serialized = window.sessionStorage.getItem(CATALOG_RETURN_STORAGE_KEY);
  if (!serialized) return null;

  try {
    const entry = JSON.parse(serialized) as Partial<CatalogReturnEntry>;
    if (
      entry.source !== source ||
      (entry.scrollRestoration !== "auto" && entry.scrollRestoration !== "manual") ||
      typeof entry.scrollY !== "number" ||
      entry.scrollY < 0
    ) {
      return null;
    }
    window.sessionStorage.removeItem(CATALOG_RETURN_STORAGE_KEY);
    return {
      scrollRestoration: entry.scrollRestoration,
      scrollY: entry.scrollY,
    };
  } catch {
    return null;
  }
}

function restoreCatalogScroll(entry: CatalogReturnEntry, attempt = 0) {
  window.requestAnimationFrame(() => {
    const source = `${window.location.pathname}${window.location.search}`;
    const maxScroll = document.documentElement.scrollHeight
      - document.documentElement.clientHeight;
    const routeReady = source === entry.source;
    const layoutReady = maxScroll + 1 >= entry.scrollY;

    if ((!routeReady || !layoutReady) && attempt < MAX_SCROLL_RESTORE_FRAMES) {
      restoreCatalogScroll(entry, attempt + 1);
      return;
    }

    if (routeReady) {
      window.scrollTo({ top: entry.scrollY, behavior: "auto" });
      window.sessionStorage.removeItem(CATALOG_RETURN_STORAGE_KEY);
    }
    window.history.scrollRestoration = entry.scrollRestoration;
  });
}

export default function BackToCatalog({ productSlug }: { productSlug: string }) {
  const router = useRouter();
  const destination = `/catalog/${productSlug}`;

  function goBack() {
    const entry = readCatalogReturn(destination);
    if (entry && window.history.length > entry.historyLength) {
      window.history.scrollRestoration = "manual";
      window.addEventListener(
        "popstate",
        () => restoreCatalogScroll(entry),
        { once: true },
      );
      window.history.back();
      return;
    }
    if (entry) window.history.scrollRestoration = "manual";
    router.push(entry?.source ?? "/catalog");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold text-cm-slate transition hover:bg-white hover:text-cm-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal"
      aria-label="Вернуться к каталогу"
    >
      <span aria-hidden="true">←</span>
      Назад к каталогу
    </button>
  );
}
