import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, bolehAksesLokasi } from "@/lib/auth";
import { prosesIzin } from "@/lib/approval";

// Setujui / tolak izin
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

  const target = await prisma.izin.findUnique({
    where: { id },
    select: { user: { select: { lokasi: true } } },
  });
  if (!target) {
    return NextResponse.json({ error: "Izin tidak ditemukan" }, { status: 404 });
  }
  if (!bolehAksesLokasi(sesi, target.user.lokasi)) {
    return NextResponse.json({ error: "Izin tidak ditemukan" }, { status: 404 });
  }

  const izin = await prosesIzin(id, status, feedback);
  return NextResponse.json({ izin });
}
