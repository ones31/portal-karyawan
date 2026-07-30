# Ringkasan Sesi — Portal Toko Marmo

**Versi: v1** — diperbarui 2026-07-30

> Ditulis untuk melanjutkan pekerjaan di sesi Claude Code baru. Baca ini + `docs/PRD.md` (kebenaran tunggal fitur, sekarang sampai **Feature 20**) + `AGENTS.md` (manual operasi & aturan kerja, sekarang 16 kesalahan umum) sebelum lanjut.

## Status saat ini

**Live di produksi:** https://portal-karyawan-theta.vercel.app **dan** domain custom **https://www.marmo.my.id** (alias ke deployment yang sama). Database **PostgreSQL (Neon)** — dev lokal dan produksi **berbagi database yang sama persis**, jadi perubahan schema/data lokal langsung berlaku di produksi juga. File surat dokter di **Vercel Blob**.

**Deploy terakhir:** commit `55823bd` ("menu Ajukan Izin admin + perbaiki kontrak lewat tanggal hilang dari daftar") — status READY, diverifikasi via curl.

## Fitur yang ditambahkan di sesi ini (Feature 18–20 di PRD)

### Feature 18 — Ringkasan & approval jarak jauh via OpenClaw
User punya OpenClaw (personal AI agent, self-hosted di Mac ini, terhubung Telegram). Dibuat:
- `GET /api/admin/ringkasan-agent` — ringkasan izin/tukar-libur/pendaftaran menunggu + kontrak segera habis, autentikasi token statis `AGENT_REPORT_TOKEN` (bukan sesi login)
- `POST /api/admin/agent-approval` — setujui/tolak izin/tukar-libur via token, dipakai OpenClaw kalau user memerintah lewat chat Telegram
- Cron OpenClaw `portal-karyawan-ringkasan` (job id `f98a9505-952d-4a32-8437-0574592fadb9`, 08:00 WIB harian, model eksplisit `sonnet`) — **catatan:** 4 cron pribadi user yang lain (morning-briefing dkk.) ditemukan rusak diam-diam karena model default agent (`9router/tes1`) unreachable; job baru ini sengaja pakai model lain supaya tidak ikut kena.
- Instruksi lengkap (URL + token) sudah ditulis ke `~/.openclaw/workspace/TOOLS.md` milik user (di luar repo ini).

### Feature 19 — Admin ber-lokasi (akses terbatas per toko)
Role `ADMIN` sekarang bisa dibatasi ke satu lokasi lewat field baru `User.lokasiAkses`. Admin ber-lokasiAkses **hanya melihat/mengelola karyawan di lokasinya** — daftar karyawan, dashboard, rekap izin, kontrak habis, tukar libur semua ter-filter (`filterLokasiSesi()` / `bolehAksesLokasi()` di `lib/auth.ts`). Akses lintas lokasi → 404/403. Owner (`SUPER_ADMIN`) tidak dibatasi.
- Akun **`admin`** → lokasiAkses **Menceng**
- Akun baru **`admin2`** → lokasiAkses **Tegal Alur**, password awal `admin2123` (sarankan diganti)

### Feature 20 — Admin/owner bisa input izin atas nama karyawan
Solusi untuk karyawan yang terkendala membuka portal sendiri. Dua jalur, endpoint sama (`POST /api/admin/karyawan/[id]/izin`, logika di `lib/pengajuan-izin.ts`):
- Menu navbar **"Ajukan Izin"** (`/admin/ajukan-izin`) — dropdown pilih karyawan (ter-scope lokasi) + form izin lengkap
- Tombol **"+ Ajukan Izin untuk Karyawan Ini"** di halaman Edit Karyawan
- Pengajuan tetap MENUNGGU, tidak otomatis disetujui

### Perubahan lain
- **Validasi wajib surat dokter untuk sakit >1 hari DIHAPUS** — sekarang opsional sepenuhnya (permintaan user langsung). ⚠️ Teks resmi Peraturan & Tata Tertib Toko (`lib/kontrak.ts`, `ISI_KONTRAK_DEFAULT`) **masih menyebut aturan lama** — sengaja belum diubah karena itu dokumen legal, perlu keputusan user terpisah kalau mau disinkronkan ke sumber Google Docs asli.
- **Tombol WhatsApp** di kolom Telepon Daftar Karyawan (`lib/whatsapp.ts`) — otomatis ambil nomor HP dari field yang kadang berisi 2 nomor sekaligus (nomor rumah/kantor diabaikan).
- **Bug diperbaiki:** halaman "Kontrak Segera Habis" (`/admin/kontrak-habis`) dulu pakai filter yang MENGECUALIKAN kontrak yang sudah lewat tanggal habisnya — jadi tombol "Perpanjang 1 Tahun" hilang justru untuk kasus paling mendesak. Sudah diperbaiki (karyawan Tetap >3 tahun dikecualikan biar kontrak basi tidak nyangkut selamanya).
- Reset password karyawan ke default (`123`) — tombol di Edit Karyawan, endpoint `POST /api/admin/karyawan/[id]/reset-password`.
- Nama karyawan di Daftar Karyawan jadi tautan langsung ke Edit Karyawan (dulu ada kolom Aksi terpisah yang sulit dijangkau di tabel lebar).
- Panduan pemakaian untuk karyawan (cara login & ajukan izin) sudah dibuat sebagai artifact HTML — diberikan ke user sebagai link, tidak tersimpan di repo.

