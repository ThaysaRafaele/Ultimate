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
      q1OurScore: games.q1OurScore,
      q1TheirScore: games.q1TheirScore,
      q2OurScore: games.q2OurScore,
      q2TheirScore: games.q2TheirScore,
      q3OurScore: games.q3OurScore,
      q3TheirScore: games.q3TheirScore,
      q4OurScore: games.q4OurScore,
      q4TheirScore: games.q4TheirScore,
      otOurScore: games.otOurScore,
      otTheirScore: games.otTheirScore,
      mvpAthleteId: games.mvpAthleteId,
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
