"use client";

import { useRouter } from "next/navigation";

export default function BackToCatalogButton() {
  const router = useRouter();

  function returnToCatalog() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/catalog");
  }

  return (
    <button
      type="button"
      onClick={returnToCatalog}
      className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold text-cm-slate transition hover:text-cm-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal"
      aria-label="Вернуться к каталогу с сохранением позиции"
    >
      <span aria-hidden="true">←</span>
      Назад к каталогу
    </button>
  );
}
