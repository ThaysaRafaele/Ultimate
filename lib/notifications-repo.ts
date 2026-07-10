import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, games, gameStats, notifications } from "@/lib/schema";
import type { GameStatRow } from "@/lib/stats-repo";

const STAT_TYPES = ["points", "rebounds", "assists", "steals"] as const;
type StatType = (typeof STAT_TYPES)[number];

const STAT_LABELS: Record<StatType, string> = {
  points: "Pontos",
  rebounds: "Rebotes",
  assists: "Assistências",
  steals: "Roubos de bola",
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

    const [row] = await db
      .select({
        maxPoints: sql<string>`coalesce(max(${gameStats.points}), -1)`,
        maxRebounds: sql<string>`coalesce(max(${gameStats.rebounds}), -1)`,
        maxAssists: sql<string>`coalesce(max(${gameStats.assists}), -1)`,
        maxSteals: sql<string>`coalesce(max(${gameStats.steals}), -1)`,
        gamesPlayed: sql<string>`count(*)`,
      })
      .from(gameStats)
      .where(and(eq(gameStats.athleteId, s.athleteId), ne(gameStats.gameId, gameId)));

    const gamesPlayed = Number(row?.gamesPlayed ?? 0);
    if (gamesPlayed === 0) continue;

    const prevBest: Record<StatType, number> = {
      points: Number(row.maxPoints),
      rebounds: Number(row.maxRebounds),
      assists: Number(row.maxAssists),
      steals: Number(row.maxSteals),
    };

    const toInsert = STAT_TYPES.filter((t) => s[t] > 0 && s[t] > prevBest[t]).map((statType) => ({
      athleteId: s.athleteId,
      gameId,
      statType,
      value: s[statType],
    }));

    if (toInsert.length > 0) {
      await db.insert(notifications).values(toInsert);
    }
  }
}
