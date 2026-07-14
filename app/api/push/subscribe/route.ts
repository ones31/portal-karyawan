import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";

// Simpan langganan push notification milik user yang sedang login
export async function POST(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: "Data langganan tidak lengkap" },
      { status: 400 }
    );
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: sesi.userId, p256dh: keys.p256dh, auth: keys.auth },
    create: {
      userId: sesi.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });
  return NextResponse.json({ ok: true });
}

// Matikan notifikasi untuk perangkat ini
export async function DELETE(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { endpoint } = await req.json();
  if (endpoint) {
    await prisma.pushSubscription
      .deleteMany({ where: { endpoint, userId: sesi.userId } })
      .catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
