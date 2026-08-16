# Ringkasan Sesi — Portal Toko Marmo

**Versi: v20** — diperbarui 2026-08-16

> Ditulis untuk melanjutkan pekerjaan di sesi Claude Code baru. Baca ini + `docs/PRD.md` (kebenaran tunggal fitur, sekarang sampai **Feature 32**) + `AGENTS.md` (manual operasi & aturan kerja, sekarang 18 kesalahan umum) sebelum lanjut.

## Status saat ini

**Live di produksi:** https://portal-karyawan-theta.vercel.app **dan** domain custom **https://www.marmo.my.id** (alias ke deployment yang sama). Database **PostgreSQL (Neon)** — dev lokal dan produksi **berbagi database yang sama persis**, jadi perubahan schema/data lokal langsung berlaku di produksi juga. File surat dokter di **Vercel Blob**.

**Deploy terakhir:** commit `a3d5c3b` ("tambah field NIP karyawan + impor data dari fingerprint") — 15 Agu 2026, status READY di kedua domain. Diverifikasi di produksi: kolom NIP terisi benar (Haryanto=2005, Azmi=3050, Andrew=3009), `/admin/karyawan` render normal. Deployment dicek lewat `GET /v6/deployments/{id}/files` — **tidak ada `.env`/secret yang ikut ter-upload**.

⚠️ **Insiden non-kode saat deploy ini**: token Vercel statis di `~/.vercel-token` mendadak kena `Not authorized... must re-authenticate to this scope` untuk tim **marmotoko** (`saml: true` di respons API — kemungkinan tim baru mengaktifkan SSO/SAML, token API lama jadi tidak cukup). **Bukan bug kode.** Solusi: `vercel login` interaktif (device auth flow, user login manual lewat browser) — begitu berhasil, `vercel deploy` langsung normal lagi tanpa perlu `--token` eksplisit (pakai sesi CLI yang baru). Kalau kejadian lagi di sesi depan, ulangi pola ini: `vercel login` → tunggu user konfirmasi sudah login di browser → `vercel whoami`/`vercel teams ls` untuk verifikasi → lanjut `vercel deploy --prod --yes` tanpa `--token`.

Catatan: schema `Catatan` ter-migrate ke Neon yang **dipakai bersama dev & produksi**, jadi perubahan schema lokal langsung berlaku di produksi.

## Feature 32 — Sub-jenis "Izin Tidak Full" (Telat / Izin di Tengah Jam Kerja / Pulang Cepat) — sesi 16 Agu 2026

Kelanjutan dari Feature 26 (Izin Setengah Hari). User minta dipecah jadi 3 sub-jenis, masing-masing mewajibkan jam berbeda:
- **Telat** → Jam Masuk
- **Izin di Tengah Jam Kerja** → Jam Keluar + Jam Masuk Kembali
- **Pulang Cepat** → Jam Pulang

**Keputusan desain (dikonfirmasi user lewat pertanyaan sebelum implementasi):** bukan jenis izin baru yang berdiri sendiri — setelah karyawan pilih "Izin Setengah Hari" di dropdown, muncul pilihan sub-jenis di dalamnya (pola sama seperti pilihan tipe surat dokter di Izin Sakit). Label final: "Telat" / "Izin di Tengah Jam Kerja" / "Pulang Cepat" — user sempat pilih "Izin Pertengahan" lalu koreksi ke "Izin di Tengah Jam Kerja".

**Schema:** enum baru `SubJenisSetengahHari` (TELAT/PERTENGAHAN/PULANG_CEPAT) + 4 kolom nullable baru di `Izin` (`subJenisSetengahHari`, `jamMasuk`, `jamKeluar`, `jamPulang` — format "HH:mm"). Migrasi `20260816094623_sub_jenis_izin_setengah_hari` diterapkan ke Neon (shared dev+prod). **1 data lama** (izin Setengah Hari milik Ilham Kar., disetujui, sebelum fitur ini ada) sengaja **dibiarkan apa adanya** (`subJenisSetengahHari: null`) — tidak ditebak/dimigrasi, tetap tampil normal tanpa baris detail tambahan di semua tempat (diverifikasi langsung, tidak error).

