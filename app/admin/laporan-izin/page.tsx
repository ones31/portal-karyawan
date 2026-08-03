"use client";

import { useCallback, useEffect, useState } from "react";
import { JENIS_IZIN, LABEL_JENIS_IZIN, type JenisIzin } from "@/lib/izin";
import { periodeSiklus, isoTanggalLokal } from "@/lib/periode";

type IzinRekap = {
  jenis: JenisIzin;
  tanggalMulai: string;
  tanggalAkhir: string;
  alasan: string;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  suratDokter: string | null;
};

type RekapKaryawan = {
  userId: string;
  nama: string;
  lokasi: string | null;
  jumlah: number;
  izin: IzinRekap[];
};

// Sama dengan pilihan di panel export supaya isi layar & isi file selalu cocok
const JENIS_FILTER = ["SEMUA", ...JENIS_IZIN] as const;
const LABEL_JENIS_FILTER: Record<string, string> = {
  SEMUA: "Semua Jenis",
  ...LABEL_JENIS_IZIN,
};

const STATUS_STYLE: Record<string, string> = {
  MENUNGGU: "bg-amber-100 text-amber-700",
  DISETUJUI: "bg-green-100 text-green-700",
  DITOLAK: "bg-red-100 text-red-700",
};

function formatTanggal(s: string | Date) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function jumlahHariIzin(mulai: string, akhir: string) {
  return (
    Math.floor(
      (new Date(akhir).getTime() - new Date(mulai).getTime()) / 86400000
    ) + 1
  );
}

// "17 Jul 2026" kalau sehari, "30 Jul 2026 – 31 Jul 2026" kalau lebih
function rentangIzin(mulai: string, akhir: string) {
  const a = formatTanggal(mulai);
  const b = formatTanggal(akhir);
  return a === b ? a : `${a} – ${b}`;
}

