import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { kirimNotifKeUser } from "@/lib/push";
import { LABEL_JENIS_IZIN } from "@/lib/izin";

// Setujui / tolak izin
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();
  if (!["DISETUJUI", "DITOLAK"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const izin = await prisma.izin.update({ where: { id }, data: { status } });

  // Beri tahu karyawan hasil pengajuannya
  await kirimNotifKeUser(izin.userId, {
    judul: `Izin Anda ${status === "DISETUJUI" ? "disetujui ✅" : "ditolak ❌"}`,
    isi: `${LABEL_JENIS_IZIN[izin.jenis]} ${izin.tanggalMulai.toLocaleDateString(
      "id-ID",
      { day: "numeric", month: "short" }
    )} ${status === "DISETUJUI" ? "telah disetujui" : "ditolak"}.`,
    url: "/karyawan/izin",
  }).catch(() => {});

  return NextResponse.json({ izin });
}
