import Search from "@/components/home/Search";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Categories from "@/components/home/Categories";
import WhyCyberMedica from "@/components/home/WhyCyberMedica";
import CTA from "@/components/home/CTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-cm-canvas">
      <Search />
      <FeaturedProducts />
      <Categories />
      <WhyCyberMedica />
      <CTA />
    </main>
  );
}
