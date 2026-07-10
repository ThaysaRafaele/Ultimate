"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavItem = {
  label: string;
  href: string | null;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Atletas",
    href: "/",
    isActive: (p) => p === "/" || p.startsWith("/importar") || p.startsWith("/perfil"),
  },
  { label: "Jogos", href: "/jogos", isActive: (p) => p.startsWith("/jogos") },
  { label: "Escalação", href: "/escalacao", isActive: (p) => p.startsWith("/escalacao") },
  { label: "Estatísticas", href: "/estatisticas", isActive: (p) => p.startsWith("/estatisticas") },
  { label: "Avisos", href: "/avisos", isActive: (p) => p.startsWith("/avisos") },
  { label: "Visão Geral", href: null, isActive: () => false },
];

export function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const team = searchParams.get("team");

  return (
    <nav className="bg-brand-red h-[50px] flex items-stretch px-6 flex-shrink-0">
      {NAV_ITEMS.map((item) => {
        if (!item.href) {
          return (
            <button
              key={item.label}
              disabled
              title="Em breve"
              className="bg-transparent text-white/80 font-heading font-bold text-[15px] tracking-[0.06em] uppercase px-5 h-full flex items-center border-b-[3px] border-transparent cursor-not-allowed"
            >
              {item.label}
            </button>
          );
        }

        const active = item.isActive(pathname);
        const href = team ? `${item.href}?team=${team}` : item.href;
        return (
          <Link
            key={item.label}
            href={href}
            className={`bg-transparent text-white font-heading font-bold text-[15px] tracking-[0.06em] uppercase px-5 h-full flex items-center border-b-[3px] ${
              active ? "border-white" : "border-transparent opacity-90"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
