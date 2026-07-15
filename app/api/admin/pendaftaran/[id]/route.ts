import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { kirimNotifKeUser } from "@/lib/push";

// Setujui / tolak pendaftaran mandiri karyawan baru
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const { statusAkun } = await req.json();
  if (!["AKTIF", "DITOLAK"].includes(statusAkun)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, statusAkun: true },
  });
  if (!target || target.role !== "KARYAWAN") {
    return NextResponse.json(
      { error: "Pendaftaran tidak ditemukan" },
      { status: 404 }
    );
  }
  if (target.statusAkun !== "MENUNGGU") {
    return NextResponse.json(
      { error: "Pendaftaran ini sudah diproses sebelumnya" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { statusAkun },
  });

  await kirimNotifKeUser(user.id, {
    judul:
      statusAkun === "AKTIF"
        ? "Pendaftaran Anda disetujui ✅"
        : "Pendaftaran Anda ditolak ❌",
    isi:
      statusAkun === "AKTIF"
        ? "Selamat! Pendaftaran Anda sebagai karyawan Toko H. Marmo telah disetujui admin."
        : "Pendaftaran Anda ditolak oleh admin. Hubungi admin/owner toko untuk info lebih lanjut.",
    url: "/karyawan",
  }).catch(() => {});

  return NextResponse.json({ user: { id: user.id, statusAkun: user.statusAkun } });
}
