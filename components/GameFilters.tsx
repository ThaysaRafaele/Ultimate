"use client";

export function GameFilters({
  years,
  year,
  onYearChange,
  search,
  onSearchChange,
  resultCount,
}: Readonly<{
  years: number[];
  year: number | "todos";
  onYearChange: (year: number | "todos") => void;
  search: string;
  onSearchChange: (search: string) => void;
  resultCount: number;
}>) {
  const isFiltered = year !== "todos" || search.trim().length >= 3;

  return (
    <div className="flex gap-3.5 max-md:flex-col mb-6">
      <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex-1">
        <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold">
          {isFiltered ? "Jogos filtrados" : "Total de jogos"}
        </div>
        <div className="font-heading font-bold text-[34px] text-ink">{resultCount}</div>
      </div>
      <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex items-center gap-2.5">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar adversário ou campeonato (mín. 3 letras)…"
          className="h-10 w-64 max-md:w-full border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800"
        />
      </div>
      <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex items-center gap-2.5">
        <span className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold shrink-0">Ano</span>
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value === "todos" ? "todos" : Number(e.target.value))}
          className="h-10 border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white cursor-pointer max-md:flex-1"
        >
          <option value="todos">Todos os anos</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
