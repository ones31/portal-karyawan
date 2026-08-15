import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [NIP, nama sesuai ejaan PERSIS di database (dicek dulu via query sebelum
// menulis daftar ini)]. Sumber: daftar NIP dari user, dicocokkan manual ke
// nama yang sudah ada — beberapa ejaan di sumber beda tipis dari database
// (dicatat di komentar per baris).
const DATA: [string, string][] = [
  ["2005", "Haryanto"],
  ["3004", "Misgiyono"], // sumber tertulis "MISGIONO"
  ["3007", "Arif"],
  ["3008", "Maulia"],
  ["3009", "Andrew"],
  ["3011", "Neneng"],
  ["3012", "April"],
  // 3016 "SURYANA" — TIDAK ADA di database, sengaja dilewati (lihat ringkasan)
  ["3017", "Putri"],
  ["3019", "Selvi"],
  ["3021", "Maulida"],
  ["3027", "Suci"],
  ["3030", "Novi"],
  ["3032", "Rian"],
  ["3033", "Imam"],
  ["3034", "Melly"], // sumber tertulis "MELI"
  ["3035", "Akmal"],
  ["3037", "Ilham Kar."], // sumber tertulis "ILHAM KAR" (tanpa titik)
  ["3038", "Wawan"],
  ["3044", "Ilham"],
  ["3045", "Erna"],
  ["3046", "Lita"],
  ["3048", "Halim"],
  ["3050", "Azmi"],
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
      // Jangan menimpa NIP yang sudah terisi (bisa jadi sudah dikoreksi admin)
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
