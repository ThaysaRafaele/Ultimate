import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { championships, gameStats, games } from "@/lib/schema";
import { computePoints, computeReboundsTotal } from "@/lib/stats-calc";
import type { GameStatRow } from "@/lib/stats-calc";

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
};

export async function getAthleteAverages(athleteId: number): Promise<AthleteAverages | null> {
  const [row] = await db
    .select({
      gamesPlayed: sql<string>`count(*)`,
      points: sql<string>`coalesce(sum(${gameStats.fg2Made} * 2 + ${gameStats.fg3Made} * 3 + ${gameStats.ftMade}), 0)`,
      rebounds: sql<string>`coalesce(sum(${gameStats.reboundsOff} + ${gameStats.reboundsDef}), 0)`,
      assists: sql<string>`coalesce(sum(${gameStats.assists}), 0)`,
      steals: sql<string>`coalesce(sum(${gameStats.steals}), 0)`,
    })
    .from(gameStats)
    .where(eq(gameStats.athleteId, athleteId));

  const gamesPlayed = Number(row?.gamesPlayed ?? 0);
  if (gamesPlayed === 0) return null;

  return {
    gamesPlayed,
    ppg: Number(row.points) / gamesPlayed,
    rpg: Number(row.rebounds) / gamesPlayed,
    apg: Number(row.assists) / gamesPlayed,
    spg: Number(row.steals) / gamesPlayed,
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
      fg2Made: gameStats.fg2Made,
      fg3Made: gameStats.fg3Made,
      ftMade: gameStats.ftMade,
    })
    .from(gameStats)
    .innerJoin(games, eq(gameStats.gameId, games.id))
    .leftJoin(championships, eq(games.championshipId, championships.id));
}

export async function getAthleteGameLog(athleteId: number): Promise<AthleteGameLogRow[]> {
  const rows = await gameLogSelect()
    .where(eq(gameStats.athleteId, athleteId))
    .orderBy(desc(games.gameDate));

  return rows.map((r) => ({
    gameId: r.gameId,
    gameDate: r.gameDate,
    opponent: r.opponent,
    championshipName: r.championshipName,
    points: computePoints(r),
    rebounds: computeReboundsTotal(r),
    assists: r.assists,
    steals: r.steals,
  }));
}

// Career-high game by points, for the "Melhor jogo" highlight on the profile page.
export async function getAthleteBestGame(athleteId: number): Promise<AthleteGameLogRow | null> {
  const rows = await gameLogSelect()
    .where(eq(gameStats.athleteId, athleteId))
    .orderBy(
      desc(sql`${gameStats.fg2Made} * 2 + ${gameStats.fg3Made} * 3 + ${gameStats.ftMade}`)
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    gameId: row.gameId,
    gameDate: row.gameDate,
    opponent: row.opponent,
    championshipName: row.championshipName,
    points: computePoints(row),
    rebounds: computeReboundsTotal(row),
    assists: row.assists,
    steals: row.steals,
  };
}
