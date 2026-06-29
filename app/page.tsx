import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import Search from "@/components/home/Search";
import Categories from "@/components/home/Categories";
import Advantages from "@/components/home/Advantages";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Manufacturers from "@/components/home/Manufacturers";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <Search />
      <Categories />
      <Advantages />
      <FeaturedProducts />
      <Manufacturers />
      <CTA />
      <Footer />
    </>
  );
}