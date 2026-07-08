import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { games, championships } from "@/lib/schema";

export type GameWithChampionship = typeof games.$inferSelect & { championshipName: string | null };

function gameSelect() {
  return db
    .select({
      id: games.id,
      team: games.team,
      championshipId: games.championshipId,
      championshipName: championships.name,
      opponent: games.opponent,
      gameDate: games.gameDate,
      gameTime: games.gameTime,
      status: games.status,
      ourScore: games.ourScore,
      theirScore: games.theirScore,
      createdAt: games.createdAt,
    })
    .from(games)
    .leftJoin(championships, eq(games.championshipId, championships.id));
}

export async function getGamesByTeam(teamId: string): Promise<GameWithChampionship[]> {
  return gameSelect().where(eq(games.team, teamId)).orderBy(asc(games.gameDate));
}

export async function getAllGames(): Promise<GameWithChampionship[]> {
  return gameSelect().orderBy(asc(games.gameDate));
}
