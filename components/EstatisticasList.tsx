"use client";

import { useState } from "react";
import { GameRow } from "@/components/GameRow";
import { StatsModal } from "@/components/StatsModal";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function EstatisticasList({
  games,
  teamAthletes,
}: Readonly<{ games: GameWithChampionship[]; teamAthletes: Athlete[] }>) {
  const [selectedGame, setSelectedGame] = useState<GameWithChampionship | null>(null);

  return (
    <>
      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <GameRow key={game.id} game={game} onClick={() => setSelectedGame(game)} />
        ))}
      </div>
      {selectedGame && (
        <StatsModal
          game={selectedGame}
          teamAthletes={teamAthletes}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
}
