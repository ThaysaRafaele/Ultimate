import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teams } from "@/lib/schema";

export type TeamRow = typeof teams.$inferSelect;

export async function getActiveTeams(): Promise<TeamRow[]> {
  return db.select().from(teams).where(eq(teams.active, true)).orderBy(asc(teams.label));
}

export async function getAllTeams(): Promise<TeamRow[]> {
  return db.select().from(teams).orderBy(asc(teams.label));
}

const COMBINING_DIACRITICS_RE = /[̀-ͯ]/g;

function slugify(label: string): string {
  return label
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_RE, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createTeam(label: string, maxAge?: number | null): Promise<TeamRow> {
  const base = slugify(label) || "time";
  const existing = await getAllTeams();
  const existingIds = new Set(existing.map((t) => t.id));

  let id = base;
  let suffix = 2;
  while (existingIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

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
