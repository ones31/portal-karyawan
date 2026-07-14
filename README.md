# Portal Toko Marmo

Aplikasi web internal Toko Marmo untuk karyawan (PRD lengkap: [docs/PRD.md](docs/PRD.md)). Dibangun dengan Next.js + Prisma. Semua data mengalir lewat REST API (`/api/*`) sehingga aplikasi Android nantinya dapat memakai backend yang sama.

## Role

| Role | Nilai di database | Kemampuan |
|---|---|---|
| Owner | `SUPER_ADMIN` | Semua kemampuan admin + membuat akun admin |
| Admin | `ADMIN` | Dashboard, kelola karyawan, approve izin |
| Karyawan | `KARYAWAN` | Data pribadi, kontrak, pengajuan izin |

## Fitur

**Karyawan** (login karyawan)
- Mengisi data pribadi karyawan baru (NIK, alamat, kontak darurat, NPWP, BPJS, rekening, dll.)
- Membaca kontrak kerja + peraturan & tata tertib toko, melihat masa berlaku kontrak, lalu menandatangani secara digital (gambar tanda tangan di layar) dan menyetujui peraturan
- Mengajukan izin tidak masuk kerja (izin sakit / izin lain-lain) dan melihat riwayat beserta statusnya

**Admin / Owner**
- Dashboard: total karyawan, jumlah izin sakit & lain-lain **dengan filter periode (bulan ini / tahun ini / semua)**, izin menunggu, dan kontrak yang segera habis (batas hari diatur lewat `BATAS_HARI_KONTRAK_HABIS` di `lib/kontrak.ts`, saat ini 30 hari)
- Menyetujui / menolak pengajuan izin
- Daftar karyawan: telepon, status kelengkapan data pribadi, status tanda tangan kontrak, masa kontrak + sisa hari, jumlah izin per jenis mengikuti filter periode
- Menambah akun karyawan baru (nama untuk login, lokasi wajib: Tegal Alur / Menceng, telepon/email opsional) beserta masa kontraknya; owner juga bisa membuat akun admin
- Kolom Lokasi tampil di daftar karyawan (daftar lokasi diatur di `lib/lokasi.ts`)

## Menjalankan

```bash
npm install
# Isi DATABASE_URL di .env dengan connection string PostgreSQL (mis. Neon)
npx prisma migrate dev   # sinkronkan skema ke database
npx tsx prisma/seed.ts   # mengisi akun awal (lewati jika database sudah berisi data)
npm run dev              # jalan di http://localhost:3000
```

Akun awal hasil seed (login memakai **nama**, tidak case-sensitive):

| Role     | Nama         | Password    |
|----------|--------------|-------------|
| Owner    | seno         | seno123     |
| Owner    | dian         | dian123     |
| Admin    | admin        | admin123    |
| Karyawan | Budi Santoso | karyawan123 |

Karyawan hasil impor spreadsheet: password awal `123`.

## Struktur penting

- `prisma/schema.prisma` — skema database (User, ProfilKaryawan, Kontrak, Izin)
- `app/api/` — REST API (auth, profil, kontrak, izin, admin) — dipakai web dan Android nanti
- `app/karyawan/` — halaman portal karyawan
- `app/admin/` — halaman admin
- `lib/auth.ts` — sesi JWT (cookie httpOnly, berlaku 8 jam)

## PWA & Push Notification

- Aplikasi bisa di-install ("Tambahkan ke layar utama"); manifest di `app/manifest.ts`, service worker di `public/sw.js`.
- Push notification memakai Web Push (VAPID). Kunci ada di `.env` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) — generate baru dengan `npx web-push generate-vapid-keys` bila perlu.
- Pengguna mengaktifkan lewat tombol "🔔 Aktifkan Notifikasi" di navbar. Kejadian yang memicu notifikasi: pengajuan izin/tukar libur baru (ke admin & owner) dan hasil approval (ke karyawan).
- Push butuh HTTPS di produksi; `localhost` dianggap aman untuk pengujian.

## Database

Sejak 14 Juli 2026, database utama adalah **PostgreSQL** (di-hosting di [Neon](https://neon.tech)), dipakai oleh dev lokal maupun deployment cloud — bukan lagi SQLite. Riwayat migrasi SQLite lama diarsipkan di `prisma/backup/migrations-sqlite-lama/` (referensi saja, jangan dipakai). Data hasil migrasi dari SQLite tersimpan sebagai dump di `prisma/backup/sqlite-dump.json` dan `prisma/backup/dev.db.bak` — folder `prisma/backup/` berisi data pribadi karyawan sungguhan, **sengaja di-gitignore**, jangan pernah di-commit.

Penyimpanan file surat dokter (`uploads/surat-dokter/`) masih di disk lokal — untuk deploy ke platform tanpa disk permanen (mis. Vercel), perlu dialihkan ke object storage (mis. Vercel Blob).

## Catatan untuk produksi

- Set env `JWT_SECRET` dengan nilai acak yang kuat (saat ini masih placeholder).
- Untuk aplikasi Android nanti, tambahkan dukungan token via header `Authorization: Bearer` di `lib/auth.ts` (saat ini sesi dibaca dari cookie).
