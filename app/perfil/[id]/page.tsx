import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { EditAthleteButton } from "@/components/EditAthleteButton";
import { ToggleAthleteActiveButton } from "@/components/ToggleAthleteActiveButton";
import { db } from "@/lib/db";
import { athletes } from "@/lib/schema";
import { getAllTeams } from "@/lib/teams-repo";
import { findTeamLabel } from "@/lib/teams";
import { entryYear, formatDateBR, initials, numLabel } from "@/lib/format";
import { getAthleteAverages, getAthleteBestGame, getAthleteGameLog } from "@/lib/stats-repo";

export default async function PerfilPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const athleteId = Number(id);
  if (!Number.isInteger(athleteId)) notFound();

  const [athlete] = await db.select().from(athletes).where(eq(athletes.id, athleteId));
  if (!athlete) notFound();

  const allTeams = await getAllTeams();
  const activeTeams = allTeams.filter((t) => t.active);
  const headerTeamId =
    athlete.teams.find((t) => activeTeams.some((at) => at.id === t)) ?? activeTeams[0]?.id ?? "";
  const teamLabels = athlete.teams.map((t) => findTeamLabel(allTeams, t)).join(", ");

  const [averages, gameLog, bestGame] = await Promise.all([
    getAthleteAverages(athlete.id),
    getAthleteGameLog(athlete.id),
    getAthleteBestGame(athlete.id),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header team={headerTeamId} teams={activeTeams} />
      <NavBar />
      <main className="flex-1 px-10 py-8 pb-14">
        <div className="max-w-295 mx-auto">
          <Link
            href="/"
            className="bg-transparent border-none text-muted-1 font-semibold text-sm cursor-pointer mb-3.5 p-0 inline-block hover:text-ink"
          >
            ← Voltar para atletas
          </Link>

          <div className="grid grid-cols-[320px_1fr] gap-6">
            <div className="bg-ink-deep rounded-2xl overflow-hidden self-start">
              <div className="h-65 bg-charcoal relative flex items-center justify-center">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(120deg,transparent_0_16px,rgba(255,255,255,.03)_16px_17px)]" />
                {athlete.photoUrl ? (
                  <Image
                    src={athlete.photoUrl}
                    alt={athlete.name}
                    fill
                    className="object-cover"
                    style={{ objectPosition: `${athlete.photoFocusX}% ${athlete.photoFocusY}%` }}
                  />
                ) : (
                  <div className="w-37.5 h-37.5 rounded-full bg-charcoal-light border-4 border-brand-red flex items-center justify-center text-white font-heading font-bold text-5xl relative">
                    {initials(athlete.name)}
                  </div>
                )}
                <div className="absolute top-4 right-5 font-heading font-bold text-5xl text-brand-red leading-none">
                  {numLabel(athlete.number)}
                </div>
              </div>
              <div className="px-6 py-5.5">
                <div className="flex items-center gap-2">
                  <div className="font-heading font-bold text-3xl uppercase text-white leading-none">
                    {athlete.name}
                  </div>
                  {!athlete.active && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-1 border border-charcoal-light rounded-full px-2 py-0.5">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="text-brand-red font-bold uppercase tracking-[0.06em] text-sm mt-1">
                  {athlete.position}
                </div>
                <div className="text-xs text-muted-1 mt-1">{teamLabels}</div>

                <div className="h-px bg-charcoal-light my-4.5" />

                <ProfileRow label="No clube desde" value={entryYear(athlete.entryDate)} />
                <ProfileRow label="Nascimento" value={formatDateBR(athlete.birthDate)} />
                <ProfileRow label="Altura" value={athlete.height ? `${athlete.height} cm` : "—"} />
                <ProfileRow label="Calçado" value={athlete.shoeSize ? String(athlete.shoeSize) : "—"} />
                <ProfileRow label="Contato" value={athlete.contact ?? "—"} />
                <ProfileRow label="E-mail" value={athlete.email ?? "—"} small />
                <ProfileRow label="Camisa" value={numLabel(athlete.number)} last />

                <div className="mt-4.5">
                  <EditAthleteButton athlete={athlete} teams={allTeams} />
                  <ToggleAthleteActiveButton athleteId={athlete.id} active={athlete.active} />
                </div>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-4 gap-3.5 mb-5">
                <StatCard
                  label="Pontos / jogo"
                  value={averages ? averages.ppg.toFixed(1) : "—"}
                  highlight
                />
                <StatCard label="Rebotes / jogo" value={averages ? averages.rpg.toFixed(1) : "—"} />
                <StatCard label="Assist. / jogo" value={averages ? averages.apg.toFixed(1) : "—"} />
                <StatCard label="Roubos / jogo" value={averages ? averages.spg.toFixed(1) : "—"} />
              </div>

              {bestGame && (
                <div className="bg-ink-deep rounded-2xl px-6 py-5 mb-5 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.06em] text-brand-red font-bold mb-1">
                      Melhor jogo
                    </div>
                    <div className="font-heading font-bold text-xl uppercase text-white">
                      Ultimate <span className="text-muted-1 normal-case">vs</span> {bestGame.opponent}
                    </div>
                    <div className="text-xs text-muted-1 mt-0.5">
                      {bestGame.championshipName} · {formatDateBR(bestGame.gameDate)}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <BestGameStat label="Pts" value={bestGame.points} highlight />
                    <BestGameStat label="Reb" value={bestGame.rebounds} />
                    <BestGameStat label="Ast" value={bestGame.assists} />
                    <BestGameStat label="Rou" value={bestGame.steals} />
                  </div>
                </div>
              )}

              {gameLog.length === 0 ? (
                <div className="bg-white border border-border-light rounded-2xl p-11 text-center">
                  <div className="font-heading font-bold text-xl uppercase text-ink mb-2">
                    Sem estatísticas ainda
                  </div>
                  <p className="text-sm text-muted-2 max-w-125 mx-auto">
                    Quando o lançamento de estatísticas for feito para os jogos deste atleta, o
                    histórico aparece aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-border-light rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-zinc-50">
                      <tr className="text-left text-xs uppercase tracking-[0.06em] text-muted-2">
                        <th className="px-5 py-3 font-bold">Data</th>
                        <th className="px-5 py-3 font-bold">Campeonato</th>
                        <th className="px-5 py-3 font-bold">Adversário</th>
                        <th className="px-5 py-3 font-bold text-center">Pts</th>
                        <th className="px-5 py-3 font-bold text-center">Reb</th>
                        <th className="px-5 py-3 font-bold text-center">Ast</th>
                        <th className="px-5 py-3 font-bold text-center">Rou</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameLog.map((g) => (
                        <tr key={g.gameId} className="border-t border-border-light">
                          <td className="px-5 py-3 text-muted-1">{formatDateBR(g.gameDate)}</td>
                          <td className="px-5 py-3 text-ink">{g.championshipName ?? "—"}</td>
                          <td className="px-5 py-3 text-ink">{g.opponent}</td>
                          <td className="px-5 py-3 text-center font-bold text-ink">{g.points}</td>
                          <td className="px-5 py-3 text-center text-ink">{g.rebounds}</td>
                          <td className="px-5 py-3 text-center text-ink">{g.assists}</td>
                          <td className="px-5 py-3 text-center text-ink">{g.steals}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  small,
  last,
}: Readonly<{ label: string; value: string; small?: boolean; last?: boolean }>) {
  return (
    <div className={`flex justify-between text-sm text-muted-1 ${last ? "" : "mb-2"}`}>
      <span>{label}</span>
      <span className={`text-white font-semibold ${small ? "text-[13px]" : ""}`}>{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: Readonly<{ label: string; value: string; highlight?: boolean }>) {
  return (
    <div className="bg-white border border-border-light rounded-xl px-5 py-4.5">
      <div className="text-xs uppercase tracking-[0.06em] text-muted-2 font-bold">{label}</div>
      <div className={`font-heading font-bold text-4xl leading-none ${highlight ? "text-brand-red" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function BestGameStat({
  label,
  value,
  highlight,
}: Readonly<{ label: string; value: number; highlight?: boolean }>) {
  return (
    <div className="text-center">
      <div
        className={`font-heading font-bold text-2xl leading-none ${highlight ? "text-brand-red" : "text-white"}`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.06em] text-muted-1 mt-1">{label}</div>
    </div>
  );
}
