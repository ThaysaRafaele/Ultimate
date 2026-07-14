import { NextRequest, NextResponse } from "next/server";
import { renameChampionship } from "@/lib/championships-repo";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Nome do campeonato é obrigatório." }, { status: 400 });
  }

  const updated = await renameChampionship(id, name);
  if (!updated) {
    return NextResponse.json({ error: "Campeonato não encontrado." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
