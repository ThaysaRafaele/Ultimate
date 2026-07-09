"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateBR } from "@/lib/format";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

type StatValues = {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  fg2Made: number;
  fg2Attempted: number;
  fg3Made: number;
  fg3Attempted: number;
  ftMade: number;
  ftAttempted: number;
};
type StatField = keyof StatValues;

type Boletim = {
  q1OurScore: number | null;
  q1TheirScore: number | null;
  q2OurScore: number | null;
  q2TheirScore: number | null;
  q3OurScore: number | null;
  q3TheirScore: number | null;
  q4OurScore: number | null;
  q4TheirScore: number | null;
  otOurScore: number | null;
  otTheirScore: number | null;
  mvpAthleteId: number | null;
};
type QuarterField = Exclude<keyof Boletim, "mvpAthleteId">;

const EMPTY_STATS: StatValues = {
  points: 0,
  rebounds: 0,
  assists: 0,
  steals: 0,
  fg2Made: 0,
  fg2Attempted: 0,
  fg3Made: 0,
  fg3Attempted: 0,
  ftMade: 0,
  ftAttempted: 0,
};
const EMPTY_BOLETIM: Boletim = {
  q1OurScore: null,
  q1TheirScore: null,
  q2OurScore: null,
  q2TheirScore: null,
  q3OurScore: null,
  q3TheirScore: null,
  q4OurScore: null,
  q4TheirScore: null,
  otOurScore: null,
  otTheirScore: null,
  mvpAthleteId: null,
};

