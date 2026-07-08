"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VARIANT_CLASSES = {
  dark: "w-full h-11 bg-transparent text-muted-1 border border-charcoal-light rounded-lg hover:text-white hover:border-white mt-2.5",
  light:
    "h-9 px-4 bg-white text-ink border-[1.5px] border-border-input rounded-lg hover:border-ink",
};

export function ToggleAthleteActiveButton({
  athleteId,
  active,
  variant = "dark",
}: Readonly<{ athleteId: number; active: boolean; variant?: "dark" | "light" }>) {
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
      className={`font-bold text-sm uppercase cursor-pointer disabled:opacity-60 ${VARIANT_CLASSES[variant]}`}
    >
      {active ? "Inativar atleta" : "Reativar atleta"}
    </button>
  );
}
