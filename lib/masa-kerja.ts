// Batas masa kerja untuk status karyawan tetap (tahun).
// Karyawan dengan masa kerja > 3 tahun sudah bukan karyawan kontrak.
export const BATAS_TAHUN_TETAP = 3;

// "TETAP"   = masa kerja > 3 tahun (tidak terikat kontrak, masa kontrak dikosongkan)
// "KONTRAK" = masih dalam masa kontrak
// null      = tanggal masuk belum diketahui
export function statusMasaKerja(
  tanggalMasuk: Date | string | null | undefined
): "TETAP" | "KONTRAK" | null {
  if (!tanggalMasuk) return null;
  const masuk = new Date(tanggalMasuk);
  const batas = new Date(masuk);
  batas.setFullYear(batas.getFullYear() + BATAS_TAHUN_TETAP);
  return new Date() >= batas ? "TETAP" : "KONTRAK";
}
