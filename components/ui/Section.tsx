import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
}

export default function Section({
  children,
}: SectionProps) {
  return (
    <section className="py-14 sm:py-16">
      {children}
    </section>
  );
}
