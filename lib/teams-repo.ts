import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teams } from "@/lib/schema";
import { uniqueSlug } from "@/lib/slug";

export type TeamRow = typeof teams.$inferSelect;

export async function getActiveTeams(): Promise<TeamRow[]> {
  return db.select().from(teams).where(eq(teams.active, true)).orderBy(asc(teams.label));
}

export async function getAllTeams(): Promise<TeamRow[]> {
  return db.select().from(teams).orderBy(asc(teams.label));
}

export async function createTeam(label: string, maxAge?: number | null): Promise<TeamRow> {
  const existing = await getAllTeams();
  const id = uniqueSlug(label, new Set(existing.map((t) => t.id)), "time");

  const [created] = await db
    .insert(teams)
    .values({ id, label: label.trim(), active: true, maxAge: maxAge ?? null })
    .returning();
  return created;
}

export async function setTeamActive(id: string, active: boolean): Promise<TeamRow | null> {
  const [updated] = await db.update(teams).set({ active }).where(eq(teams.id, id)).returning();
  return updated ?? null;
}
