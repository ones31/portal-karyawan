# Ringkasan Sesi — Portal Toko Marmo

> Ditulis untuk melanjutkan pekerjaan di sesi Claude Code baru. Baca ini + `docs/PRD.md` (kebenaran tunggal fitur) + `AGENTS.md` (manual operasi & aturan kerja) sebelum lanjut.

## Status saat ini

**Aplikasi sudah LIVE di produksi:** https://portal-karyawan-theta.vercel.app (Vercel, deploy 15 Jul 2026). Database **PostgreSQL (Neon)**, file surat dokter di **Vercel Blob** (mode private), semua env var (`DATABASE_URL`, `JWT_SECRET`, kunci VAPID, `BLOB_READ_WRITE_TOKEN`) terpasang di Vercel. Rencana trial ganda Vercel+Railway **dibatalkan** — user memutuskan cukup Vercel saja. Dev lokal (`npm run dev`, http://localhost:3000) tetap jalan dengan database Neon yang sama.

## ⏭️ Pekerjaan berikutnya (belum diputuskan user)

Di akhir sesi sebelumnya, Claude menawarkan 2 perbaikan keamanan pasca-live yang **belum dijawab user** (user memilih pindah sesi dulu). Tanyakan di awal sesi baru:
1. **Ganti password lemah** — password karyawan (`123`) dan admin (`admin123` dll.) kini berisiko karena aplikasi sudah bisa diakses publik dari internet.
2. **Tutup/batasi pendaftaran mandiri** (`/daftar`) — saat ini siapa pun yang tahu URL bisa mendaftar jadi akun karyawan tanpa persetujuan admin.

Keduanya tidak darurat/blocking, tapi sebaiknya tidak dibiarkan lama. Tawarkan opsi konkret (paksa ganti password saat login pertama, kode undangan pendaftaran, dll.) daripada langsung eksekusi — ini keputusan produk, bukan keputusan teknis semata.

## Alat & kredensial yang sudah tersedia di Mac ini

Tidak perlu setup ulang — semua sudah terpasang & login di komputer ini (`/Users/seno`):
- **`gh` CLI** — sudah login sebagai akun GitHub `ones31` (dipasang via Homebrew)
- **`vercel` CLI** — sudah terhubung ke proyek `marmotoko/portal-karyawan`; token tersimpan di `~/.vercel-token` (pakai `export VERCEL_TOKEN=$(cat ~/.vercel-token | tr -d '\n')` sebelum menjalankan perintah `vercel ... --token "$VERCEL_TOKEN"`)
- **Neon** — database Postgres sudah jalan, connection string ada di `.env` project (`DATABASE_URL`)
- Kalau sesi baru ini berjalan di lingkungan/Mac yang **berbeda** dari yang dipakai sebelumnya, kredensial di atas TIDAK ikut pindah — perlu setup ulang (`gh auth login`, `vercel login`, dst).

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

## Deploy — SELESAI (15 Jul 2026)

Rencana awal "coba Vercel + Railway dulu" **diganti** user jadi langsung Vercel saja. Database disamakan pakai **PostgreSQL (Neon)** untuk dev lokal maupun produksi (satu database yang sama).

