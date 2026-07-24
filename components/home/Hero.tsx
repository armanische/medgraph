import Image from "next/image";
import Link from "next/link";

import Search from "@/components/home/Search";
import type { Product } from "@/lib/storefront/types";

export default function Hero({ products }: { products: readonly Product[] }) {
  const equipmentImages = products.flatMap((product) => {
    const image = product.media.find(({ type }) => type === "image");
    return image ? [{ id: product.id, url: image.url }] : [];
  }).slice(0, 2);

  return (
    <section
      aria-labelledby="homepage-title"
      className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_58%,#e8f5f7_100%)]"
    >
      <div className="cm-container py-10 sm:py-14 lg:py-16">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-8">
          <div className="max-w-[56rem]">
            <h1
              id="homepage-title"
              className="cm-balanced max-w-[52rem] text-[2.125rem] font-extrabold leading-[1.08] tracking-[-0.035em] text-cm-ink sm:text-[2.5rem] lg:text-5xl"
            >
              Медицинское оборудование для клиник и медицинских организаций
            </h1>
            <p className="mt-4 max-w-[44rem] text-[15px] leading-6 text-cm-slate sm:text-base sm:leading-7">
              Найдите оборудование по названию, модели, производителю или категории
              и перейдите к карточке с доступными характеристиками и документами.
            </p>

            <Search />

            <div className="mt-4">
              <Link href="/catalog" className="cm-button-secondary !min-h-[44px] w-full sm:w-auto">
                Перейти в каталог
              </Link>
            </div>
          </div>
          {equipmentImages.length > 0 && (
            <div
              aria-hidden="true"
              className="relative mx-auto h-24 w-full max-w-[30rem] sm:h-32 lg:mx-0 lg:h-[12.5rem] lg:max-w-none"
            >
              {equipmentImages.map((image, index) => (
                <div
                  key={image.id}
                  className={
                    index === 0
                      ? "absolute bottom-0 left-1/2 h-full w-[72%] -translate-x-1/2 sm:left-[7%] sm:w-[56%] sm:translate-x-0 lg:left-0 lg:w-[68%]"
                      : "absolute bottom-[2%] right-0 hidden h-[72%] w-[52%] sm:block lg:bottom-[4%] lg:w-[58%]"
                  }
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="(max-width: 639px) 72vw, (max-width: 1023px) 30vw, 12rem"
                    className="object-contain drop-shadow-[0_14px_18px_rgba(26,92,103,0.18)]"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
