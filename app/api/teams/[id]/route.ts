import { NextRequest, NextResponse } from "next/server";
import { setTeamActive } from "@/lib/teams-repo";

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
