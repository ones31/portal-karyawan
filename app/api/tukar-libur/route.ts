import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";
import { kirimNotifKeAdmin } from "@/lib/push";

export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const tukarLibur = await prisma.tukarLibur.findMany({
    where: { userId: sesi.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tukarLibur });
}

export async function POST(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { tanggalLibur, tukarDengan, tanggalPengganti, keterangan } =
    await req.json();

  if (!tanggalLibur || !tukarDengan) {
    return NextResponse.json(
      { error: "Tanggal libur yang ditukar dan nama rekan wajib diisi" },
      { status: 400 }
    );
  }

  const tukarLibur = await prisma.tukarLibur.create({
    data: {
      userId: sesi.userId,
      tanggalLibur: new Date(tanggalLibur),
      tukarDengan,
      tanggalPengganti: tanggalPengganti ? new Date(tanggalPengganti) : null,
      keterangan: keterangan || null,
    },
  });

  // Beri tahu admin & owner ada pengajuan tukar libur baru
  await kirimNotifKeAdmin({
    judul: "Pengajuan tukar libur baru",
    isi: `${sesi.nama} tukar libur ${new Date(tanggalLibur).toLocaleDateString(
      "id-ID",
      { day: "numeric", month: "short" }
    )} dengan ${tukarDengan}`,
    url: "/admin/tukar-libur",
  }).catch(() => {});

  return NextResponse.json({ tukarLibur }, { status: 201 });
}
