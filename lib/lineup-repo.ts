import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { gameLineups, athletes } from "@/lib/schema";

export async function getLineupAthleteIds(gameId: number): Promise<number[]> {
  const rows = await db
    .select({ athleteId: gameLineups.athleteId })
    .from(gameLineups)
    .where(eq(gameLineups.gameId, gameId));
  return rows.map((r) => r.athleteId);
}

export async function getLineupAthletes(gameId: number) {
  return db
    .select({
      id: athletes.id,
      name: athletes.name,
      position: athletes.position,
      number: athletes.number,
      photoUrl: athletes.photoUrl,
      photoFocusX: athletes.photoFocusX,
      photoFocusY: athletes.photoFocusY,
    })
    .from(gameLineups)
    .innerJoin(athletes, eq(gameLineups.athleteId, athletes.id))
    .where(eq(gameLineups.gameId, gameId))
    .orderBy(asc(athletes.name));
}

// Replaces the whole lineup with the given set of athlete ids — checking an
// athlete on/off in the UI is create/delete of one row, batched into a single
// "save" action rather than per-checkbox API calls.
export async function setLineup(gameId: number, athleteIds: number[]): Promise<void> {
  await db.delete(gameLineups).where(eq(gameLineups.gameId, gameId));
  if (athleteIds.length > 0) {
    await db.insert(gameLineups).values(athleteIds.map((athleteId) => ({ gameId, athleteId })));
  }
}
