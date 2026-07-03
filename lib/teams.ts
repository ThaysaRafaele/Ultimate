export type Team = {
  id: string;
  label: string;
};

export const TEAMS: Team[] = [
  { id: "masc-adulto", label: "Masculino · Adulto" },
  { id: "masc-avancado", label: "Masculino · Avançado" },
  { id: "masc-sub19", label: "Masculino · Sub-19" },
  { id: "masc-iniciante", label: "Masculino · Iniciante" },
  { id: "masc-blazers", label: "Masculino · Blazers" },
  { id: "fem-adulto", label: "Feminino · Adulto" },
];

export const DEFAULT_TEAM_ID = TEAMS[0].id;

export function teamLabel(teamId: string): string {
  return TEAMS.find((t) => t.id === teamId)?.label ?? teamId;
}

export const POSITIONS = ["Armador", "Ala-Armador", "Ala", "Ala-Pivô", "Pivô"] as const;

export type Position = (typeof POSITIONS)[number];
