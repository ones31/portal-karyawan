"use client";

import { useEffect, useState } from "react";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";

type KontrakHabis = {
  userId: string;
  nama: string;
  lokasi: string | null;
  phone: string | null;
  mulaiKontrak: string;
  akhirKontrak: string;
  sudahTtd: boolean;
};

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sisaHari(akhir: string) {
  return Math.ceil((new Date(akhir).getTime() - Date.now()) / 86400000);
}

export default function KontrakHabisPage() {
  const [daftar, setDaftar] = useState<KontrakHabis[] | null>(null);
  const [pesan, setPesan] = useState("");
  const [memproses, setMemproses] = useState<string | null>(null);

  async function muat() {
    const r = await fetch("/api/admin/kontrak-habis");
    const d = await r.json();
    setDaftar(d.daftar ?? []);
  }

  useEffect(() => {
    muat();
  }, []);

  async function perpanjang(k: KontrakHabis) {
    if (
      !confirm(
        `Perpanjang kontrak ${k.nama} menjadi 1 tahun (mulai ${formatTanggal(k.akhirKontrak)})? Karyawan akan diminta menandatangani Kontrak Kerja 1 Tahun di portalnya.`
      )
    )
      return;
    setMemproses(k.userId);
    setPesan("");
    const res = await fetch(`/api/admin/kontrak/${k.userId}/perpanjang`, {
      method: "POST",
    });
    setMemproses(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPesan(data.error ?? "Gagal memperpanjang kontrak.");
      return;
    }
    const { kontrak } = await res.json();
    setPesan(
      `Kontrak ${k.nama} diperpanjang 1 tahun: ${formatTanggal(kontrak.mulaiKontrak)} — ${formatTanggal(kontrak.akhirKontrak)}. Kontrak Kerja 1 Tahun sudah tampil di portal karyawan untuk ditandatangani.`
    );
    muat();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">
        Kontrak Segera Habis (&lt; {BATAS_HARI_KONTRAK_HABIS} Hari)
      </h1>

      {pesan && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {pesan}
        </p>
      )}

      {daftar === null ? (
        <p className="text-slate-500">Memuat...</p>
      ) : daftar.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Tidak ada kontrak yang habis dalam {BATAS_HARI_KONTRAK_HABIS} hari
            ke depan.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Lokasi</th>
                <th className="py-2 pr-4">Telepon</th>
                <th className="py-2 pr-4">Mulai Kontrak</th>
                <th className="py-2 pr-4">Habis Kontrak</th>
                <th className="py-2 pr-4">Sisa</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((k) => {
                const sisa = sisaHari(k.akhirKontrak);
                return (
                  <tr key={k.userId} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium">{k.nama}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {k.lokasi ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {k.phone ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatTanggal(k.mulaiKontrak)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatTanggal(k.akhirKontrak)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          sisa <= 14
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {sisa} hari
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => perpanjang(k)}
                        disabled={memproses === k.userId}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {memproses === k.userId
                          ? "Memproses..."
                          : "Perpanjang 1 Tahun"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
