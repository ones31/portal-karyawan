// Dokumen resmi Toko H. Marmo yang ditampilkan ke karyawan baru
// setelah pendaftaran berhasil (sumber: Google Docs milik toko).
// Format: "# " judul, "## " sub-judul/pasal, "N. " daftar bernomor,
// "- " butir, dan **teks** untuk penekanan (dirender oleh components/DokumenMarkdown).

export const PERATURAN_TOKO = `# PERATURAN TOKO H. MARMO

1. **Jujur dan bertanggung jawab** terhadap bagian masing-masing.
2. **Tepat waktu**, saat masuk dan istirahat.
3. **Dilarang menggunakan handphone** selama bekerja, kecuali darurat & kepentingan pekerjaan.
4. Waktu istirahat dalam 1 bagian **tidak boleh bersamaan**.
5. **Dilarang makan bersama-sama** pada saat toko sedang banyak pembeli, **terutama setelah magrib**.
6. **Saling membantu** dalam bekerja.
7. **Dilarang bercanda** pada saat bekerja.
8. Saling **menjaga kebersihan toko**.
9. **Piket harus berjalan sesuai jadwal**.
10. Keamanan dan kebersihan toko adalah **tanggung jawab bersama**.`;

export const KONTRAK_PERCOBAAN = `# SURAT PERJANJIAN KERJA KONTRAK (MASA PERCOBAAN)

## TOKO MARMO

Yang bertanda tangan di bawah ini: **Toko Marmo** — selanjutnya disebut sebagai **PIHAK PERTAMA**.

Nama, alamat, dan nomor KTP karyawan sebagaimana terdaftar — selanjutnya disebut sebagai **PIHAK KEDUA**.

## Pasal 1 — Durasi Kontrak Kerja

1. PIHAK KEDUA dipekerjakan sebagai **Karyawan Percobaan** di Toko Marmo.
2. Masa kontrak kerja berlaku selama **1 (satu) bulan** sesuai masa berlaku yang ditetapkan.
3. Perpanjangan kontrak kerja **otomatis hingga maksimal 3 (tiga) bulan** jika kinerja sesuai yang diharapkan.

## Pasal 2 — Hak dan Tunjangan Karyawan

1. PIHAK KEDUA akan mendapatkan **Gaji Pokok** sesuai kesepakatan.
2. PIHAK PERTAMA wajib memberikan gaji berikut tunjangan **setiap tanggal 1** setiap bulannya.

## Pasal 3 — Jam Kerja dan Ketentuan Libur

1. Jam kerja setiap hari: masuk pukul **07.30**, pulang pukul **21.00** (akhir pekan hingga pukul **21.30**). Istirahat **maksimal 2 jam**.
2. Jadwal libur diberikan **setelah 2 minggu bekerja**.
3. Libur **1 minggu sekali** sesuai jadwal libur.
4. Tukar libur dan izin selain sakit **wajib memberitahu di grup Toko minimal 3 hari sebelumnya**.
5. Apabila tidak ada pemberitahuan, dianggap **Alpha / Mangkir (minus)**.
6. Karyawan Alpha/Mangkir dikenakan **denda Rp 100.000** per kejadian.
7. Setiap keterlambatan dikenakan **denda Rp 10.000** per kejadian.
8. Apabila tidak ada keterlambatan dalam sehari, berhak mendapatkan **reward Rp 10.000** per hari.
9. Lupa absen dikenakan **denda Rp 50.000** per kejadian.
10. Wajib melaksanakan **piket sesuai jadwal** yang ditetapkan.

## Pasal 4 — Pemutusan Hubungan Kerja

1. Salah satu pihak dapat mengakhiri perjanjian kerja apabila karyawan **tidak dapat perform** atau **melanggar peraturan**.

## Pasal 5 — Tata Tertib Kerja

PIHAK KEDUA **wajib mematuhi seluruh tata tertib** yang berlaku di Toko Marmo sebagaimana terlampir dalam perjanjian ini.

## Pasal 6 — Resign

1. Karyawan wajib memberitahu atasannya jika ingin resign **minimal 1 bulan sebelum berhenti**.
2. Apabila memberitahu mendadak atau kurang dari 1 bulan, **tidak akan mendapatkan pesangon atau uang pisah**.`;

