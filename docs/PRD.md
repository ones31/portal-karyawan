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
**Deskripsi:** Izin sakit atau izin lain-lain dengan rentang tanggal + alasan. **Izin sakit ada 2 tipe: tanpa surat dokter dan dengan surat dokter (upload PDF/JPG/PNG maks 5 MB), keduanya opsional** — validasi wajib surat dokter untuk sakit multi-hari **sudah dihapus** (per permintaan user, 28 Jul 2026). Riwayat izin tampil dengan status (Menunggu/Disetujui/Ditolak).
**User yang memakai:** Karyawan

#### Feature 5 — Approval Izin ✅
**Deskripsi:** Admin/owner menyetujui atau menolak pengajuan izin dari dashboard, termasuk membuka file surat dokter yang diupload.
**User yang memakai:** Admin, Owner

#### Feature 6 — Dashboard Owner/Admin ✅
**Deskripsi:** Kartu ringkasan: total karyawan, izin sakit, izin lain-lain (dengan filter periode bulan ini/tahun ini/semua), izin menunggu, dan **kontrak habis < 30 hari**. Semua kartu bisa diklik menuju daftar rinciannya (daftar karyawan, rekap siapa saja yang izin + jumlahnya, daftar kontrak segera habis).
**User yang memakai:** Admin, Owner

#### Feature 7 — Manajemen Karyawan ✅
**Deskripsi:** Daftar karyawan (lokasi, telepon, tanggal lahir, status data pribadi, status TTD kontrak, masa kontrak + sisa hari, jumlah izin per periode). Tambah akun karyawan (lokasi wajib dipilih). **Edit karyawan**: nama, lokasi, telepon, email, reset password (bebas isi apa saja, atau tombol **"Reset ke Password Default"** yang langsung mengembalikan ke `123` tanpa perlu mengetik — dipakai kalau karyawan sudah ganti password sendiri lewat menu Ganti Password lalu lupa; `POST /api/admin/karyawan/[id]/reset-password`, konstanta `PASSWORD_DEFAULT_KARYAWAN` di `lib/auth.ts`, hanya berlaku untuk akun role KARYAWAN), ubah/perpanjang masa kontrak, plus riwayat izin & akses surat dokter per karyawan. **Hapus karyawan** (tombol di halaman edit, untuk karyawan resign): hanya akun role KARYAWAN yang bisa dihapus, disertai konfirmasi, ikut menghapus file surat dokter di disk & seluruh data terkait (cascade). Owner juga bisa membuat akun admin. **Nama karyawan di tabel adalah tautan** langsung ke halaman Edit Karyawan (bukan tombol Edit/Hapus terpisah di tabel) — dipilih karena tabel Daftar Karyawan punya banyak kolom dan tombol aksi di ujung kanan sulit dijangkau tanpa scroll horizontal.
**User yang memakai:** Admin, Owner

#### Feature 8 — Pendaftaran Mandiri Karyawan Baru ✅
**Deskripsi:** Tombol "Daftar Karyawan Baru" di halaman login membuka **Formulir Karyawan Baru Toko H. Marmo** (mengikuti formulir kertas): nama, tempat/tanggal lahir, agama, alamat tinggal, nama ayah & ibu, no. telp rumah & HP, status, merokok/tidak, plus lokasi kerja & password, dan checkbox pernyataan "data benar & bersedia memenuhi peraturan". Setelah daftar otomatis login lalu masuk **alur onboarding 3 langkah**: (1) Peraturan Toko H. Marmo, (2) Kontrak Masa Percobaan 1 Bulan, (3) Perjanjian Kerja PKWT (teks dokumen resmi toko di `lib/dokumen-toko.ts`, dirender dengan format rapi + bold kata penting). Di akhir langkah 3 karyawan **menggambar tanda tangan persetujuan** (peraturan + kontrak percobaan + PKWT) yang tersimpan di profil dan terlihat admin di halaman Edit Karyawan. Data formulir langsung mengisi profil; role selalu karyawan; kontrak ditetapkan admin kemudian lewat Edit Karyawan.
**User yang memakai:** Karyawan baru

