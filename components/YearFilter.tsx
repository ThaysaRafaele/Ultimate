"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function YearFilter({
  years,
  selected,
  allOption = true,
  allValue,
}: Readonly<{
  years: number[];
  selected: number | null;
  allOption?: boolean;
  // Query value for "Todos os anos". Without it, that option just drops
  // ?year= (pages where no year already means every year).
  allValue?: string;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Keeps the other query params (e.g. ?team= from the header selector), so
  // switching the year never resets the category.
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      if (allValue) params.set("year", allValue);
      else params.delete("year");
    }
    else params.set("year", value);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <select
      value={selected ?? "all"}
      onChange={onChange}
      aria-label="Ano"
      className="h-10 border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white cursor-pointer"
    >
      {allOption && <option value="all">Todos os anos</option>}
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
