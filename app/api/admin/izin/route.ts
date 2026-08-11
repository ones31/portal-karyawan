import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, filterLokasiSesi } from "@/lib/auth";

// Daftar semua pengajuan izin (untuk admin/owner) — sama pola dengan
// GET /api/admin/tukar-libur. Diurutkan status dulu (MENUNGGU di atas, sesuai
// urutan enum StatusIzin di schema.prisma), baru terbaru dulu.
export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const daftar = await prisma.izin.findMany({
    where: { user: filterLokasiSesi(sesi) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { nama: true, lokasi: true } } },
  });
  return NextResponse.json({ daftar });
}
