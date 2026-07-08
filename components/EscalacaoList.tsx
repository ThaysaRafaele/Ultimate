"use client";

import { useState } from "react";
import { GameRow } from "@/components/GameRow";
import { LineupModal } from "@/components/LineupModal";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function EscalacaoList({
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
        <LineupModal
          game={selectedGame}
          teamAthletes={teamAthletes}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
}