## Akun untuk login (hafalkan)

| Role | Nama | Password | Catatan |
|---|---|---|---|
| Owner | seno / dian | seno123 / dian123 | Tidak dibatasi lokasi |
| Admin | admin | admin123 | lokasiAkses: **Menceng** |
| Admin | admin2 | admin2123 | lokasiAkses: **Tegal Alur** (baru, sarankan ganti password) |
| Karyawan lengkap | Budi Santoso | karyawan123 | Ada kontrak + TTD |
| Karyawan impor (±45 orang) | (nama masing-masing) | 123 | |

Login **tidak case-sensitive**.

## Kesalahan baru yang ditemukan & dicatat di AGENTS.md (kesalahan #16)

**Jangan tambah logika server (prisma/fs) ke file `lib/*.ts` yang isinya sudah dipakai komponen client.** Kejadian nyata sesi ini: `buatIzin()` (pakai `fs/promises`) sempat ditambahkan ke `lib/izin.ts` yang juga diimpor `app/karyawan/izin/page.tsx` (client) → build error "Module not found: fs/promises". Sudah dipisah: `lib/izin.ts` (konstanta murni, client-safe) vs `lib/pengajuan-izin.ts` (server-only). **Sebelum menambah logika ke `lib/*.ts`, cek dulu:** `grep -rl "from \"@/lib/<nama>\"" app/` — kalau ada file `"use client"` yang mengimpornya, taruh logika server di file baru.

## Alat & kredensial yang tersedia di Mac ini

- **`gh` CLI** — login sebagai `ones31`
- **`vercel` CLI** — token di `~/.vercel-token` (`export VERCEL_TOKEN=$(cat ~/.vercel-token | tr -d '\n')` sebelum `vercel ... --token "$VERCEL_TOKEN"`)
- **Neon** — `DATABASE_URL` di `.env` project
- **AnyDesk** — sudah terinstal (dibahas untuk akses remote ke Mac ini, tidak jadi dipakai untuk coding — lihat catatan di bawah)
- **OpenClaw** — Gateway jalan lokal (`openclaw status`), channel Telegram aktif (target `telegram:173364209`)
- Kalau sesi baru jalan di mesin **berbeda**, kredensial di atas tidak ikut pindah.

## Diskusi non-kode (untuk konteks, bukan tugas tertunda)

User sempat tanya cara kerja dari MacBook saat di luar rumah (Mac mini ini yang biasa dipakai). Rekomendasi yang diberikan: **clone repo di MacBook** untuk ngoding (proyek ini portabel — kode di GitHub, DB di Neon, deploy di Vercel, tidak bergantung ke Mac mini), pakai **AnyDesk** (sudah terpasang) kalau sekadar perlu akses OpenClaw/Mac mini dari jauh. Tailscale dibahas tapi belum dipasang. Ini belum ada tindakan konkret — kalau user minta lanjut, mulai dari situ.

## Cara menjalankan

```bash
cd /Users/seno/portal-karyawan
npm run dev   # http://localhost:3000
```

Kalau schema Prisma berubah: `npx prisma migrate dev --name <nama>` lalu **restart server** (`pkill -f "next dev"` lalu nyalakan lagi).

## Dokumen rujukan di repo

- **`docs/PRD.md`** — 20 fitur ✅, data model (termasuk `lokasiAkses`), fase project. **Selalu update setiap fitur baru.**
- **`AGENTS.md`** — manual operasi: stack terkunci, konstanta bisnis per file `lib/`, **16 kesalahan umum** + aturan penangkalnya, kapan harus berhenti & bertanya.
- **`.claude/skills/`** — `verifikasi-portal`, `tambah-fitur-portal`, `impor-karyawan`.

## Pola kerja yang disukai user (penting untuk sesi baru)

- User sering minta **beberapa perubahan kecil berurutan** lalu bilang "gabung aja, nanti deploy sekalian" — artinya: kerjakan & verifikasi tiap perubahan, TAPI tahan commit/deploy sampai diminta eksplisit. Jangan asumsikan harus deploy tiap selesai satu fitur.
- Selalu diverifikasi end-to-end (curl + browser) sebelum lapor selesai, data uji (prefix `Uji `) selalu dibersihkan sesudahnya — ini pola yang sudah established, ikuti terus.
- Kalau ada bug/gap yang ditemukan saat mengerjakan tugas lain (bukan yang diminta), boleh langsung diperbaiki dalam scope yang sama asal jelas dilaporkan — user menghargai ini (lihat perbaikan bug kontrak & label izin di sesi ini).

## Riwayat Versi

Setiap kali file ini diperbarui: naikkan **Versi** di judul +1, lalu tambah satu baris di tabel bawah (baris terbaru paling atas).

| Versi | Tanggal | Ringkasan perubahan |
|---|---|---|
| v1 | 2026-07-30 | Baseline mulai pakai penomoran versi. Isi saat ini: Feature 18–20 (OpenClaw, admin ber-lokasi, ajukan izin admin) + perbaikan bug kontrak lewat tanggal. |
