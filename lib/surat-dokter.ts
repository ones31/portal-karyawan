import path from "path";

// Surat dokter disimpan di luar folder public agar hanya bisa diakses
// lewat API yang memeriksa login (berisi dokumen medis).
export const DIR_SURAT_DOKTER = path.join(process.cwd(), "uploads", "surat-dokter");

export const MAKS_UKURAN_SURAT = 5 * 1024 * 1024; // 5 MB

export const TIPE_SURAT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const MIME_SURAT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
};
