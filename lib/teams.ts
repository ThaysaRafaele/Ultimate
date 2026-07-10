export type Team = {
  id: string;
  label: string;
  active: boolean;
  maxAge: number | null;
};

export const ALL_TEAMS_ID = "todos";

export function findTeamLabel(teams: readonly { id: string; label: string }[], teamId: string): string {
  return teams.find((t) => t.id === teamId)?.label ?? teamId;
}

export const POSITIONS = ["Armador", "Ala-Armador", "Ala", "Ala-Pivô", "Pivô"] as const;

export type Position = (typeof POSITIONS)[number];
