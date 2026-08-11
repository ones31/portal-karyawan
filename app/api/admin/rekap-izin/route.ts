import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, filterLokasiSesi } from "@/lib/auth";
import { rentangPeriode } from "@/lib/periode";
import { JENIS_IZIN, type JenisIzin } from "@/lib/izin";

// Rekap izin per karyawan: siapa saja yang izin + jumlahnya, sesuai jenis & periode.
// jenis "SEMUA" (atau nilai tak dikenal) = semua jenis izin digabung.
export async function GET(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const params = new URL(req.url).searchParams;
  const jenisParam = params.get("jenis") ?? "SEMUA";
  const jenis = (JENIS_IZIN as readonly string[]).includes(jenisParam)
    ? (jenisParam as JenisIzin)
    : null; // null = semua jenis
  const tanggalMulai = rentangPeriode(
    params.get("periode"),
    params.get("dari"),
    params.get("sampai")
  );

  const izin = await prisma.izin.findMany({
    where: {
      ...(jenis ? { jenis } : {}),
      tanggalMulai,
      user: filterLokasiSesi(sesi),
    },
    include: { user: { select: { id: true, nama: true, lokasi: true } } },
    orderBy: { tanggalMulai: "desc" },
  });

  const perKaryawan = new Map<
    string,
    {
      userId: string;
      nama: string;
      lokasi: string | null;
      jumlah: number;
      izin: {
        jenis: JenisIzin;
        tanggalMulai: Date;
        tanggalAkhir: Date;
        alasan: string;
        status: string;
        suratDokter: string | null;
        createdAt: Date;
      }[];
    }
  >();

  for (const i of izin) {
    let entri = perKaryawan.get(i.user.id);
    if (!entri) {
      entri = {
        userId: i.user.id,
        nama: i.user.nama,
        lokasi: i.user.lokasi,
        jumlah: 0,
        izin: [],
      };
      perKaryawan.set(i.user.id, entri);
    }
    entri.jumlah++;
    entri.izin.push({
      jenis: i.jenis,
      tanggalMulai: i.tanggalMulai,
      tanggalAkhir: i.tanggalAkhir,
      alasan: i.alasan,
      status: i.status,
      suratDokter: i.suratDokter,
      createdAt: i.createdAt,
    });
  }

  const rekap = [...perKaryawan.values()].sort((a, b) => b.jumlah - a.jumlah);
  return NextResponse.json({ jenis: jenis ?? "SEMUA", rekap });
}
