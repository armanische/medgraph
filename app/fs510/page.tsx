import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Description from "@/components/Description";
import Specifications from "@/components/Specifications";
import Documents from "@/components/Documents";
import Compatibility from "@/components/Compatibility";
import Analogs from "@/components/Analogs";
import RequestQuote from "@/components/RequestQuote";

export default function FS510Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />
      <Features />
      <Description />
      <Specifications />
      <Documents />
      <Compatibility />
      <Analogs />
      <RequestQuote />
    </main>
  );
}