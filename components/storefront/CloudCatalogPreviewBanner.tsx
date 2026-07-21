export default function CloudCatalogPreviewBanner({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <aside
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-950"
      aria-label="Режим внутреннего предпросмотра Cloud Catalog"
      data-cloud-preview-banner
    >
      Cloud Catalog Preview — данные могут быть неполными и не опубликованы
    </aside>
  );
}
