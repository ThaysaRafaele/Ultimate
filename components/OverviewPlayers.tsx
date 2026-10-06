"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/SearchInput";
import { matchesSearch } from "@/lib/text-search";
import type { PlayerSummary, ShotLine } from "@/lib/overview-calc";

type Mode = "totais" | "medias";
type StatKey = keyof PlayerSummary["totals"];
type SortKey = "name" | "games" | StatKey | "fg2" | "fg3" | "ft";

const STAT_COLUMNS: { key: StatKey; label: string; title: string }[] = [
  { key: "points", label: "PTS", title: "Pontos" },
  { key: "rebounds", label: "REB", title: "Rebotes" },
  { key: "assists", label: "AST", title: "Assistências" },
  { key: "steals", label: "ROU", title: "Roubos de bola" },
  { key: "blocks", label: "TOC", title: "Tocos" },
  { key: "turnovers", label: "ERR", title: "Erros" },
  { key: "fouls", label: "FAL", title: "Faltas" },
];

const SHOT_COLUMNS: { key: "fg2" | "fg3" | "ft"; label: string; title: string }[] = [
  { key: "fg2", label: "2P", title: "Arremessos de 2 (convertidos/tentados)" },
  { key: "fg3", label: "3P", title: "Arremessos de 3 (convertidos/tentados)" },
  { key: "ft", label: "LL", title: "Lances livres (convertidos/tentados)" },
];

const decimal = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const byName = (a: PlayerSummary, b: PlayerSummary) =>
  (a.nickname ?? a.name).localeCompare(b.nickname ?? b.name, "pt-BR");
const percent = (p: number | null) => (p == null ? "–" : `${Math.round(p * 100)}%`);

function sortValue(p: PlayerSummary, key: SortKey, mode: Mode): number | string | null {
  if (key === "name") return (p.nickname ?? p.name).toLowerCase();
  if (key === "games") return p.games;
  if (key === "fg2" || key === "fg3" || key === "ft") return p[key].pct ?? null;
  return mode === "totais" ? p.totals[key] : p.averages[key];
}