#### Feature 9 — Import Karyawan Existing & Pemisahan per Lokasi ✅
**Deskripsi:** Karyawan existing diimpor dari spreadsheet "Waktu Masuk" toko (nama + tanggal masuk): **25 karyawan Menceng** dan **20 karyawan Tegal Alur** (script `prisma/import-karyawan.ts` dan `import-karyawan-2.ts`, password awal `123`; tanggal/bulan yang kosong di spreadsheet diisi tanggal 1). Kolom **Tanggal Masuk** tampil di daftar karyawan dan bisa diedit di Edit Karyawan. Halaman **Daftar Karyawan dipisah per lokasi** dengan tab: Tegal Alur / Menceng / Semua (dengan jumlah per tab).
**User yang memakai:** Admin, Owner

#### Feature 10 — Kontrak Otomatis & Perpanjangan 1 Tahun ✅
**Deskripsi:** Saat karyawan menandatangani persetujuan di onboarding, masa kontrak terisi otomatis: masa kerja **< 3 bulan** → kontrak percobaan 3 bulan terhitung dari tanggal masuk; **3 bulan–3 tahun** → Kontrak Kerja 1 Tahun terhitung dari akhir masa 3 bulan (periode bergulir per tahun sampai mencakup hari ini); **> 3 tahun** → **karyawan tetap**, masa kontrak dikosongkan (tidak terikat kontrak). Formula ini dipusatkan di `lib/kontrak-otomatis.ts` (`hitungMasaKontrakOtomatis`), dipakai onboarding maupun script backfill. Di halaman **Kontrak Segera Habis / Sudah Lewat** (`/admin/kontrak-habis`) ada tombol **"Perpanjang 1 Tahun"**: mengganti kontrak dengan Kontrak Kerja 1 Tahun (teks resmi toko, masa berlaku terisi otomatis dari tanggal habis kontrak lama), me-reset status tanda tangan, meminta karyawan menandatangani ulang di portalnya, dan **mengirim push notification** ke karyawan ybs. Daftar ini **sengaja tanpa batas bawah tanggal** — kontrak yang sudah lewat masa berlakunya (bukan cuma yang akan habis dalam 30 hari) tetap muncul di sini supaya tombol Perpanjang tidak pernah "hilang" (bug nyata yang diperbaiki 28 Jul 2026: query lama pakai `gte: hari ini` sehingga kontrak yang sudah lewat malah disembunyikan dari daftar). Karyawan yang sudah **Tetap** (masa kerja > `BATAS_TAHUN_TETAP`) dikecualikan supaya kontrak basi yang belum sempat dibersihkan tidak nyangkut selamanya di daftar ini. Kartu dashboard "Kontrak Perlu Diperpanjang" memakai filter yang sama persis. Login memakai nama **tidak case-sensitive**; beranda karyawan menampilkan tombol **WA Grup Toko Marmo**. Aturan status masa kerja di `lib/masa-kerja.ts`.

Field **Mulai Kontrak** dan **Akhir Kontrak** di halaman Edit Karyawan sudah bisa diedit manual oleh admin/owner sejak awal (`PATCH /api/admin/karyawan/[id]`) — tapi ini cuma mengubah tanggal di database, TIDAK memperbarui teks resmi kontrak (`isiKontrak`) maupun status tanda tangan. **Gunakan tombol "Perpanjang 1 Tahun" untuk perpanjangan sungguhan** (memperbarui teks kontrak & minta TTD ulang); field tanggal manual sebaiknya hanya untuk koreksi data, bukan pengganti alur perpanjangan resmi.

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

