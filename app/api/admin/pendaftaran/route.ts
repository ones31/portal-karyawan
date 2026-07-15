import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";

// Daftar pendaftaran mandiri yang masih menunggu persetujuan admin
export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const pendaftaran = await prisma.user.findMany({
    where: { role: "KARYAWAN", statusAkun: "MENUNGGU" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nama: true,
      phone: true,
      createdAt: true,
      profil: {
        select: {
          tempatLahir: true,
          tanggalLahir: true,
          alamat: true,
          namaAyahIbu: true,
        },
      },
    },
  });

  return NextResponse.json({ pendaftaran });
}
