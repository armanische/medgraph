export function isVerifiedLocalManufacturerLogo(
  url: string | null | undefined,
): url is string {
  return Boolean(
    url && /^\/manufacturers\/[a-z0-9-]+\/logo\.(?:png|webp|svg)$/u.test(url),
  );
}