#### Feature 18 — Ringkasan & Approval Jarak Jauh via Agent Eksternal (OpenClaw) ✅
**Deskripsi:** Dua endpoint khusus agent (bukan untuk browser/login manusia), autentikasi via token statis di header `Authorization: Bearer <AGENT_REPORT_TOKEN>` (env var, bukan sesi JWT):
- **`GET /api/admin/ringkasan-agent`** — JSON ringkasan: izin & tukar libur menunggu approval (**termasuk `id` tiap pengajuan**), pendaftaran karyawan baru menunggu approval, dan kontrak yang akan habis dalam 30 hari (masing-masing dengan nama karyawan).
- **`POST /api/admin/agent-approval`** — setujui/tolak satu izin atau tukar libur. Body `{ tipe: "izin"|"tukar-libur", id, aksi: "setujui"|"tolak" }`. Hanya memproses pengajuan yang masih `MENUNGGU` (kalau sudah diputus → 400). Mengirim notifikasi hasil ke karyawan ybs, persis sama dengan approval lewat dashboard (logika dipusatkan di `lib/approval.ts` — `prosesIzin`/`prosesTukarLibur`, dipakai bersama rute admin ber-sesi `app/api/admin/izin|tukar-libur/[id]`).

Dipakai oleh **OpenClaw** milik user: cron `portal-karyawan-ringkasan` (08:00 WIB harian) mengirim ringkasan ke Telegram, dan user bisa **membalas via Telegram untuk memerintahkan approve/tolak** (agent mengambil id dari ringkasan lalu memanggil endpoint approval; agent dikonfigurasi untuk konfirmasi dulu sebelum eksekusi). Semua panggilan menembak URL **produksi Vercel**. Token ber-scope tunggal: bisa baca ringkasan + approve/tolak izin & tukar libur — TIDAK bisa login, buat/hapus karyawan, atau ubah data lain. Setup OpenClaw (Gateway, cron, channel Telegram, instruksi agent) ada di luar repo ini, di mesin user sendiri.
**User yang memakai:** Owner/Admin (lewat Telegram dari agent pribadinya)

#### Feature 19 — Admin Ber-Lokasi (Akses Terbatas per Toko) ✅
**Deskripsi:** Role `ADMIN` sekarang bisa dibatasi ke satu lokasi lewat field baru `User.lokasiAkses` ("Tegal Alur" | "Menceng"). Admin ber-`lokasiAkses` **hanya melihat & mengelola karyawan di lokasinya sendiri** — daftar karyawan, dashboard (statistik, izin terbaru, tabel Tingkat Kehadiran), rekap izin, kontrak segera habis, dan daftar tukar libur semuanya ter-filter otomatis (helper `filterLokasiSesi()` di `lib/auth.ts`, dipakai di setiap query admin). Mengakses/mengedit/menghapus/reset-password karyawan atau approve izin/tukar-libur/perpanjang-kontrak **di luar lokasinya** ditolak dengan 404 "tidak ditemukan" (helper `bolehAksesLokasi()`, tidak membocorkan bahwa datanya ada tapi di luar akses). Saat menambah karyawan atau menyetujui pendaftaran baru, admin ber-lokasiAkses **hanya bisa pilih lokasinya sendiri** (403 kalau coba lokasi lain); dropdown Lokasi di UI (Tambah Karyawan, Edit Karyawan, Pendaftaran) otomatis hanya menampilkan opsi itu.

**Owner (`SUPER_ADMIN`) tidak dibatasi** — tetap melihat & mengelola kedua lokasi seperti sebelumnya. **Pendaftaran Menunggu tidak di-scope** (lokasi belum ditentukan saat itu) — semua tingkat admin bisa melihat & memproses, tapi hanya boleh assign ke lokasi sendiri (owner bebas pilih).

