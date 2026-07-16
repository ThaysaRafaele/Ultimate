"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";

export function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const team = searchParams.get("team");

  return (
    <nav className="bg-brand-red h-[50px] max-md:hidden flex items-stretch px-6 flex-shrink-0">
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
