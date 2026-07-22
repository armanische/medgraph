"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ProductMedia } from "@/lib/storefront/types";

export default function ProductGallery({
  media,
  fallbackLabel,
  productName,
}: {
  media: readonly ProductMedia[];
  fallbackLabel: string;
  productName: string;
}) {
  const orderedMedia = useMemo(
    () => [...media].sort((left, right) => left.position - right.position),
    [media],
  );
  const imageMedia = useMemo(
    () => orderedMedia.filter(({ type }) => type === "image"),
    [orderedMedia],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const selectedMedia = orderedMedia[selectedIndex];
  const selectedImageIndex = selectedMedia
    ? imageMedia.findIndex(({ url }) => url === selectedMedia.url)
    : -1;

  function selectImage(imageIndex: number) {
    const image = imageMedia[imageIndex];
    if (!image) return;
    const mediaIndex = orderedMedia.findIndex(({ url }) => url === image.url);
    setSelectedIndex(mediaIndex);
  }

  function showPreviousImage() {
    if (imageMedia.length < 2) return;
    selectImage((selectedImageIndex - 1 + imageMedia.length) % imageMedia.length);
  }

  function showNextImage() {
    if (imageMedia.length < 2) return;
    selectImage((selectedImageIndex + 1) % imageMedia.length);
  }

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") showPreviousImage();
      if (event.key === "ArrowRight") showNextImage();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!selectedMedia) {
    return (
      <div className="grid aspect-[4/3] min-h-56 place-items-center rounded-xl border border-dashed border-[var(--cm-rule)] bg-white/70 px-4 text-center text-xs leading-6 text-cm-slate">
        <div>
          <div className="cm-empty-icon">▧</div>
          <div className="mx-auto mt-3 max-w-sm">{fallbackLabel}.</div>
        </div>
      </div>
    );
  }

  const lightboxImage = selectedImageIndex >= 0
    ? imageMedia[selectedImageIndex]
    : null;

  return (
    <div data-testid="product-gallery">
      <div className="relative aspect-[4/3] min-h-56 overflow-hidden rounded-xl border border-[var(--cm-rule)] bg-white">
        {selectedMedia.type === "image" ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative size-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cm-teal"
            aria-label={`Увеличить изображение: ${selectedMedia.alt}`}
          >
            <Image
              src={selectedMedia.url}
              alt={selectedMedia.alt}
              fill
              preload
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-2 transition duration-300 group-hover:scale-[1.015]"
            />
            <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full border border-[var(--cm-rule)] bg-white/94 text-cm-slate shadow-[0_6px_18px_rgba(11,19,32,0.14)] backdrop-blur transition group-hover:border-cm-teal/40 group-hover:text-cm-teal" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="5.5" />
                <path d="m15 15 4 4M10.5 8v5M8 10.5h5" />
              </svg>
            </span>
          </button>
        ) : (
          <video controls className="size-full" aria-label={selectedMedia.alt}>
            <source src={selectedMedia.url} />
          </video>
        )}
      </div>

      {orderedMedia.length > 1 && (
        <div
          className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1"
          aria-label="Галерея товара"
        >
          {orderedMedia.map((item, index) => (
            <button
              key={`${item.type}:${item.url}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square w-16 shrink-0 snap-start overflow-hidden rounded-lg border bg-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal sm:w-[4.5rem] ${
                index === selectedIndex
                  ? "border-cm-teal ring-1 ring-cm-teal/25"
                  : "border-[var(--cm-rule)] hover:border-cm-teal"
              }`}
              aria-label={`Показать: ${item.alt}`}
              aria-pressed={index === selectedIndex}
            >
              {item.type === "image" ? (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="72px"
                  className="object-contain p-1"
                />
              ) : (
                <span className="grid size-full place-items-center text-[10px] font-semibold text-cm-slate">
                  Видео
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && lightboxImage && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-cm-ink/92 p-3 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Галерея: ${productName}`}
          onClick={(event) => {
            if (event.currentTarget === event.target) setLightboxOpen(false);
          }}
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const endX = event.changedTouches[0]?.clientX;
            if (touchStartX.current === null || endX === undefined) return;
            const distance = endX - touchStartX.current;
            if (Math.abs(distance) > 40) {
              if (distance > 0) showPreviousImage();
              else showNextImage();
            }
            touchStartX.current = null;
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/30 bg-black/30 text-xl text-white transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Закрыть галерею"
          >
            ×
          </button>

          {imageMedia.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/30 text-2xl text-white transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-6"
                aria-label="Предыдущее изображение"
              >
                ←
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/30 text-2xl text-white transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-6"
                aria-label="Следующее изображение"
              >
                →
              </button>
            </>
          )}

          <div className="relative h-[82vh] w-[88vw] max-w-6xl">
            <Image
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-3 left-1/2 max-w-[80vw] -translate-x-1/2 rounded-full bg-black/35 px-3 py-1.5 text-center text-[11px] text-white/90 sm:bottom-5">
            {selectedImageIndex + 1} / {imageMedia.length}
          </div>
        </div>
      )}
    </div>
  );
}
