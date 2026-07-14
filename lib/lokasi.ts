export const DAFTAR_LOKASI = ["Tegal Alur", "Menceng"] as const;

export type Lokasi = (typeof DAFTAR_LOKASI)[number];

export function lokasiValid(l: unknown): l is Lokasi {
  return typeof l === "string" && (DAFTAR_LOKASI as readonly string[]).includes(l);
}
