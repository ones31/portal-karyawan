"use client";

import { useEffect, useState } from "react";

type TukarLibur = {
  id: string;
  tanggalLibur: string;
  tukarDengan: string;
  tanggalPengganti: string | null;
  keterangan: string | null;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  user: { nama: string; lokasi: string | null };
};

const STATUS_STYLE: Record<string, string> = {
  MENUNGGU: "bg-amber-100 text-amber-700",
  DISETUJUI: "bg-green-100 text-green-700",
  DITOLAK: "bg-red-100 text-red-700",
};

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminTukarLiburPage() {
  const [daftar, setDaftar] = useState<TukarLibur[] | null>(null);

  async function muat() {
    const res = await fetch("/api/admin/tukar-libur");
    const { daftar } = await res.json();
    setDaftar(daftar ?? []);
  }

  useEffect(() => {
    muat();
  }, []);

  async function ubahStatus(id: string, status: "DISETUJUI" | "DITOLAK") {
    await fetch(`/api/admin/tukar-libur/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    muat();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Pengajuan Tukar Libur</h1>

      {daftar === null ? (
        <p className="text-slate-500">Memuat...</p>
      ) : daftar.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Belum ada pengajuan tukar libur.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Karyawan</th>
                <th className="py-2 pr-4">Tgl Libur Ditukar</th>
                <th className="py-2 pr-4">Ditukar Dengan</th>
                <th className="py-2 pr-4">Libur Pengganti</th>
                <th className="py-2 pr-4">Keterangan</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{t.user.nama}</p>
                    {t.user.lokasi && (
                      <p className="text-xs text-slate-500">{t.user.lokasi}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {formatTanggal(t.tanggalLibur)}
                  </td>
                  <td className="py-3 pr-4">{t.tukarDengan}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {t.tanggalPengganti ? (
                      formatTanggal(t.tanggalPengganti)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 max-w-48 truncate" title={t.keterangan ?? ""}>
                    {t.keterangan ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {t.status === "MENUNGGU" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => ubahStatus(t.id, "DISETUJUI")}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => ubahStatus(t.id, "DITOLAK")}
                          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
