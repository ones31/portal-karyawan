import type { periodeBerjalan } from "./periode";

export type IzinRentang = { tanggalMulai: Date; tanggalAkhir: Date };

// Persentase kehadiran periode berjalan: mulai 100%, dikurangi proporsi hari
// izin (izin DITOLAK tidak mengurangi; rentang izin dipotong ke periode).
// Formula sama dipakai di beranda karyawan (per-orang) & dashboard admin (semua karyawan).
export function hitungPersenKehadiran(
  izinPeriode: IzinRentang[],
  periode: ReturnType<typeof periodeBerjalan>
): number {
  const hariIzin = izinPeriode.reduce((total, i) => {
    const mulai = Math.max(i.tanggalMulai.getTime(), periode.gte.getTime());
    const akhir = Math.min(
      i.tanggalAkhir.getTime() + 86400000, // tanggal akhir inklusif
      periode.lt.getTime()
    );
    return total + Math.max(0, Math.round((akhir - mulai) / 86400000));
  }, 0);
  return Math.max(0, Math.round(100 - (hariIzin / periode.totalHari) * 100));
}

// Warna badge kehadiran: hijau ≥90%, kuning ≥75%, merah di bawahnya
export function warnaKehadiran(persen: number): string {
  return persen >= 90
    ? "text-green-600"
    : persen >= 75
      ? "text-amber-600"
      : "text-red-600";
}
