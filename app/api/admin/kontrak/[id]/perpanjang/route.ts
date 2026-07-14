import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { tambahBulan } from "@/lib/cari-user";
import { kontrakSatuTahun } from "@/lib/dokumen-toko";
import { kirimNotifKeUser } from "@/lib/push";

// Perpanjang kontrak karyawan menjadi 1 tahun, terhitung sejak
// akhir kontrak sebelumnya. Isi kontrak diganti Kontrak Kerja 1 Tahun
// dengan masa berlaku terisi otomatis; karyawan menandatangani ulang.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params; // userId karyawan
  const kontrak = await prisma.kontrak.findUnique({ where: { userId: id } });
  if (!kontrak) {
    return NextResponse.json(
      { error: "Karyawan ini belum punya kontrak" },
      { status: 404 }
    );
  }

  const mulaiBaru = kontrak.akhirKontrak;
  const akhirBaru = tambahBulan(mulaiBaru, 12);

  const hasil = await prisma.kontrak.update({
    where: { userId: id },
    data: {
      mulaiKontrak: mulaiBaru,
      akhirKontrak: akhirBaru,
      isiKontrak: kontrakSatuTahun(mulaiBaru, akhirBaru),
      tandaTangan: null,
      setujuTataTertib: false,
      ditandatanganiPada: null,
    },
  });

  // Beri tahu karyawan bahwa kontrak 1 tahun baru sudah menunggu tanda tangan
  await kirimNotifKeUser(id, {
    judul: "Kontrak kerja baru menunggu tanda tangan",
    isi: `Kontrak Kerja 1 Tahun Anda (${mulaiBaru.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} — ${akhirBaru.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}) sudah tersedia. Silakan buka dan tanda tangani.`,
    url: "/karyawan/kontrak",
  }).catch(() => {});

  return NextResponse.json({ kontrak: hasil });
}
