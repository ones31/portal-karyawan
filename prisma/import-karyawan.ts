// Impor daftar karyawan existing dari tabel "WAKTU MASUK" (spreadsheet toko).
// Jalankan: npx tsx prisma/import-karyawan.ts
// Password awal semua akun: 123 (minta karyawan ganti lewat admin bila perlu).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// [nama, tanggal masuk YYYY-MM-DD]
const DATA: [string, string][] = [
  ["Haryanto", "2005-09-10"],
  ["Yana", "2020-08-11"],
  ["Wawan", "2020-09-09"],
  ["Andrew", "2021-04-05"],
  ["Melly", "2021-05-24"],
  ["Ilham", "2021-12-27"],
  ["Maulia", "2022-08-26"],
  ["Maulida", "2023-01-02"],
  ["April", "2023-03-01"],
  ["Lita", "2023-06-16"],
  ["Erna", "2023-06-16"],
  ["Putri", "2023-07-13"],
  ["Azmi", "2023-07-25"],
  ["Rian", "2024-04-17"],
  ["Imam", "2024-04-17"],
  ["Selvi", "2024-07-25"],
  ["Halim", "2024-12-01"],
  ["Bima", "2026-04-13"],
  ["Akmal", "2026-05-26"],
  ["Ilham Kar.", "2026-06-12"],
  ["Suci", "2026-06-12"],
];

async function main() {
  const password = await bcrypt.hash("123", 10);
  let dibuat = 0;
  let dilewati = 0;

  for (const [nama, tanggalMasuk] of DATA) {
    const sudahAda = await prisma.user.findUnique({ where: { nama } });
    if (sudahAda) {
      // Jangan timpa akun yang sudah ada; cukup lengkapi tanggal masuk jika kosong
      if (!sudahAda.tanggalMasuk) {
        await prisma.user.update({
          where: { nama },
          data: { tanggalMasuk: new Date(tanggalMasuk) },
        });
      }
      dilewati++;
      continue;
    }
    await prisma.user.create({
      data: {
        nama,
        password,
        role: "KARYAWAN",
        tanggalMasuk: new Date(tanggalMasuk),
      },
    });
    dibuat++;
  }

  console.log(`Impor selesai: ${dibuat} akun dibuat, ${dilewati} sudah ada.`);
  console.log("Password awal semua akun impor: 123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
