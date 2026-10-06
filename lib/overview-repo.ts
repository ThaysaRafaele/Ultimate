import { and, arrayContains, asc, eq, getTableColumns, gte, lte, notInArray, sql } from "drizzle-orm";
import type { AnyColumn, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, championships, gameStats, games } from "@/lib/schema";
import type { GameWithChampionship } from "@/lib/games-repo";
import { HIDDEN_YEARS } from "@/lib/overview-calc";
import type { PlayerTotalsRow } from "@/lib/overview-calc";

// Realized games of one category (or all, with null) in one year (or every
// year, with null). "Every year" still leaves the hidden ones out (ADR-0011).
function realizedScope(teamId: string | null, year: number | null): SQL | undefined {
  const conditions: SQL[] = [eq(games.status, "realizado")];
  if (teamId) conditions.push(eq(games.team, teamId));
  if (year) {
    conditions.push(gte(games.gameDate, `${year}-01-01`), lte(games.gameDate, `${year}-12-31`));
  } else if (HIDDEN_YEARS.length > 0) {
    conditions.push(notInArray(sql<number>`extract(year from ${games.gameDate})::int`, [...HIDDEN_YEARS]));
  }
  return and(...conditions);
}

// Only realized games count for the overview (ADR-0004, ADR-0011). Returns the
// full game row (quarters included) so the list can open the existing boletim.
export async function getRealizedGames(teamId: string | null, year: number | null): Promise<GameWithChampionship[]> {
  return db
    .select({ ...getTableColumns(games), championshipName: championships.name })
    .from(games)
    .leftJoin(championships, eq(games.championshipId, championships.id))
    .where(realizedScope(teamId, year))
    .orderBy(asc(games.gameDate));
}

// Dates of every realized game of the team; the caller turns them into the
// year options (see availableYears), so hidden years live in one place.
export async function getRealizedGameDates(teamId: string | null): Promise<string[]> {
  const rows = await db
    .selectDistinct({ gameDate: games.gameDate })
    .from(games)
    .where(teamId ? and(eq(games.team, teamId), eq(games.status, "realizado")) : eq(games.status, "realizado"));
  return rows.map((r) => r.gameDate);
}

// Same roster the "Estatísticas" screen hands to StatsModal. With null (all
// categories) every active athlete: StatsModal narrows it to the game lineup.
export async function getActiveTeamAthletes(teamId: string | null) {
  return db
    .select()
    .from(athletes)
    .where(teamId ? and(arrayContains(athletes.teams, [teamId]), eq(athletes.active, true)) : eq(athletes.active, true))
    .orderBy(asc(athletes.name));
}

const total = (col: AnyColumn) => sql<string>`coalesce(sum(${col}), 0)`;

// One row per athlete who has stats in a realized game of this team/year
// (null = all categories / every visible year, for the "Resumo geral").
// No filter on athletes.active or athletes.teams: the summary reflects who
// played that season, even if inactive or in another category today (ADR-0011).
export async function getPlayerStatsForYear(teamId: string | null, year: number | null): Promise<PlayerTotalsRow[]> {
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
    .where(realizedScope(teamId, year))
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
