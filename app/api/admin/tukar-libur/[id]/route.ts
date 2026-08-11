import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, bolehAksesLokasi } from "@/lib/auth";
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
  const { status, feedback } = await req.json();
  if (!["DISETUJUI", "DITOLAK"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const target = await prisma.tukarLibur.findUnique({
    where: { id },
    select: { user: { select: { lokasi: true } } },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Tukar libur tidak ditemukan" },
      { status: 404 }
    );
  }
  if (!bolehAksesLokasi(sesi, target.user.lokasi)) {
    return NextResponse.json(
      { error: "Tukar libur tidak ditemukan" },
      { status: 404 }
    );
  }

  const tukarLibur = await prosesTukarLibur(id, status, feedback);
  return NextResponse.json({ tukarLibur });
}
