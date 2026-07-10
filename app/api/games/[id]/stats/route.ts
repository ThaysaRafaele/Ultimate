import { NextRequest, NextResponse } from "next/server";
import { and, arrayContains, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes, games } from "@/lib/schema";
import { getGameStats, setGameStats } from "@/lib/stats-repo";
import { checkAndRecordPersonalRecords } from "@/lib/notifications-repo";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  const stats = await getGameStats(gameId);
  return NextResponse.json({
    stats,
    boletim: {
      q1OurScore: game.q1OurScore,
      q1TheirScore: game.q1TheirScore,
      q2OurScore: game.q2OurScore,
      q2TheirScore: game.q2TheirScore,
      q3OurScore: game.q3OurScore,
      q3TheirScore: game.q3TheirScore,
      q4OurScore: game.q4OurScore,
      q4TheirScore: game.q4TheirScore,
      otOurScore: game.otOurScore,
      otTheirScore: game.otTheirScore,
      mvpAthleteId: game.mvpAthleteId,
    },
  });
}

function isNonNegativeInt(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 0;
}

function isNonNegativeIntOrNull(v: unknown): boolean {
  return v === null || v === undefined || isNonNegativeInt(v);
}

const QUARTER_FIELDS = [
  "q1OurScore",
  "q1TheirScore",
  "q2OurScore",
  "q2TheirScore",
  "q3OurScore",
  "q3TheirScore",
  "q4OurScore",
  "q4TheirScore",
  "otOurScore",
  "otTheirScore",
] as const;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = Number(id);
  if (!Number.isInteger(gameId)) {
    return NextResponse.json({ error: "Jogo inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { stats, boletim } = body;
  if (
    !Array.isArray(stats) ||
    !stats.every(
      (s) =>
        s &&
        Number.isInteger(s.athleteId) &&
        isNonNegativeInt(s.points) &&
        isNonNegativeInt(s.rebounds) &&
        isNonNegativeInt(s.assists) &&
        isNonNegativeInt(s.steals) &&
        isNonNegativeInt(s.fg2Made) &&
        isNonNegativeInt(s.fg2Attempted) &&
        s.fg2Made <= s.fg2Attempted &&
        isNonNegativeInt(s.fg3Made) &&
        isNonNegativeInt(s.fg3Attempted) &&
        s.fg3Made <= s.fg3Attempted &&
        isNonNegativeInt(s.ftMade) &&
        isNonNegativeInt(s.ftAttempted) &&
        s.ftMade <= s.ftAttempted
    )
  ) {
    return NextResponse.json({ error: "Estatísticas inválidas." }, { status: 400 });
  }

  if (
    boletim !== undefined &&
    boletim !== null &&
    (typeof boletim !== "object" ||
      !QUARTER_FIELDS.every((f) => isNonNegativeIntOrNull(boletim[f])) ||
      !(boletim.mvpAthleteId === null ||
        boletim.mvpAthleteId === undefined ||
        Number.isInteger(boletim.mvpAthleteId)))
  ) {
    return NextResponse.json({ error: "Boletim inválido." }, { status: 400 });
  }

  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }
  if (game.status !== "realizado") {
    return NextResponse.json(
      { error: "Só é possível lançar estatísticas de jogos marcados como Realizado." },
      { status: 400 }
    );
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

  if (boletim?.mvpAthleteId != null && !athleteIds.includes(boletim.mvpAthleteId)) {
    return NextResponse.json(
      { error: "O MVP precisa ser um dos atletas com estatísticas lançadas nesse jogo." },
      { status: 400 }
    );
  }

  await setGameStats(gameId, stats);
  await checkAndRecordPersonalRecords(gameId, stats);

  if (boletim) {
    await db
      .update(games)
      .set({
        q1OurScore: boletim.q1OurScore ?? null,
        q1TheirScore: boletim.q1TheirScore ?? null,
        q2OurScore: boletim.q2OurScore ?? null,
        q2TheirScore: boletim.q2TheirScore ?? null,
        q3OurScore: boletim.q3OurScore ?? null,
        q3TheirScore: boletim.q3TheirScore ?? null,
        q4OurScore: boletim.q4OurScore ?? null,
        q4TheirScore: boletim.q4TheirScore ?? null,
        otOurScore: boletim.otOurScore ?? null,
        otTheirScore: boletim.otTheirScore ?? null,
        mvpAthleteId: boletim.mvpAthleteId ?? null,
      })
      .where(eq(games.id, gameId));
  }

  return NextResponse.json({ ok: true });
}
