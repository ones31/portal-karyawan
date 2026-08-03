import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, filterLokasiSesi } from "@/lib/auth";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";
import { filterMasihKontrak } from "@/lib/masa-kerja";

// Daftar karyawan yang kontraknya akan segera habis ATAU SUDAH LEWAT
// (sengaja tanpa batas bawah tanggal — kontrak yang sudah lewat tetap harus
// bisa diperpanjang, bukan hilang dari daftar). Karyawan yang sudah TETAP
// dikecualikan lewat filterMasihKontrak() supaya kontrak basi yang belum
// sempat dibersihkan tidak nyangkut selamanya di sini.
export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const kontrak = await prisma.kontrak.findMany({
    where: {
      akhirKontrak: {
        lte: new Date(
          Date.now() + BATAS_HARI_KONTRAK_HABIS * 24 * 60 * 60 * 1000
        ),
      },
      user: { ...filterLokasiSesi(sesi), ...filterMasihKontrak() },
    },
    include: {
      user: { select: { id: true, nama: true, lokasi: true, phone: true } },
    },
    orderBy: { akhirKontrak: "asc" },
  });

  return NextResponse.json({
    daftar: kontrak.map((k) => ({
      userId: k.user.id,
      nama: k.user.nama,
      lokasi: k.user.lokasi,
      phone: k.user.phone,
      mulaiKontrak: k.mulaiKontrak,
      akhirKontrak: k.akhirKontrak,
      sudahTtd: !!k.ditandatanganiPada,
    })),
  });
}
