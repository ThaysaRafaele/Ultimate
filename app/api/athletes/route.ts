import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes } from "@/lib/schema";
import { TEAMS, POSITIONS } from "@/lib/teams";

export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team");

  const rows = team
    ? await db.select().from(athletes).where(eq(athletes.team, team)).orderBy(asc(athletes.name))
    : await db.select().from(athletes).orderBy(asc(athletes.name));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, team, position, number, photoUrl, email, contact, birthDate, entryDate } = body;

  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (!TEAMS.some((t) => t.id === team)) {
    return NextResponse.json({ error: "Equipe inválida." }, { status: 400 });
  }
  if (!POSITIONS.includes(position)) {
    return NextResponse.json({ error: "Posição inválida." }, { status: 400 });
  }
  if (typeof entryDate !== "string" || entryDate.trim() === "") {
    return NextResponse.json({ error: "Data de entrada é obrigatória." }, { status: 400 });
  }

  const [created] = await db
    .insert(athletes)
    .values({
      name: name.trim(),
      team,
      position,
      number: number ? Number(number) : null,
      photoUrl: photoUrl || null,
      email: email || null,
      contact: contact || null,
      birthDate: birthDate || null,
      entryDate,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
