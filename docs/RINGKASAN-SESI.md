# Ringkasan Sesi — Portal Toko Marmo

**Versi: v10** — diperbarui 2026-08-11

> Ditulis untuk melanjutkan pekerjaan di sesi Claude Code baru. Baca ini + `docs/PRD.md` (kebenaran tunggal fitur, sekarang sampai **Feature 29**) + `AGENTS.md` (manual operasi & aturan kerja, sekarang 18 kesalahan umum) sebelum lanjut.

## Status saat ini

**Live di produksi:** https://portal-karyawan-theta.vercel.app **dan** domain custom **https://www.marmo.my.id** (alias ke deployment yang sama). Database **PostgreSQL (Neon)** — dev lokal dan produksi **berbagi database yang sama persis**, jadi perubahan schema/data lokal langsung berlaku di produksi juga. File surat dokter di **Vercel Blob**.

**Deploy terakhir:** commit `6fc02de` ("feedback admin, halaman kelola izin, detail izin per karyawan") — 11 Agu 2026, status READY di kedua domain. Diverifikasi di produksi: `/admin/izin` 200 dengan 2 MENUNGGU, tolak-dengan-feedback tersimpan & 403 untuk karyawan sendiri, sheet Excel "Per Karyawan" sudah kolom "Detail Izin". Deployment dicek lewat `GET /v6/deployments/{id}/files` — **tidak ada `.env`/secret yang ikut ter-upload**.

Catatan: schema `Catatan` ter-migrate ke Neon yang **dipakai bersama dev & produksi**, jadi perubahan schema lokal langsung berlaku di produksi.

## Fitur terbaru (Feature 27–29 di PRD) — sesi 11 Agu 2026, sudah di-deploy

### Feature 27 — Feedback admin saat tolak Izin/Tukar Libur
Klik **Tolak** (dashboard, `/admin/tukar-libur`) sekarang buka **modal** (`components/ModalTolakPengajuan.tsx`) dengan kolom feedback **opsional**.
- Kalau diisi: tersimpan di `feedbackAdmin` (kolom baru di `Izin` & `TukarLibur`), tampil ke karyawan di riwayat pengajuan (`/karyawan/izin`) sebagai kotak "Catatan admin: ...", dan ikut disebut di push notification
- Kalau dikosongkan: perilaku sama seperti sebelumnya (tolak langsung, tanpa catatan)
- Tombol **Setujui** TIDAK dipasangi modal — sesuai permintaan user, feedback cuma buat penolakan
- Logika dipusatkan di `lib/approval.ts` (`prosesIzin`/`prosesTukarLibur`, sekarang terima param `feedback` opsional) — dipakai bersama rute admin ber-sesi DAN endpoint OpenClaw (`agent-approval`), jadi kalau nanti OpenClaw diberi tahu, feedback bisa dikirim dari situ juga
- Diuji: karyawan sendiri tidak bisa tolak (403), tolak dengan feedback → tersimpan & tampil, tolak tanpa feedback → tidak ada kotak catatan yang muncul, modal "Batal" tidak mengubah status