const SIMPLE_FIELDS: { key: StatField; label: string }[] = [
  { key: "points", label: "Pts" },
  { key: "rebounds", label: "Reb" },
  { key: "assists", label: "Ast" },
  { key: "steals", label: "Rou" },
];
const SHOT_FIELDS: { made: StatField; attempted: StatField; label: string }[] = [
  { made: "fg2Made", attempted: "fg2Attempted", label: "2PT" },
  { made: "fg3Made", attempted: "fg3Attempted", label: "3PT" },
  { made: "ftMade", attempted: "ftAttempted", label: "LL" },
];
const QUARTERS: { our: QuarterField; their: QuarterField; label: string }[] = [
  { our: "q1OurScore", their: "q1TheirScore", label: "Q1" },
  { our: "q2OurScore", their: "q2TheirScore", label: "Q2" },
  { our: "q3OurScore", their: "q3TheirScore", label: "Q3" },
  { our: "q4OurScore", their: "q4TheirScore", label: "Q4" },
  { our: "otOurScore", their: "otTheirScore", label: "Prorr." },
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
  const [boletim, setBoletim] = useState<Boletim>(EMPTY_BOLETIM);
  const [mvpTouched, setMvpTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showBoletim = game.status === "realizado";

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
            fg2Made: s.fg2Made,
            fg2Attempted: s.fg2Attempted,
            fg3Made: s.fg3Made,
            fg3Attempted: s.fg3Attempted,
            ftMade: s.ftMade,
            ftAttempted: s.ftAttempted,
          };
        }
      }
      setValues(initial);
      if (statsData.boletim) {
        setBoletim(statsData.boletim);
        setMvpTouched(statsData.boletim.mvpAthleteId != null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [game.id, teamAthletes]);

  // Sugere automaticamente o MVP com base no desempenho (pts+reb+ast+roubos),
  // até o técnico escolher manualmente outro atleta no seletor.
  const suggestedMvpId = useMemo(() => {
    let bestId: number | null = null;
    let bestScore = 0;
    for (const a of rosterAthletes) {
      const v = values[a.id];
      if (!v) continue;
      const score = v.points + v.rebounds + v.assists + v.steals;
      if (score > bestScore) {
        bestScore = score;
        bestId = a.id;
      }
    }
    return bestId;
  }, [values, rosterAthletes]);

  const effectiveMvpId = mvpTouched ? boletim.mvpAthleteId : suggestedMvpId;

  function updateValue(athleteId: number, field: StatField, raw: string) {
    const n = raw === "" ? 0 : Math.max(0, Math.floor(Number(raw)));
    if (Number.isNaN(n)) return;
    setValues((prev) => {
      const updated = { ...(prev[athleteId] ?? EMPTY_STATS), [field]: n };
      if (field === "fg2Made" || field === "fg3Made" || field === "ftMade") {
        updated.points = updated.fg2Made * 2 + updated.fg3Made * 3 + updated.ftMade;
      }
      return { ...prev, [athleteId]: updated };
    });
  }

  function updateQuarter(field: QuarterField, raw: string) {
    const n = raw === "" ? null : Math.max(0, Math.floor(Number(raw)));
    if (n !== null && Number.isNaN(n)) return;
    setBoletim((prev) => ({ ...prev, [field]: n }));
  }

  function updateMvp(raw: string) {
    setMvpTouched(true);
    setBoletim((prev) => ({ ...prev, mvpAthleteId: raw === "" ? null : Number(raw) }));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const stats = rosterAthletes.map((a) => ({
        athleteId: a.id,
        ...(values[a.id] ?? EMPTY_STATS),
      }));

      for (const s of stats) {
        if (s.fg2Made > s.fg2Attempted || s.fg3Made > s.fg3Attempted || s.ftMade > s.ftAttempted) {
          const athleteName = rosterAthletes.find((a) => a.id === s.athleteId)?.name ?? "";
          throw new Error(
            `Arremessos certos não podem ser maiores que tentados (${athleteName}).`
          );
        }
      }

      const res = await fetch(`/api/games/${game.id}/stats`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats,
          boletim: showBoletim ? { ...boletim, mvpAthleteId: effectiveMvpId } : undefined,
        }),
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
        className="bg-white w-215 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
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
          ) : (
            <>
              <div className="mb-6">
                <div className="text-xs uppercase tracking-[0.06em] text-muted-2 font-bold mb-2">
                  Boletim do jogo
                </div>
                {!showBoletim ? (
                  <p className="text-sm text-muted-2">
                    Disponível quando o jogo for marcado como Realizado.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-8 items-start">
                    <table className="text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted-2">
                          <th className="pb-2 pr-3 font-bold"></th>
                          {QUARTERS.map((q) => (
                            <th key={q.label} className="pb-2 px-1 font-bold text-center w-16">
                              {q.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="pr-3 py-1 text-zinc-800">Nós</td>
                          {QUARTERS.map((q) => (
                            <td key={q.label} className="px-1 py-1 text-center">
                              <input
                                type="number"
                                min={0}
                                value={boletim[q.our] ?? ""}
                                onChange={(e) => updateQuarter(q.our, e.target.value)}
                                className="w-14 text-center border border-border-input rounded-md py-1"
                              />
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="pr-3 py-1 text-zinc-800">Advers.</td>
                          {QUARTERS.map((q) => (
                            <td key={q.label} className="px-1 py-1 text-center">
                              <input
                                type="number"
                                min={0}
                                value={boletim[q.their] ?? ""}
                                onChange={(e) => updateQuarter(q.their, e.target.value)}
                                className="w-14 text-center border border-border-input rounded-md py-1"
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>

                    <div>
                      <div className="text-xs uppercase tracking-[0.06em] text-muted-2 font-bold mb-2">
                        MVP do jogo
                      </div>
                      <select
                        value={effectiveMvpId ?? ""}
                        onChange={(e) => updateMvp(e.target.value)}
                        className="h-9.5 px-3 border border-border-input rounded-md text-sm text-zinc-800"
                      >
                        <option value="">Nenhum</option>
                        {rosterAthletes.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                            {!mvpTouched && a.id === suggestedMvpId ? " (sugestão automática)" : ""}
                          </option>
                        ))}
                      </select>
                      {!mvpTouched && suggestedMvpId != null && (
                        <p className="text-xs text-muted-2 mt-1">
                          Sugerido automaticamente pelo maior pts+reb+ast+roubos. Troque se quiser
                          escolher outro atleta.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {rosterAthletes.length === 0 ? (
                <p className="text-muted-2 text-sm">
                  Nenhum atleta escalado para esse jogo ainda. Defina a escalação primeiro.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted-2">
                        <th className="pb-2 pr-2 font-bold">Atleta</th>
                        {SIMPLE_FIELDS.map((f) => (
                          <th key={f.key} className="pb-2 px-1 font-bold text-center w-14">
                            {f.label}
                          </th>
                        ))}
                        {SHOT_FIELDS.map((f) => (
                          <th key={f.label} className="pb-2 px-1 font-bold text-center w-24">
                            {f.label} (C/T)
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rosterAthletes.map((a) => (
                        <tr key={a.id} className="border-t border-border-light">
                          <td className="py-2 pr-2 text-zinc-800 whitespace-nowrap">{a.name}</td>
                          {SIMPLE_FIELDS.map((f) => (
                            <td key={f.key} className="py-2 px-1 text-center">
                              <input
                                type="number"
                                min={0}
                                value={values[a.id]?.[f.key] ?? 0}
                                onChange={(e) => updateValue(a.id, f.key, e.target.value)}
                                className="w-12 text-center border border-border-input rounded-md py-1"
                              />
                            </td>
                          ))}
                          {SHOT_FIELDS.map((f) => (
                            <td key={f.label} className="py-2 px-1">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={values[a.id]?.[f.made] ?? 0}
                                  onChange={(e) => updateValue(a.id, f.made, e.target.value)}
                                  className="w-10 text-center border border-border-input rounded-md py-1"
                                />
                                <span className="text-muted-2">/</span>
                                <input
                                  type="number"
                                  min={0}
                                  value={values[a.id]?.[f.attempted] ?? 0}
                                  onChange={(e) => updateValue(a.id, f.attempted, e.target.value)}
                                  className="w-10 text-center border border-border-input rounded-md py-1"
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
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
