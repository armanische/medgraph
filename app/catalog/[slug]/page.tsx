import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { catalogRepository, productService } from "@/lib/storefront";
import type {
  Product,
  ProductDocumentKind,
  ProductSpecification,
} from "@/lib/storefront/types";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";

export async function generateStaticParams() {
  const products = await productService.getActiveProducts();
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  if (!product) notFound();

  const image = product.media.find(({ type }) => type === "image");
  return buildStorefrontMetadata({
    title: `${product.name} — медицинское оборудование`,
    description: product.shortDescription,
    canonical: `/catalog/${product.slug}`,
    image: image ? { url: image.url, alt: image.alt } : undefined,
  });
}

export default async function StorefrontProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  if (!product) notFound();

  const [manufacturers, categories, relatedProducts] = await Promise.all([
    catalogRepository.getManufacturers(),
    catalogRepository.getCategories(),
    productService.getRelatedProducts(product),
  ]);
  const manufacturer = manufacturers.find(
    ({ id }) => id === product.manufacturerId,
  );
  const category = categories.find(({ id }) => id === product.categoryId);
  const specificationGroups = groupSpecifications(product.specifications);

  return (
    <main className="min-h-screen bg-cm-canvas">
      <section className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_56%,#e8f5f7_100%)]">
        <div className="cm-container py-10">
          <div className="cm-label">
            <Link href="/catalog" className="hover:text-cm-teal">
              Каталог
            </Link>
            {" · карточка изделия"}
          </div>
          <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div>
              <Badge>{category?.name ?? "Медицинское оборудование"}</Badge>
              <h1 className="mt-4 max-w-4xl text-3xl font-extrabold tracking-[-0.03em]">
                {product.name}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-cm-slate">
                {product.shortDescription}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/request?product=${encodeURIComponent(product.name)}`}
                  className="cm-button-primary shadow-[0_12px_30px_rgba(11,19,32,0.16)]"
                >
                  Запросить КП
                </Link>
                <Link href="/catalog" className="cm-button-secondary">
                  Вернуться в каталог
                </Link>
              </div>
            </div>
            <div className="cm-card overflow-hidden bg-white/82 p-4 shadow-[0_14px_40px_rgba(11,19,32,0.06)] backdrop-blur">
              <div className="-mx-4 -mt-4 mb-4 border-b border-[var(--cm-rule)] bg-white px-4 py-3">
                <div className="cm-label !text-cm-teal">Изделие</div>
              </div>
              <dl className="space-y-3 text-xs">
                <ProductDetail label="Производитель" value={manufacturer?.name ?? "Не указан"} />
                <ProductDetail label="Модель" value={product.model} />
                <ProductDetail label="Категория" value={category?.name ?? "Не указана"} />
              </dl>
            </div>
          </div>
        </div>
      </section>

      <div className="cm-container grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-6">
          <Section title="Галерея">
            <ProductGallery product={product} />
          </Section>

          <Section title="Описание">
            <p className="text-sm leading-7 text-cm-slate">{product.description}</p>
          </Section>

          <Section title="Ключевые особенности">
            <ListEmptyWhen
              empty={product.keyFeatures.length === 0}
              message="Ключевые особенности пока не добавлены."
            >
              <ul className="grid gap-3 text-sm text-cm-slate sm:grid-cols-2">
                {product.keyFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cm-teal">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </ListEmptyWhen>
          </Section>

          <Section title="Технические характеристики">
            <ListEmptyWhen
              empty={product.specifications.length === 0}
              message="Технические характеристики пока не добавлены."
            >
              <div className="space-y-4">
                {specificationGroups.map(([group, specifications]) => (
                  <div
                    key={group}
                    className="overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white"
                  >
                    <div className="border-b border-[var(--cm-rule)] bg-cm-surface-low/65 px-4 py-3">
                      <h3 className="text-xs font-semibold">{group}</h3>
                    </div>
                    {specifications.map((specification) => (
                      <div
                        key={`${specification.label}:${specification.position}`}
                        className="grid gap-2 border-b border-[var(--cm-rule)] p-4 last:border-b-0 md:grid-cols-[14rem_1fr]"
                      >
                        <div className="cm-label">{specification.label}</div>
                        <div className="text-sm font-semibold">
                          {specification.value}
                          {specification.unit ? ` ${specification.unit}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Документы">
            <ListEmptyWhen
              empty={product.documents.length === 0}
              message="Документы пока не добавлены."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {product.documents.map((document) => (
                  <a
                    key={`${document.kind}:${document.publicUrl}`}
                    href={document.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cm-card p-4"
                  >
                    <Badge>{documentKindLabel(document.kind)}</Badge>
                    <div className="mt-3 text-sm font-semibold">
                      {document.title}
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-cm-dim">
                      {document.language}
                    </div>
                  </a>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Совместимость">
            <ListEmptyWhen
              empty={product.compatibility.length === 0}
              message="Данные о совместимости пока не добавлены."
            >
              <div className="space-y-3">
                {product.compatibility.map((item) => (
                  <div key={`${item.label}:${item.note}`} className="cm-card p-4">
                    <div className="text-sm font-semibold">{item.label}</div>
                    {item.note && (
                      <p className="mt-2 text-xs leading-6 text-cm-slate">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

          <Section title="Похожие товары">
            <ListEmptyWhen
              empty={relatedProducts.length === 0}
              message="Похожие товары пока не добавлены."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.slug}
                    href={`/catalog/${relatedProduct.slug}`}
                    className="cm-card p-4"
                  >
                    <div className="text-sm font-semibold">
                      {relatedProduct.name}
                    </div>
                    <p className="mt-2 text-xs leading-6 text-cm-slate">
                      {relatedProduct.shortDescription}
                    </p>
                    <div className="mt-3 text-xs font-semibold text-cm-teal">
                      Открыть →
                    </div>
                  </Link>
                ))}
              </div>
            </ListEmptyWhen>
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Изделие">
            <dl className="space-y-3 text-xs">
              <ProductDetail label="Название" value={product.name} />
              <ProductDetail label="Модель" value={product.model} />
              <ProductDetail label="Производитель" value={manufacturer?.name ?? "Не указан"} />
              <ProductDetail label="Категория" value={category?.name ?? "Не указана"} />
            </dl>
          </Section>

          <Section title="Области применения">
            <ListEmptyWhen
              empty={product.applicationAreas.length === 0}
              message="Области применения пока не добавлены."
              compact
            >
              <ul className="space-y-2 text-xs leading-6 text-cm-slate">
                {product.applicationAreas.map((area) => (
                  <li key={area} className="flex gap-2">
                    <span className="text-cm-teal">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </ListEmptyWhen>
          </Section>

          <Section title="Подбор оборудования">
            <p className="text-xs leading-6 text-cm-slate">
              Уточните комплектацию, доступность и условия поставки у специалиста
              CyberMedica.
            </p>
            <Link
              href={`/request?product=${encodeURIComponent(product.name)}`}
              className="cm-button-primary mt-4 w-full"
            >
              Запросить КП
            </Link>
          </Section>
        </aside>
      </div>
    </main>
  );
}

function ProductGallery({ product }: { product: Product }) {
  if (product.media.length === 0) {
    return (
      <div className="cm-empty-state px-5 py-7 text-xs leading-6 text-cm-slate">
        <div className="cm-empty-icon">▧</div>
        <div className="mx-auto mt-3 max-w-sm">
          Изображения товара пока не добавлены.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {product.media.map((media) => (
        <div
          key={`${media.type}:${media.url}`}
          className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white"
        >
          {media.type === "image" ? (
            <Image
              src={media.url}
              alt={media.alt}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-contain"
            />
          ) : (
            <video controls className="size-full" aria-label={media.alt}>
              <source src={media.url} />
            </video>
          )}
        </div>
      ))}
    </div>
  );
}

function groupSpecifications(specifications: readonly ProductSpecification[]) {
  const groups = new Map<string, ProductSpecification[]>();
  for (const specification of [...specifications].sort(
    (left, right) => left.position - right.position,
  )) {
    const group = groups.get(specification.group) ?? [];
    group.push(specification);
    groups.set(specification.group, group);
  }
  return [...groups.entries()];
}

function documentKindLabel(kind: ProductDocumentKind) {
  return kind.replaceAll("_", " ");
}

function ProductDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="cm-label">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cm-card p-5 shadow-[0_8px_30px_rgba(11,19,32,0.035)]">
      <h2 className="text-sm font-bold tracking-[-0.01em]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-[var(--cm-rule)] bg-white/80 px-2 py-1 font-mono text-[9px] font-semibold text-cm-slate">
      {children}
    </span>
  );
}

function ListEmptyWhen({
  empty,
  message,
  compact = false,
  children,
}: {
  empty: boolean;
  message: string;
  compact?: boolean;
  children: ReactNode;
}) {
  if (empty) {
    return (
      <div
        className={
          compact
            ? "text-xs leading-6 text-cm-slate"
            : "cm-empty-state px-5 py-7 text-xs leading-6 text-cm-slate"
        }
      >
        {!compact && (
          <div className="cm-empty-icon">
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7 4h7l3 3v13H7z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M14 4v4h4M9 12h6M9 16h4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
        <div className={compact ? "" : "mx-auto mt-2 max-w-sm"}>{message}</div>
      </div>
    );
  }
  return children;
}
