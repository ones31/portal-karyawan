"use client";

import { useEffect, useState } from "react";
import SignatureCanvas from "@/components/SignatureCanvas";
import DokumenMarkdown from "@/components/DokumenMarkdown";

type Kontrak = {
  mulaiKontrak: string;
  akhirKontrak: string;
  isiKontrak: string;
  tandaTangan: string | null;
  setujuTataTertib: boolean;
  ditandatanganiPada: string | null;
};

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function KontrakPage() {
  const [kontrak, setKontrak] = useState<Kontrak | null>(null);
  const [loading, setLoading] = useState(true);
  const [ttd, setTtd] = useState<string | null>(null);
  const [setuju, setSetuju] = useState(false);
  const [error, setError] = useState("");
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    fetch("/api/kontrak")
      .then((r) => r.json())
      .then(({ kontrak }) => setKontrak(kontrak))
      .finally(() => setLoading(false));
  }, []);

  async function tandaTangani() {
    setError("");
    if (!ttd) {
      setError("Silakan gambar tanda tangan Anda terlebih dahulu.");
      return;
    }
    if (!setuju) {
      setError("Anda harus menyetujui tata tertib perusahaan.");
      return;
    }
    setMengirim(true);
    const res = await fetch("/api/kontrak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tandaTangan: ttd, setujuTataTertib: setuju }),
    });
    setMengirim(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menandatangani kontrak.");
      return;
    }
    const { kontrak } = await res.json();
    setKontrak(kontrak);
  }

  if (loading) return <p className="text-slate-500">Memuat...</p>;

  if (!kontrak) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Kontrak Kerja</h1>
        <p className="mt-2 text-slate-500">
          Kontrak Anda belum dibuat oleh admin. Silakan hubungi HR.
        </p>
      </div>
    );
  }

  const sudahTtd = !!kontrak.ditandatanganiPada;

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Kontrak Kerja</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              sudahTtd
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {sudahTtd ? "Sudah ditandatangani" : "Belum ditandatangani"}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Masa berlaku kontrak:{" "}
          <strong className="text-slate-700">
            {formatTanggal(kontrak.mulaiKontrak)} —{" "}
            {formatTanggal(kontrak.akhirKontrak)}
          </strong>
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 p-5">
          <DokumenMarkdown teks={kontrak.isiKontrak} />
        </div>
      </div>

      {sudahTtd ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Tanda Tangan Anda</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ditandatangani pada {formatTanggal(kontrak.ditandatanganiPada!)}.
            Peraturan &amp; tata tertib toko telah disetujui.
          </p>
          {kontrak.tandaTangan && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kontrak.tandaTangan}
              alt="Tanda tangan"
              className="mt-3 h-32 rounded-lg border border-slate-200 bg-white"
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Tanda Tangani Kontrak</h2>
          <div className="mt-4">
            <SignatureCanvas onChange={setTtd} />
          </div>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={setuju}
              onChange={(e) => setSetuju(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Saya telah membaca dan <strong>menyetujui isi kontrak kerja
              serta peraturan &amp; tata tertib toko</strong> di atas.
            </span>
          </label>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            onClick={tandaTangani}
            disabled={mengirim}
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {mengirim ? "Mengirim..." : "Tanda Tangani Kontrak"}
          </button>
        </div>
      )}
    </div>
  );
}
