# Ringkasan Sesi — Portal Toko Marmo

> Ditulis untuk melanjutkan pekerjaan di sesi Claude Code baru. Baca ini + `docs/PRD.md` (kebenaran tunggal fitur) + `AGENTS.md` (manual operasi & aturan kerja) sebelum lanjut.

## Status saat ini

Aplikasi **berjalan lengkap secara lokal** (`npm run dev`, http://localhost:3000), database sudah **PostgreSQL (Neon)** — bukan SQLite lagi (dimigrasikan 14 Jul 2026, semua data lama dipulihkan utuh). **Sedang proses menuju deploy trial ganda: Vercel + Railway** (lihat "Keputusan tertunda" di bawah) — belum online publik.

## Apa aplikasinya

Portal HR internal Toko H. Marmo (Next.js 16 + Prisma 6 + PostgreSQL/Neon). Karyawan: onboarding mandiri (baca peraturan+kontrak, tanda tangan digital), isi data pribadi, ajukan izin (sakit/lain-lain/tugas negara/menikah/tukar libur), lihat kontrak, lihat tingkat kehadiran periode berjalan (26–25). Admin/Owner: dashboard, kelola karyawan per lokasi (Tegal Alur / Menceng), approve izin & tukar libur, perpanjang kontrak, hapus karyawan resign. PWA dengan push notification (Web Push/VAPID) untuk notifikasi pengajuan & approval.

~51 akun karyawan di database (data uji + hasil impor spreadsheet toko).

## Akun untuk login

| Role | Nama | Password |
|---|---|---|
| Owner | seno | seno123 |
| Owner | dian | dian123 |
| Admin | admin | admin123 |
| Karyawan (lengkap, ada kontrak+TTD) | Budi Santoso | karyawan123 |
| Karyawan impor (±45 orang: Haryanto, Sunarto, dll.) | (nama masing-masing) | 123 |

Login **tidak case-sensitive**.

## Cara menjalankan

```bash
cd /Users/seno/portal-karyawan
npm run dev   # http://localhost:3000, butuh DATABASE_URL (Postgres/Neon) di .env
```

Kalau schema Prisma baru diubah: `npx prisma migrate dev --name <nama>` lalu **restart server** (client lama nyangkut di memori kalau tidak).

## Dokumen rujukan di repo

- **`docs/PRD.md`** — daftar lengkap 14 fitur yang sudah jadi (✅), data model, fase project. **Selalu cek & update file ini setiap fitur baru.**
- **`AGENTS.md`** — manual operasi: stack terkunci, konstanta bisnis per file `lib/`, 13 kesalahan yang mudah terulang + aturan penangkalnya, standar kualitas per deliverable, kapan harus berhenti & bertanya ke user.
- **`.claude/skills/`** — 3 skill custom yang otomatis aktif untuk proyek ini:
  - `verifikasi-portal` — checklist uji end-to-end (curl + browser) sebelum lapor selesai
  - `tambah-fitur-portal` — peta file yang harus disentuh per jenis perubahan
  - `impor-karyawan` — pola script impor data massal dari spreadsheet/screenshot

## Riwayat fitur (ringkas — detail lengkap di PRD)

1. Login by nama (tanpa email), tidak case-sensitive
2. Onboarding karyawan baru: formulir sesuai kertas asli toko → 3 dokumen resmi (peraturan, kontrak percobaan, PKWT) → tanda tangan digital
3. Kontrak otomatis by masa kerja: **< 3 bulan** = percobaan 3 bulan; **3 bln–3 thn** = kontrak 1 tahun bergulir; **> 3 tahun** = karyawan tetap (kontrak dikosongkan)
4. Data pribadi lengkap (NIK, NPWP, BPJS, rekening, dll.), bisa diedit admin
5. Izin: Sakit (dengan/tanpa surat dokter, wajib jika >1 hari), Lain-lain, Tugas Negara (1 hari, alasan opsional), Menikah (maks 7 hari) — semua dalam satu form dropdown, termasuk Tukar Libur
6. Dashboard admin dengan kartu ber-link (total karyawan, izin sakit/lain-lain per periode termasuk custom range, izin/tukar-libur menunggu, kontrak segera habis)
7. Daftar karyawan dipisah tab per lokasi (Tegal Alur/Menceng/Belum Diatur/Semua)
8. Perpanjangan kontrak 1 tahun otomatis (tombol di halaman "Kontrak Segera Habis")
9. Import karyawan massal dari spreadsheet toko (2 lokasi, ~45 orang, password default `123`)
10. PWA installable + push notification (pengajuan baru → admin; hasil approval → karyawan)

## Keputusan & progres deploy

User memilih opsi **"coba dua-duanya dulu"**: deploy trial paralel ke **Vercel** dan **Railway** dari satu codebase yang sama, bandingkan, lalu matikan salah satu. Supaya satu kode bisa jalan di kedua platform tanpa bercabang, **database disamakan pakai PostgreSQL (Neon) di semua tempat** — termasuk dev lokal.

**Progres:**
- ✅ Akun Neon dibuat, `DATABASE_URL` sudah di `.env`
- ✅ Migrasi SQLite → PostgreSQL selesai: schema diubah, migrasi lama diarsipkan ke `prisma/backup/migrations-sqlite-lama/`, seluruh data (54 user, 5 profil, 4 kontrak, 4 izin) dipulihkan dan diverifikasi utuh di Neon
- ✅ Bug ditemukan & diperbaiki saat migrasi: `lib/cari-user.ts` pakai raw SQL tanpa kutip identifier (`FROM User`) — jalan di SQLite, error di Postgres. Diganti pakai `mode: "insensitive"` native Prisma (lebih rapi, sudah didukung Postgres)
- ✅ `.gitignore` diperbarui: `prisma/dev.db` dan `prisma/backup/` (berisi dump data karyawan asli) tidak boleh ikut ke git
- ⬜ **Belum dikerjakan:** repo GitHub (privat), abstraksi penyimpanan surat dokter (disk lokal / Vercel Blob tergantung platform), deploy ke Vercel, deploy ke Railway

**Sesi berikutnya lanjut dari sini** — langkah selanjutnya: buat repo GitHub privat, push kode, lalu deploy ke kedua platform. Shared hosting sudah dicoret sejak awal (tidak cocok untuk Next.js).

## Hal yang perlu diingat sebelum go-live (belum dikerjakan)

- `JWT_SECRET` masih default — WAJIB ganti ke nilai acak kuat sebelum publik
- Password karyawan (`123`) & admin (`admin123` dll.) cukup untuk jaringan internal, terlalu lemah untuk internet terbuka
- Pendaftaran karyawan baru saat ini terbuka tanpa verifikasi admin — perlu dipertimbangkan untuk versi publik
- Kunci VAPID (push notification) ada di `.env`, jangan sampai ikut ke git publik

## Catatan penting lain

- Semua UI, pesan error, komentar kode: **bahasa Indonesia**
- Next.js **16** dan Prisma **6** — versi ini beda signifikan dari training data model manapun; jangan menulis pola dari ingatan, tiru pola file yang sudah ada di repo
- Dokumen resmi toko (peraturan, kontrak, PKWT) sumbernya Google Docs asli milik toko — isi pasal tidak boleh dikarang ulang
