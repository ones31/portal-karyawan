// Konstanta MURNI untuk catatan/pesan khusus admin/owner → karyawan (Feature 21).
// Client-safe: file ini diimpor komponen client (app/admin/catatan/page.tsx).
// JANGAN tambah logika server (prisma/push) di sini — taruh di lib/kirim-catatan.ts.

export const MAKS_JUDUL_CATATAN = 100;
export const MAKS_ISI_CATATAN = 2000;

// Nilai dropdown "Kirim ke" pada form catatan admin:
// - TUJUAN_SEMUA          → semua karyawan yang boleh diakses admin ybs
// - "LOKASI:<nama lokasi>" → semua karyawan di satu lokasi
// - selain itu            → dianggap id satu karyawan
export const TUJUAN_SEMUA = "SEMUA";
export const PREFIKS_TUJUAN_LOKASI = "LOKASI:";

export function tujuanLokasi(lokasi: string): string {
  return `${PREFIKS_TUJUAN_LOKASI}${lokasi}`;
}

// Ambil nama lokasi dari nilai tujuan, atau null kalau tujuannya bukan per-lokasi
export function lokasiDariTujuan(tujuan: string): string | null {
  return tujuan.startsWith(PREFIKS_TUJUAN_LOKASI)
    ? tujuan.slice(PREFIKS_TUJUAN_LOKASI.length)
    : null;
}
