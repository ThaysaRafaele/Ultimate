"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AthleteCard } from "@/components/AthleteCard";
import { AthleteFormModal } from "@/components/AthleteFormModal";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function AthletesGrid({
  athletes,
  teamId,
}: Readonly<{ athletes: Athlete[]; teamId: string }>) {
  const [editing, setEditing] = useState<Athlete | null>(null);
  const router = useRouter();

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {athletes.map((athlete) => (
          <AthleteCard key={athlete.id} athlete={athlete} onClick={() => setEditing(athlete)} />
        ))}
      </div>
      {editing && (
        <AthleteFormModal
          mode="edit"
          athlete={editing}
          defaultTeamId={teamId}
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
