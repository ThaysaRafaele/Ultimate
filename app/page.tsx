import { and, arrayContains, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { AthleteCard } from "@/components/AthleteCard";
import { NewAthleteButton } from "@/components/NewAthleteButton";
import { findTeamLabel } from "@/lib/teams";
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

  const teamId = activeTeams.some((t) => t.id === team) ? team! : activeTeams[0].id;

  const teamAthletes = await db
    .select()
    .from(athletes)
    .where(and(arrayContains(athletes.teams, [teamId]), eq(athletes.active, true)))
    .orderBy(asc(athletes.name));

  return (
    <div className="flex-1 flex flex-col">
      <Header team={teamId} teams={activeTeams} />
      <NavBar />
      <main className="flex-1 px-10 py-8 pb-14">
        <div className="max-w-295 mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
                {findTeamLabel(allTeams, teamId)}
              </div>
              <h1 className="font-heading font-bold text-[40px] uppercase mt-0.5 text-ink">
                Atletas cadastrados
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/importar?team=${teamId}`}
                className="h-11.5 px-5 bg-white text-ink border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase tracking-[0.04em] cursor-pointer hover:border-ink flex items-center"
              >
                Importar atletas
              </Link>
              <NewAthleteButton teamId={teamId} teams={allTeams} />
            </div>
          </div>

          <div className="flex gap-3.5 mb-6">
            <div className="bg-white border border-border-light rounded-[10px] px-5.5 py-4 flex-1">
              <div className="text-xs uppercase tracking-[0.08em] text-muted-2 font-semibold">
                Total no elenco
              </div>
              <div className="font-heading font-bold text-[34px] text-ink">{teamAthletes.length}</div>
            </div>
          </div>

          {teamAthletes.length === 0 ? (
            <div className="border border-dashed border-border-dash rounded-xl py-16 text-center text-muted-2">
              Nenhum atleta cadastrado ainda.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {teamAthletes.map((athlete) => (
                <AthleteCard key={athlete.id} athlete={athlete} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
