import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [NIP, nama sesuai ejaan PERSIS di database]. Sumber: screenshot mesin
// fingerprint lokasi Tegal Alur ("Marmo Ling.3"), dicocokkan manual ke nama
// yang sudah ada — beberapa beda ejaan/kelengkapan nama dari sumber (dicatat
// di komentar per baris).
const DATA: [string, string][] = [
  ["2", "Sunarto"],
  ["3", "Isman"],
  ["4", "Barodin"], // sumber tertulis "Barudin"
  ["5", "Tino"],
  ["6", "Suparno"],
  ["9", "Heri"],
  // 10 "Nisa" — TIDAK ADA di database, sengaja dilewati (lihat ringkasan)
  ["11", "Reno"],
  // 12 "Yasmin" — TIDAK ADA di database, sengaja dilewati (lihat ringkasan)
  ["13", "Winda A"], // sumber tertulis "Winda" (terpotong)
  ["14", "Eka Prasetya"], // sumber tertulis "Eka" (terpotong)
  ["15", "Purwanto"],
  ["16", "Ngumroh"], // sumber tertulis "Umroh"
  ["17", "Masyur"], // sumber tertulis "Mansyur"
  ["18", "Widiarmanto"], // sumber tertulis "Widi Armanto"
  ["23", "Fany Rahman"], // sumber tertulis "Fani" (terpotong)
  ["24", "Ismail"],
  ["25", "Cintia"], // sumber tertulis "Sintia"
  ["29", "Bagas"],
  ["32", "Yulia"],
  ["33", "Faizal"],
  // PIN 1 "Seno Saputro" = akun owner (SUPER_ADMIN), bukan karyawan — dilewati
  // PIN 3030 / NIP 30 "Novi" — pola PIN≠NIP-nya beda dari baris lain, dan
  // "Novi" sudah punya NIP 3030 di lokasi Menceng (bukan Tegal Alur).
  // Kemungkinan baris ini bukan milik daftar Tegal Alur — sengaja dilewati,
  // lihat ringkasan untuk klarifikasi ke user.
];

async function main() {
  let diisi = 0;
  let dilewatiSudahAda = 0;
  const tidakDitemukan: string[] = [];

  for (const [nip, nama] of DATA) {
    const user = await prisma.user.findUnique({ where: { nama } });
    if (!user) {
      tidakDitemukan.push(`${nip} ${nama}`);
      continue;
    }
    if (user.nip) {
      dilewatiSudahAda++;
      continue;
    }
    await prisma.user.update({ where: { nama }, data: { nip } });
    diisi++;
  }

  console.log(`${diisi} NIP diisi, ${dilewatiSudahAda} dilewati (sudah ada NIP).`);
  if (tidakDitemukan.length > 0) {
    console.log("TIDAK DITEMUKAN di database:", tidakDitemukan.join(", "));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
