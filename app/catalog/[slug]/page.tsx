import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import JsonLd from "@/components/seo/JsonLd";
import SafeProductDescription from "@/components/catalog/SafeProductDescription";
import { catalogRepository, productService, storefrontDataSource } from "@/lib/storefront";
import {
  getProductPresentation,
  PRODUCT_PRESENTATION_FALLBACKS,
} from "@/lib/storefront/product-presentation";
import type {
  Product,
  ProductDocument,
  ProductDocumentKind,
  ProductSpecification,
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
  const presentation = getProductPresentation(product);
  return buildStorefrontMetadata({
    title: `${product.name} — медицинское оборудование`,
    description: presentation.shortDescription ?? `${product.name} в каталоге медицинского оборудования CyberMedica.`,
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
  const presentation = getProductPresentation(product, {
    categoryName: category?.name,
    country: manufacturer?.country,
    manufacturerName: manufacturer?.name,
  });
  const technicalSpecifications = product.specifications.filter(isTechnicalSpecification);
  const specificationGroups = groupSpecifications(technicalSpecifications);
  const registrationDocument = product.documents.find(
    ({ kind }) => kind === "registration",
  );
  const registrationRecord = product.registrationRecords?.[0];
  const accessoryDocuments = product.documents.filter(
    ({ kind }) => kind === "accessories",
  );
  const relatedProductsById = new Map(
    relatedProducts.map((relatedProduct) => [relatedProduct.id, relatedProduct]),
  );
  const registration = registrationDocument
    ? {
        href: registrationDocument.publicUrl,
        value: registrationRecord?.number || "Открыть документ",
      }
    : registrationRecord?.number
      ? { href: registrationRecord.sourceUrl, value: registrationRecord.number }
      : null;
  const sectionLinks = [
    presentation.sections.description && ["description", "Описание"],
    presentation.sections.advantages && ["advantages", "Преимущества"],
    technicalSpecifications.length > 0 && ["specifications", "Характеристики"],
    presentation.sections.package && ["package", "Комплектация"],
    presentation.sections.documents && ["documents", "Документы"],
    (presentation.sections.compatibility || presentation.sections.relatedProducts) && [
      "related-products",
      "Связанные товары",
    ],
  ].filter((entry): entry is [string, string] => Boolean(entry));

  return (
    <main className="min-h-screen bg-cm-canvas">
      {storefrontDataSource !== "cloud_preview" && (
        <JsonLd data={buildProductStructuredData({ product, manufacturer, category })} />
      )}
      <section className="border-b border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f6fafc_56%,#e8f5f7_100%)]">
        <div className="cm-container py-4 sm:py-5">
          <div className="cm-label">
            <Link href="/catalog" className="hover:text-cm-teal">
              Каталог
            </Link>
            {" · карточка товара"}
          </div>
          <div
            className="mt-3 grid overflow-hidden rounded-2xl border border-[var(--cm-rule)] bg-white shadow-[0_16px_45px_rgba(11,19,32,0.07)] md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]"
            data-testid="product-hero"
          >
            <div className="border-b border-[var(--cm-rule)] bg-cm-surface-low/45 p-3 sm:p-4 md:border-b-0 md:border-r">
              <ProductGallery product={product} />
            </div>

            <div className="flex flex-col p-4 sm:p-5 lg:p-6">
              {presentation.state === "information_incomplete" && (
                <div className="mb-3 w-fit rounded-full border border-cm-coral/25 bg-cm-coral/8 px-3 py-1.5 text-[11px] font-semibold text-cm-ink">
                  {presentation.statusLabel}
                </div>
              )}
              <h1 className="max-w-4xl text-[1.65rem] font-extrabold leading-[1.12] tracking-[-0.03em] sm:text-[2rem] lg:text-[2.25rem]">
                {product.name}
              </h1>
              {presentation.shortDescription && (
                <p className="mt-3 line-clamp-4 max-w-3xl text-[13px] leading-6 text-cm-slate">
                  {presentation.shortDescription}
                </p>
              )}

              <dl className="mt-4 grid gap-x-6 gap-y-3 border-y border-[var(--cm-rule)] py-3.5 text-xs sm:grid-cols-2">
                {manufacturer && presentation.manufacturer ? (
                  <ProductDetailLink
                    label="Производитель"
                    value={presentation.manufacturer}
                    href={`/manufacturers/${manufacturer.slug}`}
                  />
                ) : null}
                {presentation.model && (
                  <ProductDetail label="Модель / артикул" value={presentation.model} />
                )}
                {presentation.country && (
                  <ProductDetail label="Страна производства" value={presentation.country} />
                )}
                {presentation.category && (
                  <ProductDetail label="Категория" value={presentation.category} />
                )}
                {registration && (
                  <ProductDetailLinkOrText
                    label="Регистрационное удостоверение"
                    value={registration.value}
                    href={registration.href}
                  />
                )}
              </dl>

              {presentation.canRequestQuote ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/request?product=${encodeURIComponent(product.name)}`}
                    className="cm-button-primary shadow-[0_12px_30px_rgba(11,19,32,0.16)]"
                  >
                    Запросить КП
                  </Link>
                  {presentation.canCompare && storefrontDataSource !== "cloud_preview" ? (
                  <Link
                    href="/compare"
                    className="cm-button-secondary"
                    aria-label={`Открыть сравнение для ${product.name}`}
                  >
                    Открыть сравнение
                  </Link>
                  ) : null}
                </div>
              ) : null}

              {sectionLinks.length > 1 && (
                <nav
                  aria-label="Разделы карточки товара"
                  className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-semibold text-cm-slate"
                >
                  {sectionLinks.map(([id, label]) => (
                    <a key={id} href={`#${id}`} className="rounded-sm hover:text-cm-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal">
                      {label}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="cm-container py-2 sm:py-3">
        {presentation.sections.description && (
          <Section id="description" title="Описание">
            {presentation.description && <SafeProductDescription html={presentation.description} />}
            {product.applicationAreas.length > 0 && (
              <div className="mt-6 max-w-[56rem] border-t border-[var(--cm-rule)] pt-4">
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
        )}

        {presentation.sections.advantages && (
          <Section id="advantages" title="Преимущества">
            <ul className="grid max-w-[64rem] gap-x-8 gap-y-3 text-sm leading-6 text-cm-slate sm:grid-cols-2">
              {product.keyFeatures.map((feature) => (
                <li key={feature} className="flex gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cm-teal" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {technicalSpecifications.length > 0 && (
          <Section id="specifications" title="Технические характеристики">
              <div className="max-w-[64rem] overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white">
                {specificationGroups.map(([group, specifications]) => (
                  <div key={group}>
                    <h3 className="border-y border-[var(--cm-rule)] bg-cm-surface-low/65 px-4 py-2 text-xs font-semibold first:border-t-0">
                      {group}
                    </h3>
                    {specifications.map((specification) => (
                      <div
                        key={`${specification.label}:${specification.position}`}
                        className="grid gap-1 border-b border-[var(--cm-rule)] px-4 py-2.5 last:border-b-0 sm:grid-cols-[minmax(12rem,0.8fr)_1.2fr] sm:items-center"
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
          </Section>
        )}

        {presentation.sections.package && (
        <Section id="package" title="Комплектация">
              <div className="max-w-[64rem] space-y-2">
                {accessoryDocuments.map((document) => (
                  <DocumentLink key={document.publicUrl} document={document} />
                ))}
              </div>
        </Section>
        )}

        {presentation.sections.documents && (
          <Section id="documents" title="Документы">
              <div className="grid max-w-[64rem] gap-3 md:grid-cols-2">
                {product.documents.map((document) => (
                  <DocumentLink
                    key={`${document.kind}:${document.publicUrl}`}
                    document={document}
                  />
                ))}
              </div>
          </Section>
        )}

        {(presentation.sections.compatibility || presentation.sections.relatedProducts) && (
        <Section id="related-products" title="Связанные товары">
          <div className="grid max-w-[64rem] gap-5 lg:grid-cols-2">
            {presentation.sections.compatibility && (
            <div>
              <h3 className="cm-label">Совместимость</h3>
              <div className="mt-3">
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
              </div>
            </div>
            )}
            {presentation.sections.relatedProducts && (
            <div>
              <h3 className="cm-label">Товары</h3>
              <div className="mt-3">
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
                    {presentation.canCompare && (
                      <div className="mt-3 border-t border-[var(--cm-rule)] pt-3">
                      <Link
                        href="/compare"
                        className="text-xs font-semibold text-cm-slate hover:text-cm-teal"
                      >
                        Сравнить товары →
                      </Link>
                      </div>
                    )}
                  </article>
                ))}
              </div>
              </div>
            </div>
            )}
          </div>
        </Section>
        )}
      </div>
    </main>
  );
}

function ProductGallery({ product }: { product: Product }) {
  if (product.media.length === 0) {
    return (
      <div className="grid aspect-[4/3] min-h-56 place-items-center rounded-xl border border-dashed border-[var(--cm-rule)] bg-white/70 px-4 text-center text-xs leading-6 text-cm-slate">
        <div>
        <div className="cm-empty-icon">▧</div>
        <div className="mx-auto mt-3 max-w-sm">
          {PRODUCT_PRESENTATION_FALLBACKS.media}.
        </div>
        </div>
      </div>
    );
  }

  const [primaryMedia, ...secondaryMedia] = [...product.media].sort(
    (left, right) => left.position - right.position,
  );

  return (
    <div>
      <div className="relative aspect-[4/3] min-h-56 overflow-hidden rounded-xl border border-[var(--cm-rule)] bg-white">
        {primaryMedia.type === "image" ? (
          <Image
            src={primaryMedia.url}
            alt={primaryMedia.alt}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-contain p-1"
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
      className="block rounded-lg border border-[var(--cm-rule)] bg-white p-3.5 transition hover:border-cm-teal hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-teal"
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

const PRODUCT_METADATA_SPECIFICATION_LABELS = new Set([
  "артикул",
  "категория",
  "модель",
  "производитель",
  "регистрационное удостоверение",
  "страна производства",
  "тип товара",
]);

function isTechnicalSpecification(specification: ProductSpecification) {
  const normalizedLabel = specification.label
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/\s+/gu, " ");
  return !PRODUCT_METADATA_SPECIFICATION_LABELS.has(normalizedLabel);
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

function ProductDetailLinkOrText({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string | null;
}) {
  return href
    ? <ProductDetailLink label={label} value={value} href={href} external />
    : <ProductDetail label={label} value={value} />;
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
      className="scroll-mt-24 border-b border-[var(--cm-rule)] py-6 sm:py-8"
    >
      <h2 className="text-lg font-bold tracking-[-0.02em] sm:text-xl">{title}</h2>
      <div className="mt-4 sm:mt-5">{children}</div>
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
