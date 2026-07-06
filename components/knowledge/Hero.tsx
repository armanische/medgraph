import Image from "next/image";

import { Product } from "@/types/product";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface HeroProps {
  product: Product;
}

export default function Hero({ product }: HeroProps) {
  return (
    <section className="cm-card grid overflow-hidden lg:grid-cols-[1fr_22rem]">
      <div className="p-6 sm:p-8">
        <Badge>{product.category}</Badge>

        <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-[-0.03em] sm:text-3xl">
          {product.name}
        </h1>

        <p className="mt-4 text-[13px] leading-7 text-cm-slate">
          {product.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button href={`/request?product=${product.slug}`}>Получить КП</Button>

          <Button
            href={
              product.documents.find((document) => document.kind === "registration")
                ?.url
            }
            target="_blank"
            variant="secondary"
          >
            Скачать РУ
          </Button>

          <Button
            href={
              product.documents.find((document) => document.kind === "manual")?.url
            }
            target="_blank"
            variant="secondary"
          >
            Инструкция
          </Button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-[var(--cm-rule)]">
          {product.highlights.map((item) => (
            <Card key={item.label} className="!rounded-none !border-0 p-4">
              <div className="font-mono text-lg font-bold text-cm-teal">
                {item.value}
              </div>

              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-cm-dim">
                {item.label}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex min-h-80 items-center border-t border-[var(--cm-rule)] bg-[radial-gradient(ellipse_at_center,#c8e8f0_0%,#dcf0f5_38%,#f4f7fa_72%)] p-8 lg:border-l lg:border-t-0">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={900}
          height={900}
          className="max-h-72 w-full object-contain mix-blend-multiply drop-shadow-[0_16px_28px_rgba(11,19,32,0.14)]"
          priority
        />
      </div>
    </section>
  );
}
