"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AthleteFormModal } from "@/components/AthleteFormModal";
import type { athletes } from "@/lib/schema";
import type { Team } from "@/lib/teams";

type Athlete = typeof athletes.$inferSelect;

export function EditAthleteButton({
  athlete,
  teams,
}: Readonly<{ athlete: Athlete; teams: Team[] }>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-11 bg-white text-ink border-none rounded-lg font-bold text-sm uppercase cursor-pointer hover:bg-zinc-100"
      >
        Editar atleta
      </button>
      {open && (
        <AthleteFormModal
          mode="edit"
          athlete={athlete}
          teams={teams}
          defaultTeamId={athlete.teams[0]}
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
