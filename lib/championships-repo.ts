import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { championships } from "@/lib/schema";
import { uniqueSlug } from "@/lib/slug";

export type ChampionshipRow = typeof championships.$inferSelect;

export async function getAllChampionships(): Promise<ChampionshipRow[]> {
  return db.select().from(championships).orderBy(asc(championships.name));
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
