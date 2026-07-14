import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, games, gameStats, notifications } from "@/lib/schema";
import { computeEff, computePoints, computeReboundsTotal } from "@/lib/stats-calc";
import type { GameStatRow } from "@/lib/stats-calc";

const STAT_TYPES = ["points", "rebounds", "assists", "steals", "eff"] as const;
type StatType = (typeof STAT_TYPES)[number];

const STAT_LABELS: Record<StatType, string> = {
  points: "Pontos",
  rebounds: "Rebotes",
  assists: "Assistências",
  steals: "Roubos de bola",
  eff: "Eficiência (EFF)",
};

export type NotificationRow = {
  id: number;
  athleteId: number;
  athleteName: string;
  gameId: number;
  opponent: string;
  gameDate: string;
  statType: string;
  statLabel: string;
  value: number;
  read: boolean;
  createdAt: Date;
};

export async function getRecentNotifications(limit = 50): Promise<NotificationRow[]> {
  const rows = await db
    .select({
      id: notifications.id,
      athleteId: notifications.athleteId,
      athleteName: athletes.name,
      gameId: notifications.gameId,
      opponent: games.opponent,
      gameDate: games.gameDate,
      statType: notifications.statType,
      value: notifications.value,
      read: notifications.read,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(athletes, eq(notifications.athleteId, athletes.id))
    .innerJoin(games, eq(notifications.gameId, games.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((r) => ({ ...r, statLabel: STAT_LABELS[r.statType as StatType] ?? r.statType }));
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<string>`count(*)` })
    .from(notifications)
    .where(eq(notifications.read, false));
  return Number(row?.count ?? 0);
}

export async function markNotificationRead(id: number): Promise<void> {
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(): Promise<void> {
  await db.update(notifications).set({ read: true }).where(eq(notifications.read, false));
}

// Called right after stats are saved for a game. Re-derives whether each
// athlete's numbers in *this* game beat their best in every other game —
// delete-then-insert (like setLineup/setGameStats) so re-editing a game's
// stats doesn't pile up duplicate notifications for the same milestone.
export async function checkAndRecordPersonalRecords(
  gameId: number,
  stats: GameStatRow[]
): Promise<void> {
  for (const s of stats) {
    await db
      .delete(notifications)
      .where(and(eq(notifications.athleteId, s.athleteId), eq(notifications.gameId, gameId)));

    const otherGames = await db
      .select({
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
      .where(and(eq(gameStats.athleteId, s.athleteId), ne(gameStats.gameId, gameId)));

    if (otherGames.length === 0) continue;

    const prevBest: Record<StatType, number> = {
      points: -1,
      rebounds: -1,
      assists: -1,
      steals: -1,
      eff: -Infinity,
    };
    for (const g of otherGames) {
      const full = { athleteId: s.athleteId, ...g };
      prevBest.points = Math.max(prevBest.points, computePoints(full));
      prevBest.rebounds = Math.max(prevBest.rebounds, computeReboundsTotal(full));
      prevBest.assists = Math.max(prevBest.assists, g.assists);
      prevBest.steals = Math.max(prevBest.steals, g.steals);
      prevBest.eff = Math.max(prevBest.eff, computeEff(full));
    }

    const current: Record<StatType, number> = {
      points: computePoints(s),
      rebounds: computeReboundsTotal(s),
      assists: s.assists,
      steals: s.steals,
      eff: computeEff(s),
    };

    const toInsert = STAT_TYPES.filter((t) => current[t] > 0 && current[t] > prevBest[t]).map(
      (statType) => ({
        athleteId: s.athleteId,
        gameId,
        statType,
        value: current[statType],
      })
    );

    if (toInsert.length > 0) {
      await db.insert(notifications).values(toInsert);
    }
  }
}
