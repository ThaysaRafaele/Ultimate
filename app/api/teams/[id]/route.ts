import { NextRequest, NextResponse } from "next/server";
import { setTeamActive, updateTeam } from "@/lib/teams-repo";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { active } = body;

  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Campo 'active' é obrigatório." }, { status: 400 });
  }

  const updated = await setTeamActive(id, active);
  if (!updated) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { label, maxAge } = body;

  if (typeof label !== "string" || label.trim() === "") {
    return NextResponse.json({ error: "Nome da categoria é obrigatório." }, { status: 400 });
  }
  if (maxAge != null && (typeof maxAge !== "number" || !Number.isInteger(maxAge) || maxAge <= 0)) {
    return NextResponse.json({ error: "Idade máxima inválida." }, { status: 400 });
  }

  const updated = await updateTeam(id, label, maxAge ?? null);
  if (!updated) {
    return NextResponse.json({ error: "Categoria não encontrada." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
