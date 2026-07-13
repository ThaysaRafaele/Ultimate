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

  const {
    name,
    nickname,
    teams,
    position,
    number,
    height,
    shoeSize,
    photoUrl,
    photoFocusX,
    photoFocusY,
    email,
    contact,
    birthDate,
    entryDate,
  } = body;

  const [updated] = await db
    .update(athletes)
    .set({
      name: name.trim(),
      nickname: nickname?.trim() || null,
      teams,
      position,
      number: number ? Number(number) : null,
      height: height ? Number(height) : null,
      shoeSize: shoeSize ? Number(shoeSize) : null,
      photoUrl: photoUrl || null,
      photoFocusX: photoFocusX ?? 50,
      photoFocusY: photoFocusY ?? 50,
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const athleteId = Number(id);
  if (!Number.isInteger(athleteId)) {
    return NextResponse.json({ error: "Atleta inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { active } = body;
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Campo 'active' é obrigatório." }, { status: 400 });
  }

  const [updated] = await db
    .update(athletes)
    .set({ active })
    .where(eq(athletes.id, athleteId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
