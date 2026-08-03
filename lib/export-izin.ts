import ExcelJS from "exceljs";
import { LABEL_JENIS_IZIN, type JenisIzin } from "./izin";

// Server-only (pakai exceljs) — pembuatan file Excel rekap izin (Feature 22).
// Konstanta murni yang ikut dipakai komponen client ada di lib/izin.ts.

export type BarisIzinExport = {
  nama: string;
  lokasi: string | null;
  jenis: JenisIzin;
  tanggalMulai: Date;
  tanggalAkhir: Date;
  alasan: string;
  status: string;
  suratDokter: string | null;
  createdAt: Date;
};

export type ExportIzinInput = {
  baris: BarisIzinExport[];
  labelJenis: string; // "Izin Sakit" | "Semua Jenis Izin" | dst.
  dari: Date;
  sampai: Date; // inklusif — tanggal yang ditampilkan ke user
  diexporOleh: string;
};

const HEADER = [
  "No",
  "Nama Karyawan",
  "Lokasi",
  "Jenis Izin",
  "Tanggal Mulai",
  "Tanggal Akhir",
  "Jumlah Hari",
  "Alasan",
  "Status",
  "Surat Dokter",
  "Diajukan Pada",
];

const LEBAR_KOLOM = [5, 24, 13, 15, 15, 15, 12, 40, 12, 14, 15];

