import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { GamesList } from "@/components/GamesList";
import { NewGameButton } from "@/components/NewGameButton";
import { findTeamLabel } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";
import { getAllChampionships } from "@/lib/championships-repo";
import { getGamesByTeam } from "@/lib/games-repo";

export default async function JogosPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ team?: string }>;
}>) {
  const { team } = await searchParams;

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

  const [teamGames, championships] = await Promise.all([
    getGamesByTeam(teamId),
    getAllChampionships(),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header team={teamId} teams={activeTeams} />
      <NavBar />
      <main className="flex-1 px-10 max-md:px-4 py-8 max-md:py-5 pb-14">
        <div className="max-w-275 mx-auto">
          <div className="flex items-end justify-between max-md:flex-col max-md:items-stretch max-md:gap-3 mb-6">
            <div>
              <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
                Calendário · {findTeamLabel(allTeams, teamId)}
              </div>
              <h1 className="font-heading font-bold text-[40px] max-md:text-[28px] uppercase mt-0.5 text-ink">
                Jogos &amp; campeonatos
              </h1>
            </div>
            <NewGameButton teamId={teamId} teams={activeTeams} championships={championships} />
          </div>

          {teamGames.length === 0 ? (
            <div className="border border-dashed border-border-dash rounded-xl py-16 text-center text-muted-2">
              Nenhum jogo cadastrado ainda.
            </div>
          ) : (
            <GamesList games={teamGames} teamId={teamId} teams={activeTeams} championships={championships} />
          )}
        </div>
      </main>
    </div>
  );
}
