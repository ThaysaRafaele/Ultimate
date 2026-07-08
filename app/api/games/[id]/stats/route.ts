import { NextRequest, NextResponse } from "next/server";
import { and, arrayContains, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, games } from "@/lib/schema";
import { getGameStats, setGameStats } from "@/lib/stats-repo";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const stats = await getGameStats(gameId);
  return NextResponse.json({ stats });
}

function isNonNegativeInt(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { stats } = body;
  if (
    !Array.isArray(stats) ||
    !stats.every(
      (s) =>
        s &&
        Number.isInteger(s.athleteId) &&
        isNonNegativeInt(s.points) &&
        isNonNegativeInt(s.rebounds) &&
        isNonNegativeInt(s.assists) &&
        isNonNegativeInt(s.steals)
    )
  ) {
    return NextResponse.json({ error: "Estatísticas inválidas." }, { status: 400 });
  }

  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const athleteIds: number[] = stats.map((s) => s.athleteId);
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

  await setGameStats(gameId, stats);
  return NextResponse.json({ stats });
}
