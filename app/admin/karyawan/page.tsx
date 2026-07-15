"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BATAS_HARI_KONTRAK_HABIS } from "@/lib/kontrak";
import { statusMasaKerja } from "@/lib/masa-kerja";

const DAFTAR_LOKASI = ["Tegal Alur", "Menceng"];

type Karyawan = {
  id: string;
  nama: string;
  email: string | null;
  phone: string | null;
  lokasi: string | null;
  tanggalMasuk: string | null;
  tanggalLahir: string | null;
  profilLengkap: boolean;
  kontrak: {
    mulaiKontrak: string;
    akhirKontrak: string;
    ditandatanganiPada: string | null;
    setujuTataTertib: boolean;
  } | null;
  jumlahIzinSakit: number;
  jumlahIzinLainnya: number;
};

const PERIODE_LABEL: Record<string, string> = {
  bulan: "Bulan Ini",
  tahun: "Tahun Ini",
  semua: "Semua",
};

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sisaHari(akhir: string) {
  return Math.ceil((new Date(akhir).getTime() - Date.now()) / 86400000);
}

export default function DaftarKaryawanPage() {
  const [daftar, setDaftar] = useState<Karyawan[]>([]);
  const [lokasiTab, setLokasiTab] = useState<string>("Tegal Alur");
  const [periode, setPeriode] = useState("bulan");
  const [superAdmin, setSuperAdmin] = useState(false);
  const [tampilForm, setTampilForm] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    phone: "",
    lokasi: "",
    password: "",
    role: "KARYAWAN",
    mulaiKontrak: "",
    akhirKontrak: "",
  });
  const [error, setError] = useState("");
  const [mengirim, setMengirim] = useState(false);

  async function muat(p = periode) {
    const res = await fetch(`/api/admin/karyawan?periode=${p}`);
    const { karyawan } = await res.json();
    setDaftar(karyawan ?? []);
  }

  useEffect(() => {
    muat(periode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periode]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setSuperAdmin(d.user?.role === "SUPER_ADMIN"));
  }, []);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMengirim(true);
    const res = await fetch("/api/admin/karyawan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMengirim(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Gagal menambah karyawan.");
      return;
    }
    setForm({
      nama: "",
      email: "",
      phone: "",
      lokasi: "",
      password: "",
      role: "KARYAWAN",
      mulaiKontrak: "",
      akhirKontrak: "",
    });
    setTampilForm(false);
    muat();
  }

  const tampil =
    lokasiTab === "Semua"
      ? daftar
      : lokasiTab === "Belum Diatur"
        ? daftar.filter((k) => !k.lokasi)
        : daftar.filter((k) => k.lokasi === lokasiTab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Daftar Karyawan</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
            {Object.entries(PERIODE_LABEL).map(([nilai, label]) => (
              <button
                key={nilai}
                onClick={() => setPeriode(nilai)}
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
          <button
            onClick={() => setTampilForm(!tampilForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {tampilForm ? "Batal" : "+ Tambah Karyawan"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {["Tegal Alur", "Menceng", "Belum Diatur", "Semua"].map((l) => {
          const jumlah =
            l === "Semua"
              ? daftar.length
              : l === "Belum Diatur"
                ? daftar.filter((k) => !k.lokasi).length
                : daftar.filter((k) => k.lokasi === l).length;
          if (l === "Belum Diatur" && jumlah === 0) return null;
          return (
            <button
              key={l}
              onClick={() => setLokasiTab(l)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
                lokasiTab === l
                  ? "border border-b-0 border-slate-200 bg-white text-blue-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {l} ({jumlah})
            </button>
          );
        })}
      </div>

      {tampilForm && (
        <form
          onSubmit={tambah}
          className="grid gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2"
        >
          <div>
            <label className="block text-sm font-medium">
              Nama Lengkap (dipakai untuk login)
            </label>
            <input
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password Awal</label>
            <input
              type="text"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">No. Telepon (opsional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {form.role === "KARYAWAN" && (
            <div>
              <label className="block text-sm font-medium">Lokasi</label>
              <select
                required
                value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih Lokasi --</option>
                {DAFTAR_LOKASI.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Email (opsional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          {superAdmin && (
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="KARYAWAN">Karyawan</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}
          {form.role === "KARYAWAN" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Mulai Kontrak</label>
                <input
                  type="date"
                  required
                  value={form.mulaiKontrak}
                  onChange={(e) => setForm({ ...form, mulaiKontrak: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Akhir Kontrak</label>
                <input
                  type="date"
                  required
                  value={form.akhirKontrak}
                  onChange={(e) => setForm({ ...form, akhirKontrak: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          {error && (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={mengirim}
              className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mengirim ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
        {tampil.length === 0 ? (
          <p className="text-sm text-slate-500">
            Belum ada karyawan di lokasi ini.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Lokasi</th>
                <th className="py-2 pr-4">Tgl Masuk</th>
                <th className="py-2 pr-4">Telepon</th>
                <th className="py-2 pr-4">Tgl Lahir</th>
                <th className="py-2 pr-4">Data Pribadi</th>
                <th className="py-2 pr-4">Kontrak</th>
                <th className="py-2 pr-4">Masa Kontrak</th>
                <th className="py-2 pr-4">
                  Izin Sakit ({PERIODE_LABEL[periode]})
                </th>
                <th className="py-2">
                  Izin Lain-lain ({PERIODE_LABEL[periode]})
                </th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((k) => {
                const sisa = k.kontrak ? sisaHari(k.kontrak.akhirKontrak) : null;
                const tetap = statusMasaKerja(k.tanggalMasuk) === "TETAP";
                return (
                  <tr key={k.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/karyawan/${k.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {k.nama}
                      </Link>
                      {k.email && (
                        <p className="text-xs text-slate-500">{k.email}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {k.lokasi ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {k.tanggalMasuk ? (
                        formatTanggal(k.tanggalMasuk)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {k.phone ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {k.tanggalLahir ? (
                        formatTanggal(k.tanggalLahir)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          k.profilLengkap
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {k.profilLengkap ? "Lengkap" : "Belum"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {tetap && !k.kontrak ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Tetap
                        </span>
                      ) : k.kontrak?.ditandatanganiPada ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Ditandatangani
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Belum TTD
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {k.kontrak ? (
                        <>
                          {formatTanggal(k.kontrak.mulaiKontrak)} —{" "}
                          {formatTanggal(k.kontrak.akhirKontrak)}
                          {sisa !== null && (
                            <p
                              className={`text-xs ${
                                sisa < 0
                                  ? "text-red-600"
                                  : sisa <= BATAS_HARI_KONTRAK_HABIS
                                    ? "text-orange-600"
                                    : "text-slate-500"
                              }`}
                            >
                              {sisa < 0
                                ? `Habis ${-sisa} hari lalu`
                                : `Sisa ${sisa} hari`}
                            </p>
                          )}
                        </>
                      ) : tetap ? (
                        <span className="font-medium text-blue-700">
                          Karyawan Tetap
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum ada</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-center">{k.jumlahIzinSakit}</td>
                    <td className="py-3 text-center">{k.jumlahIzinLainnya}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
