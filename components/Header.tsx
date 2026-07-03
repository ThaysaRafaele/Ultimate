import Image from "next/image";
import Link from "next/link";
import { TeamSelector } from "@/components/TeamSelector";
import type { Team } from "@/lib/teams";

export function Header({ team, teams }: Readonly<{ team: string; teams: Team[] }>) {
  return (
    <header className="h-[72px] bg-ink-deep flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-5">
        <Image src="/logo.png" alt="Ultimate" height={44} width={44} className="h-11 w-auto block" priority />
        <TeamSelector value={team} teams={teams} />
      </div>
      <Link
        href="/times"
        className="text-muted-1 font-semibold text-[13px] uppercase tracking-[0.04em] hover:text-white"
      >
        Gerenciar times
      </Link>
    </header>
  );
}
