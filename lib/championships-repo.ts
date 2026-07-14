import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { championships, games } from "@/lib/schema";
import { uniqueSlug } from "@/lib/slug";

export type ChampionshipRow = typeof championships.$inferSelect;

export async function getAllChampionships(): Promise<ChampionshipRow[]> {
  return db.select().from(championships).orderBy(asc(championships.name));
}

export type ChampionshipWithGameCount = ChampionshipRow & { gameCount: number };

export async function getChampionshipsWithGameCount(): Promise<ChampionshipWithGameCount[]> {
  const rows = await db
    .select({
      id: championships.id,
      name: championships.name,
      createdAt: championships.createdAt,
      gameCount: sql<string>`count(${games.id})`,
    })
    .from(championships)
    .leftJoin(games, eq(games.championshipId, championships.id))
    .groupBy(championships.id, championships.name, championships.createdAt)
    .orderBy(asc(championships.name));

  return rows.map((r) => ({ ...r, gameCount: Number(r.gameCount) }));
}

// Only the name is editable — the id (slug) is generated once at creation
// and referenced by games.championshipId, so it never changes after the fact.
export async function renameChampionship(
  id: string,
  name: string
): Promise<ChampionshipRow | null> {
  const [updated] = await db
    .update(championships)
    .set({ name: name.trim() })
    .where(eq(championships.id, id))
    .returning();
  return updated ?? null;
}

// Reassigns every game from `sourceId` to `targetId`, then removes the
// now-empty duplicate — fixes typo'd/duplicate championships (e.g. "Ferias
// Cup" merged into "Férias Cup") without losing any game history.
export async function mergeChampionships(sourceId: string, targetId: string): Promise<void> {
  await db.update(games).set({ championshipId: targetId }).where(eq(games.championshipId, sourceId));
  await db.delete(championships).where(eq(championships.id, sourceId));
}

// Reuses an existing championship when the name already matches (case/accent
// insensitive isn't worth the complexity here — exact match after trimming),
// so games from different teams in the same tournament share one row instead
// of drifting into near-duplicate free-text entries.
export async function getOrCreateChampionship(name: string): Promise<ChampionshipRow> {
  const trimmed = name.trim();
  const existing = await getAllChampionships();
  const match = existing.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;

  const id = uniqueSlug(trimmed, new Set(existing.map((c) => c.id)), "campeonato");
  const [created] = await db.insert(championships).values({ id, name: trimmed }).returning();
  return created;
}
