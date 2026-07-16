"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";

export function MobileNavDrawer({
  teamLabel,
}: Readonly<{ teamLabel?: string }>) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const team = searchParams.get("team");

  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="hidden max-md:inline-flex items-center justify-center w-9.5 h-9.5 bg-transparent border-none cursor-pointer shrink-0 p-0"
      >
        <svg width="22" height="16" viewBox="0 0 22 16">
          <rect width="22" height="2.4" rx="1.2" fill="#fff" />
          <rect y="6.8" width="22" height="2.4" rx="1.2" fill="#fff" />
          <rect y="13.6" width="22" height="2.4" rx="1.2" fill="#fff" />
        </svg>
      </button>

      {open && (
        <div
          className="hidden max-md:block fixed inset-0 bg-black/50 z-60"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-62.5 h-full bg-ink-deep flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {teamLabel && (
              <div className="px-5 py-5 border-b border-charcoal-light">
                <div className="font-heading font-semibold text-[11px] tracking-[0.16em] text-muted-1 uppercase">
                  Equipe
                </div>
                <div className="text-white font-bold text-sm mt-1">{teamLabel}</div>
              </div>
            )}

            <nav className="flex flex-col py-2">
              {NAV_ITEMS.map((item) => {
                if (!item.href) {
                  return (
                    <button
                      key={item.label}
                      disabled
                      title="Em breve"
                      className="text-left bg-transparent border-none text-white/40 font-heading font-bold text-[15px] tracking-[0.04em] uppercase px-5 py-3.5 cursor-not-allowed"
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
                    className={`font-heading font-bold text-[15px] tracking-[0.04em] uppercase px-5 py-3.5 ${
                      active ? "bg-brand-red text-white" : "text-white/80"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-charcoal-light" />

            <div className="flex flex-col py-2">
              <Link
                href="/campeonatos"
                className="text-muted-1 font-semibold text-[13px] uppercase tracking-[0.04em] px-5 py-3"
              >
                Gerenciar campeonatos
              </Link>
              <Link
                href="/times"
                className="text-muted-1 font-semibold text-[13px] uppercase tracking-[0.04em] px-5 py-3"
              >
                Gerenciar times
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
