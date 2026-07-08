"use client";

import { useMemo, useState } from "react";
import { AthleteCard } from "@/components/AthleteCard";
import { AGE_FILTER_OPTIONS, matchesAgeFilter } from "@/lib/age-filter";
import type { AgeFilterValue } from "@/lib/age-filter";
import { ageInYears, todayISO } from "@/lib/validation";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function AthletesRoster({ athletes }: Readonly<{ athletes: Athlete[] }>) {
  const [ageFilter, setAgeFilter] = useState<AgeFilterValue>("todas");

  const filtered = useMemo(() => {
    if (ageFilter === "todas") return athletes;
    return athletes.filter((a) => {
      const age = a.birthDate ? ageInYears(a.birthDate, todayISO()) : null;
      return matchesAgeFilter(age, ageFilter);
    });
  }, [athletes, ageFilter]);

  return (
    <>
      <div className="flex gap-3.5 mb-6">
        <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex-1">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold">
            {ageFilter === "todas" ? "Total no elenco" : "Atletas filtrados"}
          </div>
          <div className="font-heading font-bold text-[34px] text-ink">{filtered.length}</div>
        </div>
        <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex items-center gap-2.5">
          <span className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold shrink-0">
            Idade
          </span>
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value as AgeFilterValue)}
            className="h-10 border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white cursor-pointer"
          >
            {AGE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-border-dash rounded-xl py-16 text-center text-muted-2">
          {athletes.length === 0
            ? "Nenhum atleta cadastrado ainda."
            : "Nenhum atleta encontrado com esse filtro de idade."}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((athlete) => (
            <AthleteCard key={athlete.id} athlete={athlete} />
          ))}
        </div>
      )}
    </>
  );
}
