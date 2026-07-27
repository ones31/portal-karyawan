import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";

// Ringkasan aktivitas portal untuk agent otomatis (mis. OpenClaw cron), BUKAN
// untuk browser/login manusia. Autentikasi via token statis (AGENT_REPORT_TOKEN)
// karena dipanggil dari luar tanpa sesi JWT. Token hanya boleh membaca angka
// & daftar ringkasan di sini, tidak bisa login atau mengubah data apa pun.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !process.env.AGENT_REPORT_TOKEN || token !== process.env.AGENT_REPORT_TOKEN) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
  }

  const [izinMenunggu, tukarLiburMenunggu, pendaftaranMenunggu, kontrakSegeraHabis] =
    await Promise.all([
      prisma.izin.findMany({
        where: { status: "MENUNGGU" },
        include: { user: { select: { nama: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.tukarLibur.findMany({
        where: { status: "MENUNGGU" },
        include: { user: { select: { nama: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "KARYAWAN", statusAkun: "MENUNGGU" },
        select: { nama: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.kontrak.findMany({
        where: {
          akhirKontrak: {
            gte: new Date(),
            lte: new Date(Date.now() + BATAS_HARI_KONTRAK_HABIS * 24 * 60 * 60 * 1000),
          },
        },
        include: { user: { select: { nama: true } } },
        orderBy: { akhirKontrak: "asc" },
      }),
    ]);

  return NextResponse.json({
    tanggal: new Date().toISOString().slice(0, 10),
    izinMenunggu: izinMenunggu.map((i) => ({
      id: i.id,
      nama: i.user.nama,
      jenis: i.jenis,
      tanggalMulai: i.tanggalMulai,
      tanggalAkhir: i.tanggalAkhir,
      alasan: i.alasan,
    })),
    tukarLiburMenunggu: tukarLiburMenunggu.map((t) => ({
      id: t.id,
      nama: t.user.nama,
      tanggalLibur: t.tanggalLibur,
      tukarDengan: t.tukarDengan,
    })),
    pendaftaranMenunggu: pendaftaranMenunggu.map((p) => ({
      nama: p.nama,
      tanggalDaftar: p.createdAt,
    })),
    kontrakSegeraHabis: kontrakSegeraHabis.map((k) => ({
      nama: k.user.nama,
      akhirKontrak: k.akhirKontrak,
    })),
  });
}
