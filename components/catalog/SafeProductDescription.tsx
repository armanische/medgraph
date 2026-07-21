import { sanitizeStorefrontHtml } from "@/lib/storefront/sanitize-html";

export default function SafeProductDescription({ html }: { html: string }) {
  const sanitized = sanitizeStorefrontHtml(html);
  return (
    <div
      className="cm-product-description max-w-[56rem] text-[15px] leading-7 text-cm-slate [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-cm-teal [&_blockquote]:pl-4 [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-cm-ink [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-cm-ink [&_li]:ml-5 [&_li]:pl-1 [&_li]:leading-7 [&_ol]:my-4 [&_ol_li]:list-decimal [&_p]:mb-4 [&_strong]:font-semibold [&_table]:my-5 [&_table]:w-full [&_td]:border [&_td]:border-[var(--cm-rule)] [&_td]:p-2.5 [&_th]:border [&_th]:border-[var(--cm-rule)] [&_th]:p-2.5 [&_ul]:my-4 [&_ul_li]:list-disc"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
