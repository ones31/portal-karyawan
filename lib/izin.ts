// Urutan ini dipakai untuk dropdown "Jenis Pengajuan" & ringkasan izin karyawan
export const JENIS_IZIN = [
  "SAKIT",
  "LAINNYA",
  "SETENGAH_HARI",
  "MENIKAH",
  "TUGAS_NEGARA",
] as const;

export type JenisIzin = (typeof JENIS_IZIN)[number];

export const LABEL_JENIS_IZIN: Record<JenisIzin, string> = {
  SAKIT: "Izin Sakit",
  LAINNYA: "Izin Lain-lain",
  SETENGAH_HARI: "Izin Setengah Hari",
  MENIKAH: "Izin Menikah",
  TUGAS_NEGARA: "Tugas Negara",
};

// Jenis izin yang hanya boleh 1 tanggal (tidak bisa rentang lebih dari sehari):
// form menampilkan satu input tanggal saja, dan tanggalAkhir dipaksa == tanggalMulai.
export const JENIS_SATU_TANGGAL: readonly JenisIzin[] = [
  "SETENGAH_HARI",
  "TUGAS_NEGARA",
];

// Jenis izin yang TIDAK mengurangi persentase kehadiran (lib/kehadiran.ts).
// Setengah Hari sengaja dikecualikan sepenuhnya (permintaan user) — bukan
// dihitung 0,5 hari, tapi tidak dihitung sama sekali. Query yang memberi data
// ke hitungPersenKehadiran() WAJIB menyaring jenis ini di `where` Prisma-nya.
export const JENIS_TIDAK_HITUNG_KEHADIRAN: readonly JenisIzin[] = [
  "SETENGAH_HARI",
];

// Batas hari untuk izin menikah (sesuai perjanjian kerja)
export const MAKS_HARI_MENIKAH = 7;

// Sub-jenis Izin Setengah Hari (Feature 32) — dipilih setelah jenis = SETENGAH_HARI,
// pola sama seperti pilihan tipe surat dokter di Izin Sakit.
export const SUB_JENIS_SETENGAH_HARI = [
  "TELAT",
  "PERTENGAHAN",
  "PULANG_CEPAT",
] as const;

export type SubJenisSetengahHari = (typeof SUB_JENIS_SETENGAH_HARI)[number];

export const LABEL_SUB_JENIS_SETENGAH_HARI: Record<SubJenisSetengahHari, string> = {
  TELAT: "Telat",
  PERTENGAHAN: "Izin di Tengah Jam Kerja",
  PULANG_CEPAT: "Pulang Cepat",
};

// Format jam 24-jam "HH:mm", dipakai <input type="time"> & validasi server
export const FORMAT_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Ringkasan detail sub-jenis Izin Setengah Hari untuk riwayat/laporan/export.
// jamMasuk dipakai bersama oleh TELAT (jam masuk aktual) & PERTENGAHAN (jam masuk kembali).
export function detailSubJenisSetengahHari(
  sub: SubJenisSetengahHari | null | undefined,
  jamMasuk: string | null | undefined,
  jamKeluar: string | null | undefined,
  jamPulang: string | null | undefined
): string | null {
  if (sub === "TELAT") return `Telat — jam masuk ${jamMasuk ?? "-"}`;
  if (sub === "PERTENGAHAN")
    return `Izin di Tengah Jam Kerja — keluar ${jamKeluar ?? "-"}, masuk kembali ${jamMasuk ?? "-"}`;
  if (sub === "PULANG_CEPAT") return `Pulang Cepat — jam pulang ${jamPulang ?? "-"}`;
  return null;
}

// Jumlah hari inklusif antara dua tanggal (yyyy-mm-dd)
export function jumlahHari(mulai: string, akhir: string): number {
  const a = new Date(mulai);
  const b = new Date(akhir);
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}
