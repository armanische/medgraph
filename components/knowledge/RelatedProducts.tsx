import Link from "next/link";
import { Product } from "@/types/product";

interface Props {
  product: Product;
}

export default function RelatedProducts({ product }: Props) {
  return (
    <section className="rounded-3xl border bg-white p-10 shadow-sm">
      <h2 className="mb-8 text-3xl font-bold">
        Похожие изделия
      </h2>

      <div className="grid gap-4">

        {product.analogs.map((item) => (
          <Link
            key={item}
            href="#"
            className="rounded-2xl border p-5 transition hover:border-blue-600 hover:bg-blue-50"
          >
            <div className="font-semibold">
              {item}
            </div>

            <div className="mt-2 text-sm text-gray-500">
              Открыть Knowledge Page →
            </div>
          </Link>
        ))}

      </div>
    </section>
  );
}