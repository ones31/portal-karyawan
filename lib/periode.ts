// Periode berjalan ala penggajian toko: tanggal 26 s/d tanggal 25 bulan berikutnya.
// Contoh: tanggal 10 Juli masuk periode 26 Juni – 25 Juli.
export function periodeBerjalan(sekarang = new Date()) {
  const thn = sekarang.getFullYear();
  const bln = sekarang.getMonth();
  const mulai =
    sekarang.getDate() >= 26
      ? new Date(thn, bln, 26)
      : new Date(thn, bln - 1, 26);
  const akhir = new Date(mulai.getFullYear(), mulai.getMonth() + 1, 26); // eksklusif (s/d tgl 25)
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return {
    gte: mulai,
    lt: akhir,
    // label "26 Jun – 25 Jul"
    label: `${fmt(mulai)} – ${fmt(new Date(akhir.getTime() - 86400000))}`,
    totalHari: Math.round((akhir.getTime() - mulai.getTime()) / 86400000),
  };
}

// Rentang tanggal untuk filter periode izin.
// periode: "bulan" (bulan ini) | "tahun" (tahun ini) | "custom" | lainnya = semua.
// Untuk "custom", isi dari & sampai (yyyy-mm-dd), keduanya inklusif.
export function rentangPeriode(
  periode: string | null,
  dari?: string | null,
  sampai?: string | null
) {
  const sekarang = new Date();
  if (periode === "bulan") {
    return {
      gte: new Date(sekarang.getFullYear(), sekarang.getMonth(), 1),
      lt: new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 1),
    };
  }
  if (periode === "tahun") {
    return {
      gte: new Date(sekarang.getFullYear(), 0, 1),
      lt: new Date(sekarang.getFullYear() + 1, 0, 1),
    };
  }
  if (periode === "custom" && dari && sampai) {
    return {
      gte: new Date(dari),
      // tambah 1 hari agar tanggal "sampai" ikut terhitung (inklusif)
      lt: new Date(new Date(sampai).getTime() + 86400000),
    };
  }
  return undefined;
}
