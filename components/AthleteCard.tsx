import Image from "next/image";
import Link from "next/link";
import { initials, numLabel, entryYear } from "@/lib/format";
import { ageInYears, todayISO } from "@/lib/validation";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function AthleteCard({
  athlete,
  teamLabel,
}: Readonly<{ athlete: Athlete; teamLabel?: string }>) {
  const age = athlete.birthDate ? ageInYears(athlete.birthDate, todayISO()) : null;

  return (
    <Link
      href={`/perfil/${athlete.id}`}
      className="bg-white border border-border-light rounded-xl overflow-hidden block max-md:flex max-md:items-center max-md:gap-3.5 max-md:p-3 transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,.10)]"
    >
      <div className="max-md:hidden h-33 bg-charcoal relative flex items-center justify-center">
        {athlete.photoUrl ? (
          <Image
            src={athlete.photoUrl}
            alt={athlete.name}
            fill
            className="object-cover"
            style={{ objectPosition: `${athlete.photoFocusX}% ${athlete.photoFocusY}%` }}
          />
        ) : (
          <div className="w-18.5 h-18.5 rounded-full bg-charcoal-light border-[2.5px] border-brand-red flex items-center justify-center text-white font-heading font-bold text-[28px]">
            {initials(athlete.name)}
          </div>
        )}
        <div className="absolute top-2.5 right-3 font-heading font-bold text-3xl text-brand-red leading-none">
          {numLabel(athlete.number)}
        </div>
      </div>
      <div className="max-md:hidden px-4 pt-3.5 pb-4">
        <div className="font-heading font-bold text-xl uppercase text-ink leading-tight">
          {athlete.nickname || athlete.name}
        </div>
        <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-0.5 mt-1.5">
          <span className="text-[13px] font-semibold text-brand-red uppercase tracking-[0.04em]">
            {athlete.position}
          </span>
          <span className="text-xs text-muted-2">
            Desde {entryYear(athlete.entryDate)}
            {age != null && ` · ${age} anos`}
          </span>
        </div>
        {teamLabel && <div className="text-xs text-muted-2 mt-1">{teamLabel}</div>}
      </div>

      <div className="hidden max-md:flex w-12 h-12 rounded-full bg-charcoal border-2 border-brand-red items-center justify-center text-white font-heading font-bold text-base shrink-0">
        {initials(athlete.name)}
      </div>
      <div className="hidden max-md:block flex-1 min-w-0">
        <div className="font-heading font-bold text-lg uppercase text-ink leading-tight truncate">
          {athlete.nickname || athlete.name}
        </div>
        <div className="text-xs text-brand-red font-semibold uppercase">
          {athlete.position} · {numLabel(athlete.number)}
        </div>
        <div className="text-xs text-muted-2">
          Desde {entryYear(athlete.entryDate)}
          {age != null && ` · ${age} anos`}
        </div>
      </div>
      <span className="hidden max-md:block text-border-dash text-xl">›</span>
    </Link>
  );
}
