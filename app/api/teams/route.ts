import { NextRequest, NextResponse } from "next/server";
import { createTeam, getAllTeams } from "@/lib/teams-repo";

export async function GET() {
  const rows = await getAllTeams();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { label } = body;

  if (typeof label !== "string" || label.trim() === "") {
    return NextResponse.json({ error: "Nome da categoria é obrigatório." }, { status: 400 });
  }

  const created = await createTeam(label);
  return NextResponse.json(created, { status: 201 });
}
