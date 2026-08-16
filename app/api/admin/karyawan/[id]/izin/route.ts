import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, bolehAksesLokasi } from "@/lib/auth";
import { buatIzin } from "@/lib/pengajuan-izin";

// Admin/owner memasukkan pengajuan izin ATAS NAMA karyawan — solusi untuk
// karyawan yang terkendala membuka portal sendiri (mis. HP rusak/tidak ada
// sinyal). Aturan validasi sama persis dengan pengajuan mandiri karyawan
// (lihat lib/izin.ts, buatIzin) dan hasilnya tetap berstatus MENUNGGU —
// tetap harus di-approve seperti biasa, bukan langsung disetujui.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const karyawan = await prisma.user.findUnique({
    where: { id },
    select: { id: true, nama: true, role: true, lokasi: true },
  });
  if (!karyawan || karyawan.role !== "KARYAWAN") {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }
  if (!bolehAksesLokasi(sesi, karyawan.lokasi)) {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }

  // Terima multipart/form-data (upload surat dokter) maupun JSON (tanpa file)
  let jenis: string, tanggalMulai: string, tanggalAkhir: string, alasan: string;
  let fileSurat: File | null = null;
  let subJenisSetengahHari: string | null = null;
  let jamMasuk: string | null = null;
  let jamKeluar: string | null = null;
  let jamPulang: string | null = null;

  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const fd = await req.formData();
    jenis = String(fd.get("jenis") ?? "");
    tanggalMulai = String(fd.get("tanggalMulai") ?? "");
    tanggalAkhir = String(fd.get("tanggalAkhir") ?? "");
    alasan = String(fd.get("alasan") ?? "");
    const f = fd.get("suratDokter");
    if (f instanceof File && f.size > 0) fileSurat = f;
    subJenisSetengahHari = (fd.get("subJenisSetengahHari") as string) || null;
    jamMasuk = (fd.get("jamMasuk") as string) || null;
    jamKeluar = (fd.get("jamKeluar") as string) || null;
    jamPulang = (fd.get("jamPulang") as string) || null;
  } else {
    ({
      jenis,
      tanggalMulai,
      tanggalAkhir,
      alasan,
      subJenisSetengahHari = null,
      jamMasuk = null,
      jamKeluar = null,
      jamPulang = null,
    } = await req.json());
  }

  const hasil = await buatIzin({
    userId: karyawan.id,
    namaKaryawan: karyawan.nama,
    jenis,
    tanggalMulai,
    tanggalAkhir,
    alasan,
    fileSurat,
    subJenisSetengahHari,
    jamMasuk,
    jamKeluar,
    jamPulang,
    diajukanOlehAdmin: true,
  });
  if (!hasil.ok) {
    return NextResponse.json({ error: hasil.pesan }, { status: hasil.status });
  }

  return NextResponse.json({ izin: hasil.izin }, { status: 201 });
}
