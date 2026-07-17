import { manufacturerService } from "@/lib/storefront";

export default async function Manufacturers() {
  const manufacturers = await manufacturerService.getManufacturers();

  return (
    <section className="max-w-7xl mx-auto px-8 py-24">
      <h2 className="text-4xl font-bold mb-10">
        Производители
      </h2>

      <p className="text-gray-500">
        {manufacturers.map((manufacturer) => manufacturer.name).join(" · ")}
      </p>
    </section>
  );
}
