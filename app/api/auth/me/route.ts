import { NextResponse } from "next/server";
import { sesiSaatIni } from "@/lib/auth";

export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  return NextResponse.json({ user: sesi });
}
