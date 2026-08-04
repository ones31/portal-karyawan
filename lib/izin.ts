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

// Jumlah hari inklusif antara dua tanggal (yyyy-mm-dd)
export function jumlahHari(mulai: string, akhir: string): number {
  const a = new Date(mulai);
  const b = new Date(akhir);
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1;
}
