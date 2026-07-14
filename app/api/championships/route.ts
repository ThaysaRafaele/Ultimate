import { NextResponse } from "next/server";
import { getChampionshipsWithGameCount } from "@/lib/championships-repo";

export async function GET() {
  const rows = await getChampionshipsWithGameCount();
  return NextResponse.json(rows);
}