**File yang disentuh** (checklist skill `tambah-fitur-portal`, jenis izin baru + field tambahan): `lib/izin.ts` (konstanta + helper `detailSubJenisSetengahHari()`), `lib/pengajuan-izin.ts` (`buatIzin()` — validasi 2 lapis, server pakai regex `FORMAT_JAM`), 2 API route (`/api/izin`, `/api/admin/karyawan/[id]/izin`), 3 form pengajuan yang terduplikasi di codebase ini (`/karyawan/izin`, `/admin/ajukan-izin`, `/admin/karyawan/[id]` bagian "+ Ajukan Izin"), dan 5 tempat tampil (`/admin/izin`, `/admin/karyawan/[id]` riwayat, `/admin/laporan-izin` kedua tab, `lib/export-izin.ts` kedua sheet Excel, `/api/admin/rekap-izin` yang me-whitelist field manual).

**Diuji:** `npx tsc --noEmit` bersih. Karyawan uji dibuat (`Uji SetengahHari`), diuji lewat curl — 3 sub-jenis submit sukses (201) dengan jam yang benar, 4 kasus negatif ditolak 400 (jam kosong per sub-jenis, format jam salah "25:99", sub-jenis tidak dipilih). UI diverifikasi lewat browser: dropdown radio + input jam muncul benar di form admin, detail line tampil benar di `/admin/izin`, Laporan Izin (Rincian & Per Karyawan), dan file Excel export (kedua sheet, dicek langsung isi selnya). Data uji (karyawan + 3 izin, cascade delete) dibersihkan sesudahnya.

