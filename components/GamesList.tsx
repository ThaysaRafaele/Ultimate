"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GamesByYear } from "@/components/GamesByYear";
import { GameFormModal } from "@/components/GameFormModal";
import { GameFilters } from "@/components/GameFilters";
import { getGameYears, matchesGameFilters } from "@/lib/game-filters";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { ChampionshipRow } from "@/lib/championships-repo";
import type { Team } from "@/lib/teams";

export function GamesList({
  games,
  teamId,
  teams,
  championships,
}: Readonly<{
  games: GameWithChampionship[];
  teamId: string;
  teams: Team[];
  championships: ChampionshipRow[];
}>) {
  const [editing, setEditing] = useState<GameWithChampionship | null>(null);
  const [year, setYear] = useState<number | "todos">("todos");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const years = useMemo(() => getGameYears(games), [games]);
  const filtered = useMemo(
    () => games.filter((g) => matchesGameFilters(g, year, search)),
    [games, year, search]
  );

  return (
    <>
      <GameFilters
        years={years}
        year={year}
        onYearChange={setYear}
        search={search}
        onSearchChange={setSearch}
        resultCount={filtered.length}
      />
      {filtered.length === 0 ? (
        <div className="border border-dashed border-border-dash rounded-xl py-16 text-center text-muted-2">
          Nenhum jogo encontrado com esse filtro.
        </div>
      ) : (
        <GamesByYear games={filtered} onGameClick={setEditing} />
      )}
      {editing && (
        <GameFormModal
          mode="edit"
          game={editing}
          teamId={teamId}
          teams={teams}
          championships={championships}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
