import { ReactNode } from "react";

interface TitleProps {
  children: ReactNode;
}

export default function Title({
  children,
}: TitleProps) {
  return (
    <h2 className="text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">
      {children}
    </h2>
  );
}
