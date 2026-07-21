const COUNTRY_NAMES_RU: Readonly<Record<string, string>> = {
  AT: "Австрия",
  AU: "Австралия",
  BE: "Бельгия",
  CA: "Канада",
  CH: "Швейцария",
  CN: "Китай",
  DE: "Германия",
  DK: "Дания",
  FI: "Финляндия",
  FR: "Франция",
  GB: "Великобритания",
  IE: "Ирландия",
  IT: "Италия",
  JP: "Япония",
  KR: "Республика Корея",
  NL: "Нидерланды",
  RU: "Россия",
  SE: "Швеция",
  US: "США",
};

/**
 * Converts canonical ISO alpha-2 values to public Russian labels.
 * Unknown code-shaped values are intentionally hidden instead of leaking
 * internal master-data codes into the Storefront.
 */
export function formatCountryForPublic(
  country: string | null | undefined,
): string | null {
  const value = country?.trim();
  if (!value) return null;

  if (/^[A-Za-z]{2}$/u.test(value)) {
    return COUNTRY_NAMES_RU[value.toUpperCase()] ?? null;
  }

  return value;
}
