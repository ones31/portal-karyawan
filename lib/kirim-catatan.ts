import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { kirimNotifKeUser } from "./push";
import { filterLokasiSesi, type SessionPayload } from "./auth";
import { lokasiValid } from "./lokasi";
import {
  MAKS_ISI_CATATAN,
  MAKS_JUDUL_CATATAN,
  TUJUAN_SEMUA,
  lokasiDariTujuan,
} from "./catatan";

// Server-only (pakai prisma & web-push) — SENGAJA dipisah dari lib/catatan.ts
// supaya konstanta di sana tetap aman diimpor komponen client (lihat AGENTS.md
// kesalahan #16, pola sama seperti lib/izin.ts vs lib/pengajuan-izin.ts).

export type KirimCatatanInput = {
  sesi: SessionPayload; // admin/owner pengirim (menentukan scope lokasi)
  tujuan: string; // TUJUAN_SEMUA | "LOKASI:<nama>" | id satu karyawan
  judul: string;
  isi: string;
};

export type HasilKirimCatatan =
  | { ok: true; jumlah: number; namaPenerima: string }
  | { ok: false; status: number; pesan: string };

// Validasi + simpan catatan (satu baris per karyawan penerima) + kirim push
// notification ke tiap penerima. Kegagalan push TIDAK menggagalkan penyimpanan.
export async function kirimCatatan(
  input: KirimCatatanInput
): Promise<HasilKirimCatatan> {
  const { sesi, tujuan } = input;
  const judul = input.judul?.trim() ?? "";
  const isi = input.isi?.trim() ?? "";

  if (!tujuan) {
    return { ok: false, status: 400, pesan: "Penerima catatan wajib dipilih" };
  }
  if (!judul || !isi) {
    return { ok: false, status: 400, pesan: "Judul dan isi catatan wajib diisi" };
  }
  if (judul.length > MAKS_JUDUL_CATATAN) {
    return {
      ok: false,
      status: 400,
      pesan: `Judul catatan maksimal ${MAKS_JUDUL_CATATAN} karakter`,
    };
  }
  if (isi.length > MAKS_ISI_CATATAN) {
    return {
      ok: false,
      status: 400,
      pesan: `Isi catatan maksimal ${MAKS_ISI_CATATAN} karakter`,
    };
  }

  // Tentukan daftar penerima. Semua jalur lewat filterLokasiSesi() supaya admin
  // ber-lokasiAkses tidak bisa mengirim ke karyawan lokasi lain.
  const scopeLokasi = filterLokasiSesi(sesi);
  const lokasiTujuan = lokasiDariTujuan(tujuan);
  let namaPenerima: string;
  let penerima: { id: string; nama: string }[];

  if (tujuan === TUJUAN_SEMUA) {
    penerima = await prisma.user.findMany({
      where: { role: "KARYAWAN", statusAkun: "AKTIF", ...scopeLokasi },
      select: { id: true, nama: true },
    });
    namaPenerima = "semua karyawan";
  } else if (lokasiTujuan !== null) {
    if (!lokasiValid(lokasiTujuan)) {
      return {
        ok: false,
        status: 400,
        pesan: "Lokasi tujuan tidak valid (Tegal Alur atau Menceng)",
      };
    }
    if (scopeLokasi.lokasi && scopeLokasi.lokasi !== lokasiTujuan) {
      return {
        ok: false,
        status: 403,
        pesan: `Anda hanya dapat mengirim catatan ke karyawan lokasi ${scopeLokasi.lokasi}`,
      };
    }
    penerima = await prisma.user.findMany({
      where: { role: "KARYAWAN", statusAkun: "AKTIF", lokasi: lokasiTujuan },
      select: { id: true, nama: true },
    });
    namaPenerima = `semua karyawan ${lokasiTujuan}`;
  } else {
    // Satu karyawan — cek juga bahwa dia masuk scope lokasi admin ybs
    const satu = await prisma.user.findFirst({
      where: { id: tujuan, role: "KARYAWAN", ...scopeLokasi },
      select: { id: true, nama: true },
    });
    if (!satu) {
      return {
        ok: false,
        status: 404,
        pesan: "Karyawan tidak ditemukan atau di luar lokasi akses Anda",
      };
    }
    penerima = [satu];
    namaPenerima = satu.nama;
  }

  if (penerima.length === 0) {
    return {
      ok: false,
      status: 400,
      pesan: "Tidak ada karyawan aktif yang cocok dengan penerima yang dipilih",
    };
  }

  // Satu batchId untuk seluruh penerima kiriman ini, supaya daftar admin bisa
  // menampilkan kiriman massal sebagai SATU baris ("12 dari 45 sudah membaca").
  const batchId = randomUUID();
  await prisma.catatan.createMany({
    data: penerima.map((p) => ({
      userId: p.id,
      batchId,
      judul,
      isi,
      pengirimId: sesi.userId,
    })),
  });

  // Notifikasi ke tiap penerima — kegagalan push tidak boleh menggagalkan kiriman
  await Promise.all(
    penerima.map((p) =>
      kirimNotifKeUser(p.id, {
        judul: `Catatan dari ${sesi.nama}`,
        isi: judul,
        url: "/karyawan/catatan",
      }).catch(() => {})
    )
  ).catch(() => {});

  return { ok: true, jumlah: penerima.length, namaPenerima };
}
