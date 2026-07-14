---
name: impor-karyawan
description: Mengimpor atau memperbarui data karyawan Portal Toko Marmo secara massal dari spreadsheet, screenshot tabel, atau Google Docs — konvensi script import di prisma/, aturan tanggal tidak lengkap, password default, lokasi per daftar, anti-timpa data yang sudah ada, dan pelaporan rekap. Gunakan saat user mengirim tabel/gambar berisi daftar nama karyawan dan berkata "masukkan/isikan/impor ke daftar karyawan", atau saat perlu update massal (set lokasi, ganti password, isi tanggal).
---

# Impor Data Karyawan Massal

User biasa mengirim screenshot spreadsheet (kolom khas: `no | NAMA | TGL | BULAN | TAHUN` di bawah header "WAKTU MASUK", kadang plus `Gapok`). Satu daftar biasanya = satu lokasi toko (Tegal Alur atau Menceng) — kalau tidak disebut, TANYA lokasi mana.

## Aturan membaca sumber

- **Screenshot terpotong**: impor baris yang terlihat, lalu di ringkasan sebut EKSPLISIT nomor baris yang tidak terlihat dan minta potongannya. Jangan menunda seluruh impor karena itu.
- **Tanggal tidak lengkap**: hanya tahun → `TAHUN-01-01`; bulan+tahun → `TAHUN-BULAN-01`. Catat kebijakan ini di ringkasan agar user tahu bisa dikoreksi via tombol Edit.
- **Kolom Gapok/gaji**: JANGAN diimpor — belum ada field gaji. Sebut di ringkasan, tawarkan sebagai fitur (khusus owner) bila user mau.
- **Google Docs/Sheets publik**: unduh langsung `curl -sL "https://docs.google.com/document/d/<ID>/export?format=txt"` (Sheets: `/export?format=csv`). 401 = privat → minta user ubah sharing atau kirim screenshot.
- Nama dipakai APA ADANYA sebagai username login (termasuk titik/spasi, mis. `Ilham Kar.`) — jangan "dirapikan".

## Konvensi script

File baru `prisma/import-<deskripsi>.ts` (jangan menimpa script lama — itu riwayat). Jalankan: `npx tsx prisma/import-<deskripsi>.ts`. Kerangka yang sudah terbukti:

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// [nama, tanggal masuk YYYY-MM-DD]
const DATA: [string, string][] = [
  ["Nama Karyawan", "2023-06-16"],
  // ...
];
const LOKASI = "Tegal Alur"; // atau "Menceng" — konfirmasi ke user

async function main() {
  const password = await bcrypt.hash("123", 10); // password awal standar impor
  let dibuat = 0, dilengkapi = 0;

  for (const [nama, tanggalMasuk] of DATA) {
    const ada = await prisma.user.findUnique({ where: { nama } });
    if (ada) {
      // JANGAN menimpa yang sudah terisi — hanya melengkapi yang kosong
      await prisma.user.update({
        where: { nama },
        data: {
          lokasi: ada.lokasi ?? LOKASI,
          tanggalMasuk: ada.tanggalMasuk ?? new Date(tanggalMasuk),
        },
      });
      dilengkapi++;
      continue;
    }
    await prisma.user.create({
      data: { nama, password, role: "KARYAWAN", lokasi: LOKASI, tanggalMasuk: new Date(tanggalMasuk) },
    });
    dibuat++;
  }

  const rekap = await prisma.user.groupBy({ by: ["lokasi"], where: { role: "KARYAWAN" }, _count: true });
  console.log(`${dibuat} dibuat, ${dilengkapi} dilengkapi. Password awal: 123`);
  console.log("Rekap lokasi:", rekap.map(r => `${r.lokasi ?? "(kosong)"}: ${r._count}`).join(", "));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

Prinsip yang TIDAK boleh dilanggar:
- **Aman dijalankan ulang** — cek dulu, jangan create buta; jangan menimpa `lokasi`/`tanggalMasuk` yang sudah terisi (bisa jadi sudah dikoreksi admin lewat tombol Edit).
- **Password awal `123`** (hash bcrypt) — konsisten dengan 45 akun sebelumnya, kecuali user minta lain.
- **Tanpa kontrak & profil** — karyawan impor melengkapinya sendiri saat login pertama (onboarding + TTD otomatis membuat kontrak sesuai aturan masa kerja di `lib/masa-kerja.ts`).
- Update massal lain (ganti password semua, set lokasi) → pola yang sama via `npx tsx -e "..."`; untuk password, verifikasi target dengan `bcrypt.compare` terhadap password lama, jangan tebak dari nama.

## Verifikasi & pelaporan

1. Jalankan script → baca rekapnya (jumlah harus cocok dengan sumber).
2. Uji login satu akun impor via curl (`nama` apa adanya, password `123`) → harus 200.
3. Cek tab lokasi di `/admin/karyawan` menunjukkan jumlah baru yang benar (login owner `seno/seno123`).
4. Ringkasan ke user wajib memuat: jumlah per lokasi, password awal, daftar baris yang tidak terbaca/terpotong, kebijakan tanggal default, dan bahwa kolom gaji (bila ada) tidak diimpor.
5. Tidak perlu update PRD kecuali polanya berubah (Feature 9 sudah mencatat mekanisme impor) — cukup revisi angka bila disebut.
