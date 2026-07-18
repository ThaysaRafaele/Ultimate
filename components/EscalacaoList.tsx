"use client";

import { useMemo, useState } from "react";
import { GameRow } from "@/components/GameRow";
import { LineupModal } from "@/components/LineupModal";
import { GameFilters } from "@/components/GameFilters";
import { getGameYears, matchesGameFilters } from "@/lib/game-filters";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function EscalacaoList({
  games,
  teamAthletes,
}: Readonly<{ games: GameWithChampionship[]; teamAthletes: Athlete[] }>) {
  const [selectedGame, setSelectedGame] = useState<GameWithChampionship | null>(null);
  const [year, setYear] = useState<number | "todos">("todos");
  const [search, setSearch] = useState("");

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
        <div className="flex flex-col gap-3">
          {filtered.map((game) => (
            <GameRow key={game.id} game={game} onClick={() => setSelectedGame(game)} />
          ))}
        </div>
      )}
      {selectedGame && (
        <LineupModal
          game={selectedGame}
          teamAthletes={teamAthletes}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
}
