import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { rentangPeriode } from "@/lib/periode";

// Rekap izin per karyawan: siapa saja yang izin + jumlahnya, sesuai jenis & periode
export async function GET(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const params = new URL(req.url).searchParams;
  const jenis = params.get("jenis") === "LAINNYA" ? "LAINNYA" : "SAKIT";
  const tanggalMulai = rentangPeriode(
    params.get("periode"),
    params.get("dari"),
    params.get("sampai")
  );

  const izin = await prisma.izin.findMany({
    where: { jenis, tanggalMulai },
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
        tanggalMulai: Date;
        tanggalAkhir: Date;
        alasan: string;
        status: string;
        suratDokter: string | null;
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
      tanggalMulai: i.tanggalMulai,
      tanggalAkhir: i.tanggalAkhir,
      alasan: i.alasan,
      status: i.status,
      suratDokter: i.suratDokter,
    });
  }

  const rekap = [...perKaryawan.values()].sort((a, b) => b.jumlah - a.jumlah);
  return NextResponse.json({ jenis, rekap });
}
