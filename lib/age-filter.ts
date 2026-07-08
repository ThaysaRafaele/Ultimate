export type AgeFilterValue =
  | "todas"
  | "sub16"
  | "17"
  | "18"
  | "19"
  | "20+"
  | "25+"
  | "30+"
  | "35+"
  | "40+";

export const AGE_FILTER_OPTIONS: { value: AgeFilterValue; label: string }[] = [
  { value: "todas", label: "Todas as idades" },
  { value: "sub16", label: "Sub 16" },
  { value: "17", label: "17 anos" },
  { value: "18", label: "18 anos" },
  { value: "19", label: "19 anos" },
  { value: "20+", label: "20+ anos" },
  { value: "25+", label: "25+ anos" },
  { value: "30+", label: "30+ anos" },
  { value: "35+", label: "35+ anos" },
  { value: "40+", label: "40+ anos" },
];

// Exact single-year match for 17-19 (checking eligibility for a specific age
// bracket), a ceiling for "Sub 16", and open-ended "at least N" thresholds for
// 20/25/30/35/40+ (veteran/masters tournament eligibility, e.g. "Copa América
// 30+") — these overlap by design, they aren't a partition into bands.
export function matchesAgeFilter(age: number | null, filter: AgeFilterValue): boolean {
  if (filter === "todas") return true;
  if (age == null) return false;

  if (filter === "sub16") return age <= 16;
  if (filter.endsWith("+")) return age >= Number(filter.slice(0, -1));
  return age === Number(filter);
}
