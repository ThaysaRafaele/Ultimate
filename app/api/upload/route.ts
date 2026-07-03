import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("filename");
  if (!filename || !request.body) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  const blob = await put(filename, request.body, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json(blob);
}
