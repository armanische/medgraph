import type { Metadata } from "next";

import Search from "@/components/home/Search";
import PlatformStats from "@/components/home/PlatformStats";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import WhyCyberMedica from "@/components/home/WhyCyberMedica";
import CTA from "@/components/home/CTA";

export const metadata: Metadata = {
  title: "Экспертная база медицинских изделий",
  description:
    "CyberMedica объединяет каталог медицинских изделий, документы, характеристики, совместимость и аналоги для врачей, инженеров и закупщиков.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-cm-canvas">
      <Search />
      <PlatformStats />
      <FeaturedProducts />
      <Categories />
      <WhyCyberMedica />
      <CTA />
    </main>
  );
}
