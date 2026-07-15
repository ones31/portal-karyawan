"use client";

import { useState } from "react";

export default function GantiPasswordForm() {
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [pesan, setPesan] = useState("");
  const [error, setError] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setPesan("");
    setError("");

    if (passwordBaru !== konfirmasi) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }

    setMenyimpan(true);
    const res = await fetch("/api/auth/ganti-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordLama, passwordBaru }),
    });
    const data = await res.json();
    setMenyimpan(false);

    if (res.ok) {
      setPesan(data.pesan ?? "Password berhasil diubah");
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasi("");
    } else {
      setError(data.error ?? "Gagal mengubah password");
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Ganti Password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Masukkan password lama Anda lalu password baru. Password baru minimal
        6 karakter.
      </p>
      <form onSubmit={simpan} className="mt-6 grid max-w-sm gap-4">
        <div>
          <label className="block text-sm font-medium">Password Lama</label>
          <input
            type="password"
            value={passwordLama}
            onChange={(e) => setPasswordLama(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password Baru</label>
          <input
            type="password"
            value={passwordBaru}
            onChange={(e) => setPasswordBaru(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Konfirmasi Password Baru
          </label>
          <input
            type="password"
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={menyimpan}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {menyimpan ? "Menyimpan..." : "Simpan"}
          </button>
          {pesan && <p className="text-sm text-green-600">{pesan}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </form>
    </div>
  );
}
