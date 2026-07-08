"use client";

import { useEffect, useState } from "react";
import { formatDateBR } from "@/lib/format";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;
type StatValues = { points: number; rebounds: number; assists: number; steals: number };
type StatField = keyof StatValues;

const EMPTY_STATS: StatValues = { points: 0, rebounds: 0, assists: 0, steals: 0 };
const FIELDS: { key: StatField; label: string }[] = [
  { key: "points", label: "Pts" },
  { key: "rebounds", label: "Reb" },
  { key: "assists", label: "Ast" },
  { key: "steals", label: "Rou" },
];

export function StatsModal({
  game,
  teamAthletes,
  onClose,
}: Readonly<{
  game: GameWithChampionship;
  teamAthletes: Athlete[];
  onClose: () => void;
}>) {
  const [rosterAthletes, setRosterAthletes] = useState<Athlete[]>([]);
  const [values, setValues] = useState<Record<number, StatValues>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/games/${game.id}/lineup`).then((r) => r.json()),
      fetch(`/api/games/${game.id}/stats`).then((r) => r.json()),
    ]).then(([lineupData, statsData]) => {
      if (cancelled) return;
      const lineupIds: number[] = lineupData.athleteIds ?? [];
      const roster =
        lineupIds.length > 0 ? teamAthletes.filter((a) => lineupIds.includes(a.id)) : teamAthletes;
      setRosterAthletes(roster);

      const initial: Record<number, StatValues> = {};
      for (const a of roster) initial[a.id] = { ...EMPTY_STATS };
      for (const s of statsData.stats ?? []) {
        if (initial[s.athleteId]) {
          initial[s.athleteId] = {
            points: s.points,
            rebounds: s.rebounds,
            assists: s.assists,
            steals: s.steals,
          };
        }
      }
      setValues(initial);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [game.id, teamAthletes]);

  function updateValue(athleteId: number, field: StatField, raw: string) {
    const n = raw === "" ? 0 : Math.max(0, Math.floor(Number(raw)));
    if (Number.isNaN(n)) return;
    setValues((prev) => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] ?? EMPTY_STATS), [field]: n },
    }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const stats = rosterAthletes.map((a) => ({
        athleteId: a.id,
        ...(values[a.id] ?? EMPTY_STATS),
      }));
      const res = await fetch(`/api/games/${game.id}/stats`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Não foi possível salvar as estatísticas.");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink-deep/60 backdrop-blur-[2px] flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-165 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ink-deep px-[26px] py-5 flex items-center justify-between shrink-0">
          <div>
            <div className="font-heading font-bold text-2xl uppercase text-white">Estatísticas</div>
            <div className="text-xs text-muted-1">
              Ultimate vs {game.opponent} · {formatDateBR(game.gameDate)} · {game.gameTime}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="bg-transparent border-none text-muted-4 text-2xl cursor-pointer leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-[26px] overflow-y-auto flex-1">
          {loading ? (
            <p className="text-muted-2 text-sm">Carregando…</p>
          ) : rosterAthletes.length === 0 ? (
            <p className="text-muted-2 text-sm">
              Nenhum atleta escalado para esse jogo ainda. Defina a escalação primeiro.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted-2">
                  <th className="pb-2 font-bold">Atleta</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} className="pb-2 font-bold text-center w-16">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rosterAthletes.map((a) => (
                  <tr key={a.id} className="border-t border-border-light">
                    <td className="py-2 text-zinc-800">{a.name}</td>
                    {FIELDS.map((f) => (
                      <td key={f.key} className="py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={values[a.id]?.[f.key] ?? 0}
                          onChange={(e) => updateValue(a.id, f.key, e.target.value)}
                          className="w-14 text-center border border-border-input rounded-md py-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {error && <p className="text-brand-red text-sm mt-4">{error}</p>}
        </div>

        <div className="px-[26px] py-5 border-t border-border-light flex justify-end items-center shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11.5 px-5 bg-white border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase cursor-pointer text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || loading || rosterAthletes.length === 0}
              className="h-11.5 px-6 bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase cursor-pointer disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar estatísticas"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
