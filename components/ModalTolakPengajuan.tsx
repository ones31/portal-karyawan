"use client";

import { useState } from "react";

type Props = {
  judul: string; // mis. "Tolak izin Budi Santoso?"
  onBatal: () => void;
  onTolak: (feedback: string) => void | Promise<void>;
};

// Modal konfirmasi tolak izin/tukar libur dengan kolom feedback opsional.
// Feedback (kalau diisi) tersimpan di feedbackAdmin & ikut ke notifikasi push
// karyawan (lihat lib/approval.ts, prosesIzin/prosesTukarLibur).
export default function ModalTolakPengajuan({ judul, onBatal, onTolak }: Props) {
  const [feedback, setFeedback] = useState("");
  const [mengirim, setMengirim] = useState(false);

  async function konfirmasi() {
    setMengirim(true);
    await onTolak(feedback);
    setMengirim(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="font-semibold">{judul}</h2>
        <div className="mt-3">
          <label className="block text-sm font-medium">
            Feedback untuk karyawan (opsional)
          </label>
          <textarea
            autoFocus
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="Contoh: Sudah ada 2 orang izin di tanggal yang sama, silakan ajukan tanggal lain"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">
            Kalau diisi, karyawan akan melihatnya di riwayat pengajuan &amp;
            ikut disebut di notifikasi.
          </p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onBatal}
            disabled={mengirim}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={konfirmasi}
            disabled={mengirim}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {mengirim ? "Menolak..." : "Tolak Pengajuan"}
          </button>
        </div>
      </div>
    </div>
  );
}
