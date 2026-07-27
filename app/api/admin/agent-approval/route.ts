import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prosesIzin, prosesTukarLibur } from "@/lib/approval";

// Setujui / tolak izin atau tukar libur dari agent otomatis (mis. OpenClaw lewat
// perintah Telegram user). Autentikasi via token statis AGENT_REPORT_TOKEN — sama
// dengan endpoint ringkasan. BUKAN sesi login. Hanya bisa memproses pengajuan
// yang masih berstatus MENUNGGU. Ambil id-nya dari GET /api/admin/ringkasan-agent.
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !process.env.AGENT_REPORT_TOKEN || token !== process.env.AGENT_REPORT_TOKEN) {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
  }

  const { tipe, id, aksi } = await req.json();
  if (!["izin", "tukar-libur"].includes(tipe)) {
    return NextResponse.json(
      { error: "tipe harus 'izin' atau 'tukar-libur'" },
      { status: 400 }
    );
  }
  if (!["setujui", "tolak"].includes(aksi)) {
    return NextResponse.json(
      { error: "aksi harus 'setujui' atau 'tolak'" },
      { status: 400 }
    );
  }
  if (!id) {
    return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
  }

  const status = aksi === "setujui" ? "DISETUJUI" : "DITOLAK";
  const kata = aksi === "setujui" ? "disetujui" : "ditolak";

  if (tipe === "izin") {
    const izin = await prisma.izin.findUnique({
      where: { id },
      include: { user: { select: { nama: true } } },
    });
    if (!izin) {
      return NextResponse.json({ error: "Izin tidak ditemukan" }, { status: 404 });
    }
    if (izin.status !== "MENUNGGU") {
      return NextResponse.json(
        {
          error: `Izin ini sudah ${
            izin.status === "DISETUJUI" ? "disetujui" : "ditolak"
          } sebelumnya`,
        },
        { status: 400 }
      );
    }
    await prosesIzin(id, status);
    return NextResponse.json({ ok: true, ringkas: `Izin ${izin.user.nama} ${kata}.` });
  }

  const tukarLibur = await prisma.tukarLibur.findUnique({
    where: { id },
    include: { user: { select: { nama: true } } },
  });
  if (!tukarLibur) {
    return NextResponse.json(
      { error: "Tukar libur tidak ditemukan" },
      { status: 404 }
    );
  }
  if (tukarLibur.status !== "MENUNGGU") {
    return NextResponse.json(
      {
        error: `Tukar libur ini sudah ${
          tukarLibur.status === "DISETUJUI" ? "disetujui" : "ditolak"
        } sebelumnya`,
      },
      { status: 400 }
    );
  }
  await prosesTukarLibur(id, status);
  return NextResponse.json({
    ok: true,
    ringkas: `Tukar libur ${tukarLibur.user.nama} ${kata}.`,
  });
}
