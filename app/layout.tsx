import "./globals.css";

import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://cybermedica.ru"),
  title: {
    default: "CyberMedica — доказательная база медицинских изделий",
    template: "%s | CyberMedica",
  },
  description:
    "Профессиональная платформа доказательной информации о медицинских изделиях: источники, документы, проверка и публикация данных.",
  applicationName: "CyberMedica",
  openGraph: {
    title: "CyberMedica — доказательная база медицинских изделий",
    description:
      "Профессиональная платформа доказательной информации о медицинских изделиях.",
    url: "https://cybermedica.ru",
    siteName: "CyberMedica",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CyberMedica — доказательная база медицинских изделий",
    description:
      "Профессиональная платформа доказательной информации о медицинских изделиях.",
  },
  robots: {
    index: false,
    follow: false,
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
