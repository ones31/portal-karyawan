// Urutan ini dipakai untuk dropdown "Jenis Pengajuan" & ringkasan izin karyawan
export const JENIS_IZIN = [
  "SAKIT",
  "LAINNYA",
  "MENIKAH",
  "TUGAS_NEGARA",
] as const;

export type JenisIzin = (typeof JENIS_IZIN)[number];

export const LABEL_JENIS_IZIN: Record<JenisIzin, string> = {
  SAKIT: "Izin Sakit",
  LAINNYA: "Izin Lain-lain",
  MENIKAH: "Izin Menikah",
  TUGAS_NEGARA: "Tugas Negara",
};

// Batas hari untuk izin menikah (sesuai perjanjian kerja)
export const MAKS_HARI_MENIKAH = 7;

// Jumlah hari inklusif antara dua tanggal (yyyy-mm-dd)
export function jumlahHari(mulai: string, akhir: string): number {
  const a = new Date(mulai);
  const b = new Date(akhir);
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}
