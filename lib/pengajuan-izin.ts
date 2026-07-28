import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { MAKS_UKURAN_SURAT, TIPE_SURAT, simpanSurat } from "./surat-dokter";
import { kirimNotifKeAdmin } from "./push";
import { LABEL_JENIS_IZIN, MAKS_HARI_MENIKAH, jumlahHari, type JenisIzin } from "./izin";

// Server-only (pakai fs/prisma) — SENGAJA dipisah dari lib/izin.ts supaya
// konstanta di sana tetap aman diimpor komponen client (app/karyawan/izin,
// app/admin/karyawan/[id]) tanpa ikut menyeret fs/promises ke bundle browser.

export type BuatIzinInput = {
  userId: string; // pemilik izin (karyawan ybs)
  namaKaryawan: string; // untuk notifikasi ke admin/owner
  jenis: string;
  tanggalMulai: string;
  tanggalAkhir: string;
  alasan: string;
  fileSurat: File | null;
};

export type HasilBuatIzin =
  | { ok: true; izin: Awaited<ReturnType<typeof prisma.izin.create>> }
  | { ok: false; status: number; pesan: string };

// Validasi + simpan pengajuan izin. Dipakai baik oleh karyawan sendiri
// (app/api/izin) maupun admin/owner yang memasukkan izin atas nama karyawan
// (app/api/admin/karyawan/[id]/izin) — aturan bisnis (surat dokter, batas hari
// menikah, dll.) harus identik di kedua jalur.
export async function buatIzin(input: BuatIzinInput): Promise<HasilBuatIzin> {
  const { userId, namaKaryawan, jenis, tanggalMulai, tanggalAkhir, alasan, fileSurat } = input;

  // Alasan tidak wajib untuk Tugas Negara
  if (
    !jenis ||
    !tanggalMulai ||
    !tanggalAkhir ||
    (jenis !== "TUGAS_NEGARA" && !alasan)
  ) {
    return { ok: false, status: 400, pesan: "Semua kolom wajib diisi" };
  }
  if (!["SAKIT", "LAINNYA", "TUGAS_NEGARA", "MENIKAH"].includes(jenis)) {
    return { ok: false, status: 400, pesan: "Jenis izin tidak valid" };
  }
  if (new Date(tanggalAkhir) < new Date(tanggalMulai)) {
    return {
      ok: false,
      status: 400,
      pesan: "Tanggal akhir tidak boleh sebelum tanggal mulai",
    };
  }
  if (jenis === "MENIKAH") {
    const hari = jumlahHari(tanggalMulai, tanggalAkhir);
    if (hari > MAKS_HARI_MENIKAH) {
      return {
        ok: false,
        status: 400,
        pesan: `Izin menikah maksimal ${MAKS_HARI_MENIKAH} hari`,
      };
    }
  }

  // Simpan surat dokter (hanya untuk izin sakit)
  let namaFile: string | null = null;
  if (jenis === "SAKIT" && fileSurat) {
    const ekstensi = TIPE_SURAT[fileSurat.type];
    if (!ekstensi) {
      return {
        ok: false,
        status: 400,
        pesan: "Format surat dokter harus PDF, JPG, atau PNG",
      };
    }
    if (fileSurat.size > MAKS_UKURAN_SURAT) {
      return { ok: false, status: 400, pesan: "Ukuran surat dokter maksimal 5 MB" };
    }
    namaFile = `${randomUUID()}.${ekstensi}`;
    await simpanSurat(
      namaFile,
      Buffer.from(await fileSurat.arrayBuffer()),
      fileSurat.type
    );
  }

  const izin = await prisma.izin.create({
    data: {
      userId,
      jenis: jenis as JenisIzin,
      tanggalMulai: new Date(tanggalMulai),
      tanggalAkhir: new Date(tanggalAkhir),
      alasan: alasan || "",
      suratDokter: namaFile,
    },
  });

  // Beri tahu admin & owner ada pengajuan baru
  await kirimNotifKeAdmin({
    judul: "Pengajuan izin baru",
    isi: `${namaKaryawan}: ${LABEL_JENIS_IZIN[jenis as JenisIzin]} (${new Date(
      tanggalMulai
    ).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})`,
    url: "/admin",
  }).catch(() => {});

  return { ok: true, izin };
}