**Yang sudah dikerjakan:**
- ✅ Migrasi SQLite → PostgreSQL selesai: seluruh data (54 user, 5 profil, 4 kontrak, 4 izin) dipulihkan & diverifikasi utuh di Neon. Migrasi lama diarsipkan di `prisma/backup/migrations-sqlite-lama/`.
- ✅ Bug diperbaiki: `lib/cari-user.ts` pakai raw SQL tanpa kutip identifier (`FROM User`) — jalan di SQLite, error di Postgres. Diganti `mode: "insensitive"` native Prisma.
- ✅ Repo GitHub **privat**: https://github.com/ones31/portal-karyawan (branch `main`)
- ✅ `gh` CLI & `vercel` CLI terpasang, login via Personal Access Token (bukan browser flow, supaya tidak macet di sesi non-interaktif)
- ✅ Proyek Vercel `marmotoko/portal-karyawan` dibuat; **Vercel Blob store** (mode private) dibuat & di-link untuk penyimpanan surat dokter (Vercel tidak punya disk permanen)
- ✅ `lib/surat-dokter.ts` diberi abstraksi: otomatis pakai Blob kalau `BLOB_READ_WRITE_TOKEN` ada, kalau tidak fallback ke disk lokal (dev/Railway). 1 file surat dokter lama (Bejo) dimigrasikan manual ke Blob.
- ✅ `JWT_SECRET` baru dibuat (`openssl rand -base64 48`), diisi ke `.env` lokal & Vercel env vars (production+preview)
- ✅ Semua env var terpasang di Vercel: `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `BLOB_READ_WRITE_TOKEN` (auto)
- ✅ **Live di:** https://portal-karyawan-theta.vercel.app — diuji: login (owner/karyawan), dashboard admin (51 karyawan, data akurat), surat dokter via Blob (byte-identik dengan aslinya)

**Insiden yang terjadi & sudah diperbaiki:**
1. `.env` (berisi password Neon + kunci VAPID privat) sempat ikut ter-upload ke deployment pertama karena `vercel deploy` CLI **tidak otomatis memakai `.gitignore`** — beda dari git. Diperbaiki dengan membuat `.vercelignore` eksplisit. Deployment yang bocor sudah **dihapus** dari Vercel.
2. Deploy sempat diblokir `BLOCKED`/`TEAM_ACCESS_REQUIRED` — bukan soal email verifikasi (sempat salah duga), tapi karena commit git pakai email asal (`seno@tokomarmo.local`) yang tidak cocok dengan akun Vercel/GitHub user. Diperbaiki dengan `git filter-branch` menulis ulang seluruh author history ke email asli user (`emailsenosaputro@gmail.com`) + force-push (aman, repo privat solo).

**Belum dikerjakan (opsional, tidak mendesak):**
- Menghubungkan GitHub repo ke Vercel untuk auto-deploy tiap push (sekarang deploy manual via `vercel deploy --prod`)
- Rotasi password Neon sebagai kehati-hatian ekstra pasca insiden #1 di atas (risiko rendah — hanya sempat ada di deployment privat Vercel milik user sendiri, sudah dihapus)

## Hal yang perlu diingat

- `JWT_SECRET` **sudah diganti** ke nilai acak kuat (baik lokal maupun produksi) — item ini SELESAI, coret dari catatan lama manapun yang bilang belum.
- **⚠️ Sekarang aplikasi sudah LIVE di internet** — password karyawan (`123`) & admin (`admin123` dll.) yang tadinya "cukup untuk jaringan internal" sekarang jadi risiko nyata karena URL-nya bisa diakses siapa saja yang tahu linknya. Pertimbangkan segera: paksa ganti password saat login pertama, atau minimal ganti password admin/owner ke sesuatu yang kuat.
- Pendaftaran karyawan baru (`/daftar`) saat ini terbuka tanpa verifikasi admin — siapa pun yang tahu URL bisa daftar jadi akun karyawan. Perlu dipertimbangkan menambah kode undangan atau approval admin.
- `.vercelignore` sudah dibuat — kalau ada perubahan konfigurasi deploy nanti, ingat `vercel deploy` TIDAK otomatis ikut `.gitignore`, harus dicek manual.

## Catatan penting lain

- Semua UI, pesan error, komentar kode: **bahasa Indonesia**
- Next.js **16** dan Prisma **6** — versi ini beda signifikan dari training data model manapun; jangan menulis pola dari ingatan, tiru pola file yang sudah ada di repo
- Dokumen resmi toko (peraturan, kontrak, PKWT) sumbernya Google Docs asli milik toko — isi pasal tidak boleh dikarang ulang
