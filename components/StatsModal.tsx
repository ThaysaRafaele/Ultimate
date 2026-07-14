"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { formatDateBR } from "@/lib/format";
import { computeEff, computePoints, computeReboundsTotal, pct } from "@/lib/stats-calc";
import type { GameStatRow } from "@/lib/stats-calc";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;
type StatField = keyof Omit<GameStatRow, "athleteId">;

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

// Não temos atleta a atleta do time adversário — o técnico preenche o total
// da equipe direto, nas mesmas colunas da tabela de estatísticas.
const OPP_FIELD_TO_API: Record<StatField, string> = {
  reboundsOff: "oppReboundsOff",
  reboundsDef: "oppReboundsDef",
  assists: "oppAssists",
  steals: "oppSteals",
  blocks: "oppBlocks",
  turnovers: "oppTurnovers",
  fouls: "oppFouls",
  fg2Made: "oppFg2Made",
  fg2Attempted: "oppFg2Attempted",
  fg3Made: "oppFg3Made",
  fg3Attempted: "oppFg3Attempted",
  ftMade: "oppFtMade",
  ftAttempted: "oppFtAttempted",
};

const EMPTY_STATS: Omit<GameStatRow, "athleteId"> = {
  reboundsOff: 0,
  reboundsDef: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
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

// Mesma ordem da planilha do técnico: Lance livre, 2 Pontos, 3 Pontos.
const SHOT_FIELDS: { made: StatField; attempted: StatField; label: string }[] = [
  { made: "ftMade", attempted: "ftAttempted", label: "LL" },
  { made: "fg2Made", attempted: "fg2Attempted", label: "2PT" },
  { made: "fg3Made", attempted: "fg3Attempted", label: "3PT" },
];
const OTHER_FIELDS: { key: StatField; label: string }[] = [
  { key: "assists", label: "Ast" },
  { key: "blocks", label: "Toco" },
  { key: "turnovers", label: "Erros" },
  { key: "steals", label: "Roubos" },
  { key: "fouls", label: "Faltas" },
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
  const [values, setValues] = useState<Record<number, Omit<GameStatRow, "athleteId">>>({});
  const [boletim, setBoletim] = useState<Boletim>(EMPTY_BOLETIM);
  const [opponentStats, setOpponentStats] = useState<Omit<GameStatRow, "athleteId">>(EMPTY_STATS);
  const [mvpTouched, setMvpTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estatísticas (e o boletim) só podem ser lançadas depois que o jogo
  // acontece — a flag já existe (status "realizado"/"agendado"), aqui só
  // usamos ela pra travar a entrada de dados também.
  const gameHappened = game.status === "realizado";

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

      const initial: Record<number, Omit<GameStatRow, "athleteId">> = {};
      for (const a of roster) initial[a.id] = { ...EMPTY_STATS };
      for (const s of statsData.stats ?? []) {
        if (initial[s.athleteId]) {
          initial[s.athleteId] = {
            reboundsOff: s.reboundsOff,
            reboundsDef: s.reboundsDef,
            assists: s.assists,
            steals: s.steals,
            blocks: s.blocks,
            turnovers: s.turnovers,
            fouls: s.fouls,
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
        const opp = { ...EMPTY_STATS };
        for (const key of Object.keys(OPP_FIELD_TO_API) as StatField[]) {
          opp[key] = statsData.boletim[OPP_FIELD_TO_API[key]] ?? 0;
        }
        setOpponentStats(opp);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [game.id, teamAthletes]);

  // Sugere automaticamente o MVP com base na maior eficiência (EFF), até o
  // técnico escolher manualmente outro atleta no seletor.
  const suggestedMvpId = useMemo(() => {
    let bestId: number | null = null;
    let bestScore = 0;
    for (const a of rosterAthletes) {
      const v = values[a.id];
      if (!v) continue;
      const score = computeEff({ athleteId: a.id, ...v });
      if (score > bestScore) {
        bestScore = score;
        bestId = a.id;
      }
    }
    return bestId;
  }, [values, rosterAthletes]);

  const effectiveMvpId = mvpTouched ? boletim.mvpAthleteId : suggestedMvpId;

  // Linha "Total" no rodapé, somando cada coluna — igual à planilha do
  // técnico (que também deixa o EFF do total em branco, então fazemos o mesmo).
  const columnTotals = useMemo(() => {
    const sums: Omit<GameStatRow, "athleteId"> = { ...EMPTY_STATS };
    for (const a of rosterAthletes) {
      const v = values[a.id] ?? EMPTY_STATS;
      for (const key of Object.keys(sums) as StatField[]) {
        sums[key] += v[key];
      }
    }
    return { sums, points: computePoints(sums), reboundsTotal: computeReboundsTotal(sums) };
  }, [values, rosterAthletes]);

  const opponentPoints = computePoints(opponentStats);
  const opponentReboundsTotal = computeReboundsTotal(opponentStats);
  const opponentEff = computeEff({ athleteId: 0, ...opponentStats });

  // Aviso não-bloqueante: só quando os 4 quartos de um lado estão preenchidos
  // e a soma não bate com o placar final já registrado no jogo.
  const quarterWarnings = useMemo(() => {
    const { q1OurScore, q2OurScore, q3OurScore, q4OurScore, otOurScore } = boletim;
    const { q1TheirScore, q2TheirScore, q3TheirScore, q4TheirScore, otTheirScore } = boletim;
    const ourFilled = [q1OurScore, q2OurScore, q3OurScore, q4OurScore].every((v) => v != null);
    const theirFilled = [q1TheirScore, q2TheirScore, q3TheirScore, q4TheirScore].every(
      (v) => v != null
    );

    const warnings: string[] = [];
    if (ourFilled && game.ourScore != null) {
      const ourSum = q1OurScore! + q2OurScore! + q3OurScore! + q4OurScore! + (otOurScore ?? 0);
      if (ourSum !== game.ourScore) {
        warnings.push(`Nós: soma dos quartos é ${ourSum}, mas o placar final é ${game.ourScore}.`);
      }
    }
    if (theirFilled && game.theirScore != null) {
      const theirSum =
        q1TheirScore! + q2TheirScore! + q3TheirScore! + q4TheirScore! + (otTheirScore ?? 0);
      if (theirSum !== game.theirScore) {
        warnings.push(
          `Adversário: soma dos quartos é ${theirSum}, mas o placar final é ${game.theirScore}.`
        );
      }
    }
    return warnings;
  }, [boletim, game.ourScore, game.theirScore]);

  function updateValue(athleteId: number, field: StatField, raw: string) {
    const n = raw === "" ? 0 : Math.max(0, Math.floor(Number(raw)));
    if (Number.isNaN(n)) return;
    setValues((prev) => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] ?? EMPTY_STATS), [field]: n },
    }));
  }

  function updateOpponentValue(field: StatField, raw: string) {
    const n = raw === "" ? 0 : Math.max(0, Math.floor(Number(raw)));
    if (Number.isNaN(n)) return;
    setOpponentStats((prev) => ({ ...prev, [field]: n }));
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
          const athlete = rosterAthletes.find((a) => a.id === s.athleteId);
          const athleteName = athlete?.nickname || athlete?.name || "";
          throw new Error(
            `Arremessos certos não podem ser maiores que tentados (${athleteName}).`
          );
        }
      }
      if (
        opponentStats.fg2Made > opponentStats.fg2Attempted ||
        opponentStats.fg3Made > opponentStats.fg3Attempted ||
        opponentStats.ftMade > opponentStats.ftAttempted
      ) {
        throw new Error("Arremessos certos do adversário não podem ser maiores que tentados.");
      }

      const oppPayload: Record<string, number> = {};
      for (const key of Object.keys(OPP_FIELD_TO_API) as StatField[]) {
        oppPayload[OPP_FIELD_TO_API[key]] = opponentStats[key];
      }

      const res = await fetch(`/api/games/${game.id}/stats`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats,
          boletim: gameHappened
            ? { ...boletim, mvpAthleteId: effectiveMvpId, ...oppPayload }
            : undefined,
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
        className="bg-white w-[95vw] max-w-375 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
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
          ) : !gameHappened ? (
            <p className="text-sm text-muted-2">
              Esse jogo ainda não aconteceu. Marque o jogo como &ldquo;Realizado&rdquo; (em Jogos,
              com o placar final) para liberar o lançamento de estatísticas e o boletim.
            </p>
          ) : (
            <>
              <div className="mb-6">
                <div className="text-xs uppercase tracking-[0.06em] text-muted-2 font-bold mb-2">
                  Boletim do jogo
                </div>
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
                          {a.nickname || a.name}
                          {!mvpTouched && a.id === suggestedMvpId ? " (sugestão automática)" : ""}
                        </option>
                      ))}
                    </select>
                    {!mvpTouched && suggestedMvpId != null && (
                      <p className="text-xs text-muted-2 mt-1">
                        Sugerido automaticamente pela maior eficiência (EFF). Troque se quiser
                        escolher outro atleta.
                      </p>
                    )}
                  </div>
                </div>
                {quarterWarnings.length > 0 && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5">
                    {quarterWarnings.map((w) => (
                      <p key={w} className="text-xs text-amber-800">
                        ⚠ {w}
                      </p>
                    ))}
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
                        <th className="pb-2 pr-2 font-bold sticky left-0 bg-white">Atleta</th>
                        {SHOT_FIELDS.map((f) => (
                          <th key={f.label} colSpan={3} className="pb-2 px-1 font-bold text-center">
                            {f.label}
                          </th>
                        ))}
                        <th className="pb-2 px-1 font-bold text-center w-14">Reb D</th>
                        <th className="pb-2 px-1 font-bold text-center w-14">Reb O</th>
                        <th className="pb-2 px-1 font-bold text-center w-14">Reb</th>
                        {OTHER_FIELDS.map((f) => (
                          <th key={f.key} className="pb-2 px-1 font-bold text-center w-14">
                            {f.label}
                          </th>
                        ))}
                        <th className="pb-2 px-1 font-bold text-center w-14">Total</th>
                        <th className="pb-2 px-1 font-bold text-center w-14">EFF</th>
                      </tr>
                      <tr className="text-left text-[10px] uppercase tracking-[0.04em] text-muted-2">
                        <th className="pb-2 pr-2 sticky left-0 bg-white"></th>
                        {SHOT_FIELDS.map((f) => (
                          <Fragment key={f.label}>
                            <th className="pb-2 px-1 text-center w-10 font-normal">T</th>
                            <th className="pb-2 px-1 text-center w-10 font-normal">C</th>
                            <th className="pb-2 px-1 text-center w-12 font-normal">%</th>
                          </Fragment>
                        ))}
                        <th colSpan={3 + OTHER_FIELDS.length + 2}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterAthletes.map((a) => {
                        const v = values[a.id] ?? EMPTY_STATS;
                        const points = computePoints(v);
                        const reboundsTotal = computeReboundsTotal(v);
                        const eff = computeEff({ athleteId: a.id, ...v });
                        return (
                          <tr key={a.id} className="border-t border-border-light">
                            <td className="py-2 pr-2 text-zinc-800 whitespace-nowrap sticky left-0 bg-white">
                              {a.nickname || a.name}
                            </td>
                            {SHOT_FIELDS.map((f) => (
                              <Fragment key={f.label}>
                                <td className="py-2 px-1">
                                  <input
                                    type="number"
                                    min={0}
                                    value={v[f.attempted]}
                                    onChange={(e) => updateValue(a.id, f.attempted, e.target.value)}
                                    className="w-10 text-center border border-border-input rounded-md py-1"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <input
                                    type="number"
                                    min={0}
                                    value={v[f.made]}
                                    onChange={(e) => updateValue(a.id, f.made, e.target.value)}
                                    className="w-10 text-center border border-border-input rounded-md py-1"
                                  />
                                </td>
                                <td className="py-2 px-1 text-center text-muted-2 text-xs">
                                  {pct(v[f.made], v[f.attempted]).toFixed(0)}%
                                </td>
                              </Fragment>
                            ))}
                            <td className="py-2 px-1">
                              <input
                                type="number"
                                min={0}
                                value={v.reboundsDef}
                                onChange={(e) => updateValue(a.id, "reboundsDef", e.target.value)}
                                className="w-12 text-center border border-border-input rounded-md py-1"
                              />
                            </td>
                            <td className="py-2 px-1">
                              <input
                                type="number"
                                min={0}
                                value={v.reboundsOff}
                                onChange={(e) => updateValue(a.id, "reboundsOff", e.target.value)}
                                className="w-12 text-center border border-border-input rounded-md py-1"
                              />
                            </td>
                            <td className="py-2 px-1 text-center font-bold text-ink">
                              {reboundsTotal}
                            </td>
                            {OTHER_FIELDS.map((f) => (
                              <td key={f.key} className="py-2 px-1">
                                <input
                                  type="number"
                                  min={0}
                                  value={v[f.key]}
                                  onChange={(e) => updateValue(a.id, f.key, e.target.value)}
                                  className="w-12 text-center border border-border-input rounded-md py-1"
                                />
                              </td>
                            ))}
                            <td className="py-2 px-1 text-center font-bold text-brand-red">
                              {points}
                            </td>
                            <td className="py-2 px-1 text-center font-bold text-ink">{eff}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border-input font-bold text-ink">
                        <td className="py-2 pr-2 whitespace-nowrap sticky left-0 bg-white">Total</td>
                        {SHOT_FIELDS.map((f) => (
                          <Fragment key={f.label}>
                            <td className="py-2 px-1 text-center">
                              {columnTotals.sums[f.attempted]}
                            </td>
                            <td className="py-2 px-1 text-center">{columnTotals.sums[f.made]}</td>
                            <td className="py-2 px-1 text-center text-xs">
                              {pct(columnTotals.sums[f.made], columnTotals.sums[f.attempted]).toFixed(
                                0
                              )}
                              %
                            </td>
                          </Fragment>
                        ))}
                        <td className="py-2 px-1 text-center">{columnTotals.sums.reboundsDef}</td>
                        <td className="py-2 px-1 text-center">{columnTotals.sums.reboundsOff}</td>
                        <td className="py-2 px-1 text-center">{columnTotals.reboundsTotal}</td>
                        {OTHER_FIELDS.map((f) => (
                          <td key={f.key} className="py-2 px-1 text-center">
                            {columnTotals.sums[f.key]}
                          </td>
                        ))}
                        <td className="py-2 px-1 text-center text-brand-red">
                          {columnTotals.points}
                        </td>
                        <td className="py-2 px-1 text-center text-muted-2">—</td>
                      </tr>
                      <tr className="border-t-2 border-dashed border-border-input bg-bg-subtle">
                        <td className="py-2 pr-2 font-bold text-[13px] uppercase tracking-[0.04em] text-muted-3 whitespace-nowrap sticky left-0 bg-bg-subtle">
                          Adversário
                        </td>
                        {SHOT_FIELDS.map((f) => (
                          <Fragment key={f.label}>
                            <td className="py-2 px-1 bg-bg-subtle">
                              <input
                                type="number"
                                min={0}
                                value={opponentStats[f.attempted]}
                                onChange={(e) => updateOpponentValue(f.attempted, e.target.value)}
                                className="w-10 text-center border border-border-input rounded-md py-1 bg-white"
                              />
                            </td>
                            <td className="py-2 px-1 bg-bg-subtle">
                              <input
                                type="number"
                                min={0}
                                value={opponentStats[f.made]}
                                onChange={(e) => updateOpponentValue(f.made, e.target.value)}
                                className="w-10 text-center border border-border-input rounded-md py-1 bg-white"
                              />
                            </td>
                            <td className="py-2 px-1 text-center text-muted-2 text-xs bg-bg-subtle">
                              {pct(opponentStats[f.made], opponentStats[f.attempted]).toFixed(0)}%
                            </td>
                          </Fragment>
                        ))}
                        <td className="py-2 px-1 bg-bg-subtle">
                          <input
                            type="number"
                            min={0}
                            value={opponentStats.reboundsDef}
                            onChange={(e) => updateOpponentValue("reboundsDef", e.target.value)}
                            className="w-12 text-center border border-border-input rounded-md py-1 bg-white"
                          />
                        </td>
                        <td className="py-2 px-1 bg-bg-subtle">
                          <input
                            type="number"
                            min={0}
                            value={opponentStats.reboundsOff}
                            onChange={(e) => updateOpponentValue("reboundsOff", e.target.value)}
                            className="w-12 text-center border border-border-input rounded-md py-1 bg-white"
                          />
                        </td>
                        <td className="py-2 px-1 text-center font-bold text-ink bg-bg-subtle">
                          {opponentReboundsTotal}
                        </td>
                        {OTHER_FIELDS.map((f) => (
                          <td key={f.key} className="py-2 px-1 bg-bg-subtle">
                            <input
                              type="number"
                              min={0}
                              value={opponentStats[f.key]}
                              onChange={(e) => updateOpponentValue(f.key, e.target.value)}
                              className="w-12 text-center border border-border-input rounded-md py-1 bg-white"
                            />
                          </td>
                        ))}
                        <td className="py-2 px-1 text-center font-bold text-brand-red bg-bg-subtle">
                          {opponentPoints}
                        </td>
                        <td className="py-2 px-1 text-center font-bold text-ink bg-bg-subtle">
                          {opponentEff}
                        </td>
                      </tr>
                    </tfoot>
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
            {gameHappened && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving || loading || rosterAthletes.length === 0}
                className="h-11.5 px-6 bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase cursor-pointer disabled:opacity-60"
              >
                {saving ? "Salvando…" : "Salvar estatísticas"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
