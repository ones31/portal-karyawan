import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, filterLokasiSesi } from "@/lib/auth";
import { JENIS_IZIN, LABEL_JENIS_IZIN, type JenisIzin } from "@/lib/izin";
import { buatExcelRekapIzin, namaFileExport } from "@/lib/export-izin";

// exceljs butuh API Node (Buffer/stream), bukan Edge runtime
export const runtime = "nodejs";

// Export rekap izin ke file Excel (.xlsx).
// Rentang tanggal WAJIB diisi (dari & sampai) supaya file yang dihasilkan selalu
// jelas mencakup periode apa — rentangnya ikut tercetak di dalam file & nama file.
export async function GET(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const params = new URL(req.url).searchParams;
  const jenisParam = params.get("jenis") ?? "SEMUA";
  const dariParam = params.get("dari");
  const sampaiParam = params.get("sampai");

  if (!dariParam || !sampaiParam) {
    return NextResponse.json(
      { error: "Tanggal dari dan sampai wajib diisi untuk export" },
      { status: 400 }
    );
  }

  const dari = new Date(dariParam);
  const sampai = new Date(sampaiParam);
  if (isNaN(dari.getTime()) || isNaN(sampai.getTime())) {
    return NextResponse.json(
      { error: "Format tanggal tidak valid (gunakan format tahun-bulan-tanggal)" },
      { status: 400 }
    );
  }
  if (sampai < dari) {
    return NextResponse.json(
      { error: "Tanggal sampai tidak boleh sebelum tanggal dari" },
      { status: 400 }
    );
  }

  const semuaJenis = jenisParam === "SEMUA";
  if (!semuaJenis && !(JENIS_IZIN as readonly string[]).includes(jenisParam)) {
    return NextResponse.json({ error: "Jenis izin tidak valid" }, { status: 400 });
  }

  const izin = await prisma.izin.findMany({
    where: {
      ...(semuaJenis ? {} : { jenis: jenisParam as JenisIzin }),
      tanggalMulai: {
        gte: dari,
        // +1 hari supaya tanggal "sampai" ikut terhitung (inklusif)
        lt: new Date(sampai.getTime() + 86400000),
      },
      user: filterLokasiSesi(sesi),
    },
    orderBy: [{ tanggalMulai: "desc" }],
    include: { user: { select: { nama: true, lokasi: true } } },
  });

  const labelJenis = semuaJenis
    ? "Semua Jenis Izin"
    : LABEL_JENIS_IZIN[jenisParam as JenisIzin];

  const buffer = await buatExcelRekapIzin({
    baris: izin.map((i) => ({
      nama: i.user.nama,
      lokasi: i.user.lokasi,
      jenis: i.jenis,
      tanggalMulai: i.tanggalMulai,
      tanggalAkhir: i.tanggalAkhir,
      alasan: i.alasan,
      status: i.status,
      suratDokter: i.suratDokter,
      createdAt: i.createdAt,
    })),
    labelJenis,
    dari,
    sampai,
    diexporOleh: sesi.nama,
  });

  const namaFile = namaFileExport(labelJenis, dari, sampai);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
