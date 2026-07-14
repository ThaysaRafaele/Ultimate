"use client";

import { useMemo, useState } from "react";
import { AthleteCard } from "@/components/AthleteCard";
import { AGE_FILTER_OPTIONS, matchesAgeFilter } from "@/lib/age-filter";
import type { AgeFilterValue } from "@/lib/age-filter";
import { ageInYears, todayISO } from "@/lib/validation";
import { findTeamLabel } from "@/lib/teams";
import type { Team } from "@/lib/teams";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function AthletesRoster({
  athletes,
  showTeamBadges,
  allTeams,
}: Readonly<{ athletes: Athlete[]; showTeamBadges?: boolean; allTeams?: Team[] }>) {
  const [ageFilter, setAgeFilter] = useState<AgeFilterValue>("todas");
  const [search, setSearch] = useState("");

  // Busca só entra em ação a partir de 3 caracteres, igual à escalação —
  // evita filtrar tudo fora a cada tecla enquanto o técnico ainda digita.
  const term = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    let result = athletes;
    if (ageFilter !== "todas") {
      result = result.filter((a) => {
        const age = a.birthDate ? ageInYears(a.birthDate, todayISO()) : null;
        return matchesAgeFilter(age, ageFilter);
      });
    }
    if (term.length >= 3) {
      result = result.filter(
        (a) => a.name.toLowerCase().includes(term) || a.nickname?.toLowerCase().includes(term)
      );
    }
    return result;
  }, [athletes, ageFilter, term]);

  return (
    <>
      <div className="flex gap-3.5 mb-6">
        <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex-1">
          <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold">
            {ageFilter === "todas" && term.length < 3 ? "Total no elenco" : "Atletas filtrados"}
          </div>
          <div className="font-heading font-bold text-[34px] text-ink">{filtered.length}</div>
        </div>
        <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex items-center gap-2.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar atleta (mín. 3 letras)…"
            className="h-10 w-56 border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800"
          />
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
            : "Nenhum atleta encontrado com esse filtro."}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {filtered.map((athlete) => (
            <AthleteCard
              key={athlete.id}
              athlete={athlete}
              teamLabel={
                showTeamBadges && allTeams
                  ? athlete.teams.map((t) => findTeamLabel(allTeams, t)).join(", ")
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
