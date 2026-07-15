import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";

// Ganti password mandiri untuk user yang sedang login (semua role).
export async function PATCH(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { passwordLama, passwordBaru } = await req.json();

  if (!passwordLama || !passwordBaru) {
    return NextResponse.json(
      { error: "Password lama dan password baru wajib diisi" },
      { status: 400 }
    );
  }
  if (String(passwordBaru).length < 6) {
    return NextResponse.json(
      { error: "Password baru minimal 6 karakter" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: sesi.userId },
    select: { password: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }

  const cocok = await bcrypt.compare(passwordLama, user.password);
  if (!cocok) {
    return NextResponse.json(
      { error: "Password lama salah" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: sesi.userId },
    data: { password: await bcrypt.hash(passwordBaru, 10) },
  });

  return NextResponse.json({ pesan: "Password berhasil diubah" });
}
