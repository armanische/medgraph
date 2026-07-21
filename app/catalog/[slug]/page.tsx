import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import JsonLd from "@/components/seo/JsonLd";
import { catalogRepository, productService } from "@/lib/storefront";
import type {
  Product,
  ProductDocument,
  ProductDocumentKind,
  ProductSpecification,
  ProductStatus,
} from "@/lib/storefront/types";
import { buildStorefrontMetadata } from "@/lib/storefront/seo";
import { buildProductStructuredData } from "@/lib/storefront/structured-data";

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
  const registrationDocument = product.documents.find(
    ({ kind }) => kind === "registration",
  );
  const accessoryDocuments = product.documents.filter(
    ({ kind }) => kind === "accessories",
  );
  const relatedProductsById = new Map(
    relatedProducts.map((relatedProduct) => [relatedProduct.id, relatedProduct]),
  );

  return (
    <main className="min-h-screen bg-cm-canvas">
      <JsonLd
        data={buildProductStructuredData({ product, manufacturer, category })}
      />
      <section className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_56%,#e8f5f7_100%)]">
        <div className="cm-container py-5">
          <div className="cm-label">
            <Link href="/catalog" className="hover:text-cm-teal">
              Каталог
            </Link>
            {" · карточка товара"}
          </div>
          <div
            className="mt-4 grid overflow-hidden rounded-2xl border border-[var(--cm-rule)] bg-white shadow-[0_18px_55px_rgba(11,19,32,0.08)] lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
            data-testid="product-hero"
          >
            <div className="border-b border-[var(--cm-rule)] bg-cm-surface-low/55 p-3 sm:p-4 lg:border-b-0 lg:border-r lg:p-5">
              <ProductGallery product={product} />
            </div>

            <div className="flex flex-col p-4 sm:p-6 lg:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{category?.name ?? "Медицинское оборудование"}</Badge>
                <StatusBadge status={product.status} />
              </div>
              <h1 className="mt-3 max-w-4xl text-[1.75rem] font-extrabold leading-tight tracking-[-0.035em] sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-cm-slate">
                {product.shortDescription}
              </p>

              <dl className="mt-4 grid gap-x-6 gap-y-3 border-y border-[var(--cm-rule)] py-4 text-xs sm:grid-cols-2">
                {manufacturer ? (
                  <ProductDetailLink
                    label="Производитель"
                    value={manufacturer.name}
                    href={`/manufacturers/${manufacturer.slug}`}
                  />
                ) : (
                  <ProductDetail label="Производитель" value="Не указан" />
                )}
                <ProductDetail
                  label="Страна"
                  value={manufacturer?.country || "Не указана"}
                />
                <ProductDetail
                  label="Категория"
                  value={category?.name ?? "Не указана"}
                />
                <ProductDetail label="Модель / артикул" value={product.model} />
                {registrationDocument ? (
                  <ProductDetailLink
                    label="Регистрационное удостоверение"
                    value="Открыть документ"
                    href={registrationDocument.publicUrl}
                    external
                  />
                ) : (
                  <ProductDetail
                    label="Регистрационное удостоверение"
                    value="Не добавлено"
                  />
                )}
                <ProductDetail
                  label="Статус"
                  value={productStatusLabel(product.status)}
                />
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/request?product=${encodeURIComponent(product.name)}`}
                  className="cm-button-primary shadow-[0_12px_30px_rgba(11,19,32,0.16)]"
                >
                  Запросить КП
                </Link>
                <Link
                  href="/compare"
                  className="cm-button-secondary"
                  aria-label={`Открыть сравнение для ${product.name}`}
                >
                  Открыть сравнение
                </Link>
              </div>

              <nav
                aria-label="Быстрые ссылки по карточке товара"
                className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-cm-slate"
              >
                <a href="#description" className="hover:text-cm-teal">
                  Описание
                </a>
                <a href="#advantages" className="hover:text-cm-teal">
                  Преимущества
                </a>
                <a href="#specifications" className="hover:text-cm-teal">
                  Характеристики
                </a>
                <a href="#documents" className="hover:text-cm-teal">
                  Документы
                </a>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <div className="cm-container space-y-4 py-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Section id="description" title="Описание">
            <p className="text-sm leading-7 text-cm-slate">{product.description}</p>
            {product.applicationAreas.length > 0 && (
              <div className="mt-5 border-t border-[var(--cm-rule)] pt-4">
                <h3 className="cm-label">Области применения</h3>
                <ul className="mt-3 flex flex-wrap gap-2 text-xs text-cm-slate">
                  {product.applicationAreas.map((area) => (
                    <li
                      key={area}
                      className="rounded-full border border-[var(--cm-rule)] bg-cm-surface-low/55 px-3 py-1.5"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section id="advantages" title="Преимущества">
            <ListEmptyWhen
              empty={product.keyFeatures.length === 0}
              message="Преимущества пока не добавлены."
              compact
            >
              <ul className="grid gap-2 text-sm text-cm-slate sm:grid-cols-2">
                {product.keyFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cm-teal">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </ListEmptyWhen>
          </Section>
        </div>

          <Section id="specifications" title="Технические характеристики">
            <ListEmptyWhen
              empty={product.specifications.length === 0}
              message="Технические характеристики пока не добавлены."
            >
              <div className="overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white">
                {specificationGroups.map(([group, specifications]) => (
                  <div key={group}>
                    <h3 className="border-y border-[var(--cm-rule)] bg-cm-surface-low/65 px-4 py-2 text-xs font-semibold first:border-t-0">
                      {group}
                    </h3>
                    {specifications.map((specification) => (
                      <div
                        key={`${specification.label}:${specification.position}`}
                        className="grid gap-1 border-b border-[var(--cm-rule)] px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(12rem,0.8fr)_1.2fr] sm:items-center"
                      >
                        <div className="text-xs text-cm-slate">{specification.label}</div>
                        <div className="text-sm font-semibold sm:text-right">
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

        <Section id="package" title="Комплектация">
            <ListEmptyWhen
              empty={accessoryDocuments.length === 0}
              message="Состав комплектации зависит от выбранной конфигурации. Уточните его в коммерческом предложении."
              compact
            >
              <div className="space-y-2">
                {accessoryDocuments.map((document) => (
                  <DocumentLink key={document.publicUrl} document={document} />
                ))}
              </div>
            </ListEmptyWhen>
            <Link
              href={`/request?product=${encodeURIComponent(product.name)}`}
              className="mt-4 inline-flex text-xs font-semibold text-cm-teal hover:underline"
            >
              Уточнить комплектацию →
            </Link>
        </Section>

          <Section id="documents" title="Документы">
            <ListEmptyWhen
              empty={product.documents.length === 0}
              message="Документы пока не добавлены."
            >
              <div className="grid gap-3 md:grid-cols-2">
                {product.documents.map((document) => (
                  <DocumentLink
                    key={`${document.kind}:${document.publicUrl}`}
                    document={document}
                  />
                ))}
              </div>
            </ListEmptyWhen>
          </Section>

        <Section id="related-products" title="Связанные товары">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="cm-label">Совместимость</h3>
              <div className="mt-3">
                <ListEmptyWhen
                  empty={product.compatibility.length === 0}
                  message="Данные о совместимости пока не добавлены."
                  compact
                >
                  <div className="space-y-3">
                    {product.compatibility.map((item) => {
                      const compatibleProduct = item.compatibleProductId
                        ? relatedProductsById.get(item.compatibleProductId)
                        : undefined;
                      return (
                        <div
                          key={`${item.label}:${item.note}`}
                          className="rounded-lg border border-[var(--cm-rule)] bg-white p-4"
                        >
                          {compatibleProduct ? (
                            <Link
                              href={`/catalog/${compatibleProduct.slug}`}
                              className="text-sm font-semibold text-cm-teal hover:underline"
                            >
                              {item.label} →
                            </Link>
                          ) : (
                            <div className="text-sm font-semibold">{item.label}</div>
                          )}
                          {item.note && (
                            <p className="mt-2 text-xs leading-6 text-cm-slate">
                              {item.note}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ListEmptyWhen>
              </div>
            </div>
            <div>
              <h3 className="cm-label">Товары</h3>
              <div className="mt-3">
            <ListEmptyWhen
              empty={relatedProducts.length === 0}
              message="Связанные товары пока не добавлены."
              compact
            >
              <div className="grid gap-3">
                {relatedProducts.map((relatedProduct) => (
                  <article
                    key={relatedProduct.slug}
                    className="cm-card p-4"
                  >
                    <Link
                      href={`/catalog/${relatedProduct.slug}`}
                      className="text-sm font-semibold hover:text-cm-teal"
                    >
                      {relatedProduct.name}
                    </Link>
                    <p className="mt-2 text-xs leading-6 text-cm-slate">
                      {relatedProduct.shortDescription}
                    </p>
                    <div className="mt-3 text-xs font-semibold text-cm-teal">
                      Открыть →
                    </div>
                    <div className="mt-3 border-t border-[var(--cm-rule)] pt-3">
                      <Link
                        href="/compare"
                        className="text-xs font-semibold text-cm-slate hover:text-cm-teal"
                      >
                        Сравнить товары →
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </ListEmptyWhen>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}

function ProductGallery({ product }: { product: Product }) {
  if (product.media.length === 0) {
    return (
      <div className="cm-empty-state px-4 py-5 text-xs leading-6 text-cm-slate">
        <div className="cm-empty-icon">▧</div>
        <div className="mx-auto mt-3 max-w-sm">
          Изображения товара пока не добавлены.
        </div>
      </div>
    );
  }

  const [primaryMedia, ...secondaryMedia] = [...product.media].sort(
    (left, right) => left.position - right.position,
  );

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--cm-rule)] bg-white">
        {primaryMedia.type === "image" ? (
          <Image
            src={primaryMedia.url}
            alt={primaryMedia.alt}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-contain p-2"
          />
        ) : (
          <video controls className="size-full" aria-label={primaryMedia.alt}>
            <source src={primaryMedia.url} />
          </video>
        )}
      </div>
      {secondaryMedia.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2" aria-label="Галерея товара">
          {secondaryMedia.map((media) => (
            <a
              key={`${media.type}:${media.url}`}
              href={media.url}
              target="_blank"
              rel="noreferrer"
              className="relative aspect-square overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white transition hover:border-cm-teal"
              aria-label={`Открыть: ${media.alt}`}
            >
              {media.type === "image" ? (
                <Image
                  src={media.url}
                  alt={media.alt}
                  fill
                  sizes="10vw"
                  className="object-contain p-1"
                />
              ) : (
                <span className="grid size-full place-items-center text-xs text-cm-slate">
                  Видео
                </span>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentLink({ document }: { document: ProductDocument }) {
  return (
    <a
      href={document.publicUrl}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-[var(--cm-rule)] bg-white p-4 transition hover:border-cm-teal hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{document.title}</div>
          <div className="mt-2 font-mono text-[10px] text-cm-dim">
            {document.language}
          </div>
        </div>
        <Badge>{documentKindLabel(document.kind)}</Badge>
      </div>
    </a>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className="rounded-full border border-cm-teal/25 bg-cm-teal/10 px-2.5 py-1 text-[10px] font-semibold text-cm-teal">
      {productStatusLabel(status)}
    </span>
  );
}

function productStatusLabel(status: ProductStatus) {
  const labels: Partial<Record<ProductStatus, string>> = {
    active: "В каталоге",
    on_request: "Под заказ",
    discontinued: "Снято с производства",
    hidden: "Скрыто",
  };
  return labels[status] ?? "Предпросмотр";
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

function ProductDetailLink({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <div>
      <dt className="cm-label">{label}</dt>
      <dd className="mt-1 font-semibold">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-cm-teal hover:underline"
          >
            {value} →
          </a>
        ) : (
          <Link href={href} className="text-cm-teal hover:underline">
            {value} →
          </Link>
        )}
      </dd>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="cm-card scroll-mt-24 p-4 shadow-[0_8px_30px_rgba(11,19,32,0.035)] sm:p-5"
    >
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
        data-optional-empty={compact ? "compact" : undefined}
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
