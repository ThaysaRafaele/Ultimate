"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ALL_TEAMS_ID } from "@/lib/teams";
import type { Team } from "@/lib/teams";

export function TeamSelector({
  value,
  teams,
  includeAllOption,
}: Readonly<{ value: string; teams: Team[]; includeAllOption?: boolean }>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("team", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2.5 pl-5 max-md:pl-2.5 border-l border-charcoal-light">
      <span className="max-md:hidden font-heading font-semibold text-[11px] tracking-[0.16em] text-muted-1 uppercase">
        Equipe
      </span>
      <select
        value={value}
        onChange={onChange}
        className="h-[38px] max-md:h-8 max-md:text-xs bg-charcoal text-white border border-zinc-border rounded-lg px-3 font-bold text-sm cursor-pointer"
      >
        {includeAllOption && <option value={ALL_TEAMS_ID}>Todos</option>}
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