export default function LaporanIzinPage() {
  // offset siklus gajian: 0 = periode berjalan (26 bulan ini – 25 bulan depan)
  const [offset, setOffset] = useState(0);
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [rentangKustom, setRentangKustom] = useState(false);
  const [jenis, setJenis] = useState<string>("SEMUA");
  const [tampilan, setTampilan] = useState<"rincian" | "karyawan">("rincian");

  const [rekap, setRekap] = useState<RekapKaryawan[] | null>(null);
  const [error, setError] = useState("");

  // Setiap offset berubah (dan selama belum diubah manual), isi ulang rentang
  // tanggal dari siklus gajian yang bersangkutan.
  useEffect(() => {
    if (rentangKustom) return;
    const p = periodeSiklus(offset);
    setDari(isoTanggalLokal(p.dari));
    setSampai(isoTanggalLokal(p.sampai));
  }, [offset, rentangKustom]);

  const muat = useCallback(async () => {
    if (!dari || !sampai) return;
    setRekap(null);
    setError("");
    const q = new URLSearchParams({ jenis, periode: "custom", dari, sampai });
    const res = await fetch(`/api/admin/rekap-izin?${q.toString()}`);
    if (!res.ok) {
      setError("Gagal memuat data laporan.");
      setRekap([]);
      return;
    }
    const d = await res.json();
    setRekap(d.rekap ?? []);
  }, [jenis, dari, sampai]);

  useEffect(() => {
    muat();
  }, [muat]);

  function unduhExcel() {
    if (!dari || !sampai) return;
    const q = new URLSearchParams({ jenis, dari, sampai });
    window.location.href = `/api/admin/rekap-izin/export?${q.toString()}`;
  }

  function gantiPeriode(arah: -1 | 1) {
    setRentangKustom(false);
    setOffset((o) => o + arah);
  }

  function kembaliKePeriodeBerjalan() {
    setRentangKustom(false);
    setOffset(0);
  }

  // Daftar rincian (mirip sheet "Rekap Izin" di file Excel), diurutkan terbaru dulu
  const rincian = (rekap ?? [])
    .flatMap((k) =>
      k.izin.map((i) => ({ nama: k.nama, lokasi: k.lokasi, ...i }))
    )
    .sort(
      (a, b) =>
        new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime()
    );

  const totalIzin = rincian.length;
  const totalHari = rincian.reduce(
    (t, i) => t + jumlahHariIzin(i.tanggalMulai, i.tanggalAkhir),
    0
  );
  const labelPeriodeAktif = rentangKustom
    ? `${formatTanggal(dari)} – ${formatTanggal(sampai)}`
    : periodeSiklus(offset).label;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Laporan Izin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Data yang sama dengan file export Excel. Default menampilkan periode
          gajian berjalan (tanggal 26 sampai 25 bulan berikutnya).
        </p>
      </div>

      {/* Pemilih periode */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => gantiPeriode(-1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← Periode Sebelumnya
          </button>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            {labelPeriodeAktif}
          </span>
          <button
            onClick={() => gantiPeriode(1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Periode Berikutnya →
          </button>
          {(offset !== 0 || rentangKustom) && (
            <button
              onClick={kembaliKePeriodeBerjalan}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Kembali ke periode berjalan
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dari}
              max={sampai || undefined}
              onChange={(e) => {
                setRentangKustom(true);
                setDari(e.target.value);
              }}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={sampai}
              min={dari || undefined}
              onChange={(e) => {
                setRentangKustom(true);
                setSampai(e.target.value);
              }}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={unduhExcel}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            ⬇ Download Excel
          </button>
        </div>
      </div>

      {/* Filter jenis + pilihan tampilan */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
          {JENIS_FILTER.map((j) => (
            <button
              key={j}
              onClick={() => setJenis(j)}
              className={`rounded-md px-3 py-1 font-medium ${
                jenis === j
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {LABEL_JENIS_FILTER[j]}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
          {(
            [
              ["rincian", "Rincian"],
              ["karyawan", "Per Karyawan"],
            ] as const
          ).map(([nilai, label]) => (
            <button
              key={nilai}
              onClick={() => setTampilan(nilai)}
              className={`rounded-md px-3 py-1 font-medium ${
                tampilan === nilai
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {rekap === null ? (
        <p className="text-slate-500">Memuat...</p>
      ) : totalIzin === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Tidak ada pengajuan izin pada periode ini.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {rekap.length} karyawan · {totalIzin} pengajuan · {totalHari} hari
            total.
          </p>

          {tampilan === "rincian" ? (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3">No</th>
                      <th className="py-2 pr-3">Nama Karyawan</th>
                      <th className="py-2 pr-3">Lokasi</th>
                      <th className="py-2 pr-3">Jenis Izin</th>
                      <th className="py-2 pr-3 whitespace-nowrap">Tanggal</th>
                      <th className="py-2 pr-3">Hari</th>
                      <th className="py-2 pr-3">Alasan</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Surat Dokter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincian.map((i, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="py-2 pr-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 pr-3 font-medium whitespace-nowrap">
                          {i.nama}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-slate-500">
                          {i.lokasi ?? "—"}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {LABEL_JENIS_IZIN[i.jenis]}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {rentangIzin(i.tanggalMulai, i.tanggalAkhir)}
                        </td>
                        <td className="py-2 pr-3 text-center">
                          {jumlahHariIzin(i.tanggalMulai, i.tanggalAkhir)}
                        </td>
                        <td className="py-2 pr-3">
                          <span className="block max-w-64 truncate" title={i.alasan}>
                            {i.alasan || "—"}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[i.status]}`}
                          >
                            {i.status}
                          </span>
                        </td>
                        <td className="py-2 whitespace-nowrap">
                          {i.suratDokter ? (
                            <a
                              href={`/api/izin/surat/${i.suratDokter}`}
                              target="_blank"
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              📎 Lihat
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3">No</th>
                      <th className="py-2 pr-3">Nama Karyawan</th>
                      <th className="py-2 pr-3">Lokasi</th>
                      <th className="py-2 pr-3">Jumlah Izin</th>
                      <th className="py-2 pr-3">Total Hari</th>
                      <th className="py-2">Tanggal Izin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rekap]
                      .sort(
                        (a, b) =>
                          b.jumlah - a.jumlah || a.nama.localeCompare(b.nama)
                      )
                      .map((k, idx) => (
                        <tr key={k.userId} className="border-b border-slate-100">
                          <td className="py-2 pr-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 pr-3 font-medium whitespace-nowrap">
                            {k.nama}
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap text-slate-500">
                            {k.lokasi ?? "—"}
                          </td>
                          <td className="py-2 pr-3 text-center">{k.jumlah}</td>
                          <td className="py-2 pr-3 text-center">
                            {k.izin.reduce(
                              (t, i) =>
                                t + jumlahHariIzin(i.tanggalMulai, i.tanggalAkhir),
                              0
                            )}
                          </td>
                          <td className="py-2 text-slate-600">
                            {[...k.izin]
                              .sort(
                                (a, b) =>
                                  new Date(a.tanggalMulai).getTime() -
                                  new Date(b.tanggalMulai).getTime()
                              )
                              .map((i) =>
                                rentangIzin(i.tanggalMulai, i.tanggalAkhir)
                              )
                              .join(", ")}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
