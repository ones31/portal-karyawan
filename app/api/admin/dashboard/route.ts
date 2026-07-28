import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, filterLokasiSesi } from "@/lib/auth";
import { rentangPeriode, periodeBerjalan } from "@/lib/periode";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";
import { BATAS_TAHUN_TETAP } from "@/lib/masa-kerja";
import { DAFTAR_LOKASI } from "@/lib/lokasi";
import { hitungPersenKehadiran } from "@/lib/kehadiran";

export async function GET(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const periode = new URL(req.url).searchParams.get("periode");
  const tanggalMulai = rentangPeriode(periode);
  // Admin ber-lokasiAkses hanya melihat statistik lokasinya; owner (SUPER_ADMIN) semua.
  const lokasiScope = filterLokasiSesi(sesi);
  // Kontrak segera habis ATAU sudah lewat (lihat app/api/admin/kontrak-habis) —
  // karyawan yang sudah Tetap dikecualikan biar kontrak basi tidak nyangkut.
  const batasTetap = new Date();
  batasTetap.setFullYear(batasTetap.getFullYear() - BATAS_TAHUN_TETAP);

  const [
    totalKaryawan,
    izinSakit,
    izinLainnya,
    izinMenunggu,
    tukarLiburMenunggu,
    kontrakSegeraHabis,
    pendaftaranMenunggu,
  ] = await Promise.all([
      prisma.user.count({ where: { role: "KARYAWAN", statusAkun: "AKTIF", ...lokasiScope } }),
      prisma.izin.count({ where: { jenis: "SAKIT", tanggalMulai, user: lokasiScope } }),
      prisma.izin.count({ where: { jenis: "LAINNYA", tanggalMulai, user: lokasiScope } }),
      prisma.izin.count({ where: { status: "MENUNGGU", user: lokasiScope } }),
      prisma.tukarLibur.count({ where: { status: "MENUNGGU", user: lokasiScope } }),
      prisma.kontrak.count({
        where: {
          akhirKontrak: {
            lte: new Date(
              Date.now() + BATAS_HARI_KONTRAK_HABIS * 24 * 60 * 60 * 1000
            ),
          },
          user: { ...lokasiScope, tanggalMasuk: { gt: batasTetap } },
        },
      }),
      // Pendaftaran menunggu belum punya lokasi (baru ditentukan saat approve),
      // jadi TIDAK di-scope — semua tingkat admin melihat & bisa memproses,
      // tapi hanya boleh assign ke lokasinya sendiri (lihat app/api/admin/pendaftaran/[id]).
      prisma.user.count({ where: { role: "KARYAWAN", statusAkun: "MENUNGGU" } }),
    ]);

  const izinTerbaru = await prisma.izin.findMany({
    where: { user: lokasiScope },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { nama: true } } },
  });

  // Persentase kehadiran periode berjalan (siklus gajian 26–25) untuk semua
  // karyawan aktif yang lokasinya sudah diatur, dipisah per lokasi.
  // Admin ber-lokasiAkses hanya mendapat tabel lokasinya sendiri.
  const lokasiUntukKehadiran =
    sesi.role === "SUPER_ADMIN"
      ? [...DAFTAR_LOKASI]
      : sesi.lokasiAkses
        ? [sesi.lokasiAkses]
        : [];
  const periodeKehadiran = periodeBerjalan();
  const lokasiFilter = { role: "KARYAWAN" as const, statusAkun: "AKTIF" as const, lokasi: { in: lokasiUntukKehadiran } };
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

  // Hanya lokasi yang boleh dilihat sesi ini yang jadi key di response —
  // frontend merender apa pun key lokasi yang ada di objek ini (lihat app/admin/page.tsx).
  const kehadiran: { periodeLabel: string; [lokasi: string]: string | typeof kehadiranSemua } = {
    periodeLabel: periodeKehadiran.label,
    ...Object.fromEntries(
      lokasiUntukKehadiran.map((l) => [l, kehadiranSemua.filter((k) => k.lokasi === l)])
    ),
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