Saat owner membuat akun admin baru (form Tambah Karyawan, role "Admin"), field **Lokasi Akses** wajib diisi. Akun yang sudah ada: **`admin`** di-set ke Menceng, akun baru **`admin2`** (password awal `admin2123`, wajib diganti) dibuat untuk Tegal Alur.
**User yang memakai:** Owner (kelola akses admin), Admin (kerja ter-scope ke lokasinya)

#### Feature 20 — Admin/Owner Bisa Memasukkan Izin Atas Nama Karyawan ✅
**Deskripsi:** Solusi untuk **karyawan yang terkendala membuka portal sendiri** (HP rusak, tidak ada sinyal, dll.) — ada 2 jalur, dua-duanya posting ke endpoint yang sama `POST /api/admin/karyawan/[id]/izin`:
- Halaman **`/admin/ajukan-izin`** (menu navbar "Ajukan Izin") — dropdown **pilih nama karyawan** (dari daftar karyawan yang sudah ter-scope lokasi admin), lalu form izin yang sama seperti form karyawan (Jenis Pengajuan Sakit/Lain-lain/Menikah/Tugas Negara, upload surat dokter, dst). Cara tercepat kalau belum tahu mau buka profil karyawan yang mana.
- Tombol **"+ Ajukan Izin untuk Karyawan Ini"** di halaman **Edit Karyawan** (kartu "Riwayat Izin & Surat Dokter") — kalau admin sudah berada di profil karyawan tsb.

Validasi identik dengan pengajuan mandiri (batas 7 hari izin menikah, dst. — surat dokter opsional, lihat Feature 4 — logika dipusatkan di `lib/pengajuan-izin.ts`, `buatIzin()`, dipakai bersama `app/api/izin`). Pengajuan yang dimasukkan admin **tetap berstatus MENUNGGU** seperti biasa (tidak otomatis disetujui). Ikut tunduk pada Feature 19: admin ber-lokasiAkses hanya bisa memasukkan izin untuk karyawan di lokasinya sendiri (dropdown & endpoint sama-sama ter-scope, 404 kalau lintas lokasi); owner bebas untuk semua karyawan.

*(Tukar Libur belum termasuk fitur ini — bisa ditambahkan dengan pola yang sama kalau dibutuhkan.)*
**User yang memakai:** Admin, Owner

#### Feature 21 — Catatan/Pesan Khusus dari Admin/Owner ke Karyawan ✅
**Deskripsi:** Admin/owner bisa mengirim **catatan atau pengumuman** ke karyawan lewat menu navbar **"Catatan"** (`/admin/catatan`). Dropdown "Kirim ke" punya tiga bentuk tujuan: **satu karyawan**, **semua karyawan**, atau **semua karyawan di satu lokasi** (`SEMUA` / `LOKASI:<nama>` / id karyawan — konstanta di `lib/catatan.ts`, logika server di `lib/kirim-catatan.ts`).

Di sisi karyawan, catatan yang belum dibaca tampil sebagai **banner kuning di paling atas beranda** (`/karyawan`) lengkap dengan isi & tombol **"Tandai sudah dibaca"**; seluruh riwayat (dibaca & belum) ada di menu **"Catatan"** (`/karyawan/catatan`). Setiap pengiriman juga memicu **push notification** ke tiap penerima (`kirimNotifKeUser`, gagal kirim tidak menggagalkan penyimpanan).

Kiriman massal disimpan **satu baris per karyawan** dengan `batchId` yang sama, sehingga: status dibaca terlacak **per orang** (admin melihat "12/45 sudah membaca" + tabel rinci siapa yang sudah/belum), dan satu kiriman bisa **ditarik kembali sekaligus** (`DELETE /api/admin/catatan/[batchId]`) kalau salah kirim. Tunduk pada Feature 19: admin ber-lokasiAkses hanya bisa mengirim/menarik catatan untuk karyawan di lokasinya (403/404 kalau lintas lokasi); owner bebas.
**User yang memakai:** Admin, Owner, Karyawan

