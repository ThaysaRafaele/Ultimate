import Link from "next/link";
import Image from "next/image";
import { TeamsManager } from "@/components/TeamsManager";
import { getAllTeams } from "@/lib/teams-repo";

// No dynamic segments/searchParams here, so Next would otherwise prerender
// this page once at build/deploy time — freezing the team list as it was
// at that moment instead of reflecting teams created afterward.
export const dynamic = "force-dynamic";

export default async function TimesPage() {
  const allTeams = await getAllTeams();

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-[72px] bg-ink-deep flex items-center px-6 flex-shrink-0">
        <Image src="/logo.png" alt="Ultimate" height={44} width={44} className="h-11 w-auto block" priority />
      </header>
      <main className="flex-1 px-10 py-8 pb-14">
        <div className="max-w-150 mx-auto">
          <Link
            href="/"
            className="bg-transparent border-none text-muted-1 font-semibold text-sm cursor-pointer mb-3.5 p-0 inline-block hover:text-ink"
          >
            ← Voltar para atletas
          </Link>
          <h1 className="font-heading font-bold text-[40px] uppercase mt-0.5 mb-6 text-ink">
            Gerenciar times
          </h1>
          <TeamsManager teams={allTeams} />
        </div>
      </main>
    </div>
  );
}
