"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { JENIS_IZIN, LABEL_JENIS_IZIN, type JenisIzin } from "@/lib/izin";

type RekapKaryawan = {
  userId: string;
  nama: string;
  lokasi: string | null;
  jumlah: number;
  izin: {
    jenis: JenisIzin;
    tanggalMulai: string;
    tanggalAkhir: string;
    alasan: string;
    status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
    suratDokter: string | null;
  }[];
};

const PERIODE_LABEL: Record<string, string> = {
  bulan: "Bulan Ini",
  tahun: "Tahun Ini",
  semua: "Semua",
  custom: "Custom",
};

// Pilihan filter jenis: semua jenis izin + opsi gabungan "SEMUA"
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

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// yyyy-mm-dd untuk <input type="date"> (pakai waktu lokal, bukan UTC)
function isoTanggal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function IsiRekapIzin() {
  const router = useRouter();
  const params = useSearchParams();
  const jenisParam = params.get("jenis") ?? "SEMUA";
  const jenis = (JENIS_FILTER as readonly string[]).includes(jenisParam)
    ? jenisParam
    : "SEMUA";
  const periode = params.get("periode") ?? "bulan";
  const dari = params.get("dari") ?? "";
  const sampai = params.get("sampai") ?? "";

  const [rekap, setRekap] = useState<RekapKaryawan[] | null>(null);

  // Rentang tanggal khusus untuk export — default bulan berjalan, bisa diubah
  // bebas tanpa mengubah filter tampilan di atasnya.
  const [exportDari, setExportDari] = useState("");
  const [exportSampai, setExportSampai] = useState("");
  const [errorExport, setErrorExport] = useState("");

  useEffect(() => {
    const kini = new Date();
    setExportDari(isoTanggal(new Date(kini.getFullYear(), kini.getMonth(), 1)));
    setExportSampai(
      isoTanggal(new Date(kini.getFullYear(), kini.getMonth() + 1, 0))
    );
  }, []);

  // Kalau filter tampilan pakai periode custom, samakan rentang export dengannya
  useEffect(() => {
    if (periode === "custom" && dari && sampai) {
      setExportDari(dari);
      setExportSampai(sampai);
    }
  }, [periode, dari, sampai]);

  // Untuk periode custom, tunggu dari & sampai terisi sebelum fetch
  const customBelumLengkap = periode === "custom" && (!dari || !sampai);

  useEffect(() => {
    if (customBelumLengkap) {
      setRekap([]);
      return;
    }
    setRekap(null);
    const q = new URLSearchParams({ jenis, periode });
    if (periode === "custom") {
      q.set("dari", dari);
      q.set("sampai", sampai);
    }
    fetch(`/api/admin/rekap-izin?${q.toString()}`)
      .then((r) => r.json())
      .then((d) => setRekap(d.rekap ?? []));
  }, [jenis, periode, dari, sampai, customBelumLengkap]);

  const judul = LABEL_JENIS_FILTER[jenis];
  const totalIzin = rekap?.reduce((t, k) => t + k.jumlah, 0) ?? 0;

  function gantiParam(kunci: string, nilai: string) {
    const p = new URLSearchParams(params);
    p.set(kunci, nilai);
    router.replace(`/admin/rekap-izin?${p.toString()}`);
  }

  function unduhExcel() {
    setErrorExport("");
    if (!exportDari || !exportSampai) {
      setErrorExport("Isi tanggal dari dan sampai terlebih dahulu.");
      return;
    }
    if (new Date(exportSampai) < new Date(exportDari)) {
      setErrorExport("Tanggal sampai tidak boleh sebelum tanggal dari.");
      return;
    }
    const q = new URLSearchParams({
      jenis,
      dari: exportDari,
      sampai: exportSampai,
    });
    // Biarkan browser yang mengunduh — respons berupa file .xlsx
    window.location.href = `/api/admin/rekap-izin/export?${q.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">
          Rekap {judul} ({PERIODE_LABEL[periode]})
        </h1>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
            {JENIS_FILTER.map((j) => (
              <button
                key={j}
                onClick={() => gantiParam("jenis", j)}
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
            {Object.entries(PERIODE_LABEL).map(([nilai, label]) => (
              <button
                key={nilai}
                onClick={() => gantiParam("periode", nilai)}
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
      </div>

      {periode === "custom" && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dari}
              max={sampai || undefined}
              onChange={(e) => gantiParam("dari", e.target.value)}
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
              onChange={(e) => gantiParam("sampai", e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {dari && sampai && (
            <p className="pb-2 text-sm text-slate-500">
              Menampilkan izin {formatTanggal(dari)} — {formatTanggal(sampai)}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Export ke Excel</h2>
        <p className="mt-1 text-xs text-slate-500">
          Pilih rentang tanggal yang ingin diexport. Rentangnya ikut tercetak di
          dalam file dan di nama filenya. Jenis izin mengikuti filter di atas (
          <span className="font-medium">{judul}</span>).
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={exportDari}
              max={exportSampai || undefined}
              onChange={(e) => setExportDari(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={exportSampai}
              min={exportDari || undefined}
              onChange={(e) => setExportSampai(e.target.value)}
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
        {errorExport && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorExport}
          </p>
        )}
      </div>

      {rekap === null ? (
        <p className="text-slate-500">Memuat...</p>
      ) : rekap.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            {customBelumLengkap
              ? "Pilih tanggal dari dan sampai untuk menampilkan izin."
              : `Tidak ada ${judul.toLowerCase()} pada periode ini.`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {rekap.length} karyawan, total {totalIzin} pengajuan.
          </p>
          <div className="space-y-3">
            {rekap.map((k) => (
              <div key={k.userId} className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{k.nama}</p>
                    {k.lokasi && (
                      <p className="text-xs text-slate-500">{k.lokasi}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                    {k.jumlah}× izin
                  </span>
                </div>
                <ul className="mt-3 divide-y divide-slate-100 text-sm">
                  {k.izin.map((i, idx) => (
                    <li
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-2 py-2"
                    >
                      <div>
                        <span className="text-slate-700">
                          {formatTanggal(i.tanggalMulai)} —{" "}
                          {formatTanggal(i.tanggalAkhir)}
                        </span>
                        {jenis === "SEMUA" && (
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {LABEL_JENIS_IZIN[i.jenis]}
                          </span>
                        )}
                        <span className="ml-2 text-slate-500">{i.alasan}</span>
                        {i.jenis === "SAKIT" &&
                          (i.suratDokter ? (
                            <a
                              href={`/api/izin/surat/${i.suratDokter}`}
                              target="_blank"
                              className="ml-2 text-xs font-medium text-blue-600 hover:underline"
                            >
                              📎 Surat dokter
                            </a>
                          ) : (
                            <span className="ml-2 text-xs text-slate-400">
                              (tanpa surat dokter)
                            </span>
                          ))}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[i.status]}`}
                      >
                        {i.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function RekapIzinPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Memuat...</p>}>
      <IsiRekapIzin />
    </Suspense>
  );
}
