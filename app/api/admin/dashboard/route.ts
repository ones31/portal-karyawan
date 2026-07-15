import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { rentangPeriode, periodeBerjalan } from "@/lib/periode";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";
import { DAFTAR_LOKASI } from "@/lib/lokasi";
import { hitungPersenKehadiran } from "@/lib/kehadiran";

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
    pendaftaranMenunggu,
  ] = await Promise.all([
      prisma.user.count({ where: { role: "KARYAWAN", statusAkun: "AKTIF" } }),
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
      prisma.user.count({ where: { role: "KARYAWAN", statusAkun: "MENUNGGU" } }),
    ]);

  const izinTerbaru = await prisma.izin.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { nama: true } } },
  });

  // Persentase kehadiran periode berjalan (siklus gajian 26–25) untuk semua
  // karyawan aktif yang lokasinya sudah diatur, dipisah per lokasi.
  const periodeKehadiran = periodeBerjalan();
  const lokasiFilter = { role: "KARYAWAN" as const, statusAkun: "AKTIF" as const, lokasi: { in: [...DAFTAR_LOKASI] } };
  const [karyawanKehadiran, izinKehadiran] = await Promise.all([
    prisma.user.findMany({
      where: lokasiFilter,
      select: { id: true, nama: true, lokasi: true },
    }),
    prisma.izin.findMany({
      where: {
        user: lokasiFilter,
        status: { not: "DITOLAK" },
        tanggalMulai: { lt: periodeKehadiran.lt },
        tanggalAkhir: { gte: periodeKehadiran.gte },
      },
      select: { userId: true, tanggalMulai: true, tanggalAkhir: true },
    }),
  ]);

  const izinPerUser = new Map<string, { tanggalMulai: Date; tanggalAkhir: Date }[]>();
  for (const i of izinKehadiran) {
    const arr = izinPerUser.get(i.userId) ?? [];
    arr.push(i);
    izinPerUser.set(i.userId, arr);
  }

  const kehadiranSemua = karyawanKehadiran
    .map((k) => ({
      id: k.id,
      nama: k.nama,
      lokasi: k.lokasi as (typeof DAFTAR_LOKASI)[number],
      persen: hitungPersenKehadiran(izinPerUser.get(k.id) ?? [], periodeKehadiran),
    }))
    .sort((a, b) => a.persen - b.persen); // terendah dulu

  const kehadiran = {
    periodeLabel: periodeKehadiran.label,
    ...Object.fromEntries(
      DAFTAR_LOKASI.map((l) => [l, kehadiranSemua.filter((k) => k.lokasi === l)])
    ),
  } as {
    periodeLabel: string;
    "Tegal Alur": typeof kehadiranSemua;
    Menceng: typeof kehadiranSemua;
  };

  return NextResponse.json({
    statistik: {
      totalKaryawan,
      izinSakit,
      izinLainnya,
      izinMenunggu,
      tukarLiburMenunggu,
      kontrakSegeraHabis,
      pendaftaranMenunggu,
    },
    izinTerbaru,
    kehadiran,
  });
}
