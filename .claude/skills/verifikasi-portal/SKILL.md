---
name: verifikasi-portal
description: Verifikasi end-to-end Portal Toko Marmo setelah perubahan kode — kapan restart server vs cukup HMR, uji API via curl (kasus positif & negatif) dengan akun uji standar, uji UI via browser preview, bersihkan data uji, dan format pelaporan hasil. Gunakan SETIAP kali selesai mengubah kode, sebelum melapor ke user; juga saat user bilang "cek", "test", "verifikasi", atau "kok error".
---

# Verifikasi Portal Toko Marmo

Tujuan: tidak pernah melapor "selesai" tanpa bukti. Jalankan urutan ini setiap selesai implementasi.

## 0. Tentukan: perlu restart server atau tidak?

| Yang berubah | Tindakan |
|---|---|
| Hanya file `.ts/.tsx/.css` | TIDAK restart — HMR otomatis. Jangan matikan server user. |
| `prisma/schema.prisma` (migrate/generate) | WAJIB restart — client lama di memori menyebabkan 500 `PrismaClientValidationError`. |
| `.env` | WAJIB restart. |

Cara restart yang benar:
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN   # lihat siapa yang memegang port
pkill -f "next dev"; sleep 2
```
Lalu nyalakan lewat `preview_start` (nama server: `portal-karyawan`). Setelah start, **poll sampai siap** — jangan langsung curl:
```bash
for i in 1 2 3 4 5 6; do sleep 3; C=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login); [ "$C" = "200" ] && break; done; echo $C
```
Kalau `preview_start` gagal "Another next dev server is already running" → server user masih hidup; kalau tak ada perubahan schema, pakai saja server itu.

## 1. Cek statis (selalu, murah)

```bash
cd /Users/seno/portal-karyawan && npx tsc --noEmit
```
Harus lolos sebelum lanjut. Untuk perubahan besar/struktural, tambah `npm run build`.

## 2. Uji API via curl (cookie jar per akun)

Akun standar: owner `seno/seno123`, admin `admin/admin123`, karyawan `Budi Santoso/karyawan123`, karyawan impor `Haryanto/123` dll. Login tidak case-sensitive.

```bash
cd /tmp
curl -s -c budi.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"nama":"Budi Santoso","password":"karyawan123"}' -o /dev/null -w "%{http_code}\n"
# lalu panggil endpoint dengan -b budi.txt
```

Wajib uji DUA arah:
- **Positif**: request valid → cek kode status (200/201) DAN isi respons (pakai `python3 -c "import json,sys; ..."` untuk mengambil field yang relevan, bukan `head -c` buta).
- **Negatif**: minimal satu pelanggaran yang disengaja → harus 400/403 dengan pesan Indonesia yang benar. Contoh pola yang sudah ada: lokasi kosong, nama kembar, izin menikah > 7 hari, admin biasa membuat akun admin.

Upload file diuji dengan `-F` (multipart): `-F "suratDokter=@file.pdf;type=application/pdf"`.

## 3. Uji UI via browser preview

- Login lewat eval `fetch("/api/auth/login", ...)` lalu `location.href = "..."` — pisahkan navigasi dan aksi ke eval berikutnya (beri jeda; halaman butuh waktu render).
- **Form React**: JANGAN `el.value = x`. Pakai:
```js
const set = (el, v) => {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement :
                el.tagName === "SELECT" ? HTMLSelectElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype, "value").set.call(el, v);
  el.dispatchEvent(new Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
};
// isi semua field → setTimeout(() => form.requestSubmit(), 150)
```
- Tanda tangan canvas: kirim rangkaian `PointerEvent` (pointerdown → banyak pointermove → pointerup) ke elemen canvas.
- Verifikasi teks/struktur pakai eval yang mengembalikan data (`[...document.querySelectorAll(...)].map(...)`) — lebih andal daripada menatap screenshot. Screenshot untuk bukti akhir.
- Perhatian: viewport preview kadang sempit (±440px) — sekalian cek responsif.
- Notifikasi push TIDAK bisa diuji penuh di preview (permission auto-denied). Uji jalurnya: langganan simulasi via `POST /api/push/subscribe`, lalu picu kejadian → mutasi harus tetap sukses (201) walau pengiriman push gagal.

## 4. Bersihkan data uji

- Semua record uji buatanmu dinamai berawalan `Uji ` (mis. "Uji Baru", "Uji Tetap") atau beralasan khas ("uji notifikasi").
- Hapus lewat script, bukan dibiarkan:
```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.deleteMany({ where: { nama: { startsWith: 'Uji ' } } })
  .then(r => console.log('dihapus:', r.count)).finally(() => p.\$disconnect());
"
```
- Data contoh permanen JANGAN dihapus: Budi Santoso, Siti Rahayu, Ani Wijaya, Rudi Hartono, Bejo, dan 45 karyawan impor.
- File upload uji di `uploads/surat-dokter/` ikut dihapus (`unlink`) bersama record-nya.

## 5. Format pelaporan ke user

Ringkasan bahasa Indonesia yang menyebut ANGKA nyata, bukan klaim:
- Apa yang diuji dan hasilnya: "tanpa lokasi ditolak [400], dengan lokasi berhasil [201]"
- Screenshot untuk perubahan visual
- Kalau server di-restart: katakan, karena user mungkin memegang terminal `npm run dev` sendiri
- Instruksi user: biasanya cukup "refresh browser, http://localhost:3000"
- Yang TIDAK bisa diuji di lingkungan ini (mis. popup notifikasi sungguhan) → jujur sebutkan + beri langkah uji manual untuk user
