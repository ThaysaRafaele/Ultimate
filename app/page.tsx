import { eq, asc } from "drizzle-orm";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { AthleteCard } from "@/components/AthleteCard";
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
        <div className="max-w-[1180px] mx-auto">
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
              <button className="h-[46px] px-5 bg-white text-ink border-[1.5px] border-border-input rounded-lg font-bold text-sm uppercase tracking-[0.04em] cursor-pointer hover:border-ink">
                Importar atletas
              </button>
              <button className="h-[46px] px-[22px] bg-brand-red text-white border-none rounded-lg font-bold text-sm uppercase tracking-[0.04em] cursor-pointer hover:bg-brand-red-hover">
                + Novo atleta
              </button>
            </div>
          </div>

          <div className="flex gap-3.5 mb-6">
            <div className="bg-white border border-border-light rounded-[10px] px-[22px] py-4 flex-1">
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
