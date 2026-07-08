import { NextRequest, NextResponse } from "next/server";
import { and, arrayContains, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, games } from "@/lib/schema";
import { getLineupAthleteIds, setLineup } from "@/lib/lineup-repo";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const athleteIds = await getLineupAthleteIds(gameId);
  return NextResponse.json({ athleteIds });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { athleteIds } = body;
  if (!Array.isArray(athleteIds) || !athleteIds.every((v) => Number.isInteger(v))) {
    return NextResponse.json({ error: "Lista de atletas inválida." }, { status: 400 });
  }

  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  if (athleteIds.length > 0) {
    const eligible = await db
      .select({ id: athletes.id })
      .from(athletes)
      .where(
        and(
          inArray(athletes.id, athleteIds),
          arrayContains(athletes.teams, [game.team]),
          eq(athletes.active, true)
        )
      );
    if (eligible.length !== athleteIds.length) {
      return NextResponse.json(
        { error: "Um ou mais atletas não pertencem a essa equipe ou estão inativos." },
        { status: 400 }
      );
    }
  }

  await setLineup(gameId, athleteIds);
  return NextResponse.json({ athleteIds });
}
