import { and, arrayContains, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { AthletesRoster } from "@/components/AthletesRoster";
import { NewAthleteButton } from "@/components/NewAthleteButton";
import { ToggleAthleteActiveButton } from "@/components/ToggleAthleteActiveButton";
import { ALL_TEAMS_ID, findTeamLabel } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";
import { db } from "@/lib/db";
import { athletes } from "@/lib/schema";

export default async function AthletesPage({
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

  // Defaults to "Todos" when no team is picked yet (fresh load, or an
  // unrecognized value) — a real team only takes over once explicitly
  // selected from the dropdown.
  const isAll = !activeTeams.some((t) => t.id === team);
  const teamId = isAll ? ALL_TEAMS_ID : team!;
  const formTeamId = isAll ? activeTeams[0].id : teamId;

  const teamFilter = isAll ? undefined : arrayContains(athletes.teams, [teamId]);

  const [teamAthletes, inactiveTeamAthletes] = await Promise.all([
    db
      .select()
      .from(athletes)
      .where(teamFilter ? and(teamFilter, eq(athletes.active, true)) : eq(athletes.active, true))
      .orderBy(asc(athletes.name)),
    db
      .select()
      .from(athletes)
      .where(teamFilter ? and(teamFilter, eq(athletes.active, false)) : eq(athletes.active, false))
      .orderBy(asc(athletes.name)),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header team={teamId} teams={activeTeams} includeAllTeamsOption />
      <NavBar />
      <main className="flex-1 px-10 max-md:px-4 py-8 max-md:py-5 pb-14">
        <div className="max-w-295 mx-auto">
          <div className="flex items-end justify-between max-md:flex-col max-md:items-stretch max-md:gap-3 mb-6">
            <div>
              <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
                {isAll ? "Todos os atletas" : findTeamLabel(allTeams, teamId)}
              </div>
              <h1 className="font-heading font-bold text-[40px] max-md:text-[28px] uppercase mt-0.5 text-ink">
                Atletas cadastrados
              </h1>
            </div>
            <div className="flex gap-3 max-md:flex-col">
              <Link
                href={`/importar?team=${formTeamId}`}
                className="h-11.5 px-5 bg-white text-ink border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase tracking-[0.04em] cursor-pointer hover:border-ink flex items-center max-md:justify-center"
              >
                Importar atletas
              </Link>
              <NewAthleteButton teamId={formTeamId} teams={allTeams} />
            </div>
          </div>

          <AthletesRoster athletes={teamAthletes} showTeamBadges={isAll} allTeams={allTeams} />

          {inactiveTeamAthletes.length > 0 && (
            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold mb-2">
                Atletas inativos
              </div>
              <div className="flex flex-col gap-2">
                {inactiveTeamAthletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between bg-bg-subtle rounded-lg px-4 py-3"
                  >
                    <Link
                      href={`/perfil/${athlete.id}`}
                      className="font-semibold text-muted-2 hover:underline"
                    >
                      {athlete.name}
                    </Link>
                    <ToggleAthleteActiveButton athleteId={athlete.id} active={false} variant="light" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
