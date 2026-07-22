import type {
  ExtractedProduct,
  NormalizedCharacteristic,
  NormalizedImage,
} from "./contracts.ts";

export function normalizeText(value: string): string {
  return value
    .normalize("NFC")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<[^>]*>/gu, " ")
    .replace(/[\t\f\v ]+/gu, " ")
    .replace(/ *\n */gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

export function normalizeLookup(value: string): string {
  return normalizeText(value).toLocaleLowerCase("ru-RU").replace(/ё/gu, "е");
}

export function normalizeUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol === "http:") url.protocol = "https:";
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid)/iu.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

export function slugify(value: string): string {
  const transliteration: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return normalizeText(value)
    .toLocaleLowerCase("ru-RU")
    .split("")
    .map((character) => transliteration[character] ?? character)
    .join("")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-{2,}/gu, "-");
}

export function normalizeBullets(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = normalizeText(raw);
    if (!value) continue;
    const key = normalizeLookup(value);
    if (!seen.has(key)) result.push(value);
    seen.add(key);
  }
  return result;
}

export function normalizeCharacteristics(
  values: ExtractedProduct["characteristicsRaw"],
  sourceId: string,
): { characteristics: NormalizedCharacteristic[]; warnings: string[] } {
  const warnings: string[] = [];
  const keys = new Map<string, string>();
  const characteristics: NormalizedCharacteristic[] = [];

  values.forEach((item, index) => {
    const displayName = normalizeText(item.label);
    const rawValue = item.value ?? "";
    const normalizedValue = normalizeText(rawValue);
    if (!displayName || !normalizedValue) {
      warnings.push(`characteristic_empty:${index}`);
      return;
    }
    const baseKey = slugify(displayName) || `characteristic-${index + 1}`;
    const previous = keys.get(baseKey);
    if (previous && previous !== normalizedValue) warnings.push(`characteristic_conflict:${baseKey}`);
    if (previous === normalizedValue) {
      warnings.push(`characteristic_duplicate:${baseKey}`);
      return;
    }
    keys.set(baseKey, normalizedValue);
    characteristics.push({
      key: baseKey,
      displayName,
      rawValue,
      normalizedValue,
      unit: null,
      sourceReference: sourceId,
      confidence: "legacy",
      requiresManualVerification: true,
      sortOrder: index * 10 + 10,
    });
  });
  return { characteristics, warnings: warnings.sort() };
}

export function normalizeImages(values: ExtractedProduct["imagesRaw"]): NormalizedImage[] {
  return values.map((image) => {
    const warnings: string[] = [];
    const rightsStatus = image.rightsStatus ?? "unknown";
    if (rightsStatus === "unknown") warnings.push("image_rights_unknown");
    if (!image.width || !image.height) warnings.push("image_dimensions_unavailable");
    return {
      sourceUrl: image.sourceUrl ? normalizeUrl(image.sourceUrl) : null,
      localSourcePath: image.localSourcePath ?? null,
      legacyFilename: image.filename,
      proposedFilename: slugify(image.filename.replace(/\.[^.]+$/u, "")) +
        (image.filename.match(/\.[^.]+$/u)?.[0].toLowerCase() ?? ""),
      roleCandidate: image.role ?? "unknown",
      width: image.width ?? null,
      height: image.height ?? null,
      mimeType: image.mimeType ?? null,
      checksum: image.checksum ?? null,
      rightsStatus,
      confidence: rightsStatus === "confirmed" ? "reviewed" : "legacy",
      warnings: warnings.sort(),
    };
  });
}
