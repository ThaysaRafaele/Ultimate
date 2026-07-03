import Image from "next/image";
import { TeamSelector } from "@/components/TeamSelector";

export function Header({ team }: { team: string }) {
  return (
    <header className="h-[72px] bg-ink-deep flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-5">
        <Image src="/logo.png" alt="Ultimate" height={44} width={44} className="h-11 w-auto block" priority />
        <TeamSelector value={team} />
      </div>
    </header>
  );
}
