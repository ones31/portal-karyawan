// Script sekali jalan: karyawan lama (impor/dibuat admin) yang belum pernah
// menandatangani onboarding dianggap sudah menandatangani kontrak, memakai
// formula otomatis yang sama dengan alur onboarding (lib/kontrak-otomatis.ts).
// Karyawan tetap (masa kerja > 3 tahun) dan karyawan yang sudah benar-benar
// TTD digital TIDAK disentuh. Aman dijalankan ulang (idempotent).
import { PrismaClient } from "@prisma/client";
import { hitungMasaKontrakOtomatis } from "../lib/kontrak-otomatis";
import { statusMasaKerja } from "../lib/masa-kerja";

const prisma = new PrismaClient();

async function main() {
  const karyawan = await prisma.user.findMany({
    where: { role: "KARYAWAN" },
    include: { kontrak: true },
  });

  const sekarang = new Date();
  let dibuat = 0;
  let ditandaiSaja = 0;
  const dilewati: string[] = [];

  for (const k of karyawan) {
    if (k.kontrak?.ditandatanganiPada) {
      dilewati.push(`${k.nama} (sudah TTD)`);
      continue;
    }
    if (!k.tanggalMasuk) {
      dilewati.push(`${k.nama} (tanggal masuk belum diisi)`);
      continue;
    }
    if (statusMasaKerja(k.tanggalMasuk) === "TETAP") {
      dilewati.push(`${k.nama} (karyawan tetap)`);
      continue;
    }

    if (!k.kontrak) {
      const hasil = hitungMasaKontrakOtomatis(new Date(k.tanggalMasuk), sekarang);
      if (!hasil) {
        dilewati.push(`${k.nama} (tidak terhitung)`);
        continue;
      }
      await prisma.kontrak.create({
        data: {
          userId: k.id,
          mulaiKontrak: hasil.mulaiKontrak,
          akhirKontrak: hasil.akhirKontrak,
          isiKontrak: hasil.isiKontrak,
          setujuTataTertib: true,
          ditandatanganiPada: sekarang,
        },
      });
      console.log(
        `+ ${k.nama}: kontrak dibuat ${hasil.mulaiKontrak.toISOString().slice(0, 10)} — ${hasil.akhirKontrak.toISOString().slice(0, 10)}`
      );
      dibuat++;
    } else {
      // Kontrak sudah pernah diisi admin (mis. lewat Edit Karyawan) tapi belum
      // ditandai TTD: masa berlaku yang sudah ada dipertahankan, cukup ditandai.
      await prisma.kontrak.update({
        where: { userId: k.id },
        data: { setujuTataTertib: true, ditandatanganiPada: sekarang },
      });
      console.log(`~ ${k.nama}: kontrak existing ditandai sudah TTD`);
      ditandaiSaja++;
    }
  }

  console.log("\n--- Rekap ---");
  console.log(`Kontrak baru dibuat & ditandai TTD: ${dibuat}`);
  console.log(`Kontrak existing ditandai TTD (masa berlaku dipertahankan): ${ditandaiSaja}`);
  console.log(`Dilewati: ${dilewati.length}`);
  for (const d of dilewati) console.log(`  - ${d}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
