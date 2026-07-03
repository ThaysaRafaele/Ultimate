import Image from "next/image";
import { initials, numLabel, entryYear } from "@/lib/format";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

export function AthleteCard({ athlete }: Readonly<{ athlete: Athlete }>) {
  return (
    <div className="bg-white border border-border-light rounded-xl overflow-hidden">
      <div className="h-[132px] bg-charcoal relative flex items-center justify-center">
        {athlete.photoUrl ? (
          <Image src={athlete.photoUrl} alt={athlete.name} fill className="object-cover" />
        ) : (
          <div className="w-[74px] h-[74px] rounded-full bg-charcoal-light border-[2.5px] border-brand-red flex items-center justify-center text-white font-heading font-bold text-[28px]">
            {initials(athlete.name)}
          </div>
        )}
        <div className="absolute top-2.5 right-3 font-heading font-bold text-3xl text-brand-red leading-none">
          {numLabel(athlete.number)}
        </div>
      </div>
      <div className="px-4 pt-3.5 pb-4">
        <div className="font-heading font-bold text-xl uppercase text-ink leading-tight">
          {athlete.name}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[13px] font-semibold text-brand-red uppercase tracking-[0.04em]">
            {athlete.position}
          </span>
          <span className="text-xs text-muted-2">Desde {entryYear(athlete.entryDate)}</span>
        </div>
      </div>
    </div>
  );
}
