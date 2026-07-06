import "./globals.css";

import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "CyberMedica",
  description: "Платформа доказательных данных о медицинских изделиях",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="bg-cm-canvas text-cm-ink antialiased">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
