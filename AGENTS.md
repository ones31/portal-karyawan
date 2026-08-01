<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Manual Operasi — Portal Toko Marmo

Aplikasi internal karyawan Toko H. Marmo: pendaftaran & onboarding karyawan, tanda tangan kontrak digital, pengajuan izin/tukar libur + approval, dashboard owner/admin, PWA + push notification. **Seluruh UI, pesan error, identifier, komentar, dan jawaban ke user berbahasa Indonesia.** Arsitektur API-first (`app/api/*` mengembalikan JSON) karena akan ada aplikasi Android.

Sumber kebutuhan: **`docs/PRD.md` adalah kebenaran tunggal.** Baca sebelum mengubah perilaku; update setelah setiap fitur.

---

## 1. Stack & versi (JANGAN di-upgrade tanpa diminta)

| Komponen | Versi | Catatan keras |
|---|---|---|
| Next.js | **16** (App Router, Turbopack) | BERBEDA dari data latihanmu. `params` adalah **Promise** (`const { id } = await params`), `cookies()` **async**, middleware bernama `proxy.ts`. |
| Prisma | **6** (JANGAN 7) | Prisma 7 mengubah total konfigurasi (url tidak boleh di schema). |
| DB | **PostgreSQL (Neon)**, sejak 14 Jul 2026 — sebelumnya SQLite | `DATABASE_URL` di `.env`. Enum disimpan sebagai native enum type. Identifier di raw SQL WAJIB dikutip (`"User"`, bukan `User`) — Postgres men-lowercase identifier tak dikutip, beda dari SQLite. Mendukung `mode: "insensitive"` native (dipakai di `lib/cari-user.ts`). Migrasi SQLite lama diarsipkan di `prisma/backup/migrations-sqlite-lama/` (jangan dipakai lagi). |
| Auth | JWT (jose) di cookie httpOnly `token`, sesi 8 jam | Bukan NextAuth. Helper di `lib/auth.ts`. |
| CSS | Tailwind v4 (`@import "tailwindcss"`) | Tanpa file konfigurasi tailwind. |
| Push | `web-push` (VAPID di `.env`) | Kunci JANGAN masuk git. |

Server dev: `npm run dev` di port **3000** (user sering membukanya di browser sendiri).

## 2. Peta wajib hafal

**Konstanta bisnis — SATU tempat, jangan tulis ulang inline:**
- `lib/auth.ts` — `sesiSaatIni()`, `adalahAdmin(role)`, `buatToken()`
- `lib/cari-user.ts` — `cariUserByNama()` (case-insensitive, raw SQL `lower()`), `tambahBulan()`
- `lib/izin.ts` — konstanta MURNI, client-safe: `JENIS_IZIN`, `LABEL_JENIS_IZIN`, `MAKS_HARI_MENIKAH` (7), `jumlahHari()`. JANGAN tambah logika server (prisma/fs) di sini — dipakai komponen client.
- `lib/pengajuan-izin.ts` — server-only: `buatIzin()` (validasi + simpan + notif), dipakai `app/api/izin` (karyawan) & `app/api/admin/karyawan/[id]/izin` (admin masukkan izin atas nama karyawan)
- `lib/approval.ts` — `prosesIzin()`, `prosesTukarLibur()` (update status + notif hasil), dipakai rute admin & `app/api/admin/agent-approval`
- `lib/catatan.ts` — konstanta MURNI, client-safe: `MAKS_JUDUL_CATATAN` (100), `MAKS_ISI_CATATAN` (2000), `TUJUAN_SEMUA`, `lokasiDariTujuan()`. JANGAN tambah logika server di sini.
- `lib/kirim-catatan.ts` — server-only: `kirimCatatan()` (validasi + scope lokasi + simpan per penerima + notif), dipakai `app/api/admin/catatan`
- `lib/export-izin.ts` — server-only: `buatExcelRekapIzin()`, `namaFileExport()` (pakai `exceljs`), dipakai `app/api/admin/rekap-izin/export`
- `lib/kontrak.ts` — `ISI_KONTRAK_DEFAULT`, `BATAS_HARI_KONTRAK_HABIS` (30)
- `lib/masa-kerja.ts` — `statusMasaKerja()`, `BATAS_TAHUN_TETAP` (3)
- `lib/lokasi.ts` — `DAFTAR_LOKASI` = ["Tegal Alur", "Menceng"], `lokasiValid()`
- `lib/periode.ts` — `rentangPeriode(periode, dari?, sampai?)` — bulan/tahun/custom/semua
- `lib/dokumen-toko.ts` — teks resmi: peraturan toko, kontrak percobaan, `kontrakSatuTahun(mulai, akhir)`, PKWT (format markdown-mini, dirender `components/DokumenMarkdown`)
- `lib/surat-dokter.ts` — file upload di `uploads/` (DI LUAR `public/`), disajikan via API ber-auth
- `lib/push.ts` — `kirimNotifKeUser()`, `kirimNotifKeAdmin()`

