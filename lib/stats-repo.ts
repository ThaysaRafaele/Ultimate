import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { championships, gameStats, games } from "@/lib/schema";
import { computeEff, computePoints, computeReboundsTotal } from "@/lib/stats-calc";
import type { GameStatRow } from "@/lib/stats-calc";

function yearRange(year?: number | null) {
  if (!year) return undefined;
  return and(gte(games.gameDate, `${year}-01-01`), lte(games.gameDate, `${year}-12-31`));
}

export type { GameStatRow };

export async function getGameStats(gameId: number): Promise<GameStatRow[]> {
  return db
    .select({
      athleteId: gameStats.athleteId,
      reboundsOff: gameStats.reboundsOff,
      reboundsDef: gameStats.reboundsDef,
      assists: gameStats.assists,
      steals: gameStats.steals,
      blocks: gameStats.blocks,
      turnovers: gameStats.turnovers,
      fouls: gameStats.fouls,
      fg2Made: gameStats.fg2Made,
      fg2Attempted: gameStats.fg2Attempted,
      fg3Made: gameStats.fg3Made,
      fg3Attempted: gameStats.fg3Attempted,
      ftMade: gameStats.ftMade,
      ftAttempted: gameStats.ftAttempted,
    })
    .from(gameStats)
    .where(eq(gameStats.gameId, gameId));
}

// Replaces the whole set of stats for a game, same batch-save pattern as setLineup.
export async function setGameStats(gameId: number, stats: GameStatRow[]): Promise<void> {
  await db.delete(gameStats).where(eq(gameStats.gameId, gameId));
  if (stats.length > 0) {
    await db.insert(gameStats).values(
      stats.map((s) => ({
        gameId,
        athleteId: s.athleteId,
        reboundsOff: s.reboundsOff,
        reboundsDef: s.reboundsDef,
        assists: s.assists,
        steals: s.steals,
        blocks: s.blocks,
        turnovers: s.turnovers,
        fouls: s.fouls,
        fg2Made: s.fg2Made,
        fg2Attempted: s.fg2Attempted,
        fg3Made: s.fg3Made,
        fg3Attempted: s.fg3Attempted,
        ftMade: s.ftMade,
        ftAttempted: s.ftAttempted,
      }))
    );
  }
}

export type AthleteAverages = {
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  effpg: number;
};

export async function getAthleteAverages(
  athleteId: number,
  year?: number | null
): Promise<AthleteAverages | null> {
  const [row] = await db
    .select({
      gamesPlayed: sql<string>`count(*)`,
      fg2Made: sql<string>`coalesce(sum(${gameStats.fg2Made}), 0)`,
      fg2Attempted: sql<string>`coalesce(sum(${gameStats.fg2Attempted}), 0)`,
      fg3Made: sql<string>`coalesce(sum(${gameStats.fg3Made}), 0)`,
      fg3Attempted: sql<string>`coalesce(sum(${gameStats.fg3Attempted}), 0)`,
      ftMade: sql<string>`coalesce(sum(${gameStats.ftMade}), 0)`,
      ftAttempted: sql<string>`coalesce(sum(${gameStats.ftAttempted}), 0)`,
      reboundsOff: sql<string>`coalesce(sum(${gameStats.reboundsOff}), 0)`,
      reboundsDef: sql<string>`coalesce(sum(${gameStats.reboundsDef}), 0)`,
      assists: sql<string>`coalesce(sum(${gameStats.assists}), 0)`,
      steals: sql<string>`coalesce(sum(${gameStats.steals}), 0)`,
      blocks: sql<string>`coalesce(sum(${gameStats.blocks}), 0)`,
      turnovers: sql<string>`coalesce(sum(${gameStats.turnovers}), 0)`,
    })
    .from(gameStats)
    .innerJoin(games, eq(gameStats.gameId, games.id))
    .where(and(eq(gameStats.athleteId, athleteId), yearRange(year)));

  const gamesPlayed = Number(row?.gamesPlayed ?? 0);
  if (gamesPlayed === 0) return null;

  // EFF is linear in every underlying counting stat, so computing it once on
  // the season totals and dividing by games played equals averaging each
  // game's EFF individually — no need to fetch every row just for this.
  const totals = {
    athleteId,
    fg2Made: Number(row.fg2Made),
    fg2Attempted: Number(row.fg2Attempted),
    fg3Made: Number(row.fg3Made),
    fg3Attempted: Number(row.fg3Attempted),
    ftMade: Number(row.ftMade),
    ftAttempted: Number(row.ftAttempted),
    reboundsOff: Number(row.reboundsOff),
    reboundsDef: Number(row.reboundsDef),
    assists: Number(row.assists),
    steals: Number(row.steals),
    blocks: Number(row.blocks),
    turnovers: Number(row.turnovers),
    fouls: 0,
  };

  return {
    gamesPlayed,
    ppg: computePoints(totals) / gamesPlayed,
    rpg: computeReboundsTotal(totals) / gamesPlayed,
    apg: totals.assists / gamesPlayed,
    spg: totals.steals / gamesPlayed,
    effpg: computeEff(totals) / gamesPlayed,
  };
}

