import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { OverviewGames } from "@/components/OverviewGames";
import { OverviewSummary } from "@/components/OverviewSummary";
import { YearFilter } from "@/components/YearFilter";
import { findTeamLabel } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";
import { availableYears, summarizeGames } from "@/lib/overview-calc";
import { getActiveTeamAthletes, getRealizedGameDates, getRealizedGames } from "@/lib/overview-repo";

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

  const teamId = activeTeams.some((t) => t.id === team) ? team! : activeTeams[0].id;
  const teamLabel = findTeamLabel(allTeams, teamId);

  const gameDates = await getRealizedGameDates(teamId);
  const years = availableYears(gameDates);
  const onlyHiddenYears = years.length === 0 && gameDates.length > 0;
  const selectedYear = years.includes(Number(year)) ? Number(year) : (years[0] ?? null);
  const [games, teamAthletes] = await Promise.all([
    selectedYear ? getRealizedGames(teamId, selectedYear) : Promise.resolve([]),
    getActiveTeamAthletes(teamId),
  ]);
  const summary = summarizeGames(games);

  return (
    <div className="flex-1 flex flex-col">
      <Header team={teamId} teams={activeTeams} />
      <NavBar />
      <main className="flex-1 px-10 max-md:px-4 py-8 max-md:py-5 pb-14">
        <div className="max-w-275 mx-auto">
          <div className="flex items-end justify-between gap-4 mb-6 max-md:mb-4 max-md:flex-col max-md:items-start">
            <div>
              <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
                Visão geral · {teamLabel}
              </div>
              <h1 className="font-heading font-bold text-[40px] max-md:text-[28px] uppercase mt-0.5 text-ink leading-tight">
                {selectedYear ? `Resumo de ${selectedYear}` : "Resumo anual"}
              </h1>
            </div>
            {years.length > 0 && (
              <YearFilter years={years} selected={selectedYear} allOption={false} />
            )}
          </div>

          {selectedYear && summary.played > 0 ? (
            <>
              <OverviewSummary summary={summary} />
              <OverviewGames games={games} teamAthletes={teamAthletes} />
            </>
          ) : selectedYear ? (
            <div className="border border-dashed border-border-dash rounded-xl py-16 px-6 text-center">
              <p className="font-heading font-bold text-xl uppercase text-ink mb-1.5">
                Faltam os placares de {selectedYear}
              </p>
              <p className="text-sm text-muted-2 max-w-110 mx-auto mb-5">
                {summary.withoutScore === 1
                  ? "Há 1 jogo realizado sem placar final."
                  : `Há ${summary.withoutScore} jogos realizados sem placar final.`}{" "}
                Informe os placares em Jogos para montar o resumo.
              </p>
              <Link
                href={`/jogos?team=${teamId}`}
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
                  ? `Os jogos de ${teamLabel} são da temporada atual, que entra na visão geral quando o técnico fechar os dados do ano.`
                  : `O resumo de ${teamLabel} aparece aqui assim que um jogo for marcado como realizado, com o placar final.`}
              </p>
              <Link
                href={`/jogos?team=${teamId}`}
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
