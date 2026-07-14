"use client";

import { useEffect, useRef, useState } from "react";
import { LABEL_JENIS_IZIN, MAKS_HARI_MENIKAH, jumlahHari } from "@/lib/izin";

type Izin = {
  id: string;
  jenis: "SAKIT" | "LAINNYA" | "TUGAS_NEGARA";
  tanggalMulai: string;
  tanggalAkhir: string;
  alasan: string;
  suratDokter: string | null;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  createdAt: string;
};

type TukarLibur = {
  id: string;
  tanggalLibur: string;
  tukarDengan: string;
  tanggalPengganti: string | null;
  keterangan: string | null;
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  createdAt: string;
};

// Item riwayat gabungan (izin + tukar libur)
type Riwayat =
  | ({ tipe: "IZIN" } & Izin)
  | ({ tipe: "TUKAR" } & TukarLibur);

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

export default function IzinPage() {
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);

  // Jenis pengajuan: SAKIT / LAINNYA / TUGAS_NEGARA / MENIKAH / TUKAR (tukar libur)
  const [jenis, setJenis] = useState<
    "SAKIT" | "LAINNYA" | "TUGAS_NEGARA" | "MENIKAH" | "TUKAR"
  >("SAKIT");

  // Field izin sakit / lain-lain
  const [tipeSakit, setTipeSakit] = useState<"TANPA" | "DENGAN">("TANPA");
  const [file, setFile] = useState<File | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [alasan, setAlasan] = useState("");

  // Field tukar libur
  const [tanggalLibur, setTanggalLibur] = useState("");
  const [tukarDengan, setTukarDengan] = useState("");
  const [tanggalPengganti, setTanggalPengganti] = useState("");
  const [keteranganTukar, setKeteranganTukar] = useState("");

  const [error, setError] = useState("");
  const [mengirim, setMengirim] = useState(false);

  async function muat() {
    const [rIzin, rTukar] = await Promise.all([
      fetch("/api/izin").then((r) => r.json()),
      fetch("/api/tukar-libur").then((r) => r.json()),
    ]);
    const gabung: Riwayat[] = [
      ...(rIzin.izin ?? []).map((i: Izin) => ({ tipe: "IZIN" as const, ...i })),
      ...(rTukar.tukarLibur ?? []).map((t: TukarLibur) => ({
        tipe: "TUKAR" as const,
        ...t,
      })),
    ];
    gabung.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setRiwayat(gabung);
  }

  useEffect(() => {
    muat();
  }, []);

  async function ajukan(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // --- Tukar libur ---
    if (jenis === "TUKAR") {
      if (!tanggalLibur || !tukarDengan) {
        setError("Tanggal libur yang ditukar dan nama rekan wajib diisi.");
        return;
      }
      setMengirim(true);
      const res = await fetch("/api/tukar-libur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalLibur,
          tukarDengan,
          tanggalPengganti,
          keterangan: keteranganTukar,
        }),
      });
      setMengirim(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal mengajukan tukar libur.");
        return;
      }
      setTanggalLibur("");
      setTukarDengan("");
      setTanggalPengganti("");
      setKeteranganTukar("");
      muat();
      return;
    }

    // --- Izin sakit / lain-lain / tugas negara / menikah ---
    if (jenis === "SAKIT" && tipeSakit === "DENGAN" && !file) {
      setError("Silakan pilih file surat dokter terlebih dahulu.");
      return;
    }
    // Tugas Negara hanya 1 hari: tanggal akhir = tanggal mulai
    const akhir = jenis === "TUGAS_NEGARA" ? tanggalMulai : tanggalAkhir;
    if (
      jenis === "MENIKAH" &&
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
    const res = await fetch("/api/izin", { method: "POST", body: fd });
    setMengirim(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal mengajukan izin.");
      return;
    }
    setTanggalMulai("");
    setTanggalAkhir("");
    setAlasan("");
    setFile(null);
    setTipeSakit("TANPA");
    if (inputFileRef.current) inputFileRef.current.value = "";
    muat();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
        <h1 className="text-xl font-bold">Ajukan Izin</h1>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span aria-hidden>⚠️</span>
          <p>
            <strong>Pengingat:</strong> Hindari izin di hari yang sama dengan
            partner yang libur.
          </p>
        </div>
        <form onSubmit={ajukan} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Jenis Pengajuan</label>
            <select
              value={jenis}
              onChange={(e) =>
                setJenis(
                  e.target.value as
                    | "SAKIT"
                    | "LAINNYA"
                    | "TUGAS_NEGARA"
                    | "MENIKAH"
                    | "TUKAR"
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="SAKIT">Izin Sakit</option>
              <option value="LAINNYA">Izin Lain-lain</option>
              <option value="MENIKAH">Izin Menikah</option>
              <option value="TUGAS_NEGARA">Tugas Negara</option>
              <option value="TUKAR">Tukar Libur</option>
            </select>
          </div>

          {/* ===== Tukar Libur ===== */}
          {jenis === "TUKAR" ? (
            <>
              <div>
                <label className="block text-sm font-medium">
                  Tanggal Libur yang Ditukar
                </label>
                <input
                  type="date"
                  required
                  value={tanggalLibur}
                  onChange={(e) => setTanggalLibur(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Ditukar dengan (nama rekan)
                </label>
                <input
                  type="text"
                  required
                  value={tukarDengan}
                  onChange={(e) => setTukarDengan(e.target.value)}
                  placeholder="Nama karyawan yang diajak tukar libur"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Tanggal Libur Pengganti (opsional)
                </label>
                <input
                  type="date"
                  value={tanggalPengganti}
                  onChange={(e) => setTanggalPengganti(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Keterangan (opsional)
                </label>
                <textarea
                  value={keteranganTukar}
                  onChange={(e) => setKeteranganTukar(e.target.value)}
                  rows={2}
                  placeholder="Alasan tukar libur"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* ===== Izin Sakit / Lain-lain ===== */}
              {jenis === "SAKIT" && (
                <div>
                  <label className="block text-sm font-medium">
                    Tipe Izin Sakit
                  </label>
                  <div className="mt-1 space-y-2">
                    <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-checked:border-blue-500 has-checked:bg-blue-50">
                      <input
                        type="radio"
                        name="tipeSakit"
                        checked={tipeSakit === "TANPA"}
                        onChange={() => {
                          setTipeSakit("TANPA");
                          setFile(null);
                          if (inputFileRef.current)
                            inputFileRef.current.value = "";
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
                      {file && (
                        <p className="mt-1 text-xs text-slate-500">
                          File terpilih: {file.name}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Sesuai tata tertib, izin sakit lebih dari 1 hari wajib
                    melampirkan surat dokter.
                  </p>
                  {tipeSakit === "TANPA" && (
                    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      ⚠️ Sering izin tanpa surat dokter dapat mengurangi
                      kerajinan kerja.
                    </p>
                  )}
                </div>
              )}

              {jenis === "LAINNYA" && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  ⚠️ Sering izin dapat mengurangi kerajinan kerja.
                </p>
              )}

              {jenis === "TUGAS_NEGARA" ? (
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
                    <label className="block text-sm font-medium">
                      Dari Tanggal
                    </label>
                    <input
                      type="date"
                      required
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">
                      Sampai Tanggal
                    </label>
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
                  Izin menikah maksimal {MAKS_HARI_MENIKAH} hari sesuai
                  perjanjian kerja.
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
                  placeholder={
                    jenis === "SAKIT"
                      ? "Contoh: demam, disarankan istirahat oleh dokter"
                      : jenis === "MENIKAH"
                        ? "Contoh: pernikahan sendiri"
                        : jenis === "TUGAS_NEGARA"
                          ? ""
                          : "Contoh: keperluan keluarga"
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={mengirim}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mengirim
              ? "Mengirim..."
              : jenis === "TUKAR"
                ? "Ajukan Tukar Libur"
                : "Ajukan Izin"}
          </button>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-3">
        <h2 className="text-xl font-bold">Riwayat Pengajuan</h2>
        {riwayat.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Belum ada pengajuan.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {riwayat.map((r) => (
              <li
                key={`${r.tipe}-${r.id}`}
                className="flex items-start justify-between gap-3 py-3"
              >
                {r.tipe === "IZIN" ? (
                  <div>
                    <p className="font-medium">
                      {LABEL_JENIS_IZIN[r.jenis]}
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        {r.tanggalMulai === r.tanggalAkhir
                          ? formatTanggal(r.tanggalMulai)
                          : `${formatTanggal(r.tanggalMulai)} — ${formatTanggal(r.tanggalAkhir)}`}
                      </span>
                    </p>
                    {r.alasan && (
                      <p className="mt-0.5 text-sm text-slate-500">{r.alasan}</p>
                    )}
                    {r.jenis === "SAKIT" &&
                      (r.suratDokter ? (
                        <a
                          href={`/api/izin/surat/${r.suratDokter}`}
                          target="_blank"
                          className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                        >
                          📎 Lihat surat dokter
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-slate-400">
                          Tanpa surat dokter
                        </p>
                      ))}
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">
                      Tukar Libur
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        {formatTanggal(r.tanggalLibur)} ↔ {r.tukarDengan}
                      </span>
                    </p>
                    {r.tanggalPengganti && (
                      <p className="mt-0.5 text-sm text-slate-500">
                        Libur pengganti: {formatTanggal(r.tanggalPengganti)}
                      </p>
                    )}
                    {r.keterangan && (
                      <p className="mt-0.5 text-sm text-slate-500">
                        {r.keterangan}
                      </p>
                    )}
                  </div>
                )}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
