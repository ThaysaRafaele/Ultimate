import Image from "next/image";
import { initials, numLabel, entryYear } from "@/lib/format";
import type { athletes } from "@/lib/schema";

type Athlete = typeof athletes.$inferSelect;

function AthleteCardBody({ athlete }: Readonly<{ athlete: Athlete }>) {
  return (
    <>
      <div className="h-33 bg-charcoal relative flex items-center justify-center">
        {athlete.photoUrl ? (
          <Image src={athlete.photoUrl} alt={athlete.name} fill className="object-cover" />
        ) : (
          <div className="w-18.5 h-18.5 rounded-full bg-charcoal-light border-[2.5px] border-brand-red flex items-center justify-center text-white font-heading font-bold text-[28px]">
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
    </>
  );
}

const CARD_CLASSES =
  "bg-white border border-border-light rounded-xl overflow-hidden transition-[transform,box-shadow] duration-150";
const CLICKABLE_CLASSES = "cursor-pointer text-left w-full hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,.10)]";

export function AthleteCard({
  athlete,
  onClick,
}: Readonly<{ athlete: Athlete; onClick?: () => void }>) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${CARD_CLASSES} ${CLICKABLE_CLASSES}`}>
        <AthleteCardBody athlete={athlete} />
      </button>
    );
  }

  return (
    <div className={CARD_CLASSES}>
      <AthleteCardBody athlete={athlete} />
    </div>
  );
}
