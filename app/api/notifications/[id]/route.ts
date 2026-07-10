import { NextRequest, NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/notifications-repo";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId)) {
    return NextResponse.json({ error: "Aviso inválido." }, { status: 400 });
  }

  await markNotificationRead(notificationId);
  return NextResponse.json({ ok: true });
}
