"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DAFTAR_AGAMA = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];
const DAFTAR_STATUS = ["Belum Menikah", "Menikah", "Cerai"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const TAHUN_SEKARANG = new Date().getFullYear();
// Usia kerja wajar: 65 tahun ke belakang
const DAFTAR_TAHUN = Array.from(
  { length: 65 },
  (_, i) => TAHUN_SEKARANG - 15 - i
);

const inputCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none";

export default function DaftarPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nama: "",
    tempatLahir: "",
    tglLahir: "",
    blnLahir: "",
    thnLahir: "",
    agama: "",
    alamat: "",
    namaAyahIbu: "",
    telepon: "",
    statusNikah: "",
    merokok: "",
    password: "",
    konfirmasi: "",
  });
  const [setuju, setSetuju] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function ubah(kunci: string, nilai: string) {
    setForm((f) => ({ ...f, [kunci]: nilai }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.konfirmasi) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    if (!setuju) {
      setError("Anda harus menyetujui pernyataan kebenaran data.");
      return;
    }
    // Gabungkan dropdown tanggal/bulan/tahun dan pastikan tanggalnya valid
    const tanggalLahir = `${form.thnLahir}-${form.blnLahir.padStart(2, "0")}-${form.tglLahir.padStart(2, "0")}`;
    const cek = new Date(tanggalLahir);
    if (
      isNaN(cek.getTime()) ||
      cek.getDate() !== Number(form.tglLahir) ||
      cek.getMonth() + 1 !== Number(form.blnLahir)
    ) {
      setError("Tanggal lahir tidak valid. Periksa kembali tanggal, bulan, dan tahunnya.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/daftar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tanggalLahir, setujuPernyataan: setuju }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal mendaftar.");
      return;
    }
    // Sudah otomatis login — tampilkan peraturan toko & dokumen kontrak dulu
    router.push("/karyawan/onboarding");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-center text-xl font-bold text-slate-800 sm:text-2xl">
          FORMULIR KARYAWAN BARU TOKO H. MARMO
        </h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          Isi formulir di bawah ini dengan data yang benar.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">
              Nama (dipakai untuk login)
            </label>
            <input
              required
              value={form.nama}
              onChange={(e) => ubah("nama", e.target.value)}
              className={inputCls}
              placeholder="Nama lengkap"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tempat Lahir</label>
            <input
              required
              value={form.tempatLahir}
              onChange={(e) => ubah("tempatLahir", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Tanggal Lahir</label>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <select
                required
                value={form.tglLahir}
                onChange={(e) => ubah("tglLahir", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Tgl</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                required
                value={form.blnLahir}
                onChange={(e) => ubah("blnLahir", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Bulan</option>
                {NAMA_BULAN.map((b, i) => (
                  <option key={b} value={i + 1}>
                    {b}
                  </option>
                ))}
              </select>
              <select
                required
                value={form.thnLahir}
                onChange={(e) => ubah("thnLahir", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-2 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Tahun</option>
                {DAFTAR_TAHUN.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Agama</label>
            <select
              required
              value={form.agama}
              onChange={(e) => ubah("agama", e.target.value)}
              className={inputCls}
            >
              <option value="">-- Pilih --</option>
              {DAFTAR_AGAMA.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select
              required
              value={form.statusNikah}
              onChange={(e) => ubah("statusNikah", e.target.value)}
              className={inputCls}
            >
              <option value="">-- Pilih --</option>
              {DAFTAR_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">Alamat Tinggal</label>
            <textarea
              required
              rows={2}
              value={form.alamat}
              onChange={(e) => ubah("alamat", e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Nama Ayah &amp; Ibu</label>
            <input
              required
              value={form.namaAyahIbu}
              onChange={(e) => ubah("namaAyahIbu", e.target.value)}
              className={inputCls}
              placeholder="contoh: Ahmad & Fatimah"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              No. Telp Rumah &amp; HP
            </label>
            <input
              type="tel"
              required
              value={form.telepon}
              onChange={(e) => ubah("telepon", e.target.value)}
              className={inputCls}
              placeholder="08xxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Merokok / Tidak</label>
            <select
              required
              value={form.merokok}
              onChange={(e) => ubah("merokok", e.target.value)}
              className={inputCls}
            >
              <option value="">-- Pilih --</option>
              <option value="Merokok">Merokok</option>
              <option value="Tidak Merokok">Tidak Merokok</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => ubah("password", e.target.value)}
              className={inputCls}
              placeholder="min. 6 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Ulangi Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.konfirmasi}
              onChange={(e) => ubah("konfirmasi", e.target.value)}
              className={inputCls}
              placeholder="ketik ulang"
            />
          </div>
          <label className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm">
            <input
              type="checkbox"
              checked={setuju}
              onChange={(e) => setSetuju(e.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Dengan ini saya menyatakan bahwa data yang saya isikan{" "}
              <strong>benar</strong>, dan{" "}
              <strong>bersedia memenuhi peraturan yang ada</strong>.
            </span>
          </label>
          {error && (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
