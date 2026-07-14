import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { kirimNotifKeUser } from "@/lib/push";

// Setujui / tolak pengajuan tukar libur
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

  const tukarLibur = await prisma.tukarLibur.update({
    where: { id },
    data: { status },
  });

  // Beri tahu karyawan hasil pengajuannya
  await kirimNotifKeUser(tukarLibur.userId, {
    judul: `Tukar libur ${status === "DISETUJUI" ? "disetujui ✅" : "ditolak ❌"}`,
    isi: `Tukar libur ${tukarLibur.tanggalLibur.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    })} dengan ${tukarLibur.tukarDengan} ${
      status === "DISETUJUI" ? "telah disetujui" : "ditolak"
    }.`,
    url: "/karyawan/izin",
  }).catch(() => {});

  return NextResponse.json({ tukarLibur });
}