**Catatan operasional:** ada 2 sesi Claude Code jalan bersamaan di folder ini — dev server sesi lain (PID 254) di-restart karena migrasi schema perlu Prisma Client baru (AGENTS.md kesalahan #3); sudah dinyalakan ulang dengan `npm run dev` seperti biasa.

**Di-deploy ke produksi** commit `810bd84`, READY, diverifikasi langsung lewat API `www.marmo.my.id` (field baru muncul, data lama tetap `null` tanpa error). Insiden token Vercel basi lagi (SSO, sama seperti sesi lalu) — diperbaiki dengan pola yang sama: `vercel login` interaktif.

**Susulan (masih sesi yang sama) — batas waktu pengajuan Telat:** user tambah aturan supaya karyawan tidak bisa beralasan sakit dulu baru belakangan mengaku "telat" padahal sebenarnya kesiangan. Sub-jenis **Telat** sekarang cuma bisa diajukan **sebelum jam 08.00 WIB pada tanggal izin itu** (tanggal lain — Izin di Tengah Jam Kerja, Pulang Cepat — tidak kena). Dihitung manual pakai offset UTC+7 eksplisit (`lewatBatasIzinTelat()` di `lib/izin.ts`), **sengaja tidak mengandalkan timezone proses server** karena Vercel default UTC (beda dari mesin dev lokal yang sudah WIB) — kalau pakai `new Date().getHours()` biasa, deadline bakal salah 7 jam di produksi. Diuji lewat curl dengan tanggal relatif ke waktu asli saat itu (17:xx WIB, 16 Agu): ajukan Telat utk hari itu juga → 400 (lewat batas); ajukan Telat utk besok → 201 (belum lewat); ajukan Izin di Tengah Jam Kerja utk hari itu juga → tetap 201 (tidak kena aturan). ~~Ditegakkan di `buatIzin()` jadi otomatis berlaku di jalur karyawan maupun admin~~ — **direvisi lagi di susulan berikutnya, lihat di bawah.**

**Susulan lagi (masih sesi yang sama) — pengecualian admin & rename 2 label jenis izin:** dua permintaan sekaligus:
1. **Pengecualian admin dari batas jam 08.00:** kalau admin/owner yang input izin Telat atas nama karyawan (bukan karyawan sendiri), batas waktu **tidak berlaku** — parameter baru `diajukanOlehAdmin: true` dikirim dari `app/api/admin/karyawan/[id]/izin/route.ts` ke `buatIzin()`, jalur karyawan (`app/api/izin/route.ts`) tidak mengirim ini jadi tetap kena batas. Client-side check & hint teks "Hanya bisa diajukan sebelum jam 8.00 WIB..." dihapus dari kedua form admin (`/admin/ajukan-izin`, "+ Ajukan Izin" di halaman Edit Karyawan), tetap ada di form karyawan.
2. **Rename label** (nama enum di database TIDAK berubah, cuma teks tampilan di `LABEL_JENIS_IZIN`): "Izin Lain-lain" → **"Izin Selain Sakit"**, "Izin Setengah Hari" → **"Izin Tidak Full (Telat, Pulang Cepat, Pertengahan)"**. **Temuan saat rename**: 2 dari 3 form pengajuan (karyawan, admin "+ Ajukan Izin untuk Karyawan Ini") ternyata punya dropdown `<option>` yang di-hardcode manual, BUKAN diambil dari `LABEL_JENIS_IZIN` — beda dari form admin "Ajukan Izin" yang sudah generik lewat `Object.entries(LABEL_JENIS_IZIN)`. Kalau cuma ganti `lib/izin.ts`, 2 form itu bakal tetap tampilkan label lama. Sekalian diperbaiki jadi generik semua (`Object.entries(...)`) supaya tidak kejadian lagi kalau ada rename/tambah jenis izin berikutnya — dicatat sebagai perbaikan dalam-scope, bukan diminta eksplisit, sesuai pola kerja yang disukai user. Heading kecil "Jenis Izin Setengah Hari" (di atas pilihan sub-jenis) ikut diganti "Detail Izin Tidak Full" di ketiga form.

Diuji: karyawan uji (`Uji AdminException`) coba Telat hari itu juga → 400 (masih kena batas); admin (seno) input Telat utk karyawan yang sama, tanggal & jam sama → 201 (dikecualikan). Label baru dicek tampil benar di dropdown ketiga form, tabel `/admin/izin`, dan kartu/tabel dashboard "Izin Selain Sakit". `npx tsc --noEmit` & eslint bersih (cuma error pre-existing tak terkait di beberapa file, pola `muat()` dalam `useEffect`). Data uji dibersihkan.

## Susulan Feature 31 — NIP Tegal Alur + perubahan roster (data-only, tidak perlu deploy kode)

Setelah Menceng (23/24 NIP) selesai, user kirim screenshot mesin fingerprint Tegal Alur ("Marmo Ling.3"). Hasil (`prisma/import-nip-karyawan-tegal-alur.ts`):
- **19 NIP terisi** untuk karyawan Tegal Alur yang sudah ada
- **Koreksi susulan (masih sesi yang sama):** user kirim ulang screenshot yang sama, minta nama **ikut ejaan mesin fingerprint** — jadi 8 nama yang tadinya dibiarkan (ejaan database) di-**rename** balik ke ejaan sumber: Barodin→Barudin, Winda A→Winda, Eka Prasetya→Eka, Ngumroh→Umroh, Masyur→Mansyur, Widiarmanto→Widi Armanto, Fany Rahman→Fani, Cintia→Sintia. ⚠️ Tiga di antaranya (Winda A→Winda, Eka Prasetya→Eka, Fany Rahman→Fani) kelihatan seperti nama LENGKAP yang dipotong di layar mesin (bukan sekadar beda ejaan) — tetap dieksekusi sesuai instruksi eksplisit, tapi ditandai di sini kalau-kalau bukan itu maksudnya & perlu nama lengkapnya dikembalikan. NIP tidak ikut berubah saat rename (dicek satu-satu). Karena `nama` = username login, karyawan-karyawan ini sekarang WAJIB pakai ejaan baru buat login (diuji: login lama gagal, login baru 200 untuk semua 8).
- **Salma dihapus** dari database (user: "salma dihapus aja" — tidak ada di daftar mesin, dicek dulu tidak ada kontrak/izin/profil terkait sebelum dihapus, aman)
- **2 karyawan baru dibuat**: Nisa (NIP 10) & Yasmin (NIP 12), lokasi Tegal Alur, password default `123`, TANPA kontrak/tanggalMasuk (belum diketahui — perlu dilengkapi lewat Edit Karyawan kalau user tahu tanggal masuknya)
- NIP 3030 "Novi" muncul di kedua lokasi (dikonfirmasi user, bukan anomali) — tidak ada perubahan, NIP-nya sudah benar di record Menceng yang sudah ada
- Diuji: login Nisa & Yasmin (200), login Salma (401, sudah tidak ada), tab "Tegal Alur (21)" di Daftar Karyawan sesuai hitungan (20 − 1 + 2)
- **Tidak ada perubahan kode app** — murni operasi data (fill NIP, delete, create) lewat script/DB langsung, jadi tidak perlu commit fitur baru atau deploy Vercel. Script diimpor tetap di-commit sebagai riwayat.

## Fitur terbaru (Feature 31 di PRD) — sesi 15 Agu 2026, sudah di-deploy

### Feature 31 — NIP (Nomor Induk Pegawai) karyawan
User kirim daftar NIP (nomor PIN mesin fingerprint) + nama, minta diimpor ke Portal Karyawan. Field baru `User.nip` (opsional, unik) — **beda dari `ProfilKaryawan.nik`** (itu NIK KTP, jangan tertukar).
- Kolom **"NIP"** di Daftar Karyawan (setelah Nama), field editable di Edit Karyawan, field opsional di form Tambah Karyawan
- Validasi unik: NIP yang sudah dipakai karyawan lain ditolak 400 dengan pesan jelas
- **Migrasi dibuat manual** (bukan `prisma migrate dev`) karena environment non-interactive menolak prompt konfirmasi unique-constraint-warning — file SQL ditulis tangan mengikuti pola migrasi Prisma yang sudah ada, lalu diterapkan via `prisma migrate deploy` (non-interactive, aman)
- **Impor data**: `prisma/import-nip-karyawan.ts`, 23 dari 24 baris sumber berhasil dicocokkan (aman dijalankan ulang, skip yang sudah ada NIP). **"SURYANA" (NIP 3016) tidak ditemukan** di database — dilewati, perlu klarifikasi user (karyawan baru belum terdaftar, atau salah eja?). Tiga nama butuh koreksi ejaan sumber→DB: `MISGIONO`→`Misgiyono`, `MELI`→`Melly`, `ILHAM KAR`→`Ilham Kar.` — dicocokkan berdasar kemiripan jelas, dicatat di komentar script, BUKAN ditebak sembarangan
- Diuji: NIP tampil benar di Daftar Karyawan & Edit Karyawan (dicek Akmal=3035, Andrew=3009, dll cocok persis sumber), validasi duplikat NIP ditolak 400, ubah+kembalikan NIP Akmal berhasil, responsif 375px tanpa overflow

## Fitur sesi sebelumnya (Feature 27–30 di PRD) — 11 Agu 2026, sudah di-deploy

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

**Susulan:** user minta hal yang sama juga di halaman **`/admin/izin`** (Feature 28) — ditambah kolom **"Diajukan"** (tanggal+jam, format sama) di antara Tanggal dan Alasan. `GET /api/admin/izin` sudah otomatis punya `createdAt` (tidak pakai `select` eksplisit), tinggal ditampilkan.

### Feature 30 — Cegah duplikasi pengajuan izin
Karyawan/admin tidak bisa ajukan izin **jenis sama** untuk tanggal **sama/tumpang tindih** dengan pengajuan yang masih **MENUNGGU atau DISETUJUI** — ditolak 400 dengan pesan yang sebut detail pengajuan sebelumnya (contoh: `"Izin Lain-lain untuk tanggal 10 Sep 2026 sudah pernah diajukan sebelumnya (status: menunggu)..."`).
- **Izin DITOLAK TIDAK menghalangi** ajuan ulang (keputusan desain: wajar mencoba lagi setelah ditolak) — diuji eksplisit
- Jenis izin **berbeda** di tanggal sama tetap boleh (bukan duplikat satu sama lain) — diuji eksplisit
- Cek pakai overlap tanggal (bukan cuma kecocokan persis), jadi rentang yang beririsan sebagian juga kena
- Logika di `buatIzin()` (`lib/pengajuan-izin.ts`) — otomatis berlaku di jalur karyawan (`/api/izin`) DAN jalur admin (`/api/admin/karyawan/[id]/izin`) karena keduanya panggil fungsi yang sama; diuji eksplisit dari jalur admin juga kena tolak
- Diuji end-to-end lewat curl (6 skenario) + lewat UI form beneran (pesan error tampil di halaman)

**Revisi susulan sesi ini (contoh nyata dari user: Haryanto punya 3 izin Sakit dobel di tanggal sama):** ditemukan aturan awal terlalu ketat — user klarifikasi izin Sakit **tanpa** surat dokter harus boleh dilengkapi surat dokter belakangan untuk tanggal yang sama. Diperbaiki: kasus ini sekarang **UPDATE baris yang sudah ada** (`suratDokter`, `alasan`, tanggal ikut diperbarui), **BUKAN bikin baris baru** — supaya "proses perhitungan izinnya tetap 1 hari" (permintaan eksplisit user) otomatis benar di semua laporan/kehadiran tanpa perlu dedup terpisah, karena datanya memang tetap 1 baris. Kalau izin yang sudah ada **sudah** punya surat dokter, pengajuan susulan tetap dianggap duplikat biasa (ditolak) — pengecualian cuma berlaku sekali arah, dari tanpa ke dengan. Notifikasi admin untuk kasus ini beda judul: "Surat dokter dilampirkan" (bukan "Pengajuan izin baru"). Helper baru `simpanSuratValidasi()` dipakai bersama di kedua jalur (create biasa & update-lengkapi) supaya validasi format/ukuran file tidak dobel ditulis. Diuji ulang: lengkapi surat dokter → ID sama, jumlah baris SAKIT tetap 1; kirim lagi setelah sudah ada surat dokter → tetap ditolak sebagai duplikat; jenis lain di tanggal sama → tetap boleh.

⚠️ **Insiden lanjutan sesi ini**: pas verifikasi kolom baru ini, badge "Izin Menunggu" ternyata sudah turun jadi 1 (dari 2) — sempat khawatir itu efek dari testing sebelumnya. Dicek: **bukan** — izin Putri (7 Agu) sudah berstatus DISETUJUI dengan `feedbackAdmin: null`, konsisten dengan owner memprosesnya sendiri lewat aplikasi asli di sela waktu kerja (bukan sesuatu yang salah/rusak). Baik-baik saja, cuma perlu dicek karena histori insiden sebelumnya di fitur yang sama.

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
- **`vercel` CLI** — coba dulu token di `~/.vercel-token` (`export VERCEL_TOKEN=$(cat ~/.vercel-token | tr -d '\n')` sebelum `vercel ... --token "$VERCEL_TOKEN"`). **Kalau muncul `Not authorized... must re-authenticate to this scope "marmotoko"`** (token statis basi/tim aktifkan SSO), token itu tidak bisa dipakai lagi — jalankan `vercel login` (device auth, minta user login lewat browser), lalu `vercel deploy --prod --yes` TANPA `--token` (pakai sesi CLI hasil login, bukan token lama).
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

- **`docs/PRD.md`** — 31 fitur ✅, data model (termasuk `lokasiAkses`, `tetapManual`, `feedbackAdmin`, `nip` & entity `Catatan`), fase project. **Selalu update setiap fitur baru.**
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
| v20 | 2026-08-16 | Susulan Feature 32: batas jam 08.00 WIB untuk Telat dikecualikan kalau admin yang input; rename label "Izin Lain-lain"→"Izin Selain Sakit" & "Izin Setengah Hari"→"Izin Tidak Full (...)" (2 dropdown hardcoded ikut diperbaiki jadi generik). Belum di-deploy. |
| v19 | 2026-08-16 | Susulan Feature 32: batas waktu pengajuan Telat (hanya sebelum jam 08.00 WIB pada tanggal izin), dihitung manual dengan offset UTC+7 eksplisit supaya tidak salah di server Vercel (default UTC). Sudah di-deploy bersama v18. |
| v18 | 2026-08-16 | **Feature 32** (sub-jenis Izin Setengah Hari: Telat/Izin di Tengah Jam Kerja/Pulang Cepat, masing-masing dengan field jam wajib berbeda) **di-deploy ke produksi** (commit `810bd84`, READY, diverifikasi langsung di www.marmo.my.id). Migrasi schema diterapkan ke Neon, data lama dibiarkan (`null`). |
| v17 | 2026-08-15 | Susulan Feature 31 (data-only, tanpa deploy kode): 19 NIP Tegal Alur terisi, Salma dihapus, Nisa & Yasmin dibuat baru. |
| v16 | 2026-08-15 | Feature 31 **di-deploy ke produksi** (commit `a3d5c3b`, READY, diverifikasi langsung di www.marmo.my.id — NIP tampil benar). Insiden: token Vercel statis basi (tim aktifkan SSO), diperbaiki via `vercel login` interaktif — dicatat di "Alat & kredensial" untuk sesi depan. |
| v15 | 2026-08-15 | **Feature 31** (field `User.nip` + kolom/form di Daftar & Edit Karyawan; impor 23/24 NIP dari data user, "Suryana" tidak ditemukan). Migrasi & data sudah di Neon (shared dev+prod), tapi kode UI/API belum di-deploy. |
| v14 | 2026-08-11 | Feature 28 (kolom Diajukan) & 30 (+ revisi lengkapi surat dokter) **di-deploy ke produksi** (commit `8aec394`, READY, diverifikasi langsung di www.marmo.my.id — update-bukan-baris-baru & blokir duplikat dikonfirmasi kerja). |
| v13 | 2026-08-11 | Revisi Feature 30: izin Sakit tanpa surat dokter boleh dilengkapi surat dokter belakangan (UPDATE baris, bukan baris baru) — koreksi dari contoh nyata Haryanto yang user tunjukkan. Belum di-deploy. |
| v12 | 2026-08-11 | **Feature 30** (cegah duplikasi izin jenis sama + tanggal tumpang tindih, izin DITOLAK tidak menghalangi ajuan ulang). Belum di-deploy. |
| v11 | 2026-08-11 | Susulan Feature 29: kolom "Diajukan" (tanggal+jam) ditambah juga ke `/admin/izin`, bukan cuma Laporan Izin. Belum di-deploy. |
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