#### Feature 22 — Export Rekap Izin ke Excel (.xlsx) ✅
**Deskripsi:** Halaman **Rekap Izin** (`/admin/rekap-izin`) kini punya panel **"Export ke Excel"** dengan input **Dari Tanggal** & **Sampai Tanggal** yang **wajib diisi** — endpoint `GET /api/admin/rekap-izin/export` menolak 400 kalau kosong atau kalau `sampai < dari`. Rentang tanggalnya **ikut tercetak di dalam file** (baris "Periode: 1 Juli 2026 s/d 31 Juli 2026") **dan di nama filenya** (`Rekap-Izin-Sakit_2026-07-01_sd_2026-07-31.xlsx`), supaya file yang sudah diunduh tidak pernah ambigu periodenya.

File berisi 2 sheet (dibuat di `lib/export-izin.ts` dengan `exceljs`): **"Rekap Izin"** (No, Nama, Lokasi, Jenis, Tanggal Mulai/Akhir, Jumlah Hari, Alasan, Status, Surat Dokter, Diajukan Pada — header dibekukan & diberi warna) dan **"Per Karyawan"** (jumlah izin + total hari per orang, terbanyak dulu).

Sekalian di feature ini, **filter jenis di halaman rekap diperluas** dari hanya Sakit/Lain-lain menjadi **Semua Jenis + keempat jenis izin**, sehingga halaman ini menjadi tempat melihat *seluruh* kumpulan pengajuan izin (tabel "Pengajuan Izin Terbaru" di dashboard menautkan ke sini lewat "Lihat semua & export Excel →"). Export mengikuti filter jenis yang aktif dan tetap ter-scope lokasi admin (Feature 19).
**User yang memakai:** Admin, Owner

#### Feature 23 — Tidak Ada Karyawan Tetap Otomatis untuk Angkatan 2026 ke Atas ✅
**Deskripsi:** **Perubahan aturan bisnis.** Karyawan yang **mulai kerja tahun 2026 ke atas** tidak pernah otomatis menjadi karyawan tetap walau masa kerjanya melewati 3 tahun — **kontraknya diperpanjang terus**: **3 bulan pertama** (masa percobaan terhitung dari tanggal masuk), lalu **1 tahun berulang** tanpa batas.

Status tetap untuk mereka hanya bisa **ditetapkan manual oleh owner** lewat centang **"Karyawan Tetap (ditetapkan owner)"** di halaman Edit Karyawan (field baru `User.tetapManual`). Admin biasa melihat centang itu dalam keadaan nonaktif; kalau tetap mencoba mengubahnya lewat API, ditolak **403** ("Hanya owner yang dapat mengubah status karyawan tetap").

**Karyawan lama (masuk sebelum 2026) tidak terpengaruh** — aturan lama tetap berlaku: masa kerja > `BATAS_TAHUN_TETAP` (3) tahun = otomatis tetap. Konstanta & logikanya dipusatkan di `lib/masa-kerja.ts` (`TAHUN_TANPA_TETAP_OTOMATIS` = 2026, `statusMasaKerja(tanggalMasuk, tetapManual)`, `filterMasihKontrak()` untuk query Prisma). Karyawan tetap otomatis hilang dari daftar & hitungan **Kontrak Segera Habis**.

