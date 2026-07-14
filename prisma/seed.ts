import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ISI_KONTRAK_DEFAULT } from "../lib/kontrak";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { nama: "seno" },
    update: { role: "SUPER_ADMIN" },
    create: {
      password: await bcrypt.hash("seno123", 10),
      nama: "seno",
      role: "SUPER_ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { nama: "dian" },
    update: { role: "SUPER_ADMIN" },
    create: {
      password: await bcrypt.hash("dian123", 10),
      nama: "dian",
      role: "SUPER_ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { nama: "admin" },
    update: {},
    create: {
      password: await bcrypt.hash("admin123", 10),
      nama: "admin",
      role: "ADMIN",
    },
  });

  const karyawan = await prisma.user.upsert({
    where: { nama: "Budi Santoso" },
    update: { lokasi: "Tegal Alur" },
    create: {
      password: await bcrypt.hash("karyawan123", 10),
      nama: "Budi Santoso",
      lokasi: "Tegal Alur",
      role: "KARYAWAN",
    },
  });

  await prisma.kontrak.upsert({
    where: { userId: karyawan.id },
    update: {},
    create: {
      userId: karyawan.id,
      mulaiKontrak: new Date("2026-07-01"),
      akhirKontrak: new Date("2027-06-30"),
      isiKontrak: ISI_KONTRAK_DEFAULT,
    },
  });

  console.log("Seed selesai. Login memakai nama (tidak case-sensitive):");
  console.log("Owner   : seno / seno123, dian / dian123");
  console.log("Admin   : admin / admin123");
  console.log("Karyawan: Budi Santoso / karyawan123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
