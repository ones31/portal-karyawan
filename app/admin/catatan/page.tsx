"use client";

import { useEffect, useState } from "react";
import { DAFTAR_LOKASI } from "@/lib/lokasi";
import {
  MAKS_ISI_CATATAN,
  MAKS_JUDUL_CATATAN,
  TUJUAN_SEMUA,
  tujuanLokasi,
} from "@/lib/catatan";

type Karyawan = { id: string; nama: string; lokasi: string | null };

type Penerima = {
  nama: string;
  lokasi: string | null;
  dibacaPada: string | null;
};

type CatatanTerkirim = {
  batchId: string;
  judul: string;
  isi: string;
  pengirim: string | null;
  createdAt: string;
  jumlahPenerima: number;
  jumlahDibaca: number;
  penerima: Penerima[];
};

function formatWaktu(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CatatanAdminPage() {
  const [daftarKaryawan, setDaftarKaryawan] = useState<Karyawan[]>([]);
  const [lokasiAkses, setLokasiAkses] = useState<string | null>(null);
  const [terkirim, setTerkirim] = useState<CatatanTerkirim[] | null>(null);
  const [dibuka, setDibuka] = useState<string | null>(null);

  const [tujuan, setTujuan] = useState("");
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [error, setError] = useState("");
  const [pesan, setPesan] = useState("");
  const [mengirim, setMengirim] = useState(false);

  async function muatTerkirim() {
    const res = await fetch("/api/admin/catatan");
    const data = await res.json();
    setTerkirim(data.catatan ?? []);
  }

  useEffect(() => {
    fetch("/api/admin/karyawan")
      .then((r) => r.json())
      .then((d) => {
        const list: Karyawan[] = (d.karyawan ?? [])
          .map((k: Karyawan) => ({ id: k.id, nama: k.nama, lokasi: k.lokasi }))
          .sort((a: Karyawan, b: Karyawan) => a.nama.localeCompare(b.nama));
        setDaftarKaryawan(list);
      });
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setLokasiAkses(d.user?.lokasiAkses ?? null));
    muatTerkirim();
  }, []);

  // Admin ber-lokasiAkses hanya boleh memilih lokasinya sendiri (ditegakkan juga di server)
  const lokasiTersedia = lokasiAkses
    ? DAFTAR_LOKASI.filter((l) => l === lokasiAkses)
    : DAFTAR_LOKASI;

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPesan("");
    if (!tujuan) {
      setError("Pilih penerima catatan terlebih dahulu.");
      return;
    }

    setMengirim(true);
    const res = await fetch("/api/admin/catatan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tujuan, judul, isi }),
    });
    setMengirim(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Gagal mengirim catatan.");
      return;
    }
    setPesan(
      `Catatan terkirim ke ${data.namaPenerima} (${data.jumlah} karyawan). Notifikasi sudah dikirim.`
    );
    setTujuan("");
    setJudul("");
    setIsi("");
    muatTerkirim();
  }

  async function tarikKembali(batchId: string, judulCatatan: string) {
    if (
      !confirm(
        `Tarik kembali catatan "${judulCatatan}"? Catatan akan hilang dari beranda karyawan.`
      )
    ) {
      return;
    }
    await fetch(`/api/admin/catatan/${batchId}`, { method: "DELETE" });
    muatTerkirim();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Catatan untuk Karyawan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kirim pesan atau pengumuman ke karyawan. Catatan tampil di beranda
          karyawan dan memunculkan notifikasi di HP mereka.
        </p>
      </div>

      <form onSubmit={kirim} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium">Kirim ke</label>
          <select
            required
            value={tujuan}
            onChange={(e) => setTujuan(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Pilih Penerima --</option>
            <option value={TUJUAN_SEMUA}>Semua Karyawan</option>
            {lokasiTersedia.map((l) => (
              <option key={l} value={tujuanLokasi(l)}>
                Semua Karyawan — {l}
              </option>
            ))}
            <option disabled>──────────</option>
            {daftarKaryawan.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
                {k.lokasi ? ` (${k.lokasi})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Judul</label>
          <input
            required
            maxLength={MAKS_JUDUL_CATATAN}
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Jadwal lembur Sabtu ini"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            {judul.length}/{MAKS_JUDUL_CATATAN} karakter
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">Isi Catatan</label>
          <textarea
            required
            rows={5}
            maxLength={MAKS_ISI_CATATAN}
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            placeholder="Tulis pesan lengkapnya di sini..."
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            {isi.length}/{MAKS_ISI_CATATAN} karakter
          </p>
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
          {mengirim ? "Mengirim..." : "Kirim Catatan"}
        </button>
      </form>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Catatan Terkirim</h2>
        {terkirim === null ? (
          <p className="mt-3 text-sm text-slate-500">Memuat...</p>
        ) : terkirim.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Belum ada catatan terkirim.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {terkirim.map((c) => (
              <li key={c.batchId} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{c.judul}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatWaktu(c.createdAt)} · oleh {c.pengirim ?? "—"} ·{" "}
                      <span
                        className={
                          c.jumlahDibaca === c.jumlahPenerima
                            ? "font-medium text-green-700"
                            : "font-medium text-amber-700"
                        }
                      >
                        {c.jumlahDibaca}/{c.jumlahPenerima} sudah membaca
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setDibuka(dibuka === c.batchId ? null : c.batchId)
                      }
                      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {dibuka === c.batchId ? "Tutup" : "Detail"}
                    </button>
                    <button
                      onClick={() => tarikKembali(c.batchId, c.judul)}
                      className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Tarik kembali
                    </button>
                  </div>
                </div>
                {dibuka === c.batchId && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-sm whitespace-pre-wrap text-slate-700">
                      {c.isi}
                    </p>
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-1 pr-4">Karyawan</th>
                            <th className="py-1 pr-4">Lokasi</th>
                            <th className="py-1">Dibaca</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.penerima.map((p) => (
                            <tr key={p.nama} className="border-b border-slate-100">
                              <td className="py-1 pr-4 font-medium">{p.nama}</td>
                              <td className="py-1 pr-4 text-slate-500">
                                {p.lokasi ?? "—"}
                              </td>
                              <td className="py-1">
                                {p.dibacaPada ? (
                                  <span className="text-green-700">
                                    {formatWaktu(p.dibacaPada)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Belum</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
