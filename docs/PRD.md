# PRD — Portal Toko Marmo

> **Cara pakai:** Isi semua bagian dalam `[kurung siku]`. Hapus contoh kalau sudah tidak perlu. Bagian yang belum relevan boleh ditulis "N/A" daripada dikosongkan, biar AI tahu itu memang sudah diputuskan bukan lupa diisi.

## Daftar Isi
- [0. Cara AI Membaca Dokumen Ini](#0-cara-ai-membaca-dokumen-ini)
- [1. Overview](#1-overview)
- [2. Tech Stack](#2-tech-stack)
- [3. Features](#3-features)
- [4. Data Model](#4-data-model)
- [5. Phases](#5-phases)
- [Notes untuk AI Developer](#notes-tambahan-untuk-ai-developer)

---

## 0. Cara AI Membaca Dokumen Ini

Dokumen ini adalah **sumber konteks utama** untuk project ini. Saat membantu coding, AI harus:

- [ ] Mengikuti struktur dan kebutuhan yang tertulis di PRD ini
- [ ] Tidak membuat asumsi besar tanpa konfirmasi
- [ ] Menjaga scope tetap fokus ke MVP terlebih dahulu
- [ ] Menjelaskan jika ada bagian yang belum jelas
- [ ] Memberi saran teknis hanya jika relevan dengan tujuan project
- [ ] Tidak mengubah arsitektur utama tanpa alasan kuat

---

## 1. Overview

### 1.1 Nama Project
`[Portal Toko Marmo]`

### 1.2 Deskripsi Singkat
*Jelaskan project ini dalam 2–4 kalimat.*

> Contoh: Project ini adalah aplikasi manajemen order untuk bisnis custom fashion. Sistem ini membantu admin mencatat pesanan, mengatur status produksi, menyimpan data customer, dan memantau progress order dari awal sampai selesai.

```
[Project ini adalah aplikasi dashboard karyawan marmo mulai dari masuk pertama kali untuk mengisi data diri .membaca peraturan toko tanda tangan kontrak . Untuk Karyawan existing untuk mengetahui masa berakhir kontrak kerja dan untuk mengajukan perizinan serta role admin untuk mengapprove perizinan serta melihat dashboard jumlah yang izin ]
```

### 1.3 Target User
*Siapa yang akan memakai project ini? (centang yang relevan)*

- [ v] Admin internal
- [ v] Owner bisnis
- [ v] Karyawan Baru
- [ v] Karyawan Lama
- [ ] Sales / CS
- [ ] Vendor / partner
- [ ] Lainnya: `[...]`

### 1.4 Masalah yang Mau Diselesaikan
> Contoh: Data order masih dicatat manual di spreadsheet; tim sering lupa update status; owner sulit melihat progress real-time; customer sering tanya ulang; data tercecer di WhatsApp.

- `[data karywan kurang rapi]`
- `[Lupa jika masa kontrak sudah berakhir]`
- `[Owner sulit mengetahui masa kontrak dan sudah berapa kali izn karyawan selama sebulan/setahun]`

### 1.5 Tujuan Utama Project
> Contoh: Semua data tersimpan rapi; admin mudah update status; owner punya dashboard; proses lebih efisien dan minim human error.

- `[data karyawan dan izin lebih tertata dan mudah dilihat didashboard owner`
- `[memudahkan karyawan untuk izin]`
- `[Tujuan 3]`

### 1.6 Value Proposition
*Kenapa project ini penting?*

```
[agar owner dan karyawan punya 1 portal dari karyawan baru sampai existing dan bagi owner penting agar data mudah dilihat]
```

### 1.7 Success Metrics
| Metrik | Target |
|---|---|
| Waktu input data order | dari `[x menit]` → `[x menit]` |
| Waktu pencarian order | < `[x detik]` |
| Kejelasan status order | 100% order punya status jelas |
| Reporting | Owner bisa lihat summary harian/mingguan |
| Error pencatatan | berkurang minimal `[x%]` |

---

## 2. Tech Stack

**Stack terpilih (sudah diimplementasikan):**
- **Framework:** Next.js 16 (TypeScript) + Tailwind CSS — web app, API routes untuk backend
- **Database:** PostgreSQL (Neon) via Prisma 6 — dimigrasikan dari SQLite pada 14 Jul 2026 sebagai persiapan deploy ke cloud (Vercel tidak punya disk permanen untuk SQLite)
- **Auth:** JWT di cookie httpOnly, login memakai **nama** (bukan email), sesi 8 jam
- **File upload:** surat dokter — Vercel Blob (mode private) di produksi, folder `uploads/` lokal untuk dev/platform lain (auto-switch di `lib/surat-dokter.ts` berdasar `BLOB_READ_WRITE_TOKEN`), diakses lewat API dengan pemeriksaan login
- **Arsitektur API-first:** semua data lewat REST API `/api/*` (JSON) — siap dipakai aplikasi Android nanti
- **Deploy:** Vercel, live di https://portal-karyawan-theta.vercel.app (sejak 15 Jul 2026). Repo GitHub privat: `ones31/portal-karyawan`.

### 2.3 Constraint Teknis
- [ v] Harus mobile responsive
- [ v] Harus ringan dan cepat
- [ v] Harus mudah dipakai non-teknis
- [v ] Harus bisa dikembangkan bertahap
- [ v] Tidak boleh terlalu kompleks di fase MVP
- [ ] Budget hosting maksimal: `[...]`

---

## 3. Features

### 3.1 MVP Features

#### Feature 1 — Login by Nama ✅
**Deskripsi:** Login memakai nama + password (tanpa email). Nama unik per akun. Redirect otomatis sesuai role.
**User yang memakai:** Semua role

#### Feature 2 — Onboarding Data Pribadi ✅
**Deskripsi:** Karyawan baru mengisi data pribadi: NIK, tempat/tanggal lahir, jenis kelamin, agama, alamat, nama ayah & ibu, telepon, status nikah, merokok/tidak, kontak darurat, rekening bank, pendidikan. **NPWP & BPJS TIDAK diisi karyawan** (form-nya dihapus dari menu Data Pribadi) — hanya admin/owner yang bisa mengisinya lewat Edit Karyawan; nilai yang diisi admin tidak tertimpa saat karyawan menyimpan formnya.
**User yang memakai:** Karyawan

#### Feature 3 — Kontrak Kerja & Tanda Tangan Digital ✅
**Deskripsi:** Karyawan membaca isi kontrak + peraturan & tata tertib toko, melihat masa berlaku, menandatangani digital (gambar di layar) dan mencentang persetujuan. Setelah ditandatangani kontrak terkunci.
**User yang memakai:** Karyawan (baca & TTD), Admin/Owner (set masa kontrak)

#### Feature 4 — Pengajuan Izin ✅
**Deskripsi:** Izin sakit atau izin lain-lain dengan rentang tanggal + alasan. **Izin sakit ada 2 tipe: tanpa surat dokter dan dengan surat dokter (upload PDF/JPG/PNG maks 5 MB).** Aturan: sakit lebih dari 1 hari wajib melampirkan surat dokter. Riwayat izin tampil dengan status (Menunggu/Disetujui/Ditolak).
**User yang memakai:** Karyawan

#### Feature 5 — Approval Izin ✅
**Deskripsi:** Admin/owner menyetujui atau menolak pengajuan izin dari dashboard, termasuk membuka file surat dokter yang diupload.
**User yang memakai:** Admin, Owner

#### Feature 6 — Dashboard Owner/Admin ✅
**Deskripsi:** Kartu ringkasan: total karyawan, izin sakit, izin lain-lain (dengan filter periode bulan ini/tahun ini/semua), izin menunggu, dan **kontrak habis < 30 hari**. Semua kartu bisa diklik menuju daftar rinciannya (daftar karyawan, rekap siapa saja yang izin + jumlahnya, daftar kontrak segera habis).
**User yang memakai:** Admin, Owner

#### Feature 7 — Manajemen Karyawan ✅
**Deskripsi:** Daftar karyawan (lokasi, telepon, tanggal lahir, status data pribadi, status TTD kontrak, masa kontrak + sisa hari, jumlah izin per periode). Tambah akun karyawan (lokasi wajib dipilih). **Edit karyawan**: nama, lokasi, telepon, email, reset password, ubah/perpanjang masa kontrak, plus riwayat izin & akses surat dokter per karyawan. **Hapus karyawan** (tombol di halaman edit, untuk karyawan resign): hanya akun role KARYAWAN yang bisa dihapus, disertai konfirmasi, ikut menghapus file surat dokter di disk & seluruh data terkait (cascade). Owner juga bisa membuat akun admin. **Nama karyawan di tabel adalah tautan** langsung ke halaman Edit Karyawan (bukan tombol Edit/Hapus terpisah di tabel) — dipilih karena tabel Daftar Karyawan punya banyak kolom dan tombol aksi di ujung kanan sulit dijangkau tanpa scroll horizontal.
**User yang memakai:** Admin, Owner

#### Feature 8 — Pendaftaran Mandiri Karyawan Baru ✅
**Deskripsi:** Tombol "Daftar Karyawan Baru" di halaman login membuka **Formulir Karyawan Baru Toko H. Marmo** (mengikuti formulir kertas): nama, tempat/tanggal lahir, agama, alamat tinggal, nama ayah & ibu, no. telp rumah & HP, status, merokok/tidak, plus lokasi kerja & password, dan checkbox pernyataan "data benar & bersedia memenuhi peraturan". Setelah daftar otomatis login lalu masuk **alur onboarding 3 langkah**: (1) Peraturan Toko H. Marmo, (2) Kontrak Masa Percobaan 1 Bulan, (3) Perjanjian Kerja PKWT (teks dokumen resmi toko di `lib/dokumen-toko.ts`, dirender dengan format rapi + bold kata penting). Di akhir langkah 3 karyawan **menggambar tanda tangan persetujuan** (peraturan + kontrak percobaan + PKWT) yang tersimpan di profil dan terlihat admin di halaman Edit Karyawan. Data formulir langsung mengisi profil; role selalu karyawan; kontrak ditetapkan admin kemudian lewat Edit Karyawan.
**User yang memakai:** Karyawan baru

#### Feature 9 — Import Karyawan Existing & Pemisahan per Lokasi ✅
**Deskripsi:** Karyawan existing diimpor dari spreadsheet "Waktu Masuk" toko (nama + tanggal masuk): **25 karyawan Menceng** dan **20 karyawan Tegal Alur** (script `prisma/import-karyawan.ts` dan `import-karyawan-2.ts`, password awal `123`; tanggal/bulan yang kosong di spreadsheet diisi tanggal 1). Kolom **Tanggal Masuk** tampil di daftar karyawan dan bisa diedit di Edit Karyawan. Halaman **Daftar Karyawan dipisah per lokasi** dengan tab: Tegal Alur / Menceng / Semua (dengan jumlah per tab).
**User yang memakai:** Admin, Owner

#### Feature 10 — Kontrak Otomatis & Perpanjangan 1 Tahun ✅
**Deskripsi:** Saat karyawan menandatangani persetujuan di onboarding, masa kontrak terisi otomatis: masa kerja **< 3 bulan** → kontrak percobaan 3 bulan terhitung dari tanggal masuk; **3 bulan–3 tahun** → Kontrak Kerja 1 Tahun terhitung dari akhir masa 3 bulan (periode bergulir per tahun sampai mencakup hari ini); **> 3 tahun** → **karyawan tetap**, masa kontrak dikosongkan (tidak terikat kontrak). Formula ini dipusatkan di `lib/kontrak-otomatis.ts` (`hitungMasaKontrakOtomatis`), dipakai onboarding maupun script backfill. Di halaman **Kontrak Segera Habis** ada tombol **"Perpanjang 1 Tahun"**: mengganti kontrak dengan Kontrak Kerja 1 Tahun (teks resmi toko, masa berlaku terisi otomatis dari tanggal habis kontrak lama), memperbarui data karyawan, meminta karyawan menandatangani ulang di portalnya, dan **mengirim push notification** ke karyawan ybs. Login memakai nama **tidak case-sensitive**; beranda karyawan menampilkan tombol **WA Grup Toko Marmo**. Aturan status masa kerja di `lib/masa-kerja.ts`.

**Backfill sekali jalan (15 Jul 2026):** karyawan lama (impor) yang belum pernah onboarding dianggap sudah menandatangani kontrak, memakai formula yang sama — dijalankan via `prisma/backfill-kontrak-karyawan-lama.ts` (aman dijalankan ulang, melewati yang sudah TTD/tetap/tanpa tanggal masuk). 14 karyawan mendapat kontrak baru dengan `ditandatanganiPada` terisi tanggal backfill; **hanya untuk data yang sudah ada saat itu** — karyawan baru (mandiri atau ditambah admin) tetap wajib TTD digital normal lewat onboarding.
**User yang memakai:** Semua role

#### Feature 14 — Ringkasan Izin, Tingkat Kehadiran & Notifikasi Kontrak di Beranda Karyawan ✅
**Deskripsi:** Beranda karyawan menampilkan **rincian jumlah izin per jenis** (kartu "Pengajuan Izin") untuk **periode berjalan tanggal 26 s/d 25 bulan berikutnya** (siklus penggajian toko; helper `periodeBerjalan()` di `lib/periode.ts`), urutan mengikuti dropdown: Izin Sakit, Izin Lain-lain, Izin Menikah, Tugas Negara. Di kartu sambutan ada **persentase Tingkat Kehadiran** periode berjalan: mulai 100%, berkurang sesuai jumlah **hari** izin (izin DITOLAK tidak mengurangi; rentang izin dipotong ke periode; hijau ≥90%, kuning ≥75%, merah di bawahnya). Saat admin/owner membuat kontrak baru atau memperpanjang kontrak (Feature 10) dan karyawan belum menandatanganinya, muncul **banner notifikasi biru** di atas beranda dengan tautan langsung ke halaman Kontrak Kerja.
**User yang memakai:** Karyawan

#### Feature 13 — PWA & Push Notification ✅
**Deskripsi:** Aplikasi bisa di-install ke layar utama (manifest di `app/manifest.ts`, ikon "M Marmo", service worker `public/sw.js`). **Push notification** via Web Push/VAPID (kunci di `.env`, model `PushSubscription` per perangkat): tombol **"🔔 Aktifkan Notifikasi"** di navbar (semua role). Notifikasi terkirim saat: karyawan mengajukan izin/tukar libur → ke semua admin & owner; izin/tukar libur disetujui/ditolak → ke karyawan ybs. Klik notifikasi membuka halaman terkait. Langganan kedaluwarsa dibersihkan otomatis. Butuh HTTPS saat produksi (localhost dianggap aman untuk pengujian). Helper kirim di `lib/push.ts`.
**User yang memakai:** Semua role

#### Feature 12 — Jenis Izin Lengkap, Pengingat & Filter Custom ✅
**Deskripsi:** Dropdown jenis izin urutan tetap **1. Izin Sakit** (dengan/tanpa surat dokter) **2. Izin Lain-lain 3. Izin Menikah** (rentang, maks 7 hari sesuai perjanjian kerja — divalidasi klien & server) **4. Tugas Negara** (1 tanggal saja, alasan opsional), lalu **Tukar Libur**. Halaman izin karyawan menampilkan **pengingat**: "Hindari izin di hari yang sama dengan partner yang libur." Selain itu ada **peringatan merah** saat memilih izin sakit **tanpa surat dokter** ("Sering izin tanpa surat dokter dapat mengurangi kerajinan kerja") dan saat memilih **izin lain-lain** ("Sering izin dapat mengurangi kerajinan kerja"). Rekap izin admin punya filter periode **Bulan Ini / Tahun Ini / Semua / Custom** (rentang tanggal bebas). Urutan & enum di `lib/izin.ts` (`JENIS_IZIN`), rentang di `lib/periode.ts`.
**User yang memakai:** Karyawan (ajukan), Admin/Owner (rekap)

#### Feature 11 — Izin Tukar Libur ✅
**Deskripsi:** Tukar libur menyatu di halaman **Ajukan Izin** karyawan sebagai opsi dropdown "Jenis Pengajuan" (Izin Sakit / Izin Lain-lain / **Tukar Libur**). Saat Tukar Libur dipilih, form menampilkan field: **tanggal libur yang ditukar**, **ditukar dengan siapa** (nama rekan), tanggal libur pengganti (opsional), keterangan (opsional). Riwayat menggabungkan izin + tukar libur berstatus (Menunggu/Disetujui/Ditolak). Di **dashboard admin/owner** ada **kartu "Tukar Libur Menunggu"** yang mengarah ke halaman approval (setujui/tolak). Model `TukarLibur`.
**User yang memakai:** Karyawan (ajukan), Admin/Owner (approve)

#### Feature 15 — Ganti Password Mandiri ✅
**Deskripsi:** Menu **"Ganti Password"** tersedia di navbar untuk semua role (karyawan, admin, owner), mengarah ke `/karyawan/ganti-password` atau `/admin/ganti-password` (komponen bersama `components/GantiPasswordForm.tsx`). Form meminta password lama + password baru + konfirmasi; password lama diverifikasi via `bcrypt.compare` sebelum password baru (min. 6 karakter) disimpan ter-hash. Endpoint: `PATCH /api/auth/ganti-password`.
**User yang memakai:** Semua role

#### Feature 16 — Persetujuan Admin untuk Pendaftaran Mandiri ✅
**Deskripsi:** User baru mendapat field `statusAkun` (`MENUNGGU` / `AKTIF` / `DITOLAK`, default `AKTIF`). Pendaftaran mandiri (`/daftar`) kini membuat akun dengan status **MENUNGGU**: karyawan tetap langsung bisa login & mengerjakan onboarding seperti biasa (baca peraturan, isi data, TTD kontrak), tapi **belum tampil di Daftar Karyawan utama** sampai admin menyetujui. Admin melihat & memproses pendaftaran menunggu di halaman baru **`/admin/pendaftaran`** (kartu dashboard "Pendaftaran Menunggu"). Setiap baris punya dropdown **Lokasi** (Tegal Alur/Menceng) yang **wajib dipilih** sebelum tombol Setujui bisa diproses (validasi klien + server `PATCH /api/admin/pendaftaran/[id]`, 400 kalau lokasi kosong/tidak valid) — jadi lokasi kerja langsung ditetapkan di saat yang sama dengan persetujuan, bukan langkah terpisah. Setujui → `statusAkun: AKTIF` + `lokasi` tersimpan, langsung tampil di Daftar Karyawan. Tolak (→ `DITOLAK`, **login diblokir** sejak saat itu — dicek di `app/api/auth/login/route.ts`) tidak butuh lokasi. Karyawan dapat notifikasi push saat pendaftarannya disetujui/ditolak. Akun yang dibuat admin langsung (`POST /api/admin/karyawan`) tetap otomatis `AKTIF`.
**User yang memakai:** Karyawan baru (daftar), Admin/Owner (approve/tolak + tetapkan lokasi)

#### Feature 18 — Ringkasan Aktivitas untuk Agent Eksternal (OpenClaw) ✅
**Deskripsi:** Endpoint khusus **`GET /api/admin/ringkasan-agent`** (bukan untuk browser/login manusia) mengembalikan JSON ringkasan: izin & tukar libur menunggu approval, pendaftaran karyawan baru menunggu approval, dan kontrak yang akan habis dalam 30 hari (masing-masing dengan nama karyawan). Autentikasi via token statis di header `Authorization: Bearer <AGENT_REPORT_TOKEN>` (env var, bukan sesi JWT) — token hanya bisa membaca ringkasan ini, tidak bisa login atau mengubah data apa pun. Dipakai oleh **cron job OpenClaw** milik user (`portal-karyawan-ringkasan`, jadwal 08:00 WIB harian) yang memanggil endpoint ini, merangkum hasilnya, dan mengirim ke Telegram pribadi user. Setup OpenClaw (Gateway, cron, channel Telegram) ada di luar repo ini, di mesin user sendiri — bukan bagian dari deployment Vercel.
**User yang memakai:** Owner/Admin (lewat notifikasi Telegram dari agent pribadinya, bukan dari portal langsung)

#### Feature 17 — Ranking Persentase Kehadiran per Lokasi di Dashboard ✅
**Deskripsi:** Dashboard admin/owner menampilkan dua tabel **"Tingkat Kehadiran"** terpisah per lokasi (Tegal Alur & Menceng), berisi semua karyawan aktif dengan lokasi terisi, diurutkan **dari persentase kehadiran terendah ke tertinggi**. Memakai formula & periode yang sama dengan Feature 14 (periode berjalan 26–25, izin DITOLAK tidak mengurangi), dipusatkan di `lib/kehadiran.ts` (`hitungPersenKehadiran`, `warnaKehadiran`) supaya beranda karyawan & dashboard admin memakai satu sumber logika yang sama. Query di `app/api/admin/dashboard/route.ts` menghindari N+1 dengan satu `findMany` izin dikelompokkan per user di JS.
**User yang memakai:** Admin, Owner

---

### 3.2 Nice-to-Have Features
*Fitur yang belum wajib di MVP, bisa masuk fase berikutnya:*

- Grafik/chart di dashboard (tren izin per bulan)
- Export data karyawan & izin (Excel/CSV)
- Notifikasi otomatis (WhatsApp/email) saat kontrak mendekati habis atau ada pengajuan izin baru
- Aplikasi Android (memakai REST API yang sudah ada; perlu tambah dukungan token `Authorization: Bearer`)
- Riwayat perpanjangan kontrak (saat ini edit masa kontrak menimpa data lama)



---

## 4. Data Model

### 4.1 Entity: Users
*Menyimpan data pengguna sistem.*

| Field | Keterangan |
|---|---|
| name | dipakai untuk login (unik) |
| password | di-hash (bcrypt) |
| role | dropdown: `admin` dan `karyawan` (pilihan `admin` hanya muncul untuk owner) |
| statusAkun | `MENUNGGU` / `AKTIF` / `DITOLAK`, default `AKTIF`. Pendaftaran mandiri mulai `MENUNGGU` sampai admin approve (Feature 16); `DITOLAK` memblokir login |
| lokasi | dropdown: `Tegal Alur` dan `Menceng` (wajib untuk karyawan) |
| tanggal_masuk | waktu mulai bekerja di toko (dari spreadsheet "Waktu Masuk") |
| phone | opsional |
| email | opsional, tidak dipakai login |
| created_at | |
| updated_at | |

**Roles:** `super_admin` (owner — bisa membuat akun admin), `admin`, `user` (karyawan)

---

### 4.2 Entity: ProfilKaryawan
*Data pribadi yang diisi karyawan saat onboarding (relasi 1-1 ke Users).*

| Field | Keterangan |
|---|---|
| nik | No. KTP |
| tempat_lahir, tanggal_lahir | diisi saat pendaftaran |
| jenis_kelamin | |
| agama | diisi saat pendaftaran (dropdown 6 agama) |
| alamat | alamat tinggal, diisi saat pendaftaran |
| nama_ayah_ibu | diisi saat pendaftaran |
| telepon | no. telp rumah & HP, diisi saat pendaftaran |
| status_nikah | diisi saat pendaftaran |
| merokok | `Merokok` / `Tidak Merokok`, diisi saat pendaftaran |
| kontak_darurat | nama & nomor |
| npwp, bpjs | opsional |
| rekening_bank | bank & nomor |
| pendidikan | pendidikan terakhir |

---

### 4.3 Entity: Kontrak
*Kontrak kerja per karyawan (relasi 1-1 ke Users).*

| Field | Keterangan |
|---|---|
| mulai_kontrak, akhir_kontrak | masa berlaku; dashboard memberi peringatan jika habis **< 30 hari** |
| isi_kontrak | teks kontrak + peraturan & tata tertib toko |
| tanda_tangan | gambar tanda tangan digital karyawan |
| setuju_tata_tertib | persetujuan peraturan toko |
| ditandatangani_pada | tanggal TTD; setelah terisi kontrak terkunci |

---

### 4.4 Entity: Izin
*Pengajuan izin tidak masuk kerja.*

| Field | Keterangan |
|---|---|
| jenis | `SAKIT` / `LAINNYA` |
| tanggal_mulai, tanggal_akhir | |
| alasan | |
| surat_dokter | file upload (PDF/JPG/PNG maks 5 MB); sakit > 1 hari wajib ada. Hanya bisa dibuka pemilik izin dan admin/owner |
| status | `MENUNGGU` / `DISETUJUI` / `DITOLAK` (di-approve admin/owner) |

---

## 5. Phases

| Phase | Goal | Scope | Deliverables | Status |
|---|---|---|---|---|
| **1 — MVP Foundation** | Membangun versi dasar yang sudah bisa dipakai | Setup project, setup database, authentication, role access, CRUD data utama, layout dashboard dasar | User bisa login; admin bisa input data; data tersimpan; dashboard dasar bisa dibuka | ✅ Selesai |
| **2 — Core Workflow** | Membuat alur kerja utama berjalan end-to-end | Onboarding → TTD kontrak → pengajuan izin (+upload surat dokter) → approval; edit karyawan | Workflow utama berjalan dari awal sampai akhir; admin bisa update status | ✅ Selesai |
| **3 — Dashboard & Reporting** | Memberikan insight untuk owner/admin | Summary data, kartu dashboard klik-ke-rincian, filter periode, grafik sederhana, export data | Owner bisa lihat performa & rekap izin/kontrak | 🔶 Sebagian (tersisa: grafik & export) |
| **4 — Automation & Integration** | Mengurangi pekerjaan manual | WhatsApp/email notification (kontrak habis, izin baru), auto-generate report, aplikasi Android | Sistem bisa kirim update otomatis | ⬜ Belum |
| **5 — Optimization** | Merapikan sistem untuk jangka panjang | Performance, security, UI/UX, bug fixing, backup, dokumentasi, set `JWT_SECRET` | Sistem stabil; UX rapi; siap scaling | 🔶 Sebagian (DB Postgres ✅, JWT_SECRET ✅, deploy Vercel ✅, ganti password mandiri ✅, approval pendaftaran ✅; backup rutin & password default karyawan impor (`123`) yang belum diganti masih belum) |

---

## Notes Tambahan untuk AI Developer

Sebelum mulai coding, bantu saya:

1. Review PRD ini
2. Cari bagian yang masih kurang jelas
3. Buat daftar pertanyaan klarifikasi
4. Setelah jelas, pecah project menjadi task kecil
5. Kerjakan dari **Phase 1** terlebih dahulu
6. Jangan loncat ke fitur advanced sebelum MVP selesai
