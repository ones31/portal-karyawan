import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { MIME_SURAT, bacaSurat } from "@/lib/surat-dokter";

// Surat dokter berisi dokumen medis: hanya pemilik izin dan admin yang boleh melihat
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nama: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { nama } = await params;
  const namaBersih = path.basename(nama); // cegah path traversal

  const izin = await prisma.izin.findFirst({
    where: { suratDokter: namaBersih },
  });
  if (!izin) {
    return NextResponse.json({ error: "Surat tidak ditemukan" }, { status: 404 });
  }
  if (!adalahAdmin(sesi.role) && izin.userId !== sesi.userId) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const data = await bacaSurat(namaBersih);
  if (!data) {
    return NextResponse.json(
      { error: "File surat tidak ditemukan di server" },
      { status: 404 }
    );
  }

  const mime = MIME_SURAT[path.extname(namaBersih)] ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="surat-dokter-${namaBersih}"`,
    },
  });
}
