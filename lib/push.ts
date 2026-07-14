import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:emailsenosaputro@gmail.com",
    PUBLIC_KEY,
    PRIVATE_KEY
  );
}

export type IsiNotifikasi = {
  judul: string;
  isi: string;
  url?: string; // halaman yang dibuka saat notifikasi diklik
};

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

async function kirimKeSub(sub: Sub, payload: IsiNotifikasi) {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
  } catch (e: unknown) {
    // Langganan kedaluwarsa/dicabut: bersihkan dari database
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription
        .delete({ where: { id: sub.id } })
        .catch(() => {});
    }
  }
}

// Kirim notifikasi ke semua perangkat milik satu user
export async function kirimNotifKeUser(userId: string, payload: IsiNotifikasi) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.all(subs.map((s) => kirimKeSub(s, payload)));
}

// Kirim notifikasi ke semua admin & owner
export async function kirimNotifKeAdmin(payload: IsiNotifikasi) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return;
  const subs = await prisma.pushSubscription.findMany({
    where: { user: { role: { in: ["ADMIN", "SUPER_ADMIN"] } } },
  });
  await Promise.all(subs.map((s) => kirimKeSub(s, payload)));
}
