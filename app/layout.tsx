import "./globals.css";

import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

const allowIndexing = process.env.CYBERMEDICA_ALLOW_INDEXING === "1";
const siteUrl = "https://cybermedica.ru";
const siteTitle = "CyberMedica — экспертная база медицинских изделий";
const siteDescription =
  "CyberMedica помогает врачам, инженерам и закупщикам проверять медицинские изделия: регистрационные документы, характеристики, совместимость, аналоги и источники данных.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | CyberMedica",
  },
  description: siteDescription,
  applicationName: "CyberMedica",
  authors: [{ name: "CyberMedica" }],
  creator: "CyberMedica",
  publisher: "CyberMedica",
  keywords: [
    "CyberMedica",
    "медицинские изделия",
    "регистрационные документы",
    "медицинское оборудование",
    "совместимость медицинских изделий",
    "аналоги медицинских изделий",
    "закупки медицинского оборудования",
    "база знаний медицинских изделий",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "CyberMedica",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: allowIndexing,
    follow: allowIndexing,
  },
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
