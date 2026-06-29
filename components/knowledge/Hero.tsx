import Image from "next/image";

import { Product } from "@/types/product";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface HeroProps {
  product: Product;
}

export default function Hero({ product }: HeroProps) {
  return (
    <section className="grid gap-16 lg:grid-cols-2 items-center">
      <div>
        <Badge>{product.category}</Badge>

        <h1 className="mt-6 text-5xl font-bold leading-tight">
          {product.name}
        </h1>

        <p className="mt-6 text-xl leading-8 text-gray-600">
          {product.description}
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/request">Получить КП</Button>

          <Button href={product.documents[0]?.url} target="_blank" variant="secondary">
            Скачать РУ
          </Button>

          <Button href={product.documents[1]?.url} target="_blank" variant="secondary">
            Инструкция
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="text-3xl font-bold text-blue-600">99.999%</div>
            <div className="mt-2 text-sm text-gray-500">
              Эффективность фильтрации
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-3xl font-bold text-blue-600">24 часа</div>
            <div className="mt-2 text-sm text-gray-500">
              Максимальное использование
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-3xl font-bold text-blue-600">100–2000 мл</div>
            <div className="mt-2 text-sm text-gray-500">
              Дыхательный объем
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-3xl font-bold text-blue-600">27 г</div>
            <div className="mt-2 text-sm text-gray-500">Вес изделия</div>
          </Card>
        </div>
      </div>

      <Card>
        <Image
          src={product.images[0]}
          alt={product.name}
          width={900}
          height={900}
          className="w-full object-contain"
          priority
        />
      </Card>
    </section>
  );
}