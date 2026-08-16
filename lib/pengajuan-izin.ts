import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { MAKS_UKURAN_SURAT, TIPE_SURAT, simpanSurat } from "./surat-dokter";
import { kirimNotifKeAdmin } from "./push";
import {
  FORMAT_JAM,
  JAM_BATAS_IZIN_TELAT,
  JENIS_IZIN,
  JENIS_SATU_TANGGAL,
  LABEL_JENIS_IZIN,
  MAKS_HARI_MENIKAH,
  SUB_JENIS_SETENGAH_HARI,
  jumlahHari,
  lewatBatasIzinTelat,
  type JenisIzin,
  type SubJenisSetengahHari,
} from "./izin";

// Server-only (pakai fs/prisma) — SENGAJA dipisah dari lib/izin.ts supaya
// konstanta di sana tetap aman diimpor komponen client (app/karyawan/izin,
// app/admin/karyawan/[id]) tanpa ikut menyeret fs/promises ke bundle browser.

function formatTanggalIndo(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Validasi format/ukuran lalu simpan file surat dokter ke disk/Blob.
// Dipisah supaya bisa dipakai baik di jalur "buat izin baru" maupun jalur
// "lampirkan surat dokter ke izin sakit yang sudah ada" (lihat buatIzin()).
async function simpanSuratValidasi(
  fileSurat: File
): Promise<{ ok: true; namaFile: string } | { ok: false; status: number; pesan: string }> {
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
  const namaFile = `${randomUUID()}.${ekstensi}`;
  await simpanSurat(namaFile, Buffer.from(await fileSurat.arrayBuffer()), fileSurat.type);
  return { ok: true, namaFile };
}

export type BuatIzinInput = {
  userId: string; // pemilik izin (karyawan ybs)
  namaKaryawan: string; // untuk notifikasi ke admin/owner
  jenis: string;
  tanggalMulai: string;
  tanggalAkhir: string;
  alasan: string;
  fileSurat: File | null;
  // Hanya dipakai kalau jenis = SETENGAH_HARI (Feature 32)
  subJenisSetengahHari?: string | null;
  jamMasuk?: string | null;
  jamKeluar?: string | null;
  jamPulang?: string | null;
  // true kalau admin/owner yang input atas nama karyawan (Feature 20) — mengecualikan
  // dari batas waktu pengajuan Telat (Feature 32 susulan), karena keterlambatan
  // input admin bukan salah karyawan yang sudah lapor sebelum jam 8.
  diajukanOlehAdmin?: boolean;
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
  if (!(JENIS_IZIN as readonly string[]).includes(jenis)) {
    return { ok: false, status: 400, pesan: "Jenis izin tidak valid" };
  }
  if (new Date(tanggalAkhir) < new Date(tanggalMulai)) {
    return {
      ok: false,
      status: 400,
      pesan: "Tanggal akhir tidak boleh sebelum tanggal mulai",
    };
  }
  // Pertahanan sisi server: jenis "satu tanggal" (Tugas Negara, Setengah Hari)
  // tidak boleh diajukan sebagai rentang, walau UI sudah memaksa satu input.
  if (
    JENIS_SATU_TANGGAL.includes(jenis as JenisIzin) &&
    tanggalMulai !== tanggalAkhir
  ) {
    return {
      ok: false,
      status: 400,
      pesan: `${LABEL_JENIS_IZIN[jenis as JenisIzin]} hanya berlaku untuk 1 tanggal, tidak bisa rentang`,
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

  // Detail sub-jenis Izin Setengah Hari (Feature 32) — pertahanan sisi server,
  // sama seperti pertahanan JENIS_SATU_TANGGAL di atas.
  let subJenisValid: SubJenisSetengahHari | null = null;
  let jamMasukValid: string | null = null;
  let jamKeluarValid: string | null = null;
  let jamPulangValid: string | null = null;
  if (jenis === "SETENGAH_HARI") {
    const sub = input.subJenisSetengahHari;
    if (!sub || !(SUB_JENIS_SETENGAH_HARI as readonly string[]).includes(sub)) {
      return {
        ok: false,
        status: 400,
        pesan:
          "Pilih jenis Izin Tidak Full: Telat, Izin di Tengah Jam Kerja, atau Pulang Cepat",
      };
    }
    subJenisValid = sub as SubJenisSetengahHari;
    if (subJenisValid === "TELAT") {
      if (!input.jamMasuk || !FORMAT_JAM.test(input.jamMasuk)) {
        return { ok: false, status: 400, pesan: "Jam masuk wajib diisi dengan format yang benar" };
      }
      // Cegah pengajuan "telat" setelah kesiangan sungguhan — deadline
      // 08.00 WIB pada tanggal izin. Tidak berlaku kalau admin/owner yang
      // input atas nama karyawan (Feature 20) — keterlambatan admin
      // menginput bukan salah karyawan yang sudah lapor sebelum jam 8.
      if (!input.diajukanOlehAdmin && lewatBatasIzinTelat(tanggalMulai)) {
        return {
          ok: false,
          status: 400,
          pesan: `Izin Telat untuk tanggal ${formatTanggalIndo(new Date(tanggalMulai))} hanya bisa diajukan sebelum jam ${JAM_BATAS_IZIN_TELAT}.00 WIB`,
        };
      }
      jamMasukValid = input.jamMasuk;
    } else if (subJenisValid === "PERTENGAHAN") {
      if (!input.jamKeluar || !FORMAT_JAM.test(input.jamKeluar)) {
        return { ok: false, status: 400, pesan: "Jam keluar wajib diisi dengan format yang benar" };
      }
      if (!input.jamMasuk || !FORMAT_JAM.test(input.jamMasuk)) {
        return {
          ok: false,
          status: 400,
          pesan: "Jam masuk kembali wajib diisi dengan format yang benar",
        };
      }
      jamKeluarValid = input.jamKeluar;
      jamMasukValid = input.jamMasuk;
    } else {
      if (!input.jamPulang || !FORMAT_JAM.test(input.jamPulang)) {
        return { ok: false, status: 400, pesan: "Jam pulang wajib diisi dengan format yang benar" };
      }
      jamPulangValid = input.jamPulang;
    }
  }

  // Cegah duplikasi: jenis izin sama + tanggal tumpang tindih dengan pengajuan
  // yang masih MENUNGGU atau sudah DISETUJUI. Izin yang sudah DITOLAK TIDAK
  // menghalangi pengajuan ulang (karyawan boleh coba lagi).
  const sudahAda = await prisma.izin.findFirst({
    where: {
      userId,
      jenis: jenis as JenisIzin,
      status: { in: ["MENUNGGU", "DISETUJUI"] },
      tanggalMulai: { lte: new Date(tanggalAkhir) },
      tanggalAkhir: { gte: new Date(tanggalMulai) },
    },
  });
  if (sudahAda) {
    // PENGECUALIAN: izin Sakit yang tadinya tanpa surat dokter boleh dilengkapi
    // dengan surat dokter belakangan — bukan dianggap pengajuan baru yang
    // duplikat, tapi MELENGKAPI baris yang sudah ada (bukan bikin baris baru).
    // Ini juga yang membuat penghitungan izin tetap 1 hari, bukan 2 — karena
    // datanya memang tetap satu baris, di semua laporan/rekap/kehadiran.
    const lengkapiSuratDokter =
      jenis === "SAKIT" && !sudahAda.suratDokter && !!fileSurat;

    if (!lengkapiSuratDokter) {
      const rentang =
        sudahAda.tanggalMulai.getTime() === sudahAda.tanggalAkhir.getTime()
          ? formatTanggalIndo(sudahAda.tanggalMulai)
          : `${formatTanggalIndo(sudahAda.tanggalMulai)} – ${formatTanggalIndo(sudahAda.tanggalAkhir)}`;
      const statusLabel = sudahAda.status === "MENUNGGU" ? "menunggu" : "disetujui";
      return {
        ok: false,
        status: 400,
        pesan: `${LABEL_JENIS_IZIN[jenis as JenisIzin]} untuk tanggal ${rentang} sudah pernah diajukan sebelumnya (status: ${statusLabel}). Tidak bisa mengajukan izin jenis yang sama untuk tanggal yang sama/tumpang tindih.`,
      };
    }

    const hasilSurat = await simpanSuratValidasi(fileSurat!);
    if (!hasilSurat.ok) return hasilSurat;

    const izinTerbaru = await prisma.izin.update({
      where: { id: sudahAda.id },
      data: {
        suratDokter: hasilSurat.namaFile,
        alasan: alasan || sudahAda.alasan,
        tanggalMulai: new Date(tanggalMulai),
        tanggalAkhir: new Date(tanggalAkhir),
      },
    });

    await kirimNotifKeAdmin({
      judul: "Surat dokter dilampirkan",
      isi: `${namaKaryawan} melampirkan surat dokter untuk izin sakit ${formatTanggalIndo(
        izinTerbaru.tanggalMulai
      )}`,
      url: "/admin",
    }).catch(() => {});

    return { ok: true, izin: izinTerbaru };
  }

  // Simpan surat dokter (hanya untuk izin sakit)
  let namaFile: string | null = null;
  if (jenis === "SAKIT" && fileSurat) {
    const hasilSurat = await simpanSuratValidasi(fileSurat);
    if (!hasilSurat.ok) return hasilSurat;
    namaFile = hasilSurat.namaFile;
  }

  const izin = await prisma.izin.create({
    data: {
      userId,
      jenis: jenis as JenisIzin,
      tanggalMulai: new Date(tanggalMulai),
      tanggalAkhir: new Date(tanggalAkhir),
      alasan: alasan || "",
      suratDokter: namaFile,
      subJenisSetengahHari: subJenisValid,
      jamMasuk: jamMasukValid,
      jamKeluar: jamKeluarValid,
      jamPulang: jamPulangValid,
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
