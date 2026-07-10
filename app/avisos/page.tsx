import Link from "next/link";
import { Header } from "@/components/Header";
import { NavBar } from "@/components/NavBar";
import { getAllTeams } from "@/lib/teams-repo";
import { getRecentNotifications } from "@/lib/notifications-repo";
import { formatDateBR } from "@/lib/format";

// NavBar reads useSearchParams(), which needs a Suspense boundary to be
// statically prerendered — every other page sidesteps this by declaring a
// `searchParams` prop (forcing dynamic rendering); this route has none, so
// it opts out explicitly instead.
export const dynamic = "force-dynamic";

export default async function AvisosPage() {
  const allTeams = await getAllTeams();
  const activeTeams = allTeams.filter((t) => t.active);
  const headerTeamId = activeTeams[0]?.id ?? "";

  const notifications = await getRecentNotifications();

  return (
    <div className="flex-1 flex flex-col">
      <Header team={headerTeamId} teams={activeTeams} />
      <NavBar />
      <main className="flex-1 px-10 py-8 pb-14">
        <div className="max-w-275 mx-auto">
          <div className="mb-6">
            <div className="font-heading font-semibold text-[13px] tracking-[0.24em] text-brand-red uppercase">
              Avisos
            </div>
            <h1 className="font-heading font-bold text-[40px] uppercase mt-0.5 text-ink">
              Recordes pessoais
            </h1>
          </div>

          {notifications.length === 0 ? (
            <div className="border border-dashed border-border-dash rounded-xl py-16 text-center text-muted-2">
              Nenhum recorde pessoal registrado ainda.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="bg-white border border-border-light rounded-xl px-5.5 py-4.5"
                  style={{ borderLeft: "4px solid #E11B22" }}
                >
                  <div className="font-heading font-bold text-lg uppercase text-ink">
                    <Link href={`/perfil/${n.athleteId}`} className="hover:underline">
                      {n.athleteName}
                    </Link>{" "}
                    bateu novo recorde pessoal!
                  </div>
                  <div className="text-sm text-muted-1 mt-0.5">
                    {n.statLabel}: <span className="font-bold text-brand-red">{n.value}</span> ·
                    Ultimate vs {n.opponent} · {formatDateBR(n.gameDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
