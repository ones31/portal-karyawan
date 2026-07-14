// Impor tahap 2:
// - Baris 2-5 daftar Menceng yang sebelumnya terpotong (Misgiyono, Arif, Neneng, Novi)
// - Set lokasi "Menceng" untuk seluruh karyawan impor tahap 1
// - Daftar karyawan Tegal Alur (spreadsheet kedua)
// Tanggal/bulan yang kosong di spreadsheet diisi 1 (awal bulan/tahun).
// Jalankan: npx tsx prisma/import-karyawan-2.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MENCENG_LAMA = [
  "Haryanto", "Yana", "Wawan", "Andrew", "Melly", "Ilham", "Maulia",
  "Maulida", "April", "Lita", "Erna", "Putri", "Azmi", "Rian", "Imam",
  "Selvi", "Halim", "Bima", "Akmal", "Ilham Kar.", "Suci",
];

// [nama, tanggal masuk YYYY-MM-DD]
const MENCENG_BARU: [string, string][] = [
  ["Misgiyono", "2006-07-01"],
  ["Arif", "2011-04-01"],
  ["Neneng", "2017-09-08"],
  ["Novi", "2019-10-01"],
];

const TEGAL_ALUR: [string, string][] = [
  ["Sunarto", "1990-01-01"],
  ["Isman", "1997-12-01"],
  ["Suparno", "2000-10-01"],
  ["Barodin", "2002-12-01"],
  ["Masyur", "2006-04-19"],
  ["Heri", "2010-11-05"],
  ["Tino", "2010-12-20"],
  ["Winda A", "2014-09-02"],
  ["Widiarmanto", "2014-12-01"],
  ["Purwanto", "2015-07-01"],
  ["Ngumroh", "2016-03-17"],
  ["Fany Rahman", "2019-09-06"],
  ["Salma", "2022-07-14"],
  ["Ismail", "2023-02-01"],
  ["Cintia", "2023-03-14"],
  ["Yulia", "2023-07-16"],
  ["Reno", "2023-11-02"],
  ["Eka Prasetya", "2024-09-06"],
  ["Faizal", "2024-12-04"],
  ["Bagas", "2025-09-09"],
];

async function buatAtauLengkapi(
  nama: string,
  tanggalMasuk: string,
  lokasi: string,
  password: string
) {
  const sudahAda = await prisma.user.findUnique({ where: { nama } });
  if (sudahAda) {
    await prisma.user.update({
      where: { nama },
      data: {
        lokasi: sudahAda.lokasi ?? lokasi,
        tanggalMasuk: sudahAda.tanggalMasuk ?? new Date(tanggalMasuk),
      },
    });
    return "dilengkapi";
  }
  await prisma.user.create({
    data: {
      nama,
      password,
      role: "KARYAWAN",
      lokasi,
      tanggalMasuk: new Date(tanggalMasuk),
    },
  });
  return "dibuat";
}

async function main() {
  const password = await bcrypt.hash("123", 10);

  const setLokasi = await prisma.user.updateMany({
    where: { nama: { in: MENCENG_LAMA }, lokasi: null },
    data: { lokasi: "Menceng" },
  });
  console.log(`Lokasi Menceng di-set untuk ${setLokasi.count} karyawan impor tahap 1.`);

  let dibuat = 0;
  for (const [nama, tgl] of MENCENG_BARU) {
    if ((await buatAtauLengkapi(nama, tgl, "Menceng", password)) === "dibuat") dibuat++;
  }
  for (const [nama, tgl] of TEGAL_ALUR) {
    if ((await buatAtauLengkapi(nama, tgl, "Tegal Alur", password)) === "dibuat") dibuat++;
  }

  const rekap = await prisma.user.groupBy({
    by: ["lokasi"],
    where: { role: "KARYAWAN" },
    _count: true,
  });
  console.log(`${dibuat} akun baru dibuat. Password awal: 123`);
  console.log("Rekap per lokasi:", rekap.map((r) => `${r.lokasi ?? "(kosong)"}: ${r._count}`).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
