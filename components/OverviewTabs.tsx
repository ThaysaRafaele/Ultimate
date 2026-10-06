"use client";

import { useId, useRef, useState } from "react";

export type OverviewTab = { id: string; label: string; count?: number; content: React.ReactNode };

// Tabs under the summary cards, so the page shows one long list at a time.
// The open tab goes to ?aba= without a server round trip (history.replaceState
// keeps useSearchParams in sync), so it survives a year/category change and
// can be shared.
export function OverviewTabs({ tabs, initial }: Readonly<{ tabs: OverviewTab[]; initial?: string }>) {
  const [active, setActive] = useState(() => (tabs.some((t) => t.id === initial) ? initial! : tabs[0].id));
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  function select(id: string, focus = false) {
    setActive(id);
    const url = new URL(window.location.href);
    if (id === tabs[0].id) url.searchParams.delete("aba");
    else url.searchParams.set("aba", id);
    window.history.replaceState(null, "", url);
    if (focus) buttons.current[tabs.findIndex((t) => t.id === id)]?.focus();
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    select(tabs[(index + step + tabs.length) % tabs.length].id, true);
  }

  return (
    <div className="mt-8 max-md:mt-6">
      <div
        role="tablist"
        aria-label="Seções da visão geral"
        className="sticky top-0 z-30 bg-zinc-100 flex gap-1 border-b border-border-light mb-5 max-md:mb-4"
      >
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`relative flex items-center gap-2 px-4 max-md:px-3 h-12 font-heading font-bold text-lg max-md:text-base uppercase whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red rounded-t-lg ${
                selected ? "text-ink" : "text-muted-1 hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`min-w-6 h-5.5 px-1.5 rounded-full text-xs font-sans font-bold inline-flex items-center justify-center ${
                    selected ? "bg-brand-red text-white" : "bg-bg-subtle-2 text-muted-1"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              <span
                aria-hidden
                className={`absolute left-2 right-2 -bottom-px h-[3px] rounded-full ${selected ? "bg-brand-red" : "bg-transparent"}`}
              />
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
