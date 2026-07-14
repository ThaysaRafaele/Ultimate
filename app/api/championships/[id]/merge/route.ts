import { NextRequest, NextResponse } from "next/server";
import { getAllChampionships, mergeChampionships } from "@/lib/championships-repo";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { targetId } = body;

  if (typeof targetId !== "string" || targetId.trim() === "") {
    return NextResponse.json({ error: "Escolha um campeonato de destino." }, { status: 400 });
  }
  if (targetId === id) {
    return NextResponse.json(
      { error: "O campeonato de destino precisa ser diferente do de origem." },
      { status: 400 }
    );
  }

  const all = await getAllChampionships();
  if (!all.some((c) => c.id === id) || !all.some((c) => c.id === targetId)) {
    return NextResponse.json({ error: "Campeonato não encontrado." }, { status: 404 });
  }

  await mergeChampionships(id, targetId);
  return NextResponse.json({ ok: true });
}
