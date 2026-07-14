import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { put, get } from "@vercel/blob";

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

// Vercel tidak punya disk permanen: kalau BLOB_READ_WRITE_TOKEN ada
// (di Vercel, otomatis terpasang lewat Blob store yang terhubung ke project),
// simpan/baca lewat Vercel Blob (mode private). Kalau tidak ada (dev lokal,
// atau platform dengan disk permanen seperti Railway), pakai folder disk biasa.
function pakaiBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function simpanSurat(
  namaFile: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  if (pakaiBlob()) {
    await put(namaFile, data, { access: "private", contentType });
    return;
  }
  await mkdir(DIR_SURAT_DOKTER, { recursive: true });
  await writeFile(path.join(DIR_SURAT_DOKTER, namaFile), data);
}

export async function bacaSurat(namaFile: string): Promise<Buffer | null> {
  if (pakaiBlob()) {
    const hasil = await get(namaFile, { access: "private" }).catch(() => null);
    if (!hasil) return null;
    return Buffer.from(await new Response(hasil.stream).arrayBuffer());
  }
  try {
    return await readFile(path.join(DIR_SURAT_DOKTER, namaFile));
  } catch {
    return null;
  }
}
