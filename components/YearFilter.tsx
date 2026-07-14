"use client";

import { usePathname, useRouter } from "next/navigation";

export function YearFilter({
  years,
  selected,
}: Readonly<{ years: number[]; selected: number | null }>) {
  const router = useRouter();
  const pathname = usePathname();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    router.push(value === "all" ? pathname : `${pathname}?year=${value}`);
  }

  return (
    <select
      value={selected ?? "all"}
      onChange={onChange}
      className="h-10 border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white cursor-pointer"
    >
      <option value="all">Todos os anos</option>
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
