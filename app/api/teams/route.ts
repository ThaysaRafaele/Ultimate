import { NextRequest, NextResponse } from "next/server";
import { createTeam, getAllTeams } from "@/lib/teams-repo";

export async function GET() {
  const rows = await getAllTeams();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { label, maxAge } = body;

  if (typeof label !== "string" || label.trim() === "") {
    return NextResponse.json({ error: "Nome da categoria é obrigatório." }, { status: 400 });
  }
  if (maxAge != null && (typeof maxAge !== "number" || !Number.isInteger(maxAge) || maxAge <= 0)) {
    return NextResponse.json({ error: "Idade máxima inválida." }, { status: 400 });
  }

  const created = await createTeam(label, maxAge ?? null);
  return NextResponse.json(created, { status: 201 });
}
