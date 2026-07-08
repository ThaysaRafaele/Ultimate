"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GameFormModal } from "@/components/GameFormModal";
import type { Team } from "@/lib/teams";
import type { ChampionshipRow } from "@/lib/championships-repo";

export function NewGameButton({
  teamId,
  teams,
  championships,
}: Readonly<{ teamId: string; teams: Team[]; championships: ChampionshipRow[] }>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-[46px] px-[22px] bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase tracking-[0.04em] cursor-pointer hover:bg-brand-red-hover"
      >
        + Novo jogo
      </button>
      {open && (
        <GameFormModal
          mode="create"
          teamId={teamId}
          teams={teams}
          championships={championships}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
