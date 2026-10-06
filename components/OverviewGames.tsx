"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsModal } from "@/components/StatsModal";
import { formatDateBR } from "@/lib/format";
import { QUARTERS, gameResult, groupByChampionship, quarterScore } from "@/lib/overview-calc";
import type { ChampionshipGroup, GameResult, Quarter } from "@/lib/overview-calc";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

const QUARTER_LABEL: Record<Quarter, string> = { q1: "Q1", q2: "Q2", q3: "Q3", q4: "Q4", ot: "Prorr." };

const RESULT_BADGE: Record<GameResult, { label: string; short: string; className: string }> = {
  vitoria: { label: "Vitória", short: "V", className: "bg-green-50 text-green-700" },
  derrota: { label: "Derrota", short: "D", className: "bg-red-50 text-brand-red" },
  empate: { label: "Empate", short: "E", className: "bg-zinc-100 text-muted-3" },
};

const decimal = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function OverviewGames({
  games,
  teamAthletes,
  teamLabels,
}: Readonly<{
  games: GameWithChampionship[];
  teamAthletes: Athlete[];
  // Set when showing every category: tags each game with its category.
  teamLabels?: Record<string, string>;
}>) {
  const [selected, setSelected] = useState<GameWithChampionship | null>(null);
  const router = useRouter();
  const groups = useMemo(() => groupByChampionship(games), [games]);

  return (
    <section className="mt-9 max-lg:mt-7">
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="font-heading font-bold text-2xl uppercase text-ink">Jogos do ano</h2>
        <span className="text-sm text-muted-1">
          {groups.length} {groups.length === 1 ? "campeonato" : "campeonatos"} · {games.length}{" "}
          {games.length === 1 ? "jogo" : "jogos"}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <ChampionshipBlock key={group.name} group={group} onOpen={setSelected} teamLabels={teamLabels} />
        ))}
      </div>

      {selected && (
        <StatsModal
          game={selected}
          teamAthletes={teamAthletes}
          onClose={() => {
            setSelected(null);
            // The boletim may have changed scores; reload the summary and list.
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function ChampionshipBlock({
  group,
  onOpen,
  teamLabels,
}: Readonly<{
  group: ChampionshipGroup<GameWithChampionship>;
  onOpen: (g: GameWithChampionship) => void;
  teamLabels?: Record<string, string>;
}>) {
  const quarters = QUARTERS.filter((q) => q !== "ot" || group.hasOvertime);
  const { summary } = group;
  const gridCols = group.hasOvertime
    ? "lg:grid-cols-[88px_minmax(0,1fr)_repeat(5,68px)_92px_92px]"
    : "lg:grid-cols-[88px_minmax(0,1fr)_repeat(4,68px)_92px_92px]";

  return (
    <div className="bg-white border border-border-light rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 max-lg:px-4 py-3.5 border-b border-border-light bg-bg-subtle">
        <div className="min-w-0">
          <div className="font-heading font-bold text-lg uppercase text-ink leading-tight truncate">{group.name}</div>
          <div className="text-xs text-muted-1">
            {group.games.length} {group.games.length === 1 ? "jogo" : "jogos"}
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <Pill className="bg-green-50 text-green-700">{summary.wins}V</Pill>
          <Pill className="bg-red-50 text-brand-red">{summary.losses}D</Pill>
          {summary.draws > 0 && <Pill className="bg-zinc-100 text-muted-3">{summary.draws}E</Pill>}
        </div>
      </div>

      <div
        className={`hidden lg:grid ${gridCols} gap-x-2 px-5 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-2 font-bold border-b border-border-light`}
      >
        <span>Data</span>
        <span>Adversário</span>
        {quarters.map((q) => (
          <span key={q} className="text-center">
            {QUARTER_LABEL[q]}
          </span>
        ))}
        <span className="text-center">Final</span>
        <span className="text-right">Resultado</span>
      </div>

      <ul>
        {group.games.map((g) => {
          const result = g.ourScore != null && g.theirScore != null ? gameResult(g.ourScore, g.theirScore) : null;
          return (
            <li key={g.id} className="border-b border-border-light last:border-b-0">
              <button
                type="button"
                onClick={() => onOpen(g)}
                title="Abrir boletim"
                className={`w-full text-left grid grid-cols-[minmax(0,1fr)_auto] ${gridCols} gap-x-2 items-center px-5 max-lg:px-4 py-3 cursor-pointer hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red transition-colors`}
              >
                <span className="text-[13px] text-muted-1 max-lg:col-span-2 max-lg:text-xs">{formatDateBR(g.gameDate)}</span>
                <span className="font-bold text-ink truncate max-lg:text-[15px]">
                  {g.opponent}
                  {teamLabels && (
                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[0.06em] text-muted-1 border border-border-light rounded-full px-1.5 py-px">
                      {teamLabels[g.team] ?? g.team}
                    </span>
                  )}
                </span>
                {quarters.map((q) => (
                  <QuarterCell key={q} score={quarterScore(g, q)} />
                ))}
                <span className="font-heading font-bold text-xl text-ink text-center max-lg:hidden tabular-nums">
                  {g.ourScore ?? "–"} × {g.theirScore ?? "–"}
                </span>
                <span className="flex items-center justify-end gap-2">
                  <span className="lg:hidden font-heading font-bold text-lg text-ink tabular-nums">
                    {g.ourScore ?? "–"} × {g.theirScore ?? "–"}
                  </span>
                  {result ? (
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.03em] ${RESULT_BADGE[result].className}`}
                    >
                      <span className="max-lg:hidden">{RESULT_BADGE[result].label}</span>
                      <span className="lg:hidden" aria-hidden>{RESULT_BADGE[result].short}</span>
                      <span className="sr-only lg:hidden">{RESULT_BADGE[result].label}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-2">sem placar</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <BlockFooter group={group} quarters={quarters} gridCols={gridCols} />
    </div>
  );
}

function BlockFooter({
  group,
  quarters,
  gridCols,
}: Readonly<{ group: ChampionshipGroup<GameWithChampionship>; quarters: readonly Quarter[]; gridCols: string }>) {
  const { summary, quarterTotals } = group;
  if (summary.played === 0) return null;

  const rows = [
    {
      label: "Total",
      quarter: (q: Quarter) => (quarterTotals[q].games ? `${quarterTotals[q].our}–${quarterTotals[q].their}` : "–"),
      final: `${summary.pointsFor} × ${summary.pointsAgainst}`,
    },
    {
      label: "Média",
      quarter: (q: Quarter) => {
        const t = quarterTotals[q];
        return t.games ? `${decimal(t.our / t.games)}–${decimal(t.their / t.games)}` : "–";
      },
      final: `${decimal(summary.avgFor)} × ${decimal(summary.avgAgainst)}`,
    },
  ];

  return (
    <div className="bg-bg-subtle border-t border-border-light">
      {rows.map((row) => (
        <div
          key={row.label}
          className={`grid grid-cols-[minmax(0,1fr)_auto] ${gridCols} gap-x-2 items-center px-5 max-lg:px-4 py-2 text-[13px]`}
        >
          <span className="font-bold uppercase text-[11px] tracking-[0.06em] text-muted-1">{row.label}</span>
          <span className="max-lg:hidden" />
          {quarters.map((q) => (
            <span key={q} className="text-center text-muted-1 tabular-nums whitespace-nowrap max-lg:hidden">
              {row.quarter(q)}
            </span>
          ))}
          <span className="font-bold text-ink text-center tabular-nums whitespace-nowrap max-lg:text-right">{row.final}</span>
          <span className="max-lg:hidden" />
        </div>
      ))}
    </div>
  );
}

function QuarterCell({ score }: Readonly<{ score: { our: number; their: number } | null }>) {
  if (!score) return <span className="hidden lg:block text-center text-muted-2">–</span>;
  const tone = score.our > score.their ? "text-green-700" : score.our < score.their ? "text-brand-red" : "text-muted-3";
  return (
    <span className="hidden lg:block text-center text-[13px] tabular-nums">
      <span className={`font-bold ${tone}`}>{score.our}</span>
      <span className="text-muted-2">–{score.their}</span>
    </span>
  );
}

function Pill({ className, children }: Readonly<{ className: string; children: React.ReactNode }>) {
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${className}`}>{children}</span>;
}
