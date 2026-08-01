import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";

// Karyawan menandai catatan miliknya sudah dibaca.
// Hanya pemilik catatan yang boleh — admin tidak lewat rute ini.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const { id } = await params;
  const { count } = await prisma.catatan.updateMany({
    // userId ikut di where: catatan milik orang lain tidak akan tersentuh
    where: { id, userId: sesi.userId, dibacaPada: null },
    data: { dibacaPada: new Date() },
  });

  if (count === 0) {
    // Tidak ditemukan, bukan miliknya, atau memang sudah pernah dibaca
    const ada = await prisma.catatan.findFirst({
      where: { id, userId: sesi.userId },
      select: { id: true },
    });
    if (!ada) {
      return NextResponse.json(
        { error: "Catatan tidak ditemukan" },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
