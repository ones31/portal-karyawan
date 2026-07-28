import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";
import { buatIzin } from "@/lib/pengajuan-izin";

export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const izin = await prisma.izin.findMany({
    where: { userId: sesi.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ izin });
}

export async function POST(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  // Terima multipart/form-data (web + upload surat dokter) maupun JSON (tanpa file)
  let jenis: string, tanggalMulai: string, tanggalAkhir: string, alasan: string;
  let fileSurat: File | null = null;

  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const fd = await req.formData();
    jenis = String(fd.get("jenis") ?? "");
    tanggalMulai = String(fd.get("tanggalMulai") ?? "");
    tanggalAkhir = String(fd.get("tanggalAkhir") ?? "");
    alasan = String(fd.get("alasan") ?? "");
    const f = fd.get("suratDokter");
    if (f instanceof File && f.size > 0) fileSurat = f;
  } else {
    ({ jenis, tanggalMulai, tanggalAkhir, alasan } = await req.json());
  }

  const hasil = await buatIzin({
    userId: sesi.userId,
    namaKaryawan: sesi.nama,
    jenis,
    tanggalMulai,
    tanggalAkhir,
    alasan,
    fileSurat,
  });
  if (!hasil.ok) {
    return NextResponse.json({ error: hasil.pesan }, { status: hasil.status });
  }

  return NextResponse.json({ izin: hasil.izin }, { status: 201 });
}
