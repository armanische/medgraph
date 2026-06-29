import { ReactNode } from "react";

interface TitleProps {
  children: ReactNode;
}

export default function Title({
  children,
}: TitleProps) {
  return (
    <h2 className="text-4xl font-bold tracking-tight">
      {children}
    </h2>
  );
}