import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
        <Link href="/" className="text-2xl font-bold">
          Cyber<span className="text-blue-600">Medica</span>
        </Link>

        <nav className="hidden gap-8 lg:flex">
          <Link href="/">Главная</Link>
          <Link href="/catalog">Каталог</Link>
          <Link href="/manufacturers">Производители</Link>
          <Link href="/products/fs510">База знаний</Link>
        </nav>

        <Link
          href="/request"
          className="rounded-xl bg-blue-600 px-5 py-2 text-white"
        >
          Получить КП
        </Link>
      </div>
    </header>
  );
}