export type AthleteGameLogRow = {
  gameId: number;
  gameDate: string;
  opponent: string;
  championshipName: string | null;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  eff: number;
};

function gameLogSelect() {
  return db
    .select({
      gameId: games.id,
      gameDate: games.gameDate,
      opponent: games.opponent,
      championshipName: championships.name,
      reboundsOff: gameStats.reboundsOff,
      reboundsDef: gameStats.reboundsDef,
      assists: gameStats.assists,
      steals: gameStats.steals,
      blocks: gameStats.blocks,
      turnovers: gameStats.turnovers,
      fouls: gameStats.fouls,
      fg2Made: gameStats.fg2Made,
      fg2Attempted: gameStats.fg2Attempted,
      fg3Made: gameStats.fg3Made,
      fg3Attempted: gameStats.fg3Attempted,
      ftMade: gameStats.ftMade,
      ftAttempted: gameStats.ftAttempted,
    })
    .from(gameStats)
    .innerJoin(games, eq(gameStats.gameId, games.id))
    .leftJoin(championships, eq(games.championshipId, championships.id));
}

function toGameLogRow(r: Awaited<ReturnType<typeof gameLogSelect>>[number]): AthleteGameLogRow {
  const full = { athleteId: 0, ...r };
  return {
    gameId: r.gameId,
    gameDate: r.gameDate,
    opponent: r.opponent,
    championshipName: r.championshipName,
    points: computePoints(full),
    rebounds: computeReboundsTotal(full),
    assists: r.assists,
    steals: r.steals,
    blocks: r.blocks,
    turnovers: r.turnovers,
    fouls: r.fouls,
    eff: computeEff(full),
  };
}

export async function getAthleteGameLog(
  athleteId: number,
  year?: number | null
): Promise<AthleteGameLogRow[]> {
  const rows = await gameLogSelect()
    .where(and(eq(gameStats.athleteId, athleteId), yearRange(year)))
    .orderBy(desc(games.gameDate));

  return rows.map(toGameLogRow);
}

// Career-high game by EFF (or best game within a given year), for the
// "Melhor jogo" highlight on the profile page — same composite metric used
// to auto-suggest MVP, so "best game" means the same thing everywhere.
export async function getAthleteBestGame(
  athleteId: number,
  year?: number | null
): Promise<AthleteGameLogRow | null> {
  const rows = await gameLogSelect().where(
    and(eq(gameStats.athleteId, athleteId), yearRange(year))
  );
  const [first, ...rest] = rows.map(toGameLogRow);
  if (!first) return null;

  return rest.reduce((best, r) => (r.eff > best.eff ? r : best), first);
}