export function formatTanggalDokumen(d: Date): string {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Kontrak kerja durasi 1 tahun (untuk perpanjangan setelah masa percobaan 3 bulan).
// Masa berlaku diisi otomatis sesuai tanggal perpanjangan.
export function kontrakSatuTahun(mulai: Date, akhir: Date): string {
  return `# SURAT PERJANJIAN KERJA KONTRAK (DURASI 1 TAHUN)

## TOKO MARMO

Yang bertanda tangan di bawah ini: **Toko Marmo** — selanjutnya disebut sebagai **PIHAK PERTAMA**.

Nama, alamat, dan nomor KTP karyawan sebagaimana terdaftar — selanjutnya disebut sebagai **PIHAK KEDUA**.

## Pasal 1 — Durasi Kontrak Kerja

1. PIHAK KEDUA dipekerjakan sebagai **Karyawan** di Toko Marmo.
2. Masa kontrak kerja berlaku selama **1 (satu) tahun** terhitung sejak tanggal **${formatTanggalDokumen(mulai)}** sampai **${formatTanggalDokumen(akhir)}**.

## Pasal 2 — Hak dan Tunjangan Karyawan

1. Setelah masa percobaan 3 (tiga) bulan, PIHAK KEDUA akan mendapatkan komponen berikut:
- **Gaji Pokok**
- **Tunjangan Keahlian**
- **Tunjangan Kerajinan Kerja**
- **Tunjangan Kerajinan Hadir**
- **Uang Makan Rp 35.000 per hari kerja**, diberikan jika masuk penuh sesuai jadwal.

## Pasal 3 — Jam Kerja dan Ketentuan Libur

1. Jam kerja setiap hari: masuk pukul **07.30**, pulang pukul **21.00** (akhir pekan hingga pukul **21.30**). Istirahat **maksimal 2 jam**.
2. Jadwal libur diberikan **setelah 2 minggu bekerja**.
3. Libur **1 minggu sekali** sesuai jadwal libur.
4. Tukar libur dan izin selain sakit **wajib memberitahu di grup Toko minimal 3 hari sebelumnya**.
5. Apabila tidak ada pemberitahuan, dianggap **Alpha / Mangkir (minus)** dan dikenakan SP.
6. Karyawan Alpha/Mangkir dikenakan **denda Rp 100.000** per kejadian.
7. Setiap keterlambatan dikenakan **denda Rp 10.000** per kejadian.
8. Apabila tidak ada keterlambatan dalam sehari, berhak mendapatkan **reward Rp 10.000** per hari.
9. Lupa absen dikenakan **denda Rp 50.000** per kejadian.
10. Wajib melaksanakan **piket sesuai jadwal** yang ditetapkan.

## Pasal 4 — Pemutusan Hubungan Kerja

1. Salah satu pihak dapat mengakhiri perjanjian kerja apabila karyawan **tidak perform dengan baik** atau **melanggar peraturan**.

## Pasal 5 — Tata Tertib Kerja

PIHAK KEDUA **wajib mematuhi seluruh tata tertib** yang berlaku di Toko Marmo sebagaimana terlampir dalam perjanjian ini.

## Pasal 6 — Resign

1. Karyawan wajib memberitahu atasannya jika ingin resign **minimal 1 bulan sebelum berhenti**.
2. Apabila memberitahu mendadak atau kurang dari 1 bulan, **tidak akan mendapatkan pesangon atau uang pisah**.`;
}

export const PERJANJIAN_KERJA = `# PERJANJIAN KERJA

Perjanjian Kerja Waktu Tertentu (selanjutnya disebut "Perjanjian") ini dibuat dan ditandatangani di Jakarta oleh dan antara:

**TOKO H. MARMO** — untuk selanjutnya disebut **PIHAK PERTAMA**,

dan karyawan yang bertindak untuk dan atas nama dirinya sendiri — untuk selanjutnya disebut **PIHAK KEDUA**.

PIHAK PERTAMA adalah toko dan bisnis di bidang penjualan retail dan grosir yang bermaksud mempekerjakan PIHAK KEDUA untuk **jangka waktu tertentu**, dan PIHAK KEDUA sepakat menerima maksud tersebut.

## Pasal 2 — Tugas dan Tanggung Jawab

1. PIHAK KEDUA sepakat menjalankan tugas dan tanggung jawab dengan jabatan serta rincian tugas yang ditentukan oleh PIHAK PERTAMA, yang **dapat berubah dari waktu ke waktu** dan akan diberitahukan.
2. Apabila diperlukan, PIHAK KEDUA bersedia **dipekerjakan dalam jenis atau sistem pekerjaan lain** dari klasifikasi semula.

## Pasal 3 — Tata Tertib Kerja

1. PIHAK KEDUA sepakat **tunduk dan mematuhi Tata Tertib Kerja** serta peraturan lain yang berlaku di tempat usaha PIHAK PERTAMA.
2. Selama bekerja, PIHAK KEDUA **dilarang menerima atau merangkap pekerjaan** di tempat usaha lain.
3. PIHAK KEDUA **wajib merahasiakan** segala sesuatu tentang usaha PIHAK PERTAMA, baik lisan maupun tulisan, **baik selama bekerja maupun setelah tidak bekerja**.
4. PIHAK KEDUA berjanji **menjaga nama baik** usaha PIHAK PERTAMA dalam arti seluas-luasnya.
5. Saat jam kerja **wajib memakai seragam/pakaian yang telah ditentukan** tanpa menambah atau menguranginya.

## Pasal 4 — Waktu Kerja dan Libur Kerja

1. Waktu kerja dan libur disesuaikan berdasarkan **jadwal dan kebutuhan lokasi kerja** yang diputuskan PIHAK PERTAMA dengan mengacu pada Tata Tertib.
2. Jam kerja berdasarkan **shift** yang ditetapkan; PIHAK PERTAMA **berhak sewaktu-waktu merubah jadwal**.
3. Hari kerja yang jatuh pada **libur nasional/keagamaan** (Idul Adha, Natal, Nyepi, Waisak, dll.) **wajib masuk kerja seperti biasa**. Menolak tanpa persetujuan akan dikenakan sanksi sesuai Tata Tertib.

## Pasal 5 — Gaji, Tunjangan dan Fasilitas

1. Gaji & tunjangan PIHAK KEDUA terdiri dari:
- **Gaji Pokok**
- **Insentif Kehadiran** — diberikan setelah bekerja **di atas 3 bulan**
- **Insentif Kerajinan** — diberikan setelah bekerja **di atas 3 bulan**, jumlah tidak tetap sesuai kinerja
- **Tunjangan** — diberikan setelah bekerja **di atas 12 bulan**, jumlah tidak tetap sesuai kinerja
- **Insentif Keahlian** — diberikan setelah **menguasai keahlian tertentu**

2. Pengaturan fasilitas:
- PIHAK PERTAMA **tidak menyediakan mess dan/atau uang transport**.
- PIHAK PERTAMA **memberikan fasilitas kesehatan** kepada PIHAK KEDUA.
- PIHAK PERTAMA memberikan tunjangan setelah PIHAK KEDUA bekerja selama **12 bulan**.

## Pasal 6 — Libur Lebaran, Izin Menikah & Melahirkan

1. Berhak mendapatkan **libur Idul Fitri selama 7 hari** terhitung mulai hari H Idul Fitri.
2. Berhak mendapatkan **libur menikah selama 7 hari**.
3. Berhak mendapatkan **libur melahirkan selama 60 hari** terhitung mulai hari H.
4. Terlambat kembali dari libur lebaran/menikah/melahirkan **tanpa alasan yang dapat diterima**: PIHAK PERTAMA berhak memberikan **sanksi atau pemberhentian**.

## Pasal 7 — Penilaian Prestasi / Kinerja Karyawan

1. PIHAK PERTAMA mengadakan **evaluasi hasil kerja** dalam bentuk Penilaian Prestasi/Kinerja.
2. Kriteria penilaian sesuai **formulir penilaian karyawan** yang ditetapkan PIHAK PERTAMA.
3. Penilaian diberikan oleh **atasan langsung dan atasan tidak langsung** sesuai prosedur.
4. Hasil penilaian **harus memenuhi kriteria minimum** yang ditetapkan.
5. Apabila tidak memenuhi kriteria minimum, PIHAK PERTAMA **berhak memberhentikan** PIHAK KEDUA.

## Pasal 8 — Pemutusan Hubungan Kerja

**I. Pemutusan oleh PIHAK PERTAMA** — tanpa kompensasi apapun dalam hal:

1. **Berakhirnya masa kerja** sebagaimana diatur dalam Perjanjian ini.
2. PIHAK KEDUA **melanggar ketentuan Pasal 3** Perjanjian ini.
3. Melanggar ketentuan lain dalam Perjanjian/Peraturan Toko dan **telah diberi peringatan**.
4. Melakukan **pelanggaran berat**, antara lain: penipuan/pencurian/penggelapan; keterangan palsu; mabuk atau penyalahgunaan obat terlarang di tempat kerja; asusila atau perjudian di tempat kerja; kejahatan terhadap PIHAK PERTAMA; memperdagangkan barang terlarang; penganiayaan/ancaman/penghinaan kasar; membujuk melakukan perbuatan melanggar hukum; kecerobohan yang membahayakan; **membocorkan rahasia usaha** atau mencemarkan nama baik.
5. **Tidak masuk kerja 5 (lima) hari kerja berturut-turut tanpa izin resmi** sesuai Peraturan Toko.

**II. Pemutusan oleh PIHAK KEDUA:**

1. Wajib memberitahukan pengunduran diri **selambat-lambatnya 7 (tujuh) hari sebelumnya** dan tetap melaksanakan kewajiban dengan baik sampai tanggal pengunduran diri.
2. **Menyerahkan seragam & fasilitas** sebelum pengunduran diri.

## Pasal 9 — Penutup

Persyaratan lain yang tidak tercantum dalam Perjanjian ini dicakup dalam **Peraturan Toko** dan apabila terdapat kekurangan akan ditambahkan.

Demikian Perjanjian ini dibuat dan ditandatangani di Jakarta dalam rangkap 2 (dua) bermaterai cukup, masing-masing mempunyai kekuatan hukum yang sama.`;
