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
      ? "cm-button-primary"
      : "cm-button-secondary";

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