function tanggalPanjang(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Jumlah hari inklusif antara dua tanggal (objek Date)
function jumlahHariIzin(mulai: Date, akhir: Date) {
  return Math.floor((akhir.getTime() - mulai.getTime()) / 86400000) + 1;
}

function tanggalRingkas(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Satu entri tanggal izin untuk kolom rekap: "17 Jul 2026" kalau sehari,
// "30 Jul 2026 – 31 Jul 2026" kalau lebih dari sehari.
function rentangIzin(mulai: Date, akhir: Date) {
  const a = tanggalRingkas(mulai);
  const b = tanggalRingkas(akhir);
  return a === b ? a : `${a} – ${b}`;
}

// Nama file yang sudah menyertakan rentang tanggal, mis.
// "Rekap-Izin-Sakit_2026-07-01_sd_2026-07-31.xlsx"
export function namaFileExport(labelJenis: string, dari: Date, sampai: Date) {
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  const slug = labelJenis.replace(/\s+/g, "-");
  return `Rekap-${slug}_${iso(dari)}_sd_${iso(sampai)}.xlsx`;
}

export async function buatExcelRekapIzin(
  input: ExportIzinInput
): Promise<Buffer> {
  const { baris, labelJenis, dari, sampai, diexporOleh } = input;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Portal Toko Marmo";
  wb.created = new Date();

  // ---- Sheet 1: daftar rinci ----
  const ws = wb.addWorksheet("Rekap Izin");
  ws.columns = LEBAR_KOLOM.map((width) => ({ width }));

  const judul = ws.addRow([`REKAP PENGAJUAN IZIN — TOKO H. MARMO`]);
  judul.font = { bold: true, size: 14 };
  ws.mergeCells(judul.number, 1, judul.number, HEADER.length);

  const barisJenis = ws.addRow([`Jenis: ${labelJenis}`]);
  ws.mergeCells(barisJenis.number, 1, barisJenis.number, HEADER.length);

  // Rentang tanggal SELALU ikut tercetak di file (permintaan user)
  const barisPeriode = ws.addRow([
    `Periode: ${tanggalPanjang(dari)} s/d ${tanggalPanjang(sampai)}`,
  ]);
  barisPeriode.font = { bold: true };
  ws.mergeCells(barisPeriode.number, 1, barisPeriode.number, HEADER.length);

  const barisInfo = ws.addRow([
    `Diekspor ${tanggalPanjang(new Date())} oleh ${diexporOleh} · ${baris.length} pengajuan`,
  ]);
  barisInfo.font = { italic: true, size: 10 };
  ws.mergeCells(barisInfo.number, 1, barisInfo.number, HEADER.length);

  ws.addRow([]);

  const barisHeader = ws.addRow(HEADER);
  barisHeader.font = { bold: true };
  barisHeader.alignment = { vertical: "middle", horizontal: "center" };
  barisHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDBEAFE" }, // biru muda, senada tema portal
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  baris.forEach((b, idx) => {
    const r = ws.addRow([
      idx + 1,
      b.nama,
      b.lokasi ?? "—",
      LABEL_JENIS_IZIN[b.jenis],
      tanggalPanjang(b.tanggalMulai),
      tanggalPanjang(b.tanggalAkhir),
      jumlahHariIzin(b.tanggalMulai, b.tanggalAkhir),
      b.alasan || "—",
      b.status,
      b.suratDokter ? "Ada" : "Tidak ada",
      tanggalPanjang(b.createdAt),
    ]);
    r.alignment = { vertical: "top", wrapText: true };
    r.getCell(1).alignment = { horizontal: "center" };
    r.getCell(7).alignment = { horizontal: "center" };
  });

  if (baris.length === 0) {
    const kosong = ws.addRow(["Tidak ada pengajuan izin pada rentang tanggal ini."]);
    kosong.font = { italic: true };
    ws.mergeCells(kosong.number, 1, kosong.number, HEADER.length);
  }

  // Baris header tetap terlihat saat di-scroll
  ws.views = [{ state: "frozen", ySplit: barisHeader.number }];

  // ---- Sheet 2: rekap jumlah per karyawan ----
  const ws2 = wb.addWorksheet("Per Karyawan");
  ws2.columns = [
    { width: 5 },
    { width: 24 },
    { width: 13 },
    { width: 14 },
    { width: 12 },
    { width: 55 },
  ];

  const judul2 = ws2.addRow([
    `REKAP PER KARYAWAN — ${labelJenis} (${tanggalPanjang(dari)} s/d ${tanggalPanjang(sampai)})`,
  ]);
  judul2.font = { bold: true, size: 12 };
  ws2.mergeCells(judul2.number, 1, judul2.number, 6);
  ws2.addRow([]);

  const header2 = ws2.addRow([
    "No",
    "Nama Karyawan",
    "Lokasi",
    "Jumlah Izin",
    "Total Hari",
    "Tanggal Izin",
  ]);
  header2.font = { bold: true };
  header2.alignment = { horizontal: "center" };
  header2.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDBEAFE" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const perKaryawan = new Map<
    string,
    {
      nama: string;
      lokasi: string | null;
      jumlah: number;
      totalHari: number;
      // Tanggal tiap izin, disimpan mentah dulu supaya bisa diurutkan kronologis
      tanggal: { mulai: Date; akhir: Date }[];
    }
  >();
  for (const b of baris) {
    let e = perKaryawan.get(b.nama);
    if (!e) {
      e = { nama: b.nama, lokasi: b.lokasi, jumlah: 0, totalHari: 0, tanggal: [] };
      perKaryawan.set(b.nama, e);
    }
    e.jumlah++;
    e.totalHari += jumlahHariIzin(b.tanggalMulai, b.tanggalAkhir);
    e.tanggal.push({ mulai: b.tanggalMulai, akhir: b.tanggalAkhir });
  }

  [...perKaryawan.values()]
    .sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama))
    .forEach((k, idx) => {
      const daftarTanggal = k.tanggal
        .slice()
        .sort((a, b) => a.mulai.getTime() - b.mulai.getTime())
        .map((t) => rentangIzin(t.mulai, t.akhir))
        .join(", ");
      const r = ws2.addRow([
        idx + 1,
        k.nama,
        k.lokasi ?? "—",
        k.jumlah,
        k.totalHari,
        daftarTanggal,
      ]);
      r.alignment = { vertical: "top" };
      r.getCell(1).alignment = { horizontal: "center", vertical: "top" };
      r.getCell(4).alignment = { horizontal: "center", vertical: "top" };
      r.getCell(5).alignment = { horizontal: "center", vertical: "top" };
      r.getCell(6).alignment = { wrapText: true, vertical: "top" };
    });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
