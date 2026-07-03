import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { AthletesGrid } from "@/components/AthletesGrid";
import { NewAthleteButton } from "@/components/NewAthleteButton";
import { DEFAULT_TEAM_ID, teamLabel } from "@/lib/teams";
import { db } from "@/lib/db";
import { athletes } from "@/lib/schema";

export default async function AthletesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ team?: string }>;
}>) {
  const { team } = await searchParams;
  const teamId = team ?? DEFAULT_TEAM_ID;

  const teamAthletes = await db
    .select()
    .from(athletes)
    .where(eq(athletes.team, teamId))
    .orderBy(asc(athletes.name));

  return (
    <div className="flex-1 flex flex-col">
      <Header team={teamId} />
      <NavBar />
      <main className="flex-1 px-10 py-8 pb-14">
        <div className="max-w-295 mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
                {teamLabel(teamId)}
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
              <NewAthleteButton teamId={teamId} teamLabel={teamLabel(teamId)} />
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
            <AthletesGrid athletes={teamAthletes} teamId={teamId} teamLabel={teamLabel(teamId)} />
          )}
        </div>
      </main>
    </div>
  );
}
