import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";

export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const kontrak = await prisma.kontrak.findUnique({
    where: { userId: sesi.userId },
  });
  return NextResponse.json({ kontrak });
}

// Tanda tangan kontrak + persetujuan tata tertib
export async function POST(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { tandaTangan, setujuTataTertib } = await req.json();

  if (!tandaTangan || !setujuTataTertib) {
    return NextResponse.json(
      { error: "Tanda tangan dan persetujuan tata tertib wajib diisi" },
      { status: 400 }
    );
  }

  const kontrak = await prisma.kontrak.findUnique({
    where: { userId: sesi.userId },
  });
  if (!kontrak) {
    return NextResponse.json(
      { error: "Kontrak belum dibuat oleh admin" },
      { status: 404 }
    );
  }
  if (kontrak.ditandatanganiPada) {
    return NextResponse.json(
      { error: "Kontrak sudah ditandatangani" },
      { status: 400 }
    );
  }

  const hasil = await prisma.kontrak.update({
    where: { userId: sesi.userId },
    data: {
      tandaTangan,
      setujuTataTertib: true,
      ditandatanganiPada: new Date(),
    },
  });
  return NextResponse.json({ kontrak: hasil });
}