export function OverviewPlayers({
  players,
  year,
  othersPoints,
  teamGames,
}: Readonly<{
  players: PlayerSummary[];
  // null = "Resumo geral": career totals over every visible year.
  year: number | null;
  othersPoints: number;
  teamGames: number;
}>) {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("totais");

  // Back link of the profile: this same overview, on the players tab.
  const profileHref = (athleteId: number) => {
    const back = new URLSearchParams(searchParams.toString());
    back.set("aba", "jogadores");
    const query = new URLSearchParams({ voltar: `/visao-geral?${back}` });
    if (year) query.set("year", String(year));
    return `/perfil/${athleteId}?${query}`;
  };
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "points", dir: "desc" });

  const sorted = useMemo(() => {
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...players].sort((a, b) => {
      const va = sortValue(a, sort.key, mode);
      const vb = sortValue(b, sort.key, mode);
      // Players without attempts (null %) always go last, whatever the direction.
      if (va === null || vb === null) return va === vb ? byName(a, b) : va === null ? 1 : -1;
      if (va === vb) return byName(a, b);
      if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb, "pt-BR") * factor;
      return (va > vb ? 1 : -1) * factor;
    });
  }, [players, sort, mode]);

  const [search, setSearch] = useState("");
  const searching = search.trim() !== "";
  const visible = useMemo(
    () => (searching ? sorted.filter((p) => matchesSearch(search, [p.nickname, p.name])) : sorted),
    [sorted, search, searching]
  );

  function toggleSort(key: SortKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "name" ? "asc" : "desc" }
    );
  }

  return (
    <section aria-label={year ? "Jogadores do ano" : "Jogadores em todos os anos"}>
      <div className="flex items-center justify-between gap-3 mb-3.5 max-md:flex-col max-md:items-stretch">
        <p className="text-sm text-muted-1">
          {searching
            ? `${visible.length} de ${players.length} jogadores`
            : `${players.length} ${players.length === 1 ? "jogador" : "jogadores"} com estatísticas lançadas`}
          {players.length > 0 && <span className="max-md:block"> · toque no nome para ver o perfil completo</span>}
        </p>
        {players.length > 0 && (
          <div className="flex items-center gap-2.5 max-md:flex-col max-md:items-stretch">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar jogador…"
              ariaLabel="Buscar jogador por nome ou apelido"
              wrapperClassName="h-10 w-56 max-md:w-full"
              className="border-[1.5px] border-border-input rounded-lg px-3 text-[15px] text-zinc-800 bg-white"
            />
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
        )}
      </div>

      {players.length === 0 ? (
        <div className="border border-dashed border-border-dash rounded-xl py-12 px-6 text-center text-sm text-muted-2">
          {year
            ? "Nenhuma estatística de jogador foi lançada nos jogos deste ano."
            : "Nenhuma estatística de jogador foi lançada nos jogos ainda."}
        </div>
      ) : visible.length === 0 ? (
        <div className="border border-dashed border-border-dash rounded-xl py-12 px-6 text-center">
          <p className="text-sm text-muted-2 mb-3">Nenhum jogador encontrado para “{search.trim()}”.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-sm font-bold text-brand-red hover:underline cursor-pointer"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="bg-white border border-border-light rounded-xl overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-muted-2 border-b border-border-light">
                <SortHeader label="Jogador" sortKey="name" sort={sort} onSort={toggleSort} sticky align="left" />
                <SortHeader label="J" title="Jogos disputados" sortKey="games" sort={sort} onSort={toggleSort} />
                {STAT_COLUMNS.map((c) => (
                  <SortHeader key={c.key} label={c.label} title={c.title} sortKey={c.key} sort={sort} onSort={toggleSort} />
                ))}
                {SHOT_COLUMNS.map((c) => (
                  <SortHeader key={c.key} label={c.label} title={`${c.title}; ordena pelo %`} sortKey={c.key} sort={sort} onSort={toggleSort} />
                ))}
                <SortHeader label="EFF" title="Eficiência" sortKey="eff" sort={sort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const stats = mode === "totais" ? p.totals : p.averages;
                const fmt = mode === "totais" ? (n: number) => n.toLocaleString("pt-BR") : decimal;
                return (
                  <tr key={p.athleteId} className="group border-b border-border-light last:border-b-0 hover:bg-bg-subtle">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-bg-subtle px-4 py-2.5 min-w-40 max-md:min-w-32 shadow-[1px_0_0_var(--color-border-light)]">
                      <Link
                        href={profileHref(p.athleteId)}
                        className="group/link flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red rounded"
                        title={year ? `Ver o perfil de ${p.nickname ?? p.name} em ${year}` : `Ver o perfil de ${p.nickname ?? p.name}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="font-bold text-ink underline decoration-border-input decoration-1 underline-offset-4 group-hover/link:text-brand-red group-hover/link:decoration-brand-red">
                            {p.nickname ?? p.name}
                          </span>
                          {!p.active && (
                            <span className="ml-1.5 align-middle text-[10px] font-bold uppercase tracking-[0.06em] text-muted-1 border border-border-light rounded-full px-1.5 py-px">
                              Inativo
                            </span>
                          )}
                          {p.nickname && (
                            <span className="block text-[11px] text-muted-1 truncate max-w-48">{p.name}</span>
                          )}
                        </span>
                        <span
                          aria-hidden
                          className="flex-shrink-0 w-6 h-6 rounded-full bg-bg-subtle-2 text-muted-1 inline-flex items-center justify-center text-sm font-bold group-hover/link:bg-brand-red group-hover/link:text-white transition-colors"
                        >
                          ›
                        </span>
                      </Link>
                    </td>
                    <Num>{p.games}</Num>
                    {STAT_COLUMNS.map((c) => (
                      <Num key={c.key} strong={c.key === "points"}>
                        {fmt(stats[c.key])}
                      </Num>
                    ))}
                    {SHOT_COLUMNS.map((c) => (
                      <ShotCell key={c.key} line={p[c.key]} />
                    ))}
                    <Num tone={stats.eff < 0 ? "text-brand-red" : undefined}>{fmt(stats.eff)}</Num>
                  </tr>
                );
              })}
              {othersPoints !== 0 && !searching && (
                <tr className="bg-bg-subtle text-muted-1">
                  <td
                    className="sticky left-0 z-10 bg-bg-subtle px-4 py-2.5 italic shadow-[1px_0_0_var(--color-border-light)]"
                    title="Pontos do placar oficial que não aparecem no boletim de nenhum atleta cadastrado (jogadores que ainda não têm cadastro no sistema)."
                  >
                    {othersPoints > 0 ? "Outros (sem cadastro)" : "Boletim acima do placar"}
                    <span className="block text-[11px] not-italic">só pontos</span>
                  </td>
                  <Num>–</Num>
                  <Num strong>
                    {mode === "totais"
                      ? othersPoints.toLocaleString("pt-BR")
                      : decimal(teamGames > 0 ? othersPoints / teamGames : 0)}
                  </Num>
                  <td colSpan={STAT_COLUMNS.length - 1 + SHOT_COLUMNS.length + 1} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ModeToggle({ mode, onChange }: Readonly<{ mode: Mode; onChange: (m: Mode) => void }>) {
  return (
    <div role="radiogroup" aria-label="Exibir" className="inline-flex bg-bg-subtle-2 rounded-lg p-1">
      {(["totais", "medias"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => onChange(m)}
          className={`px-3.5 h-8 rounded-md text-xs font-bold uppercase tracking-[0.04em] cursor-pointer transition-colors ${
            mode === m ? "bg-white text-ink shadow-sm" : "text-muted-1 hover:text-ink"
          }`}
        >
          {m === "totais" ? "Totais" : "Médias por jogo"}
        </button>
      ))}
    </div>
  );
}

function SortHeader({
  label,
  title,
  sortKey,
  sort,
  onSort,
  sticky,
  align = "right",
}: Readonly<{
  label: string;
  title?: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  sticky?: boolean;
  align?: "left" | "right";
}>) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      className={`font-bold py-2.5 px-2.5 whitespace-nowrap ${align === "left" ? "text-left px-4" : "text-right"} ${
        sticky ? "sticky left-0 z-20 bg-white shadow-[1px_0_0_var(--color-border-light)]" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        title={title ?? label}
        aria-label={`Ordenar por ${title ?? label}`}
        className={`inline-flex items-center gap-1 uppercase cursor-pointer hover:text-ink ${active ? "text-ink" : ""}`}
      >
        {label}
        <span aria-hidden className={active ? "text-brand-red" : "opacity-0"}>
          {sort.dir === "asc" && active ? "▲" : "▼"}
        </span>
      </button>
    </th>
  );
}

function Num({
  children,
  strong,
  tone,
}: Readonly<{ children: React.ReactNode; strong?: boolean; tone?: string }>) {
  return (
    <td
      className={`px-2.5 py-2.5 text-right tabular-nums whitespace-nowrap ${
        tone ?? (strong ? "text-brand-red" : "text-ink")
      } ${strong ? "font-bold" : ""}`}
    >
      {children}
    </td>
  );
}

function ShotCell({ line }: Readonly<{ line: ShotLine }>) {
  return (
    <td className="px-2.5 py-2 text-right tabular-nums whitespace-nowrap">
      <span className="block text-ink">
        {line.made}/{line.attempted}
      </span>
      <span className="block text-[11px] text-muted-1">{percent(line.pct)}</span>
    </td>
  );
}
