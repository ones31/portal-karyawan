"use client";

import { useEffect, useState } from "react";

// Konversi kunci VAPID (base64url) ke format yang diminta PushManager
function vapidKeyKeUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const hasil = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) hasil[i] = raw.charCodeAt(i);
  return hasil;
}

type Status = "cek" | "tidak-didukung" | "ditolak" | "aktif" | "nonaktif";

export default function NotifikasiToggle() {
  const [status, setStatus] = useState<Status>("cek");
  const [proses, setProses] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("tidak-didukung");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setStatus("aktif");
        else if (Notification.permission === "denied") setStatus("ditolak");
        else setStatus("nonaktif");
      })
      .catch(() => setStatus("tidak-didukung"));
  }, []);

  async function aktifkan() {
    setProses(true);
    try {
      const izin = await Notification.requestPermission();
      if (izin !== "granted") {
        setStatus("ditolak");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyKeUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (res.ok) setStatus("aktif");
    } finally {
      setProses(false);
    }
  }

  async function matikan() {
    setProses(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("nonaktif");
    } finally {
      setProses(false);
    }
  }

  if (status === "cek" || status === "tidak-didukung") return null;

  if (status === "ditolak") {
    return (
      <span
        className="text-xs text-slate-400"
        title="Notifikasi diblokir. Izinkan lewat pengaturan situs di browser."
      >
        🔕 Diblokir
      </span>
    );
  }

  return status === "aktif" ? (
    <button
      onClick={matikan}
      disabled={proses}
      title="Notifikasi aktif — klik untuk mematikan"
      className="rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
    >
      🔔 Notif Aktif
    </button>
  ) : (
    <button
      onClick={aktifkan}
      disabled={proses}
      title="Aktifkan push notification di perangkat ini"
      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
    >
      {proses ? "..." : "🔔 Aktifkan Notifikasi"}
    </button>
  );
}
