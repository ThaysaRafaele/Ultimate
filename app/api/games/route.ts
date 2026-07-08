import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/schema";
import { getAllTeams } from "@/lib/teams-repo";
import { getOrCreateChampionship } from "@/lib/championships-repo";
import { getAllGames, getGamesByTeam } from "@/lib/games-repo";
import { validateGamePayload } from "@/lib/games-validation";

export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team");
  const rows = team ? await getGamesByTeam(team) : await getAllGames();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const allTeams = await getAllTeams();
  const validationError = validateGamePayload(body, allTeams.map((t) => t.id));
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { team, championship, opponent, gameDate, gameTime, status, ourScore, theirScore } = body;
  const championshipRow = await getOrCreateChampionship(championship);

  const [created] = await db
    .insert(games)
    .values({
      team,
      championshipId: championshipRow.id,
      opponent: opponent.trim(),
      gameDate,
      gameTime,
      status,
      ourScore: ourScore ?? null,
      theirScore: theirScore ?? null,
    })
    .returning();

  return NextResponse.json({ ...created, championshipName: championshipRow.name }, { status: 201 });
}
