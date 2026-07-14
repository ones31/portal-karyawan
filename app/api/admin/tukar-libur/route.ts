import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";

// Daftar semua pengajuan tukar libur (untuk admin/owner)
export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const daftar = await prisma.tukarLibur.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { nama: true, lokasi: true } } },
  });
  return NextResponse.json({ daftar });
}