### Feature 28 — Bug fix: kartu "Izin Menunggu" sekarang bisa diklik
User laporkan ada 2 izin menunggu tapi tidak bisa disetujui/tolak dari dashboard. Root cause: kartu "Izin Menunggu" **satu-satunya kartu approval tanpa `href`** — tidak pernah link kemana-mana sejak awal (kesalahan #18 baru di AGENTS.md). Dibuat halaman baru **`/admin/izin`** (pola sama `/admin/tukar-libur`): semua pengajuan izin, MENUNGGU di atas, tombol Setujui/Tolak. Endpoint baru `GET /api/admin/izin`. Kartu dashboard sekarang link ke sana.

⚠️ **Insiden kecil saat testing fitur ini**: salah klik "Setujui" pas verifikasi UI, tidak sengaja menyetujui izin SUNGGUHAN milik karyawan Putri (bukan data uji). Ketahuan dari badge "2 menunggu" → "1 menunggu" yang tidak seharusnya berubah. Langsung dikembalikan ke MENUNGGU + `feedbackAdmin: null`, diverifikasi datanya utuh persis semula. Pelajaran: hati-hati kalau tabel testing berisi data campuran (sungguhan + kemungkinan uji) — cek dulu row mana yang bakal kena klik sebelum eksekusi, terutama di dev yang **database-nya sama dengan produksi**.

### Feature 29 — Tipe izin & waktu pengajuan di Laporan Izin "Per Karyawan"
Kolom "Tanggal Izin" di tab Per Karyawan (Laporan Izin) dan sheet Excel "Per Karyawan" diganti jadi **"Detail Izin"**: tiap baris sekarang tampilkan **jenis izin** + **tanggal & jam saat karyawan input di webapp** (`createdAt`, bukan tanggal izinnya). Format: `"Izin Sakit — 8 Agu 2026 – 9 Agu 2026 (diajukan 8 Agu 2026, 08.18)"`. Endpoint `GET /api/admin/rekap-izin` diperluas mengembalikan `createdAt` per izin. Web & Excel sekarang identik isinya (dicek langsung, sama persis). Sheet "Rekap Izin"/tab Rincian TIDAK diubah — cuma tab Per Karyawan yang diminta.

## Fitur sesi sebelumnya (Feature 26 di PRD) — 4 Agu 2026, sudah di-deploy

### Feature 26 — Jenis izin baru: Setengah Hari
Dropdown "Jenis Pengajuan" (karyawan & admin) sekarang punya **Izin Setengah Hari**, diletakkan **tepat di bawah Izin Lain-lain**: SAKIT → LAINNYA → **SETENGAH_HARI** → MENIKAH → TUGAS_NEGARA.
- **Hanya 1 tanggal** — pola sama dengan Tugas Negara. Konstanta baru `JENIS_SATU_TANGGAL` di `lib/izin.ts` mendaftar keduanya; UI otomatis tampil 1 input tanggal untuk jenis apa pun yang ada di daftar itu
- Server (`lib/pengajuan-izin.ts`, `buatIzin()`) menolak **400** kalau tetap dikirim sebagai rentang — bukan cuma dicegah UI
- Alasan **wajib diisi** (beda dari Tugas Negara yang opsional)
- **Otomatis ikut** di filter Laporan Izin & export Excel — kedua tempat itu sudah generik lewat `JENIS_IZIN`/`LABEL_JENIS_IZIN`, tidak ada perubahan tambahan di sana
- **Susulan sesi ini juga:** Izin Setengah Hari **TIDAK dihitung sama sekali** dalam persentase kehadiran (bukan 0,5 hari — dikecualikan penuh, keputusan user setelah sempat dibiarkan ikut terhitung 1 hari absen). Konstanta `JENIS_TIDAK_HITUNG_KEHADIRAN` di `lib/izin.ts`, disaring di `where` Prisma pada kedua query kehadiran (`app/karyawan/page.tsx` & `app/api/admin/dashboard/route.ts`) — bukan di dalam `hitungPersenKehadiran()` sendiri (fungsi itu tidak tahu jenis izin). Diuji: Setengah Hari disetujui → kehadiran tetap 100%; kontrol Izin Sakit 3 hari → turun ke 90% seperti biasa, konsisten di beranda karyawan & dashboard admin.

## Fitur sesi sebelumnya (Feature 23–25 di PRD) — 3 Agu 2026, sudah di-deploy

### Feature 23 — ATURAN BISNIS BERUBAH: tidak ada karyawan tetap otomatis untuk angkatan 2026+
Ini perubahan aturan, bukan sekadar fitur. **Baca sebelum menyentuh apa pun soal kontrak.**
- Karyawan dengan `tanggalMasuk` **tahun 2026 ke atas** tidak pernah otomatis jadi tetap walau masa kerja > 3 tahun — kontrak diperpanjang terus: **3 bulan pertama, lalu 1 tahun berulang selamanya**
- Status tetap untuk mereka hanya lewat field baru **`User.tetapManual`**, centang di Edit Karyawan yang **hanya bisa diubah owner** (admin biasa → 403)
- **Karyawan lama (masuk < 2026) tidak berubah** — masih otomatis tetap setelah 3 tahun
- Semua logika dipusatkan di `lib/masa-kerja.ts`: `statusMasaKerja(tanggalMasuk, tetapManual)`, `filterMasihKontrak()` (filter Prisma), `TAHUN_TANPA_TETAP_OTOMATIS = 2026`. Dua tempat yang dulu membandingkan tanggal 3 tahun inline (dashboard & kontrak-habis) sudah diganti ke `filterMasihKontrak()`
- Menetapkan tetap **tidak menghapus kontrak** yang sudah ada (bukti hukum) — hanya berhenti muncul di Kontrak Segera Habis

### Feature 24 — Kolom "Tanggal Izin" di sheet Per Karyawan file export
Sheet "Per Karyawan" di `.xlsx` kini menampilkan tanggal tiap izin, urut kronologis: `"10 Jul 2026, 15 Jul 2026, 17 Jul 2026"`, izin multi-hari jadi rentang `"30 Jul 2026 – 31 Jul 2026"`.

### Feature 25 — Menu & halaman baru "Laporan Izin"
`/admin/laporan-izin`, menu tepat setelah "Daftar Karyawan". Isinya sama persis dengan file export tapi di layar.
- **Default = periode gajian berjalan (26 bulan ini – 25 bulan berikutnya)** via `periodeSiklus()` di `lib/periode.ts`
- Tombol geser periode ← →, plus input Dari/Sampai untuk rentang bebas
- Dua tampilan: **Rincian** (= sheet "Rekap Izin") & **Per Karyawan** (= sheet "Per Karyawan", termasuk Tanggal Izin)
- Filter jenis + tombol Download Excel yang ikut periode & filter yang tampil
- Tanpa endpoint baru — pakai `GET /api/admin/rekap-izin` yang sudah ter-scope lokasi

## Fitur sesi sebelumnya (Feature 21–22 di PRD) — 1 Agu 2026

### Feature 21 — Catatan/pesan khusus admin → karyawan
Menu **"Catatan"** di navbar admin (`/admin/catatan`) & karyawan (`/karyawan/catatan`).
- Dropdown "Kirim ke": **satu karyawan**, **semua karyawan**, atau **semua di satu lokasi** (`lib/catatan.ts` konstanta client-safe, `lib/kirim-catatan.ts` server-only)
- Karyawan: catatan belum dibaca tampil sebagai **banner kuning paling atas di beranda** + tombol "Tandai sudah dibaca"; riwayat lengkap di menu Catatan
- **Push notification** dikirim ke tiap penerima saat catatan dibuat
- Kiriman massal = satu baris per penerima dengan `batchId` sama → admin lihat **read receipt per orang** ("12/45 sudah membaca" + tabel rinci) dan bisa **tarik kembali satu kiriman sekaligus** (`DELETE /api/admin/catatan/[batchId]`)
- Ter-scope lokasi (Feature 19): admin ber-lokasiAkses tidak bisa kirim/tarik lintas lokasi

### Feature 22 — Export rekap izin ke Excel (.xlsx)
Panel **"Export ke Excel"** di `/admin/rekap-izin`, pakai `exceljs` (**dependency baru**, `lib/export-izin.ts`).
- Input **Dari/Sampai wajib** — endpoint balas 400 kalau kosong atau `sampai < dari`
- Rentang tanggal **tercetak di dalam file** ("Periode: 1 Juli 2026 s/d 31 Juli 2026") **dan di nama file** (`Rekap-Izin-Sakit_2026-07-01_sd_2026-07-31.xlsx`)
- 2 sheet: "Rekap Izin" (rinci, header dibekukan) + "Per Karyawan" (jumlah izin & total hari)
- **Filter jenis di halaman rekap diperluas** dari Sakit/Lain-lain saja → **Semua Jenis + 4 jenis izin**; dashboard "Pengajuan Izin Terbaru" kini menautkan ke sini ("Lihat semua & export Excel →")

## Fitur sesi sebelumnya (Feature 18–20 di PRD)

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
| Karyawan impor (±49 orang) | Akmal, Andrew, Haryanto, dll. | 123 | |

Login **tidak case-sensitive**.

⚠️ **Budi Santoso / Siti / Ani / Rudi sudah TIDAK ada** di database (dicek 1 Agu 2026, login balas 401) — catatan lama yang menyebut akun ini sudah usang. Kalau butuh karyawan uji, buat sendiri berawalan `Uji ` lalu hapus.

## Kesalahan baru yang dicatat di AGENTS.md (kesalahan #17)

**Jangan langsung salahkan kode kalau state komponen client tidak pernah terisi padahal API-nya 200.** Kejadian nyata sesi ini: sesudah `npm install exceljs`, dropdown karyawan kosong terus & daftar mentok "Memuat...". Penyebabnya Turbopack panic `Failed to write app endpoint … Next.js package not found` → Fast Refresh rebuild berulang → React remount sebelum `fetch` selesai. **Cek `preview_logs` + console (`[Fast Refresh] rebuilding` berulang) dulu**; perbaikannya di lingkungan: `pkill -f "next dev"; rm -rf .next; npm install` lalu nyalakan ulang.

(Kesalahan #16 sesi sebelumnya: jangan tambah logika server (prisma/fs) ke `lib/*.ts` yang diimpor komponen client — pola pemisahan itu diikuti lagi di sesi ini: `lib/catatan.ts` vs `lib/kirim-catatan.ts`.)

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
cd /Users/seno/projects/portal-karyawan
npm run dev   # http://localhost:3000
```

Kalau schema Prisma berubah: `npx prisma migrate dev --name <nama>` lalu **restart server** (`pkill -f "next dev"` lalu nyalakan lagi).

## Dokumen rujukan di repo

- **`docs/PRD.md`** — 29 fitur ✅, data model (termasuk `lokasiAkses`, `tetapManual`, `feedbackAdmin` & entity `Catatan`), fase project. **Selalu update setiap fitur baru.**
- **`AGENTS.md`** — manual operasi: stack terkunci, konstanta bisnis per file `lib/`, **18 kesalahan umum** + aturan penangkalnya, kapan harus berhenti & bertanya.
- **`.claude/skills/`** — `verifikasi-portal`, `tambah-fitur-portal`, `impor-karyawan`.

## Pola kerja yang disukai user (penting untuk sesi baru)

- User sering minta **beberapa perubahan kecil berurutan** lalu bilang "gabung aja, nanti deploy sekalian" — artinya: kerjakan & verifikasi tiap perubahan, TAPI tahan commit/deploy sampai diminta eksplisit. Jangan asumsikan harus deploy tiap selesai satu fitur.
- Selalu diverifikasi end-to-end (curl + browser) sebelum lapor selesai, data uji (prefix `Uji `) selalu dibersihkan sesudahnya — ini pola yang sudah established, ikuti terus.
- Kalau ada bug/gap yang ditemukan saat mengerjakan tugas lain (bukan yang diminta), boleh langsung diperbaiki dalam scope yang sama asal jelas dilaporkan — user menghargai ini (lihat perbaikan bug kontrak & label izin di sesi ini).

## Riwayat Versi

Setiap kali file ini diperbarui: naikkan **Versi** di judul +1, lalu tambah satu baris di tabel bawah (baris terbaru paling atas).

| Versi | Tanggal | Ringkasan perubahan |
|---|---|---|
| v10 | 2026-08-11 | Feature 27–29 **di-deploy ke produksi** (commit `6fc02de`, READY, diverifikasi langsung di www.marmo.my.id — halaman `/admin/izin`, feedback tolak, sheet Excel Detail Izin). |
| v9 | 2026-08-11 | **Feature 28** (bug fix: halaman `/admin/izin` + link kartu "Izin Menunggu" yang tadinya buntu, kesalahan #18 dicatat) & **Feature 29** (kolom Detail Izin: jenis + jam pengajuan di Laporan Izin Per Karyawan & export). Di-deploy `6fc02de`. |
| v8 | 2026-08-11 | **Feature 27** (feedback admin opsional saat tolak Izin/Tukar Libur — modal, `feedbackAdmin`, tampil ke karyawan + ikut notifikasi). Belum di-deploy. |
| v7 | 2026-08-04 | Feature 26 (+ susulan pengecualian kehadiran) **di-deploy ke produksi** (commit `4036432`, READY, diverifikasi langsung di www.marmo.my.id). |
| v6 | 2026-08-04 | Susulan Feature 26: Izin Setengah Hari dikecualikan PENUH dari persentase kehadiran (bukan 0,5 hari) via `JENIS_TIDAK_HITUNG_KEHADIRAN`. Belum di-deploy. |
| v5 | 2026-08-04 | **Feature 26** (jenis izin baru Setengah Hari, 1 tanggal, di bawah Izin Lain-lain, otomatis ikut Laporan Izin & export). Belum di-deploy. |
| v4 | 2026-08-03 | **Feature 23** (aturan kontrak berubah: angkatan 2026+ tidak ada tetap otomatis, hanya manual oleh owner lewat `User.tetapManual`), **Feature 24** (kolom Tanggal Izin di sheet Per Karyawan), **Feature 25** (menu & halaman Laporan Izin, default periode 26–25). Di-deploy `0b5b0a0` (3 Agu 2026). |
| v3 | 2026-08-01 | Feature 21 & 22 **di-deploy ke produksi** (commit `93d5da5`, READY di www.marmo.my.id) & diverifikasi di sana; catatan "belum di-deploy" di v2 dicabut. |
| v2 | 2026-08-01 | **Feature 21** (catatan/pesan admin→karyawan, banner beranda + push notif + read receipt + tarik kembali) & **Feature 22** (export rekap izin ke .xlsx dengan rentang tanggal wajib; filter jenis diperluas ke semua jenis izin). Dependency baru `exceljs`. Kesalahan #17 dicatat di AGENTS.md. Akun contoh Budi Santoso dkk. dikonfirmasi sudah tidak ada di DB. Path repo di dokumen dibetulkan ke `~/projects/portal-karyawan`. |
| v1 | 2026-07-30 | Baseline mulai pakai penomoran versi. Isi saat ini: Feature 18–20 (OpenClaw, admin ber-lokasi, ajukan izin admin) + perbaikan bug kontrak lewat tanggal. |
