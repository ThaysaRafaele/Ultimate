import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes } from "@/lib/schema";
import { POSITIONS } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";
import { validateAthletePayload } from "@/lib/validation";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athleteId = Number(id);
  if (!Number.isInteger(athleteId)) {
    return NextResponse.json({ error: "Atleta inválido." }, { status: 400 });
  }

  const body = await request.json();

  const allTeams = await getAllTeams();
  const validationError = validateAthletePayload(body, allTeams, POSITIONS);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { name, teams, position, number, photoUrl, email, contact, birthDate, entryDate } = body;

  const [updated] = await db
    .update(athletes)
    .set({
      name: name.trim(),
      teams,
      position,
      number: number ? Number(number) : null,
      photoUrl: photoUrl || null,
      email: email || null,
      contact: contact || null,
      birthDate: birthDate || null,
      entryDate,
    })
    .where(eq(athletes.id, athleteId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
