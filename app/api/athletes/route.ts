import { NextRequest, NextResponse } from "next/server";
import { arrayContains, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { athletes } from "@/lib/schema";
import { POSITIONS } from "@/lib/teams";
import { getAllTeams } from "@/lib/teams-repo";
import { validateAthletePayload } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team");

  const rows = team
    ? await db.select().from(athletes).where(arrayContains(athletes.teams, [team])).orderBy(asc(athletes.name))
    : await db.select().from(athletes).orderBy(asc(athletes.name));

  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const allTeams = await getAllTeams();
  const teamIds = allTeams.map((t) => t.id);
  const validationError = validateAthletePayload(body, teamIds, POSITIONS);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { name, teams, position, number, photoUrl, email, contact, birthDate, entryDate } = body;

  const [created] = await db
    .insert(athletes)
    .values({
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
    .returning();

  return NextResponse.json(created, { status: 201 });
}
