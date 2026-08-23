"use client";

import { useState } from "react";
import { GameRow } from "@/components/GameRow";
import { YearGroup } from "@/components/YearGroup";
import { groupGamesByYear } from "@/lib/game-filters";
import type { GameWithChampionship } from "@/lib/games-repo";

// Agrupa por ano e colapsa os anos mais antigos por padrão (só o mais
// recente começa aberto) — evita rolagem gigante conforme os anos de jogos
// importados se acumulam.
export function GamesByYear({
  games,
  onGameClick,
}: Readonly<{
  games: GameWithChampionship[];
  onGameClick: (game: GameWithChampionship) => void;
}>) {
  const groups = groupGamesByYear(games);
  const [collapsedYears, setCollapsedYears] = useState<Set<number>>(
    () => new Set(groups.slice(1).map((g) => g.year))
  );

  if (groups.length <= 1) {
    return (
      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <GameRow key={game.id} game={game} onClick={() => onGameClick(game)} />
        ))}
      </div>
    );
  }

  const allCollapsed = groups.every((g) => collapsedYears.has(g.year));

  function toggleYear(year: number) {
    setCollapsedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            setCollapsedYears(allCollapsed ? new Set() : new Set(groups.map((g) => g.year)))
          }
          className="text-xs font-semibold text-muted-1 hover:text-ink underline underline-offset-2 cursor-pointer"
        >
          {allCollapsed ? "Expandir tudo" : "Recolher tudo"}
        </button>
      </div>
      {groups.map(({ year, games: yearGames }) => (
        <YearGroup
          key={year}
          year={year}
          count={yearGames.length}
          expanded={!collapsedYears.has(year)}
          onToggle={() => toggleYear(year)}
        >
          {yearGames.map((game) => (
            <GameRow key={game.id} game={game} onClick={() => onGameClick(game)} />
          ))}
        </YearGroup>
      ))}
    </div>
  );
}
