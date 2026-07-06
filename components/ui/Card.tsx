import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`cm-card p-6 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
