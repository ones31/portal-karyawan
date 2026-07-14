---
name: tambah-fitur-portal
description: Resep end-to-end menambah atau mengubah fitur Portal Toko Marmo — peta file yang WAJIB disentuh per jenis perubahan (jenis izin baru, field data karyawan, halaman/menu baru, aturan role, kartu dashboard, notifikasi), urutan pengerjaan, dan sinkronisasi docs/PRD.md. Gunakan setiap user meminta "tambahkan", "ubah", "buat menu/fitur/kolom/dropdown", supaya tidak ada sisi yang terlewat (form karyawan vs dashboard admin vs PRD).
---

# Tambah/Ubah Fitur Portal Toko Marmo

Kesalahan paling umum di repo ini: fitur dikerjakan di satu sisi saja (form karyawan diubah, label di dashboard admin lupa; kode jadi, PRD tidak). Skill ini adalah peta "kalau mengubah X, sentuh file-file ini".

## Urutan baku

1. Cek `docs/PRD.md` — apakah permintaan mengubah aturan yang sudah tercatat? Kalau bertentangan, tanya user dulu.
2. Konstanta/aturan baru → letakkan di `lib/` (JANGAN inline; JANGAN export helper dari `route.ts`).
3. Schema (bila perlu) → `npx prisma migrate dev --name <kebab-indonesia>` → **restart server**.
4. API → UI karyawan → UI admin (urutan ini, karena UI meniru bentuk respons API).
5. Verifikasi (skill `verifikasi-portal`) → bersihkan data uji.
6. Update `docs/PRD.md`: tambah `#### Feature N — <Nama> ✅` atau revisi feature yang sudah ada. Gaya: deskripsi padat + **bold** keputusan penting + sebut file lib terkait.
7. Ringkasan Indonesia dengan bukti pengujian.

## Peta file per jenis perubahan

### A. Jenis izin baru / aturan izin
- `prisma/schema.prisma` → enum `JenisIzin` (SQLite menyimpan teks; sering hanya perlu `prisma generate` + restart)
- `lib/izin.ts` → `JENIS_IZIN`, `LABEL_JENIS_IZIN`, konstanta batas (mis. `MAKS_HARI_MENIKAH`)
- `app/api/izin/route.ts` → daftar jenis valid + validasi khusus (batas hari, alasan opsional, surat dokter) + cast `jenis as ...`
- `app/karyawan/izin/page.tsx` → union type `jenis`, `<option>` dropdown, field kondisional, placeholder alasan, tampilan riwayat
- `app/admin/page.tsx` → union type `IzinTerbaru.jenis` (label sudah via `LABEL_JENIS_IZIN`)
- Pertimbangkan: `app/api/admin/rekap-izin/route.ts` & halamannya kalau jenis baru perlu difilter/direkap; kartu dashboard kalau perlu hitungan sendiri (tanya user bila ragu)

### B. Field baru data karyawan (akun/User)
- `prisma/schema.prisma` model `User` (nullable!) → migrate → restart
- `app/api/admin/karyawan/route.ts` → `select` di GET + terima di POST
- `app/api/admin/karyawan/[id]/route.ts` → `select` GET detail + PATCH
- `app/api/auth/daftar/route.ts` → kalau diisi saat pendaftaran mandiri
- UI: `app/admin/karyawan/page.tsx` (type + kolom tabel + form tambah), `app/admin/karyawan/[id]/page.tsx` (type + form edit)

### C. Field baru data pribadi (ProfilKaryawan)
- `prisma/schema.prisma` model `ProfilKaryawan` → migrate → restart
- `app/api/profil/route.ts` → mapping PUT
- `app/karyawan/data-pribadi/page.tsx` → array `FIELDS`
- `app/admin/karyawan/[id]/page.tsx` → array `PROFIL_FIELDS` + mapping PATCH profil di `app/api/admin/karyawan/[id]/route.ts`
- `app/daftar/page.tsx` + `app/api/auth/daftar/route.ts` → kalau ikut formulir pendaftaran

### D. Halaman/menu baru
- Karyawan: buat `app/karyawan/<nama>/page.tsx`; menu di `app/karyawan/layout.tsx` (prop `links` Navbar). Guard sudah ditangani layout.
- Admin: `app/admin/<nama>/page.tsx`; tautan dari kartu dashboard (`app/admin/page.tsx`, array `kartu` dengan `href`) ATAU menu `app/admin/layout.tsx`. Preferensi user: **fitur approval/rekap sebagai kartu dashboard, bukan menu navbar**.
- Halaman client yang membaca query string → bungkus `useSearchParams` dalam `<Suspense>`.

### E. Aturan role/akses
- `lib/auth.ts` → `SessionPayload`, `adalahAdmin()`
- Titik cek: semua `app/api/admin/*` (pola `if (!sesi || !adalahAdmin(sesi.role))`), `app/admin/layout.tsx`, `app/karyawan/layout.tsx`, `app/page.tsx`, redirect di `app/login/page.tsx`
- Fitur khusus owner: pola `superAdmin` via `/api/auth/me` di client + penegakan `sesi.role !== "SUPER_ADMIN"` di server (lihat pembuatan akun admin di `app/api/admin/karyawan/route.ts`)

### F. Kartu/statistik dashboard
- `app/api/admin/dashboard/route.ts` → tambah count di `Promise.all` + field `statistik`
- `app/admin/page.tsx` → type `Statistik`, array `kartu` (label ikut `labelPeriode` bila terfilter periode), sesuaikan `lg:grid-cols-N`
- Filter periode: pakai `rentangPeriode()` dari `lib/periode.ts` — jangan bikin logika tanggal baru

### G. Notifikasi push untuk kejadian baru
- Panggil `kirimNotifKeAdmin()` / `kirimNotifKeUser()` dari `lib/push.ts` SETELAH mutasi berhasil
- SELALU `await ...catch(() => {})` — kegagalan push tidak boleh menggagalkan request
- Isi: `judul` singkat, `isi` menyebut nama & tanggal (`toLocaleDateString("id-ID", ...)`), `url` halaman tujuan klik

### H. Dokumen resmi toko (peraturan/kontrak)
- Teks di `lib/dokumen-toko.ts` (format markdown-mini: `#`, `##`, `N.`, `-`, `**bold**`; dirender `components/DokumenMarkdown`)
- Isi pasal TIDAK dikarang — minta link Google Docs; unduh: `curl -sL "https://docs.google.com/document/d/<ID>/export?format=txt"` (401 = privat → minta user set "Anyone with the link")

## Konvensi penulisan

- Bahasa Indonesia untuk identifier baru, pesan error, komentar, UI. Ikuti gaya yang ada: `tanggalMulai`, `kirimNotifKeAdmin`, `muat()`, `ajukan()`.
- UI meniru idiom: kartu `rounded-xl bg-white p-6 shadow-sm`, tombol `bg-blue-600`, badge `STATUS_STYLE`, tabel dalam `overflow-x-auto`.
- Validasi dua lapis untuk aturan penting: pesan ramah di client + penegakan di server.
- Kolom DB baru harus aman untuk ±50 user existing (nullable/default).
