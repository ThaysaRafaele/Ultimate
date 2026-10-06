"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/SearchInput";
import { StatsModal } from "@/components/StatsModal";
import { formatDateBR } from "@/lib/format";
import { QUARTERS, gameResult, groupByChampionship, quarterScore } from "@/lib/overview-calc";
import type { ChampionshipGroup, GameResult, Quarter } from "@/lib/overview-calc";
import { matchesSearch } from "@/lib/text-search";
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
  const allGroups = useMemo(() => groupByChampionship(games), [games]);
  // Championships start collapsed (just the header line), so the tab stays
  // short; a single championship opens right away.
  const [open, setOpen] = useState<ReadonlySet<string>>(() =>
    allGroups.length === 1 ? new Set([allGroups[0].name]) : new Set()
  );
  const allOpen = allGroups.every((g) => open.has(g.name));

  // Searching opens every championship with a match and hides the per-
  // championship totals (they would only add up the matching games).
  const [search, setSearch] = useState("");
  const searching = search.trim() !== "";
  const matching = useMemo(
    () =>
      searching
        ? games.filter((g) =>
            matchesSearch(search, [
              g.opponent,
              g.championshipName,
              formatDateBR(g.gameDate),
              teamLabels?.[g.team],
            ])
          )
        : games,
    [games, search, searching, teamLabels]
  );
  const groups = useMemo(
    () => (searching ? groupByChampionship(matching) : allGroups),
    [searching, matching, allGroups]
  );

  function toggle(name: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <section aria-label="Jogos do ano">
      <div className="flex items-center justify-between gap-3 mb-3.5 text-sm text-muted-1 max-md:flex-col max-md:items-stretch">
        <span>
          {searching
            ? `${matching.length} de ${games.length} jogos`
            : `${allGroups.length} ${allGroups.length === 1 ? "campeonato" : "campeonatos"} · ${games.length} ${games.length === 1 ? "jogo" : "jogos"}`}
          <span className="max-md:block"> · toque num jogo para abrir o boletim</span>
        </span>
        <div className="flex items-center gap-2.5 max-md:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar adversário, campeonato…"
            ariaLabel="Buscar jogo por adversário, campeonato ou data"
            wrapperClassName="h-10 w-64 max-md:flex-1 max-md:w-auto"
            className="border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white"
          />
          {allGroups.length > 1 && !searching && (
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(allGroups.map((g) => g.name)))}
              className="flex-shrink-0 text-xs font-bold uppercase tracking-[0.04em] text-ink hover:text-brand-red cursor-pointer px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
            >
              {allOpen ? "Recolher todos" : "Expandir todos"}
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="border border-dashed border-border-dash rounded-xl py-12 px-6 text-center">
          <p className="text-sm text-muted-2 mb-3">Nenhum jogo encontrado para “{search.trim()}”.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-sm font-bold text-brand-red hover:underline cursor-pointer"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <ChampionshipBlock
              key={group.name}
              group={group}
              expanded={searching || open.has(group.name)}
              onToggle={() => toggle(group.name)}
              onOpen={setSelected}
              teamLabels={teamLabels}
              showTotals={!searching}
            />
          ))}
        </div>
      )}

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
  expanded,
  onToggle,
  onOpen,
  teamLabels,
  showTotals,
}: Readonly<{
  group: ChampionshipGroup<GameWithChampionship>;
  showTotals: boolean;
  expanded: boolean;
  onToggle: () => void;
  onOpen: (g: GameWithChampionship) => void;
  teamLabels?: Record<string, string>;
}>) {
  const bodyId = useId();
  const quarters = QUARTERS.filter((q) => q !== "ot" || group.hasOvertime);
  const { summary } = group;
  const gridCols = group.hasOvertime
    ? "lg:grid-cols-[88px_minmax(0,1fr)_repeat(5,68px)_92px_124px]"
    : "lg:grid-cols-[88px_minmax(0,1fr)_repeat(4,68px)_92px_124px]";

  return (
    <div className="bg-white border border-border-light rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className={`w-full flex items-center gap-3 px-5 max-lg:px-4 py-3.5 text-left cursor-pointer hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red transition-colors ${
          expanded ? "bg-bg-subtle border-b border-border-light" : ""
        }`}
      >
        <span
          aria-hidden
          className={`flex-shrink-0 w-7 h-7 rounded-full inline-flex items-center justify-center transition-transform ${
            expanded ? "rotate-90 bg-brand-red text-white" : "bg-bg-subtle-2 text-ink"
          }`}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading font-bold text-lg uppercase text-ink leading-tight truncate">
            {group.name}
          </span>
          <span className="block text-xs text-muted-1">
            {group.games.length} {group.games.length === 1 ? "jogo" : "jogos"}
            {summary.played > 0 && ` · ${summary.pointsFor} × ${summary.pointsAgainst} pontos`}
            <span className="max-md:hidden"> · {expanded ? "toque para recolher" : "toque para ver os jogos"}</span>
          </span>
        </span>
        <span className="flex gap-1.5 flex-shrink-0">
          <Pill className="bg-green-50 text-green-700">{summary.wins}V</Pill>
          <Pill className="bg-red-50 text-brand-red">{summary.losses}D</Pill>
          {summary.draws > 0 && <Pill className="bg-zinc-100 text-muted-3">{summary.draws}E</Pill>}
        </span>
      </button>

      {expanded && (
        <div id={bodyId}>
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
                    title={`Abrir o boletim contra ${g.opponent}`}
                    className={`group/row w-full text-left grid grid-cols-[minmax(0,1fr)_auto] ${gridCols} gap-x-2 items-center px-5 max-lg:px-4 py-3 cursor-pointer hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-red transition-colors`}
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
                      <span
                        aria-hidden
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-bg-subtle-2 text-muted-1 inline-flex items-center justify-center text-sm font-bold group-hover/row:bg-brand-red group-hover/row:text-white transition-colors"
                      >
                        ›
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {showTotals && <BlockFooter group={group} quarters={quarters} gridCols={gridCols} />}
        </div>
      )}
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
