import Link from "next/link";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  target?: string;
}

export default function Button({
  children,
  href,
  variant = "primary",
  target,
}: ButtonProps) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
      : "inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold transition hover:bg-gray-50";

  if (href) {
    return (
      <Link
        href={href}
        target={target}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={className}>
      {children}
    </button>
  );
}