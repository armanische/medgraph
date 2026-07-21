import Image from "next/image";
import { isVerifiedLocalManufacturerLogo } from "@/lib/storefront/manufacturer-presentation";

export default function ManufacturerMark({
  logoUrl,
  name,
  size = "md",
}: {
  logoUrl: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-9",
    md: "size-11",
    lg: "size-14",
  } as const;
  const imageSizes = { sm: "36px", md: "44px", lg: "56px" } as const;

  if (isVerifiedLocalManufacturerLogo(logoUrl)) {
    return (
      <span
        className={`relative ${sizes[size]} shrink-0 overflow-hidden rounded-lg border border-[var(--cm-rule)] bg-white`}
      >
        <Image
          src={logoUrl}
          alt={`${name} — логотип`}
          fill
          sizes={imageSizes[size]}
          className="object-contain p-1"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid ${sizes[size]} shrink-0 place-items-center rounded-lg border border-[var(--cm-rule)] bg-cm-surface-low text-cm-teal`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none">
        <path
          d="M5 20V8l7-4 7 4v12M9 20v-5h6v5M8 10h1m3 0h1m3 0h1"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
