"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PERATURAN_TOKO,
  KONTRAK_PERCOBAAN,
  PERJANJIAN_KERJA,
} from "@/lib/dokumen-toko";
import DokumenMarkdown from "@/components/DokumenMarkdown";
import SignatureCanvas from "@/components/SignatureCanvas";

const LANGKAH = [
  {
    judul: "Peraturan Toko",
    keterangan: "Baca dan pahami peraturan Toko H. Marmo berikut ini.",
    isi: PERATURAN_TOKO,
  },
  {
    judul: "Kontrak Masa Percobaan (1 Bulan)",
    keterangan:
      "Berikut ketentuan kontrak kerja masa percobaan. Masa berlaku dan gaji akan ditetapkan oleh admin pada kontrak Anda.",
    isi: KONTRAK_PERCOBAAN,
  },
  {
    judul: "Perjanjian Kerja (PKWT)",
    keterangan:
      "Berikut perjanjian kerja waktu tertentu yang berlaku setelah masa percobaan selesai. Baca sampai selesai, lalu tanda tangani di bagian bawah.",
    isi: PERJANJIAN_KERJA,
  },
];

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function OnboardingPage() {
  const router = useRouter();
  const [langkah, setLangkah] = useState(0);
  const [ttd, setTtd] = useState<string | null>(null);
  const [sudahTtd, setSudahTtd] = useState<string | null>(null); // tanggal ttd jika sudah
  const [error, setError] = useState("");
  const [mengirim, setMengirim] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding/tanda-tangan")
      .then((r) => r.json())
      .then((d) => {
        if (d.tandaTanganPada) setSudahTtd(d.tandaTanganPada);
      });
  }, []);

  const l = LANGKAH[langkah];
  const terakhir = langkah === LANGKAH.length - 1;

  async function tandaTanganiDanSelesai() {
    setError("");
    if (!ttd) {
      setError("Silakan gambar tanda tangan Anda terlebih dahulu.");
      return;
    }
    setMengirim(true);
    const res = await fetch("/api/onboarding/tanda-tangan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tandaTangan: ttd }),
    });
    setMengirim(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menyimpan tanda tangan.");
      return;
    }
    router.push("/karyawan");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-600">
          Langkah {langkah + 1} dari {LANGKAH.length}
        </p>
        <div className="mt-2 flex gap-1.5">
          {LANGKAH.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= langkah ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <h1 className="mt-4 text-xl font-bold">{l.judul}</h1>
        <p className="mt-1 text-sm text-slate-500">{l.keterangan}</p>
        <div className="mt-4 max-h-[55vh] overflow-y-auto rounded-lg bg-slate-50 p-5">
          <DokumenMarkdown teks={l.isi} />
        </div>

        {terakhir && (
          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <h2 className="font-semibold">
              Tanda Tangan Persetujuan — PIHAK KEDUA
            </h2>
            {sudahTtd ? (
              <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                Anda sudah menandatangani persetujuan ini pada{" "}
                {formatTanggal(sudahTtd)}.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  Dengan menandatangani, Anda menyatakan telah membaca dan
                  menyetujui <strong>peraturan toko, kontrak masa percobaan,
                  dan perjanjian kerja</strong> di atas.
                </p>
                <div className="mt-3">
                  <SignatureCanvas onChange={setTtd} />
                </div>
                {error && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setLangkah(langkah - 1)}
            disabled={langkah === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            ← Kembali
          </button>
          {terakhir ? (
            sudahTtd ? (
              <button
                onClick={() => router.push("/karyawan")}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Selesai, Masuk Portal →
              </button>
            ) : (
              <button
                onClick={tandaTanganiDanSelesai}
                disabled={mengirim}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {mengirim ? "Menyimpan..." : "Tanda Tangani & Selesai →"}
              </button>
            )
          ) : (
            <button
              onClick={() => setLangkah(langkah + 1)}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Lanjut →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