**Aturan bisnis yang berlaku (jangan "diperbaiki" diam-diam):**
- Login pakai **nama** (bukan email), **tidak case-sensitive**. Nama unik.
- Role: `SUPER_ADMIN` (owner; bisa buat akun admin), `ADMIN`, `KARYAWAN`. Cek admin selalu via `adalahAdmin()` — jangan `role === "ADMIN"`.
- Kontrak otomatis saat TTD onboarding: masa kerja **< 3 bulan** → percobaan 3 bulan dari `tanggalMasuk`; **3 bln–3 thn** → kontrak 1 tahun bergulir dari akhir masa 3 bulan; **> 3 tahun** → karyawan TETAP, kontrak dikosongkan.
- Izin: `SAKIT` (2 tipe: tanpa/dengan surat dokter, PDF/JPG/PNG ≤ 5 MB — **opsional, tidak ada lagi validasi wajib berdasar jumlah hari**, dihapus per permintaan user), `LAINNYA`, `TUGAS_NEGARA` (1 tanggal, alasan opsional), `MENIKAH` (maks 7 hari). Tukar libur = model terpisah `TukarLibur`, di UI karyawan menyatu di dropdown "Jenis Pengajuan". Catatan: teks resmi peraturan toko (`lib/kontrak.ts`, `ISI_KONTRAK_DEFAULT`) MASIH menyebut aturan lama ("izin sakit >1 hari wajib surat dokter") — belum diubah karena itu dokumen resmi (lihat aturan #12), perlu keputusan user terpisah kalau mau disinkronkan.
- Surat dokter = dokumen medis: hanya pemilik izin & admin/owner yang boleh membuka (`/api/izin/surat/[nama]`).
- Notifikasi push: pengajuan baru → admin+owner; hasil approval → karyawan ybs. Pemanggilan notif SELALU `await ...catch(() => {})` — tidak boleh menggagalkan mutasi utamanya.
- Password karyawan impor = `123` (memang lemah; keputusan user untuk jaringan internal — JANGAN diubah tanpa diminta).
- Admin ber-lokasi (Feature 19): `ADMIN` bisa dibatasi ke satu lokasi via `User.lokasiAkses`. Query karyawan/izin/tukar-libur/kontrak untuk admin WAJIB lewat `filterLokasiSesi(sesi)` (list) atau `bolehAksesLokasi(sesi, lokasi)` (satu record) dari `lib/auth.ts` — jangan query langsung tanpa itu. `SUPER_ADMIN` (owner) tidak dibatasi.

**Akun untuk pengujian (hafalkan):**

| Role | Nama login | Password |
|---|---|---|
| Owner | seno / dian | seno123 / dian123 |
| Admin (lokasiAkses: Menceng) | admin | admin123 |
| Admin (lokasiAkses: Tegal Alur) | admin2 | admin2123 |
| Karyawan impor (±49 orang) | Akmal, Andrew, Haryanto, Sunarto, dll. | 123 |

⚠️ Akun contoh lama **Budi Santoso / Siti / Ani / Rudi sudah TIDAK ada** di database (dicek 1 Agu 2026 — login balas 401). Jangan pakai untuk pengujian; kalau butuh karyawan uji, buat sendiri berawalan `Uji ` lalu hapus (kesalahan #6).

## 3. Kesalahan yang PASTI dilakukan model lemah di sini — dan aturan penangkalnya

1. **Menulis Next.js dari ingatan.** Gejala: `params.id` tanpa await, `cookies()` sinkron, `middleware.ts`. → *Aturan: kalau ragu pada konvensi apa pun, `grep` file serupa yang sudah ada di repo dan tiru polanya; repo ini selalu benar, ingatanmu belum tentu.*
2. **Meng-export fungsi helper dari `route.ts`.** Next 16 menolak export selain HTTP handler → build gagal. → *Aturan: helper selalu ke `lib/`; `route.ts` hanya export GET/POST/PATCH/DELETE.*
3. **Menguji perubahan schema pada server yang masih jalan.** Prisma client lama di memori → `PrismaClientValidationError` 500 yang membingungkan. → *Aturan: setelah `prisma migrate dev` / `prisma generate`, WAJIB `pkill -f "next dev"` lalu nyalakan ulang sebelum menguji. Perubahan kode biasa (tanpa schema) cukup HMR — jangan restart.*
4. **`findUnique({ where: { nama } })` untuk login/cek duplikat.** Lolos type-check, tapi menghancurkan aturan case-insensitive. → *Aturan: pencarian user by nama SELALU `cariUserByNama()` dari `lib/cari-user.ts`.*
5. **Mengisi form React dengan `el.value = x` saat menguji.** React tidak melihatnya; data terkirim kosong. → *Aturan: pakai native setter + `dispatchEvent(new Event("input"|"change", { bubbles: true }))`, lalu `form.requestSubmit()` dengan `setTimeout` kecil.*
6. **Meninggalkan data uji di database.** Owner melihat "Uji Tetap" di daftar karyawan sungguhan. → *Aturan: record uji dinamai berawalan `Uji ` dan DIHAPUS via `npx tsx -e` segera setelah verifikasi. Data contoh yang disengaja (Budi, Siti, Ani, Rudi) dibiarkan.*
7. **Mengerjakan satu sisi fitur saja.** Contoh nyata: menambah jenis izin di form karyawan tapi lupa label di dashboard admin & rekap. → *Aturan: setiap perubahan jalankan checklist skill `tambah-fitur-portal` (schema → lib → API → UI karyawan → UI admin → PRD).*
8. **Menimpa/menghapus kontrak & tanda tangan yang sudah ada.** TTD adalah bukti hukum. → *Aturan: kontrak yang `ditandatanganiPada != null` tidak boleh diubah isinya kecuali alur yang memang dirancang (perpanjangan me-reset TTD secara eksplisit). Operasi destruktif pada data sungguhan = tanya dulu.*
9. **"Memperbaiki" hal yang tidak diminta** (mengetatkan password, menutup pendaftaran terbuka, upgrade dependensi/provider tanpa diminta). → *Aturan: kerjakan persis yang diminta; usulan perbaikan ditulis sebagai catatan opsional di ringkasan akhir, bukan dieksekusi.*
10. **Menganggap port 3000 kosong / membunuh proses tanpa cek.** User sering menjalankan `npm run dev` sendiri. → *Aturan: cek `lsof -nP -iTCP:3000 -sTCP:LISTEN` dulu. Kalau harus restart (karena schema), boleh `pkill -f "next dev"` lalu nyalakan lagi — dan KATAKAN itu di ringkasan.*
11. **Menjawab atau menulis UI dalam bahasa Inggris.** → *Aturan: Indonesia untuk semuanya — nama variabel baru (ikuti gaya `kirimNotifKeAdmin`, `tanggalMulai`), pesan error API, dan ringkasan ke user.*
12. **Mengarang isi dokumen resmi toko.** Peraturan/kontrak/PKWT berasal dari Google Docs milik toko. → *Aturan: isi pasal tidak boleh dikarang; hanya format boleh dirapikan. Dokumen publik bisa diunduh: `curl -sL "https://docs.google.com/document/d/<ID>/export?format=txt"`.*
13. **Raw SQL (`$queryRaw`) dengan identifier tanpa kutip.** Kejadian nyata: `FROM User` (tanpa kutip) di SQLite jalan, tapi di PostgreSQL Postgres men-lowercase-kan jadi `user` dan error "column does not exist". → *Aturan: hindari raw SQL kalau bisa (pakai fitur Prisma native, mis. `mode: "insensitive"`); kalau terpaksa raw SQL, kutip identifier dengan `"NamaTabel"`.*
14. **Mengasumsikan `vercel deploy` menghormati `.gitignore`.** Kejadian nyata: `.env` (password DB + kunci privat) ikut ter-upload ke deployment karena tidak ada `.vercelignore` eksplisit — `.gitignore` TIDAK otomatis dipakai untuk `vercel deploy` CLI (beda dari git push). → *Aturan: proyek yang di-deploy ke Vercel WAJIB punya `.vercelignore` sendiri; setelah deploy pertama, selalu verifikasi lewat `GET /v6/deployments/{id}/files` bahwa tidak ada `.env`/secret yang ikut.*
15. **Commit git dengan email placeholder/asal.** Kejadian nyata: `git config user.email "seno@tokomarmo.local"` (dikarang, bukan email asli user) membuat Vercel memblokir deploy dengan `TEAM_ACCESS_REQUIRED` karena tidak bisa memverifikasi commit author = pemilik akun. → *Aturan: `git config user.email`/`user.name` proyek yang akan di-deploy harus pakai identitas ASLI user (email yang terverifikasi di platform deploy-nya), bukan nilai sembarang.*
16. **Menambah fungsi server (prisma/fs) ke file `lib/*.ts` yang isinya sudah dipakai komponen client.** Kejadian nyata: `buatIzin()` (pakai `fs/promises` lewat `lib/surat-dokter.ts`) ditambahkan ke `lib/izin.ts` yang juga diimpor `app/karyawan/izin/page.tsx` (client) → build error "Module not found: fs/promises". → *Aturan: sebelum menambah logika ke `lib/*.ts`, cek dulu `grep -rl "from \"@/lib/<nama>\"" app/` — kalau ada komponen `"use client"` yang mengimpornya, taruh logika server di file BARU terpisah (pola: `lib/izin.ts` konstanta murni vs `lib/pengajuan-izin.ts` server-only).*

17. **Menyalahkan kode saat gejalanya sebenarnya dev server rusak sesudah `npm install`.** Kejadian nyata: sesudah `npm install exceljs`, halaman client terlihat "state-nya tidak pernah terisi" (dropdown kosong, daftar mentok "Memuat...") padahal API balas 200. Penyebabnya Turbopack panic `Failed to write app endpoint ... Next.js package not found` (log menyebut `Next.js version: 0.0.0`) → Fast Refresh rebuild terus-menerus → React remount sebelum `fetch` selesai. → *Aturan: kalau state client tidak pernah settle TAPI endpointnya 200, JANGAN langsung bongkar komponen — cek `preview_logs` dulu untuk panic Turbopack & console untuk `[Fast Refresh] rebuilding` berulang. Perbaikannya di lingkungan, bukan kode: `pkill -f "next dev"; rm -rf .next; npm install` lalu nyalakan ulang server.*

## 4. Standar kualitas per jenis deliverable (kriteria bisa dicek, bukan kata sifat)

**Setiap perubahan kode, tanpa kecuali:**
- [ ] `npx tsc --noEmit` lolos
- [ ] Diverifikasi end-to-end (bukan "harusnya jalan"): API via `curl` dengan kode status ditulis di ringkasan, UI via screenshot browser
- [ ] Data uji dibersihkan
- [ ] `docs/PRD.md` diupdate (Feature baru atau revisi feature terkait)
- [ ] `docs/RINGKASAN-SESI.md` diupdate: naikkan **Versi** +1 di judul, tambah baris baru di tabel "Riwayat Versi"
- [ ] Ringkasan bahasa Indonesia menyebut: apa yang berubah, apa yang diuji + hasil nyatanya, dan instruksi user ("refresh browser")

**API route baru:**
- [ ] Baris pertama handler: cek sesi (`sesiSaatIni()`; tambah `adalahAdmin()` untuk rute `/api/admin/*`), balas 401/403 JSON
- [ ] Validasi input → 400 dengan pesan Indonesia yang spesifik ("Lokasi wajib dipilih (Tegal Alur atau Menceng)"), bukan generik
- [ ] Kasus negatif ikut diuji dengan curl (minimal satu 400/403 yang disengaja)

**Halaman/komponen UI:**
- [ ] Meniru idiom yang ada: kartu `rounded-xl bg-white p-6 shadow-sm`, tombol utama `bg-blue-600`, badge status pola `STATUS_STYLE` (amber=MENUNGGU, green=DISETUJUI, red=DITOLAK)
- [ ] Responsif dicek (viewport preview sering ±440px); tabel lebar dibungkus `overflow-x-auto`
- [ ] Tanggal ditampilkan `toLocaleDateString("id-ID", ...)`

**Perubahan database:**
- [ ] Kolom baru nullable atau ber-default (data existing 50+ karyawan tidak boleh rusak)
- [ ] Nama migrasi kebab-case Indonesia (`--name tukar-libur`)
- [ ] Setelah migrate: server di-restart sebelum verifikasi (kesalahan #3)

**Script impor data:**
- [ ] Aman dijalankan ulang (upsert / cek dulu, tidak menimpa data yang sudah terisi)
- [ ] Mencetak rekap hasil (`X dibuat, Y dilewati`) dan password default
- [ ] Tersimpan di `prisma/` sebagai `import-*.ts` agar terdokumentasi

## 5. Kapan BERHENTI dan bertanya ke user

Tanya dulu, jangan jalan:
- **Menghapus/menimpa data sungguhan** (karyawan, kontrak, tanda tangan, surat dokter) di luar data uji buatanmu sendiri
- **Aturan bisnis yang tidak terjawab PRD** — durasi, batas hari, siapa boleh apa. Jangan mengarang angka.
- **Perubahan perilaku keamanan** — kebijakan password, pendaftaran terbuka, akses file
- **Biaya/eksternal** — sewa layanan, kirim data ke pihak ketiga, deploy
- **Scope tambahan signifikan** di luar kalimat permintaan user

JANGAN berhenti untuk hal ini (pola yang sudah disepakati — kerjakan lalu laporkan):
- Data kiriman user tidak lengkap (mis. screenshot terpotong) → proses yang terlihat, sebut eksplisit bagian yang hilang di ringkasan
- Pilihan teknis kecil yang punya konvensi jelas di repo → ikuti repo
- Perbaikan konsistensi UI kecil yang mengikuti idiom yang ada

Format bertanya: satu pertanyaan spesifik + rekomendasimu + konsekuensi tiap pilihan. Bukan daftar 10 pertanyaan.

## 6. Alur kerja standar per permintaan

1. Baca permintaan; kalau menyentuh aturan bisnis, cek `docs/PRD.md`
2. Petakan file yang tersentuh (skill `tambah-fitur-portal`)
3. Implementasi (konstanta → `lib/`; ikuti pola file tetangga)
4. `npx prisma migrate dev --name <x>` bila schema berubah → **restart server**
5. Verifikasi (skill `verifikasi-portal`) — API negatif+positif, UI, screenshot
6. Bersihkan data uji
7. Update `docs/PRD.md` dan `docs/RINGKASAN-SESI.md` (naikkan Versi +1 + baris baru di Riwayat Versi)
8. Ringkasan Indonesia: perubahan, bukti pengujian, catatan/opsi lanjutan
