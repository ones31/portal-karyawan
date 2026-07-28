import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, bolehAksesLokasi, PASSWORD_DEFAULT_KARYAWAN } from "@/lib/auth";

// Reset password karyawan kembali ke default ("123"), dipakai admin/owner saat
// karyawan mengubah password sendiri lalu lupa. Hanya untuk akun role KARYAWAN
// (sama seperti pembatasan hapus karyawan) — akun admin/owner tidak bisa
// direset lewat sini.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "KARYAWAN") {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }
  if (!bolehAksesLokasi(sesi, user.lokasi)) {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }

  await prisma.user.update({
    where: { id },
    data: { password: await bcrypt.hash(PASSWORD_DEFAULT_KARYAWAN, 10) },
  });

  return NextResponse.json({ ok: true, password: PASSWORD_DEFAULT_KARYAWAN });
}
