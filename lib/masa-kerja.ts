// Batas masa kerja untuk status karyawan tetap OTOMATIS (tahun).
// Hanya berlaku untuk karyawan lama — lihat TAHUN_TANPA_TETAP_OTOMATIS.
export const BATAS_TAHUN_TETAP = 3;

// Kebijakan baru (Feature 23): karyawan yang MULAI KERJA tahun 2026 ke atas
// TIDAK pernah otomatis jadi karyawan tetap walau masa kerjanya lewat 3 tahun —
// kontraknya diperpanjang terus (3 bulan pertama, lalu 1 tahun berulang).
// Status tetap untuk mereka hanya bisa ditetapkan MANUAL oleh owner
// (field User.tetapManual). Karyawan lama (masuk sebelum 2026) tetap memakai
// aturan lama: > BATAS_TAHUN_TETAP tahun = otomatis tetap.
export const TAHUN_TANPA_TETAP_OTOMATIS = 2026;

// "TETAP"   = tidak terikat kontrak (masa kontrak dikosongkan)
// "KONTRAK" = masih dalam masa kontrak, terus diperpanjang
// null      = tanggal masuk belum diketahui (dan tidak ditetapkan tetap manual)
export function statusMasaKerja(
  tanggalMasuk: Date | string | null | undefined,
  tetapManual: boolean = false
): "TETAP" | "KONTRAK" | null {
  // Penetapan manual owner selalu menang, tidak peduli tanggal masuknya
  if (tetapManual) return "TETAP";
  if (!tanggalMasuk) return null;

  const masuk = new Date(tanggalMasuk);
  // Karyawan angkatan 2026 ke atas: tidak ada tetap otomatis
  if (masuk.getFullYear() >= TAHUN_TANPA_TETAP_OTOMATIS) return "KONTRAK";

  const batas = new Date(masuk);
  batas.setFullYear(batas.getFullYear() + BATAS_TAHUN_TETAP);
  return new Date() >= batas ? "TETAP" : "KONTRAK";
}

// Filter Prisma untuk "karyawan yang MASIH terikat kontrak" (kebalikan TETAP).
// Dipakai daftar & hitungan Kontrak Segera Habis supaya karyawan tetap tidak
// nyangkut di sana. Harus sejalan dengan statusMasaKerja() di atas:
// - tetapManual = true                     -> TETAP, dikecualikan
// - tanggalMasuk >= 1 Jan 2026             -> selalu KONTRAK, ikut
// - tanggalMasuk masih < 3 tahun yang lalu -> KONTRAK (aturan lama), ikut
// Catatan: tanggalMasuk null tetap dikecualikan, sama seperti perilaku sebelumnya.
export function filterMasihKontrak() {
  const batasTetap = new Date();
  batasTetap.setFullYear(batasTetap.getFullYear() - BATAS_TAHUN_TETAP);
  const awalAngkatanBaru = new Date(TAHUN_TANPA_TETAP_OTOMATIS, 0, 1);

  return {
    tetapManual: false,
    OR: [
      { tanggalMasuk: { gte: awalAngkatanBaru } },
      { tanggalMasuk: { gt: batasTetap } },
    ],
  };
}
