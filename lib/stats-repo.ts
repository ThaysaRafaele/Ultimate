import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { championships, gameStats, games } from "@/lib/schema";

export type GameStatRow = {
  athleteId: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  fg2Made: number;
  fg2Attempted: number;
  fg3Made: number;
  fg3Attempted: number;
  ftMade: number;
  ftAttempted: number;
};

export async function getGameStats(gameId: number): Promise<GameStatRow[]> {
  return db
    .select({
      athleteId: gameStats.athleteId,
      points: gameStats.points,
      rebounds: gameStats.rebounds,
      assists: gameStats.assists,
      steals: gameStats.steals,
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
        points: s.points,
        rebounds: s.rebounds,
        assists: s.assists,
        steals: s.steals,
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
      points: sql<string>`coalesce(sum(${gameStats.points}), 0)`,
      rebounds: sql<string>`coalesce(sum(${gameStats.rebounds}), 0)`,
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

export async function getAthleteGameLog(athleteId: number): Promise<AthleteGameLogRow[]> {
  return db
    .select({
      gameId: games.id,
      gameDate: games.gameDate,
      opponent: games.opponent,
      championshipName: championships.name,
      points: gameStats.points,
      rebounds: gameStats.rebounds,
      assists: gameStats.assists,
      steals: gameStats.steals,
    })
    .from(gameStats)
    .innerJoin(games, eq(gameStats.gameId, games.id))
    .leftJoin(championships, eq(games.championshipId, championships.id))
    .where(eq(gameStats.athleteId, athleteId))
    .orderBy(desc(games.gameDate));
}
