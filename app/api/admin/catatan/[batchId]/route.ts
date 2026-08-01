import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, filterLokasiSesi } from "@/lib/auth";

// Tarik kembali satu kiriman catatan (semua penerimanya sekaligus).
// Berguna kalau admin salah kirim — catatan langsung hilang dari beranda karyawan.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { batchId } = await params;

  // Admin ber-lokasiAkses hanya boleh menghapus kiriman untuk karyawan di lokasinya
  const scope = filterLokasiSesi(sesi);
  const jumlahDalamScope = await prisma.catatan.count({
    where: { batchId, user: scope },
  });
  if (jumlahDalamScope === 0) {
    return NextResponse.json(
      { error: "Catatan tidak ditemukan" },
      { status: 404 }
    );
  }

  const { count } = await prisma.catatan.deleteMany({
    where: { batchId, user: scope },
  });
  return NextResponse.json({ dihapus: count });
}
