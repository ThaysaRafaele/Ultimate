import { and, arrayContains, asc, eq, getTableColumns, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, championships, games } from "@/lib/schema";
import type { GameWithChampionship } from "@/lib/games-repo";

// Only realized games count for the overview (ADR-0004, ADR-0011). Returns the
// full game row (quarters included) so the list can open the existing boletim.
export async function getRealizedGames(teamId: string, year: number): Promise<GameWithChampionship[]> {
  return db
    .select({ ...getTableColumns(games), championshipName: championships.name })
    .from(games)
    .leftJoin(championships, eq(games.championshipId, championships.id))
    .where(
      and(
        eq(games.team, teamId),
        eq(games.status, "realizado"),
        gte(games.gameDate, `${year}-01-01`),
        lte(games.gameDate, `${year}-12-31`)
      )
    )
    .orderBy(asc(games.gameDate));
}

// Dates of every realized game of the team; the caller turns them into the
// year options (see availableYears), so hidden years live in one place.
export async function getRealizedGameDates(teamId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ gameDate: games.gameDate })
    .from(games)
    .where(and(eq(games.team, teamId), eq(games.status, "realizado")));
  return rows.map((r) => r.gameDate);
}

// Same roster the "Estatísticas" screen hands to StatsModal.
export async function getActiveTeamAthletes(teamId: string) {
  return db
    .select()
    .from(athletes)
    .where(and(arrayContains(athletes.teams, [teamId]), eq(athletes.active, true)))
    .orderBy(asc(athletes.name));
}
