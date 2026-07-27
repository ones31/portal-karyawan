import { NextResponse } from "next/server";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { prosesTukarLibur } from "@/lib/approval";

// Setujui / tolak pengajuan tukar libur
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();
  if (!["DISETUJUI", "DITOLAK"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const tukarLibur = await prosesTukarLibur(id, status);
  return NextResponse.json({ tukarLibur });
}
