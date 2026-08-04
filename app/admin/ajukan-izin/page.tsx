"use client";

import { useEffect, useRef, useState } from "react";
import {
  JENIS_SATU_TANGGAL,
  LABEL_JENIS_IZIN,
  MAKS_HARI_MENIKAH,
  jumlahHari,
  type JenisIzin,
} from "@/lib/izin";

type Karyawan = {
  id: string;
  nama: string;
  lokasi: string | null;
};

export default function AjukanIzinAdminPage() {
  const [daftarKaryawan, setDaftarKaryawan] = useState<Karyawan[]>([]);
  const [karyawanId, setKaryawanId] = useState("");

  const [jenis, setJenis] = useState<JenisIzin>("SAKIT");
  const [tipeSakit, setTipeSakit] = useState<"TANPA" | "DENGAN">("TANPA");
  const [file, setFile] = useState<File | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [alasan, setAlasan] = useState("");

  const [error, setError] = useState("");
  const [pesan, setPesan] = useState("");
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    fetch("/api/admin/karyawan")
      .then((r) => r.json())
      .then((d) => {
        const list: Karyawan[] = (d.karyawan ?? [])
          .map((k: Karyawan) => ({ id: k.id, nama: k.nama, lokasi: k.lokasi }))
          .sort((a: Karyawan, b: Karyawan) => a.nama.localeCompare(b.nama));
        setDaftarKaryawan(list);
      });
  }, []);

  async function ajukan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPesan("");
    if (!karyawanId) {
      setError("Pilih karyawan terlebih dahulu.");
      return;
    }
    if (jenis === "SAKIT" && tipeSakit === "DENGAN" && !file) {
      setError("Silakan pilih file surat dokter terlebih dahulu.");
      return;
    }
    const akhir = JENIS_SATU_TANGGAL.includes(jenis) ? tanggalMulai : tanggalAkhir;
    if (
      jenis === "MENIKAH" &&
      tanggalMulai &&
      akhir &&
      jumlahHari(tanggalMulai, akhir) > MAKS_HARI_MENIKAH
    ) {
      setError(`Izin menikah maksimal ${MAKS_HARI_MENIKAH} hari.`);
      return;
    }

    setMengirim(true);
    const fd = new FormData();
    fd.append("jenis", jenis);
    fd.append("tanggalMulai", tanggalMulai);
    fd.append("tanggalAkhir", akhir);
    fd.append("alasan", alasan);
    if (jenis === "SAKIT" && tipeSakit === "DENGAN" && file) {
      fd.append("suratDokter", file);
    }
    const namaKaryawan = daftarKaryawan.find((k) => k.id === karyawanId)?.nama ?? "";
    const res = await fetch(`/api/admin/karyawan/${karyawanId}/izin`, {
      method: "POST",
      body: fd,
    });
    setMengirim(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal mengajukan izin.");
      return;
    }
    setPesan(`Izin untuk ${namaKaryawan} berhasil diajukan, berstatus Menunggu.`);
    setKaryawanId("");
    setJenis("SAKIT");
    setTipeSakit("TANPA");
    setFile(null);
    if (inputFileRef.current) inputFileRef.current.value = "";
    setTanggalMulai("");
    setTanggalAkhir("");
    setAlasan("");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-bold">Ajukan Izin untuk Karyawan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Untuk karyawan yang terkendala membuka portal sendiri (mis. HP
          rusak/tidak ada sinyal). Pengajuan tetap berstatus Menunggu, perlu
          disetujui/ditolak seperti pengajuan lainnya.
        </p>
      </div>

      <form onSubmit={ajukan} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium">Karyawan</label>
          <select
            required
            value={karyawanId}
            onChange={(e) => setKaryawanId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Pilih Karyawan --</option>
            {daftarKaryawan.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
                {k.lokasi ? ` (${k.lokasi})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Jenis Pengajuan</label>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as JenisIzin)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            {Object.entries(LABEL_JENIS_IZIN).map(([nilai, label]) => (
              <option key={nilai} value={nilai}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {jenis === "SAKIT" && (
          <div>
            <label className="block text-sm font-medium">Tipe Izin Sakit</label>
            <div className="mt-1 space-y-2">
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-checked:border-blue-500 has-checked:bg-blue-50">
                <input
                  type="radio"
                  name="tipeSakit"
                  checked={tipeSakit === "TANPA"}
                  onChange={() => {
                    setTipeSakit("TANPA");
                    setFile(null);
                    if (inputFileRef.current) inputFileRef.current.value = "";
                  }}
                />
                Tanpa surat dokter
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-checked:border-blue-500 has-checked:bg-blue-50">
                <input
                  type="radio"
                  name="tipeSakit"
                  checked={tipeSakit === "DENGAN"}
                  onChange={() => setTipeSakit("DENGAN")}
                />
                Dengan surat dokter
              </label>
            </div>
            {tipeSakit === "DENGAN" && (
              <div className="mt-2">
                <label className="block text-sm font-medium">
                  Upload Surat Dokter (PDF/JPG/PNG, maks 5 MB)
                </label>
                <input
                  ref={inputFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                />
              </div>
            )}
          </div>
        )}

        {JENIS_SATU_TANGGAL.includes(jenis) ? (
          <div>
            <label className="block text-sm font-medium">Tanggal</label>
            <input
              type="date"
              required
              value={tanggalMulai}
              onChange={(e) => setTanggalMulai(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Dari Tanggal</label>
              <input
                type="date"
                required
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Sampai Tanggal</label>
              <input
                type="date"
                required
                value={tanggalAkhir}
                onChange={(e) => setTanggalAkhir(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}
        {jenis === "MENIKAH" && (
          <p className="text-xs text-slate-500">
            Izin menikah maksimal {MAKS_HARI_MENIKAH} hari sesuai perjanjian kerja.
          </p>
        )}

        <div>
          <label className="block text-sm font-medium">
            Alasan{jenis === "TUGAS_NEGARA" ? " (opsional)" : ""}
          </label>
          <textarea
            required={jenis !== "TUGAS_NEGARA"}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {pesan && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{pesan}</p>
        )}
        <button
          type="submit"
          disabled={mengirim}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mengirim ? "Mengirim..." : "Ajukan Izin"}
        </button>
      </form>
    </div>
  );
}
