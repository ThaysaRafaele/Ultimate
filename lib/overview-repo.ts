import { and, arrayContains, asc, eq, getTableColumns, gte, lte, sql } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, championships, gameStats, games } from "@/lib/schema";
import type { GameWithChampionship } from "@/lib/games-repo";
import type { PlayerTotalsRow } from "@/lib/overview-calc";

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

const total = (col: AnyColumn) => sql<string>`coalesce(sum(${col}), 0)`;

// One row per athlete who has stats in a realized game of this team/year.
// No filter on athletes.active or athletes.teams: the summary reflects who
// played that season, even if inactive or in another category today (ADR-0011).
export async function getPlayerStatsForYear(teamId: string, year: number): Promise<PlayerTotalsRow[]> {
  const rows = await db
    .select({
      athleteId: athletes.id,
      name: athletes.name,
      nickname: athletes.nickname,
      active: athletes.active,
      games: sql<string>`count(distinct ${gameStats.gameId})`,
      reboundsOff: total(gameStats.reboundsOff),
      reboundsDef: total(gameStats.reboundsDef),
      assists: total(gameStats.assists),
      steals: total(gameStats.steals),
      blocks: total(gameStats.blocks),
      turnovers: total(gameStats.turnovers),
      fouls: total(gameStats.fouls),
      fg2Made: total(gameStats.fg2Made),
      fg2Attempted: total(gameStats.fg2Attempted),
      fg3Made: total(gameStats.fg3Made),
      fg3Attempted: total(gameStats.fg3Attempted),
      ftMade: total(gameStats.ftMade),
      ftAttempted: total(gameStats.ftAttempted),
    })
    .from(gameStats)
    .innerJoin(games, eq(gameStats.gameId, games.id))
    .innerJoin(athletes, eq(gameStats.athleteId, athletes.id))
    .where(
      and(
        eq(games.team, teamId),
        eq(games.status, "realizado"),
        gte(games.gameDate, `${year}-01-01`),
        lte(games.gameDate, `${year}-12-31`)
      )
    )
    .groupBy(athletes.id, athletes.name, athletes.nickname, athletes.active);

  // Postgres returns sums/counts as strings (bigint/numeric).
  return rows.map((r) => ({
    athleteId: r.athleteId,
    name: r.name,
    nickname: r.nickname,
    active: r.active,
    games: Number(r.games),
    reboundsOff: Number(r.reboundsOff),
    reboundsDef: Number(r.reboundsDef),
    assists: Number(r.assists),
    steals: Number(r.steals),
    blocks: Number(r.blocks),
    turnovers: Number(r.turnovers),
    fouls: Number(r.fouls),
    fg2Made: Number(r.fg2Made),
    fg2Attempted: Number(r.fg2Attempted),
    fg3Made: Number(r.fg3Made),
    fg3Attempted: Number(r.fg3Attempted),
    ftMade: Number(r.ftMade),
    ftAttempted: Number(r.ftAttempted),
  }));
}
