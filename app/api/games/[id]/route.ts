import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { gameLineups, gameStats, games } from "@/lib/schema";
import { getAllTeams } from "@/lib/teams-repo";
import { getOrCreateChampionship } from "@/lib/championships-repo";
import { validateGamePayload } from "@/lib/games-validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const body = await request.json();

  const allTeams = await getAllTeams();
  const validationError = validateGamePayload(body, allTeams.map((t) => t.id));
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { team, championship, opponent, gameDate, gameTime, status, ourScore, theirScore } = body;
  const championshipRow = await getOrCreateChampionship(championship);

  const [updated] = await db
    .update(games)
    .set({
      team,
      championshipId: championshipRow.id,
      opponent: opponent.trim(),
      gameDate,
      gameTime,
      status,
      ourScore: ourScore ?? null,
      theirScore: theirScore ?? null,
    })
    .where(eq(games.id, gameId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ...updated, championshipName: championshipRow.name });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const [deleted] = await db.delete(games).where(eq(games.id, gameId)).returning();
  if (!deleted) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  await db.delete(gameLineups).where(eq(gameLineups.gameId, gameId));
  await db.delete(gameStats).where(eq(gameStats.gameId, gameId));

  return NextResponse.json({ ok: true });
}
