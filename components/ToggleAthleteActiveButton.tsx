"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ToggleAthleteActiveButton({
  athleteId,
  active,
}: Readonly<{ athleteId: number; active: boolean }>) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onToggle() {
    const label = active ? "inativar" : "reativar";
    if (!window.confirm(`Quer ${label} este atleta?`)) return;

    setLoading(true);
    try {
      await fetch(`/api/athletes/${athleteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="w-full h-11 bg-transparent text-muted-1 border border-charcoal-light rounded-lg font-bold text-sm uppercase cursor-pointer hover:text-white hover:border-white disabled:opacity-60 mt-2.5"
    >
      {active ? "Inativar atleta" : "Reativar atleta"}
    </button>
  );
}
