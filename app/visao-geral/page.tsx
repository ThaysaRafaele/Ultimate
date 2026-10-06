import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { OverviewGames } from "@/components/OverviewGames";
import { OverviewPlayers } from "@/components/OverviewPlayers";
import { OverviewSummary } from "@/components/OverviewSummary";
import { OverviewYears } from "@/components/OverviewYears";
import { YearFilter } from "@/components/YearFilter";
import { ALL_TEAMS_ID, findTeamLabel } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";
import {
  availableYears,
  othersPoints,
  summarizeByYear,
  summarizeGames,
  summarizePlayers,
} from "@/lib/overview-calc";
import {
  getActiveTeamAthletes,
  getPlayerStatsForYear,
  getRealizedGameDates,
  getRealizedGames,
} from "@/lib/overview-repo";

// ?year=todos opens the "Resumo geral" (every visible year).
const ALL_YEARS = "todos";
const ALL_TEAMS_LABEL = "Todas as categorias";

export default async function VisaoGeralPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ team?: string; year?: string }>;
}>) {
  const { team, year } = await searchParams;

  const allTeams = await getAllTeams();
  const activeTeams = allTeams.filter((t) => t.active);

  if (activeTeams.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-zinc-100">
        <p className="text-muted-2">Nenhuma categoria ativa ainda.</p>
        <Link
          href="/times"
          className="h-11.5 px-5 bg-brand-red text-white rounded-lg font-bold text-sm uppercase flex items-center"
        >
          Cadastrar categoria
        </Link>
      </div>
    );
  }

  const allTeamsSelected = team === ALL_TEAMS_ID;
  const teamId = allTeamsSelected
    ? ALL_TEAMS_ID
    : activeTeams.some((t) => t.id === team)
      ? team!
      : activeTeams[0].id;
  // Repo filter: null = every category.
  const teamFilter = allTeamsSelected ? null : teamId;
  const teamLabel = allTeamsSelected ? ALL_TEAMS_LABEL : findTeamLabel(allTeams, teamId);

  const gameDates = await getRealizedGameDates(teamFilter);
  const years = availableYears(gameDates);
  const onlyHiddenYears = years.length === 0 && gameDates.length > 0;
  const allYears = year === ALL_YEARS && years.length > 0;
  const selectedYear = allYears ? null : years.includes(Number(year)) ? Number(year) : (years[0] ?? null);
  const hasPeriod = allYears || selectedYear !== null;
  const [games, teamAthletes, playerRows] = await Promise.all([
    hasPeriod ? getRealizedGames(teamFilter, selectedYear) : Promise.resolve([]),
    selectedYear ? getActiveTeamAthletes(teamFilter) : Promise.resolve([]),
    hasPeriod ? getPlayerStatsForYear(teamFilter, selectedYear) : Promise.resolve([]),
  ]);
  const byYear = summarizeByYear(games);
  const summary = allYears ? byYear.total : summarizeGames(games);
  const players = summarizePlayers(playerRows);
  const teamLabels = allTeamsSelected ? Object.fromEntries(allTeams.map((t) => [t.id, t.label])) : undefined;
  const yearHref = (y: number) => `/visao-geral?team=${teamId}&year=${y}`;
  const gamesHref = allTeamsSelected ? "/jogos" : `/jogos?team=${teamId}`;
  // With realized games missing the final score, the official total is
  // incomplete and the difference would be misleading: hide the row.
  const others = summary.withoutScore > 0 ? 0 : othersPoints(summary.pointsFor, players);

  return (
    <div className="flex-1 flex flex-col">
      <Header team={teamId} teams={activeTeams} includeAllTeamsOption allTeamsLabel={ALL_TEAMS_LABEL} />
      <NavBar />
      <main className="flex-1 px-10 max-md:px-4 py-8 max-md:py-5 pb-14">
        <div className="max-w-275 mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6 max-md:mb-4 max-md:flex-col max-md:items-start">
            <div>
              <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
                Visão geral · {teamLabel}
              </div>
              <h1 className="font-heading font-bold text-[40px] max-md:text-[28px] uppercase mt-0.5 text-ink leading-tight">
                {allYears ? "Resumo geral" : selectedYear ? `Resumo de ${selectedYear}` : "Resumo anual"}
              </h1>
            </div>
            {years.length > 0 && (
              <YearFilter years={years} selected={selectedYear} allValue={ALL_YEARS} />
            )}
          </div>

          {allYears && summary.played > 0 ? (
            <>
              <OverviewYears years={byYear.years} total={byYear.total} yearHref={yearHref} />
              <OverviewPlayers players={players} year={null} othersPoints={others} teamGames={summary.played} />
            </>
          ) : selectedYear && summary.played > 0 ? (
            <>
              <OverviewSummary summary={summary} />
              <OverviewGames games={games} teamAthletes={teamAthletes} teamLabels={teamLabels} />
              <OverviewPlayers players={players} year={selectedYear} othersPoints={others} teamGames={summary.played} />
            </>
          ) : hasPeriod ? (
            <div className="border border-dashed border-border-dash rounded-xl py-16 px-6 text-center">
              <p className="font-heading font-bold text-xl uppercase text-ink mb-1.5">
                {allYears ? "Faltam os placares dos jogos" : `Faltam os placares de ${selectedYear}`}
              </p>
              <p className="text-sm text-muted-2 max-w-110 mx-auto mb-5">
                {summary.withoutScore === 1
                  ? "Há 1 jogo realizado sem placar final."
                  : `Há ${summary.withoutScore} jogos realizados sem placar final.`}{" "}
                Informe os placares em Jogos para montar o resumo.
              </p>
              <Link
                href={gamesHref}
                className="inline-flex items-center h-10 px-4 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg font-bold text-sm uppercase"
              >
                Ir para Jogos
              </Link>
            </div>
          ) : (
            <div className="border border-dashed border-border-dash rounded-xl py-16 px-6 text-center">
              <p className="font-heading font-bold text-xl uppercase text-ink mb-1.5">
                {onlyHiddenYears ? "Temporada ainda em andamento" : "Nenhum jogo realizado ainda"}
              </p>
              <p className="text-sm text-muted-2 max-w-110 mx-auto mb-5">
                {onlyHiddenYears
                  ? `Os jogos de ${allTeamsSelected ? "todas as categorias" : teamLabel} são da temporada atual, que entra na visão geral quando o técnico fechar os dados do ano.`
                  : `O resumo de ${allTeamsSelected ? "todas as categorias" : teamLabel} aparece aqui assim que um jogo for marcado como realizado, com o placar final.`}
              </p>
              <Link
                href={gamesHref}
                className="inline-flex items-center h-10 px-4 bg-brand-red hover:bg-brand-red-hover text-white rounded-lg font-bold text-sm uppercase"
              >
                Ir para Jogos
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
