import Image from "next/image";
import Link from "next/link";
import { NotificationsBell } from "@/components/NotificationsBell";
import { TeamSelector } from "@/components/TeamSelector";
import { MobileNavDrawer } from "@/components/MobileNavDrawer";
import { findTeamLabel } from "@/lib/teams";
import type { Team } from "@/lib/teams";

export function Header({
  team,
  teams,
  includeAllTeamsOption,
}: Readonly<{ team: string; teams: Team[]; includeAllTeamsOption?: boolean }>) {
  return (
    <header className="h-[72px] bg-ink-deep flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-5">
        <MobileNavDrawer teamLabel={findTeamLabel(teams, team)} />
        <Image src="/logo.png" alt="Ultimate" height={44} width={44} className="h-11 w-auto block" priority />
        <TeamSelector value={team} teams={teams} includeAllOption={includeAllTeamsOption} />
      </div>
      <div className="flex items-center gap-5">
        <NotificationsBell />
        <Link
          href="/campeonatos"
          className="max-md:hidden text-muted-1 font-semibold text-[13px] uppercase tracking-[0.04em] hover:text-white"
        >
          Gerenciar campeonatos
        </Link>
        <Link
          href="/times"
          className="max-md:hidden text-muted-1 font-semibold text-[13px] uppercase tracking-[0.04em] hover:text-white"
        >
          Gerenciar times
        </Link>
      </div>
    </header>
  );
}