Catatan: menetapkan seseorang jadi tetap **tidak menghapus kontraknya yang sudah ada** — kontrak bertanda tangan adalah bukti hukum (AGENTS.md #8). Kontraknya hanya berhenti ditagih perpanjangan.
**User yang memakai:** Owner (menetapkan), Admin (melihat), Karyawan (status di beranda)

#### Feature 24 — Tanggal Izin di Sheet "Per Karyawan" File Export ✅
**Deskripsi:** Sheet **"Per Karyawan"** pada file export `.xlsx` (Feature 22) ditambah kolom **"Tanggal Izin"** berisi daftar tanggal seluruh izin karyawan tsb, diurutkan kronologis: `"10 Jul 2026, 15 Jul 2026, 17 Jul 2026"`. Izin yang lebih dari sehari ditulis sebagai rentang: `"30 Jul 2026 – 31 Jul 2026"`. Jadi rekap per karyawan tidak lagi hanya menampilkan jumlah, tapi juga kapan saja izinnya.
**User yang memakai:** Admin, Owner

#### Feature 25 — Halaman Laporan Izin (Menu Baru) ✅
**Deskripsi:** Menu navbar baru **"Laporan Izin"** (`/admin/laporan-izin`), diletakkan **tepat setelah "Daftar Karyawan"**. Menampilkan **data yang sama persis dengan isi file export Excel**, tapi langsung di layar.

- **Default menampilkan periode gajian berjalan: tanggal 26 bulan ini sampai 25 bulan berikutnya** (`periodeSiklus()` di `lib/periode.ts`)
- Tombol **← Periode Sebelumnya / Periode Berikutnya →** untuk menggeser siklus, plus **"Kembali ke periode berjalan"**
- Input **Dari/Sampai Tanggal** kalau butuh rentang bebas di luar siklus
- Dua tampilan: **Rincian** (setara sheet "Rekap Izin": nama, lokasi, jenis, tanggal, jumlah hari, alasan, status, surat dokter) dan **Per Karyawan** (setara sheet "Per Karyawan" termasuk kolom Tanggal Izin dari Feature 24)
- Filter jenis izin (Semua Jenis + keempat jenis) dan tombol **Download Excel** yang mengikuti periode & filter yang sedang tampil
- Ringkasan total: `"4 karyawan · 5 pengajuan · 6 hari total"`

Datanya diambil dari `GET /api/admin/rekap-izin` yang sudah ada (ter-scope lokasi sesuai Feature 19), jadi tidak ada endpoint baru.
**User yang memakai:** Admin, Owner

#### Feature 26 — Jenis Izin Baru: Izin Setengah Hari ✅
**Deskripsi:** Jenis izin ke-5, muncul di dropdown "Jenis Pengajuan" **tepat di bawah Izin Lain-lain** (SAKIT → LAINNYA → **SETENGAH_HARI** → MENIKAH → TUGAS_NEGARA — urutan ini di `lib/izin.ts`, dipakai konsisten di semua dropdown).

**Hanya 1 tanggal** (tidak bisa rentang lebih dari sehari) — pola yang sama dengan Tugas Negara. Konstanta baru `JENIS_SATU_TANGGAL` di `lib/izin.ts` mendaftar kedua jenis ini; UI menampilkan satu input "Tanggal" (bukan Dari/Sampai), dan `lib/pengajuan-izin.ts` (`buatIzin()`) menolak **400** kalau tetap dikirim sebagai rentang (`tanggalMulai !== tanggalAkhir`) — pertahanan sisi server, bukan cuma UI. Alasan tetap **wajib diisi** (beda dari Tugas Negara yang opsional).

Otomatis ikut di semua tempat yang sudah generik lewat `JENIS_IZIN`/`LABEL_JENIS_IZIN`: dropdown Ajukan Izin (karyawan & admin), filter jenis di halaman **Laporan Izin** (Feature 25), dan **export Excel** (Feature 22/24) — tidak ada endpoint atau logika baru yang perlu ditambah di tempat-tempat itu.

**Izin Setengah Hari TIDAK dihitung sama sekali dalam persentase kehadiran** (keputusan user, bukan dihitung 0,5 hari) — kedua query yang memberi data ke `hitungPersenKehadiran()` (beranda karyawan di `app/karyawan/page.tsx` dan dashboard admin di `app/api/admin/dashboard/route.ts`) menyaring `jenis: { notIn: JENIS_TIDAK_HITUNG_KEHADIRAN }` di `where` Prisma-nya. Konstanta itu ada di `lib/izin.ts` — kalau nanti ada jenis izin lain yang perlu dikecualikan juga, cukup tambah ke daftar itu, jangan tulis ulang filternya di tempat lain. Diverifikasi: karyawan uji dengan Izin Setengah Hari disetujui tetap 100% kehadiran; ditambah Izin Sakit 3 hari (kontrol) turun ke 90% seperti biasa, konsisten di beranda karyawan maupun dashboard admin.
**User yang memakai:** Karyawan, Admin, Owner

#### Feature 17 — Ranking Persentase Kehadiran per Lokasi di Dashboard ✅
**Deskripsi:** Dashboard admin/owner menampilkan dua tabel **"Tingkat Kehadiran"** terpisah per lokasi (Tegal Alur & Menceng), berisi semua karyawan aktif dengan lokasi terisi, diurutkan **dari persentase kehadiran terendah ke tertinggi**. Memakai formula & periode yang sama dengan Feature 14 (periode berjalan 26–25, izin DITOLAK tidak mengurangi), dipusatkan di `lib/kehadiran.ts` (`hitungPersenKehadiran`, `warnaKehadiran`) supaya beranda karyawan & dashboard admin memakai satu sumber logika yang sama. Query di `app/api/admin/dashboard/route.ts` menghindari N+1 dengan satu `findMany` izin dikelompokkan per user di JS.
**User yang memakai:** Admin, Owner

---

### 3.2 Nice-to-Have Features
*Fitur yang belum wajib di MVP, bisa masuk fase berikutnya:*

- Grafik/chart di dashboard (tren izin per bulan)
- Export data **karyawan** ke Excel/CSV (export **izin** sudah jadi — lihat Feature 22)
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
| lokasiAkses | untuk role `ADMIN`: lokasi yang boleh dilihat/dikelola (Feature 19). Wajib diisi saat owner membuat akun admin. `null`/`SUPER_ADMIN` = tanpa batasan |
| tanggal_masuk | waktu mulai bekerja di toko (dari spreadsheet "Waktu Masuk"). Menentukan aturan kontrak: masuk **2026 ke atas** = tidak ada tetap otomatis (Feature 23) |
| tetapManual | `true` = karyawan tetap yang **ditetapkan owner** (Feature 23). Default `false`. Hanya `SUPER_ADMIN` yang boleh mengubah |
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
| jenis | `SAKIT` / `LAINNYA` / `SETENGAH_HARI` / `MENIKAH` / `TUGAS_NEGARA` — `SETENGAH_HARI` & `TUGAS_NEGARA` hanya 1 tanggal (`tanggalMulai == tanggalAkhir`, lihat `JENIS_SATU_TANGGAL`) |
| tanggal_mulai, tanggal_akhir | |
| alasan | |
| surat_dokter | file upload (PDF/JPG/PNG maks 5 MB), **opsional** (tidak ada validasi wajib berdasar jumlah hari). Hanya bisa dibuka pemilik izin dan admin/owner |
| status | `MENUNGGU` / `DISETUJUI` / `DITOLAK` (di-approve admin/owner) |

---

### 4.5 Entity: Catatan
*Pesan/pengumuman dari admin/owner ke karyawan (Feature 21).*

| Field | Keterangan |
|---|---|
| userId | karyawan penerima. Kiriman massal = **satu baris per penerima**, bukan satu baris broadcast |
| batchId | sama untuk semua penerima dari satu kali kirim — dipakai mengelompokkan di daftar admin & menarik kembali satu kiriman sekaligus |
| judul | maks 100 karakter |
| isi | maks 2000 karakter, line break dipertahankan saat ditampilkan |
| pengirimId | admin/owner pembuat; `null` kalau akunnya dihapus (`onDelete: SetNull`) |
| dibacaPada | `null` = belum dibaca (tampil sebagai banner di beranda karyawan); diisi saat karyawan menekan "Tandai sudah dibaca" |

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
