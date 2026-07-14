import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { rentangPeriode } from "@/lib/periode";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";

export async function GET(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const periode = new URL(req.url).searchParams.get("periode");
  const tanggalMulai = rentangPeriode(periode);

  const [
    totalKaryawan,
    izinSakit,
    izinLainnya,
    izinMenunggu,
    tukarLiburMenunggu,
    kontrakSegeraHabis,
  ] = await Promise.all([
      prisma.user.count({ where: { role: "KARYAWAN" } }),
      prisma.izin.count({ where: { jenis: "SAKIT", tanggalMulai } }),
      prisma.izin.count({ where: { jenis: "LAINNYA", tanggalMulai } }),
      prisma.izin.count({ where: { status: "MENUNGGU" } }),
      prisma.tukarLibur.count({ where: { status: "MENUNGGU" } }),
      prisma.kontrak.count({
        where: {
          akhirKontrak: {
            gte: new Date(),
            lte: new Date(
              Date.now() + BATAS_HARI_KONTRAK_HABIS * 24 * 60 * 60 * 1000
            ),
          },
        },
      }),
    ]);

  const izinTerbaru = await prisma.izin.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { nama: true } } },
  });

  return NextResponse.json({
    statistik: {
      totalKaryawan,
      izinSakit,
      izinLainnya,
      izinMenunggu,
      tukarLiburMenunggu,
      kontrakSegeraHabis,
    },
    izinTerbaru,
  });
}
