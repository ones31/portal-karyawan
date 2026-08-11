"use client";

import { useEffect, useState } from "react";
import { LABEL_JENIS_IZIN, type JenisIzin } from "@/lib/izin";
import ModalTolakPengajuan from "@/components/ModalTolakPengajuan";

type Izin = {
  id: string;
  jenis: JenisIzin;
  tanggalMulai: string;
  tanggalAkhir: string;
  alasan: string;
  suratDokter: string | null;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  feedbackAdmin: string | null;
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

export default function AdminIzinPage() {
  const [daftar, setDaftar] = useState<Izin[] | null>(null);
  const [tolakDialog, setTolakDialog] = useState<{ id: string; nama: string } | null>(
    null
  );

  async function muat() {
    const res = await fetch("/api/admin/izin");
    const { daftar } = await res.json();
    setDaftar(daftar ?? []);
  }

  useEffect(() => {
    muat();
  }, []);

  async function ubahStatus(
    id: string,
    status: "DISETUJUI" | "DITOLAK",
    feedback?: string
  ) {
    await fetch(`/api/admin/izin/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    muat();
  }

  async function konfirmasiTolak(feedback: string) {
    if (!tolakDialog) return;
    await ubahStatus(tolakDialog.id, "DITOLAK", feedback);
    setTolakDialog(null);
  }

  const jumlahMenunggu = daftar?.filter((i) => i.status === "MENUNGGU").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pengajuan Izin</h1>
        {jumlahMenunggu > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {jumlahMenunggu} menunggu
          </span>
        )}
      </div>

      {daftar === null ? (
        <p className="text-slate-500">Memuat...</p>
      ) : daftar.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Belum ada pengajuan izin.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Karyawan</th>
                <th className="py-2 pr-4">Jenis</th>
                <th className="py-2 pr-4">Tanggal</th>
                <th className="py-2 pr-4">Alasan</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((i) => (
                <tr key={i.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{i.user.nama}</p>
                    {i.user.lokasi && (
                      <p className="text-xs text-slate-500">{i.user.lokasi}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {LABEL_JENIS_IZIN[i.jenis]}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {i.tanggalMulai === i.tanggalAkhir
                      ? formatTanggal(i.tanggalMulai)
                      : `${formatTanggal(i.tanggalMulai)} — ${formatTanggal(i.tanggalAkhir)}`}
                  </td>
                  <td className="py-3 pr-4 max-w-56">
                    <span className="block truncate" title={i.alasan}>
                      {i.alasan || <span className="text-slate-400">—</span>}
                    </span>
                    {i.jenis === "SAKIT" && i.suratDokter && (
                      <a
                        href={`/api/izin/surat/${i.suratDokter}`}
                        target="_blank"
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        📎 Surat dokter
                      </a>
                    )}
                    {i.feedbackAdmin && (
                      <p className="mt-1 text-xs text-slate-500">
                        <span className="font-medium">Catatan:</span>{" "}
                        {i.feedbackAdmin}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[i.status]}`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {i.status === "MENUNGGU" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => ubahStatus(i.id, "DISETUJUI")}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() =>
                            setTolakDialog({ id: i.id, nama: i.user.nama })
                          }
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

      {tolakDialog && (
        <ModalTolakPengajuan
          judul={`Tolak izin ${tolakDialog.nama}?`}
          onBatal={() => setTolakDialog(null)}
          onTolak={konfirmasiTolak}
        />
      )}
    </div>
  );
}
