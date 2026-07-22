import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import ProductDocuments from "@/components/catalog/ProductDocuments";
import ProductGallery from "@/components/catalog/ProductGallery";
import ProductManufacturer from "@/components/catalog/ProductManufacturer";
import ProductPageNavigation from "@/components/catalog/ProductPageNavigation";
import ProductSpecifications from "@/components/catalog/ProductSpecifications";
import JsonLd from "@/components/seo/JsonLd";
import SafeProductDescription from "@/components/catalog/SafeProductDescription";
import { catalogRepository, productService, storefrontDataSource } from "@/lib/storefront";
import { buildProductDetailExperience } from "@/lib/storefront/product-detail-experience";
import {
  getProductPresentation,
  PRODUCT_PRESENTATION_FALLBACKS,
} from "@/lib/storefront/product-presentation";
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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ metadata?: string | string[] }>;
}) {
  const { slug } = await params;
  const metadataMode = (await searchParams).metadata === "values" ? "values" : "labels";
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
  const experience = buildProductDetailExperience({ product, manufacturer, category });
  const technicalSpecifications = experience.specifications;
  const registrationDocument = product.documents.find(
    ({ kind }) => kind === "registration",
  );
  const registrationRecord = product.registrationRecords?.[0];
  const accessoryDocuments = experience.optionalContent.accessories;
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
    experience.advantages.length > 0 && ["advantages", "Преимущества"],
    technicalSpecifications.length > 0 && ["specifications", "Характеристики"],
    presentation.sections.package && ["package", "Комплектация"],
    presentation.sections.documents && ["documents", "Документы"],
    ["manufacturer", "Производитель"],
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
          <ProductPageNavigation />
          <div
            className="mt-3 grid overflow-hidden rounded-2xl border border-[var(--cm-rule)] bg-white shadow-[0_16px_45px_rgba(11,19,32,0.07)] md:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] lg:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]"
            data-testid="product-hero"
          >
            <div className="border-b border-[var(--cm-rule)] bg-cm-surface-low/45 p-3 sm:p-4 md:border-b-0 md:border-r">
              <ProductGallery
                media={experience.media}
                fallbackLabel={PRODUCT_PRESENTATION_FALLBACKS.media}
                productName={product.name}
              />
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
              {experience.summary && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-cm-slate">
                  {experience.summary}
                </p>
              )}

              {experience.badges.length > 0 && (
                <dl className="mt-4 flex flex-wrap gap-2" aria-label="Ключевая информация о товаре" data-metadata-mode={metadataMode}>
                  {experience.badges.map((badge) => (
                    <div
                      key={`${badge.label}:${badge.value}`}
                      className={`max-w-full rounded-lg border border-[var(--cm-rule)] px-3 ${metadataMode === "labels" ? "bg-cm-surface-low/55 py-1.5" : "bg-white py-2 shadow-[0_3px_10px_rgba(11,19,32,0.04)]"}`}
                    >
                      <dt className={metadataMode === "labels" ? "text-[9px] font-semibold uppercase tracking-[0.08em] text-cm-dim" : "sr-only"}>{badge.label}</dt>
                      <dd className={`${metadataMode === "labels" ? "mt-0.5 text-[11px]" : "text-xs"} truncate font-semibold text-cm-ink`}>
                        {badge.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-[var(--cm-rule)] py-3.5 text-xs">
                {presentation.model && (
                  <div className="rounded-md bg-cm-teal-soft px-2.5 py-1.5 font-semibold text-cm-teal">
                    <dt className="sr-only">Модель</dt>
                    <dd>{presentation.model}</dd>
                  </div>
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
            {experience.description && (
              <div className="max-w-[62rem] rounded-xl border border-[var(--cm-rule)] bg-cm-surface-low/25 p-4 sm:p-5">
                <SafeProductDescription html={experience.description} />
              </div>
            )}
          </Section>
        )}

        {experience.advantages.length > 0 && (
          <Section id="advantages" title="Преимущества">
            <ul className="grid max-w-[68rem] gap-3 text-sm text-cm-slate sm:grid-cols-2 lg:grid-cols-3">
              {experience.advantages.map((feature) => (
                <li key={feature} className="flex min-h-[4.25rem] items-center gap-3 rounded-xl border border-[var(--cm-rule)] bg-[linear-gradient(135deg,#ffffff_0%,#f4fafb_100%)] p-3.5 shadow-[0_5px_18px_rgba(11,19,32,0.025)]">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-cm-teal/15 bg-cm-teal-soft text-[12px] font-extrabold leading-none text-cm-teal" aria-hidden="true">✓</span>
                  <span className="font-semibold leading-5 text-cm-ink">{feature}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {technicalSpecifications.length > 0 && (
          <Section id="specifications" title="Технические характеристики">
            <ProductSpecifications specifications={technicalSpecifications} />
          </Section>
        )}

        {presentation.sections.package && (
        <Section id="package" title="Комплектация">
          <ProductDocuments documents={accessoryDocuments} />
        </Section>
        )}

        {presentation.sections.documents && (
          <Section id="documents" title="Документы">
            <ProductDocuments documents={experience.documents} />
          </Section>
        )}

        <Section id="manufacturer" title="Производитель">
          <ProductManufacturer manufacturer={experience.manufacturer} />
        </Section>

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
      className="my-4 scroll-mt-24 rounded-2xl border border-[var(--cm-rule)] bg-white p-5 shadow-[0_10px_32px_rgba(11,19,32,0.035)] sm:my-5 sm:p-7"
    >
      <h2 className="text-lg font-bold tracking-[-0.02em] sm:text-xl">{title}</h2>
      <div className="mt-4 sm:mt-5">{children}</div>
    </section>
  );
}
