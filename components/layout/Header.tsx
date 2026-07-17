"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 items-center justify-center rounded-md bg-cm-ink text-white"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
        <path
          d="M3 12h4l2.2-5 4.2 10 2.1-5H21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const navItems = [
    ["/catalog", "Каталог"],
    ["/compare", "Сравнение"],
    ["/manufacturers", "Производители"],
    ["/request", "Поставщикам"],
  ];
  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--cm-rule)] bg-white/88 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] backdrop-blur-xl">
      <div className="cm-container flex min-h-14 items-center gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 transition duration-200 hover:opacity-85"
          aria-label="CyberMedica — главная"
        >
          <BrandMark />
          <span className="text-sm font-extrabold tracking-[-0.02em]">
            Cyber<span className="text-cm-teal">Medica</span>
          </span>
        </Link>

        <nav
          aria-label="Основная навигация"
          className="ml-auto hidden items-center gap-1.5 lg:flex"
        >
          {navItems.map(([href, label]) => (
            <Link
              key={href}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition duration-200 hover:-translate-y-px hover:bg-cm-surface-low hover:text-cm-ink ${
                isActive(href)
                  ? "bg-cm-teal-soft text-cm-teal shadow-[0_8px_22px_rgba(11,123,142,0.08)]"
                  : "text-cm-slate"
              }`}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/search"
          className="ml-auto hidden min-h-9 items-center gap-2 rounded-lg border border-[var(--cm-rule)] bg-white px-3 text-xs font-medium text-cm-slate transition duration-200 hover:-translate-y-px hover:border-cm-teal/30 hover:text-cm-ink hover:shadow-[0_10px_24px_rgba(11,19,32,0.06)] sm:inline-flex lg:ml-3"
        >
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Поиск
        </Link>

        <Link href="/request" className="cm-button-primary min-h-9 px-3.5 py-2 text-xs">
          Запросить КП
        </Link>
      </div>

      <nav
        aria-label="Мобильная навигация"
        className="flex min-h-10 items-center gap-1.5 overflow-x-auto border-t border-[var(--cm-rule)] px-4 lg:hidden"
      >
        {navItems.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className={`shrink-0 rounded-lg px-2.5 py-2 text-xs transition duration-200 hover:bg-cm-surface-low hover:text-cm-teal ${
              isActive(href)
                ? "bg-cm-teal-soft text-cm-teal"
                : "text-cm-slate"
            }`}
            aria-current={isActive(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
