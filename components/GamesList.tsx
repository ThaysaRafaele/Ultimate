"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameRow } from "@/components/GameRow";
import { GameFormModal } from "@/components/GameFormModal";
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
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <GameRow key={game.id} game={game} onClick={() => setEditing(game)} />
        ))}
      </div>
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
