import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";
import { MAKS_UKURAN_SURAT, TIPE_SURAT, simpanSurat } from "@/lib/surat-dokter";
import { MAKS_HARI_MENIKAH, LABEL_JENIS_IZIN, type JenisIzin } from "@/lib/izin";
import { kirimNotifKeAdmin } from "@/lib/push";

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

  // Alasan tidak wajib untuk Tugas Negara
  if (
    !jenis ||
    !tanggalMulai ||
    !tanggalAkhir ||
    (jenis !== "TUGAS_NEGARA" && !alasan)
  ) {
    return NextResponse.json(
      { error: "Semua kolom wajib diisi" },
      { status: 400 }
    );
  }
  if (!["SAKIT", "LAINNYA", "TUGAS_NEGARA", "MENIKAH"].includes(jenis)) {
    return NextResponse.json({ error: "Jenis izin tidak valid" }, { status: 400 });
  }
  if (new Date(tanggalAkhir) < new Date(tanggalMulai)) {
    return NextResponse.json(
      { error: "Tanggal akhir tidak boleh sebelum tanggal mulai" },
      { status: 400 }
    );
  }
  if (jenis === "MENIKAH") {
    const hari =
      Math.floor(
        (new Date(tanggalAkhir).getTime() - new Date(tanggalMulai).getTime()) /
          86400000
      ) + 1;
    if (hari > MAKS_HARI_MENIKAH) {
      return NextResponse.json(
        { error: `Izin menikah maksimal ${MAKS_HARI_MENIKAH} hari` },
        { status: 400 }
      );
    }
  }

  // Simpan surat dokter (hanya untuk izin sakit)
  let namaFile: string | null = null;
  if (jenis === "SAKIT" && fileSurat) {
    const ekstensi = TIPE_SURAT[fileSurat.type];
    if (!ekstensi) {
      return NextResponse.json(
        { error: "Format surat dokter harus PDF, JPG, atau PNG" },
        { status: 400 }
      );
    }
    if (fileSurat.size > MAKS_UKURAN_SURAT) {
      return NextResponse.json(
        { error: "Ukuran surat dokter maksimal 5 MB" },
        { status: 400 }
      );
    }
    namaFile = `${randomUUID()}.${ekstensi}`;
    await simpanSurat(
      namaFile,
      Buffer.from(await fileSurat.arrayBuffer()),
      fileSurat.type
    );
  }

  // Sesuai tata tertib: izin sakit lebih dari 1 hari wajib melampirkan surat dokter
  if (
    jenis === "SAKIT" &&
    !namaFile &&
    new Date(tanggalAkhir).getTime() > new Date(tanggalMulai).getTime()
  ) {
    return NextResponse.json(
      { error: "Izin sakit lebih dari 1 hari wajib melampirkan surat dokter" },
      { status: 400 }
    );
  }

  const izin = await prisma.izin.create({
    data: {
      userId: sesi.userId,
      jenis: jenis as "SAKIT" | "LAINNYA" | "TUGAS_NEGARA" | "MENIKAH",
      tanggalMulai: new Date(tanggalMulai),
      tanggalAkhir: new Date(tanggalAkhir),
      alasan: alasan || "",
      suratDokter: namaFile,
    },
  });

  // Beri tahu admin & owner ada pengajuan baru
  await kirimNotifKeAdmin({
    judul: "Pengajuan izin baru",
    isi: `${sesi.nama}: ${LABEL_JENIS_IZIN[jenis as JenisIzin]} (${new Date(
      tanggalMulai
    ).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})`,
    url: "/admin",
  }).catch(() => {});

  return NextResponse.json({ izin }, { status: 201 });
}
