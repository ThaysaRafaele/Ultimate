import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { championships, games } from "@/lib/schema";

export type OverviewGame = {
  id: number;
  gameDate: string;
  opponent: string;
  championshipName: string | null;
  ourScore: number | null;
  theirScore: number | null;
};

// Only realized games count for the overview (ADR-0004, ADR-0011).
export async function getRealizedGames(teamId: string, year: number): Promise<OverviewGame[]> {
  return db
    .select({
      id: games.id,
      gameDate: games.gameDate,
      opponent: games.opponent,
      championshipName: championships.name,
      ourScore: games.ourScore,
      theirScore: games.theirScore,
    })
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
