"use client";

export function YearGroup({
  year,
  count,
  expanded,
  onToggle,
  children,
}: Readonly<{
  year: number;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}>) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 bg-white border border-border-light rounded-[10px] px-5.5 py-3.5 cursor-pointer hover:bg-bg-subtle transition-colors"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M1 0.5 L8.5 5 L1 9.5 Z" fill="#101012" />
        </svg>
        <span className="font-heading font-bold text-lg text-ink">{year}</span>
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-bg-subtle-2 text-xs font-bold text-muted-2">
          {count}
        </span>
      </button>
      {expanded && <div className="flex flex-col gap-3 mt-3">{children}</div>}
    </div>
  );
}
