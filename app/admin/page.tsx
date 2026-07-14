"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";
import { LABEL_JENIS_IZIN } from "@/lib/izin";

type Statistik = {
  totalKaryawan: number;
  izinSakit: number;
  izinLainnya: number;
  izinMenunggu: number;
  tukarLiburMenunggu: number;
  kontrakSegeraHabis: number;
};

type IzinTerbaru = {
  id: string;
  jenis: "SAKIT" | "LAINNYA" | "TUGAS_NEGARA" | "MENIKAH";
  tanggalMulai: string;
  tanggalAkhir: string;
  alasan: string;
  suratDokter: string | null;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  user: { nama: string };
};

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const PERIODE_LABEL: Record<string, string> = {
  bulan: "Bulan Ini",
  tahun: "Tahun Ini",
  semua: "Semua",
};

export default function AdminDashboard() {
  const [stat, setStat] = useState<Statistik | null>(null);
  const [izin, setIzin] = useState<IzinTerbaru[]>([]);
  const [periode, setPeriode] = useState("bulan");

  async function muat(p = periode) {
    const res = await fetch(`/api/admin/dashboard?periode=${p}`);
    const data = await res.json();
    setStat(data.statistik);
    setIzin(data.izinTerbaru ?? []);
  }

  useEffect(() => {
    muat(periode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode]);

  async function ubahStatus(id: string, status: "DISETUJUI" | "DITOLAK") {
    await fetch(`/api/admin/izin/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    muat();
  }

  if (!stat) return <p className="text-slate-500">Memuat...</p>;

  const labelPeriode = PERIODE_LABEL[periode];
  const kartu = [
    {
      label: "Total Karyawan",
      nilai: stat.totalKaryawan,
      warna: "text-blue-600",
      href: "/admin/karyawan",
    },
    {
      label: `Izin Sakit (${labelPeriode})`,
      nilai: stat.izinSakit,
      warna: "text-red-600",
      href: `/admin/rekap-izin?jenis=SAKIT&periode=${periode}`,
    },
    {
      label: `Izin Lain-lain (${labelPeriode})`,
      nilai: stat.izinLainnya,
      warna: "text-purple-600",
      href: `/admin/rekap-izin?jenis=LAINNYA&periode=${periode}`,
    },
    { label: "Izin Menunggu", nilai: stat.izinMenunggu, warna: "text-amber-600" },
    {
      label: "Tukar Libur Menunggu",
      nilai: stat.tukarLiburMenunggu,
      warna: "text-teal-600",
      href: "/admin/tukar-libur",
    },
    {
      label: `Kontrak Habis < ${BATAS_HARI_KONTRAK_HABIS} Hari`,
      nilai: stat.kontrakSegeraHabis,
      warna: "text-orange-600",
      href: "/admin/kontrak-habis",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Dashboard Admin</h1>
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
          {Object.entries(PERIODE_LABEL).map(([nilai, label]) => (
            <button
              key={nilai}
              onClick={() => setPeriode(nilai)}
              className={`rounded-md px-3 py-1 font-medium ${
                periode === nilai
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kartu.map((k) =>
          k.href ? (
            <Link
              key={k.label}
              href={k.href}
              className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-blue-200"
            >
              <p className={`text-3xl font-bold ${k.warna}`}>{k.nilai}</p>
              <p className="mt-1 text-sm text-slate-500">{k.label}</p>
              <p className="mt-1 text-xs text-blue-600">Lihat daftar →</p>
            </Link>
          ) : (
            <div key={k.label} className="rounded-xl bg-white p-4 shadow-sm">
              <p className={`text-3xl font-bold ${k.warna}`}>{k.nilai}</p>
              <p className="mt-1 text-sm text-slate-500">{k.label}</p>
            </div>
          )
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Pengajuan Izin Terbaru</h2>
        {izin.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Belum ada pengajuan izin.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
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
                {izin.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium">{i.user.nama}</td>
                    <td className="py-2 pr-4">
                      {LABEL_JENIS_IZIN[i.jenis]}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatTanggal(i.tanggalMulai)} — {formatTanggal(i.tanggalAkhir)}
                    </td>
                    <td className="py-2 pr-4 max-w-48">
                      <span className="block truncate" title={i.alasan}>
                        {i.alasan}
                      </span>
                      {i.suratDokter && (
                        <a
                          href={`/api/izin/surat/${i.suratDokter}`}
                          target="_blank"
                          className="text-xs font-medium text-blue-600 hover:underline"
                        >
                          📎 Surat dokter
                        </a>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          i.status === "MENUNGGU"
                            ? "bg-amber-100 text-amber-700"
                            : i.status === "DISETUJUI"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {i.status === "MENUNGGU" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => ubahStatus(i.id, "DISETUJUI")}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => ubahStatus(i.id, "DITOLAK")}
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
    </div>
  );
}
