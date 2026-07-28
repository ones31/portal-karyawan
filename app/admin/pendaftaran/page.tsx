"use client";

import { useEffect, useState } from "react";
import { DAFTAR_LOKASI } from "@/lib/lokasi";

type Pendaftaran = {
  id: string;
  nama: string;
  phone: string | null;
  createdAt: string;
  profil: {
    tempatLahir: string | null;
    tanggalLahir: string | null;
    alamat: string | null;
    namaAyahIbu: string | null;
  } | null;
};

function formatTanggal(s: string) {
  return new Date(s).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPendaftaranPage() {
  const [daftar, setDaftar] = useState<Pendaftaran[] | null>(null);
  const [memproses, setMemproses] = useState<string | null>(null);
  const [lokasiPilihan, setLokasiPilihan] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [superAdmin, setSuperAdmin] = useState(false);
  const [lokasiAksesAdmin, setLokasiAksesAdmin] = useState<string | null>(null);

  // Admin ber-lokasiAkses hanya boleh assign pendaftaran baru ke lokasinya sendiri
  const lokasiOpsi =
    !superAdmin && lokasiAksesAdmin ? [lokasiAksesAdmin] : DAFTAR_LOKASI;

  async function muat() {
    const res = await fetch("/api/admin/pendaftaran");
    const { pendaftaran } = await res.json();
    setDaftar(pendaftaran ?? []);
  }

  useEffect(() => {
    muat();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setSuperAdmin(d.user?.role === "SUPER_ADMIN");
        setLokasiAksesAdmin(d.user?.lokasiAkses ?? null);
      });
  }, []);

  async function ubahStatus(id: string, statusAkun: "AKTIF" | "DITOLAK") {
    if (statusAkun === "AKTIF" && !lokasiPilihan[id]) {
      setError({ ...error, [id]: "Pilih lokasi dulu sebelum menyetujui." });
      return;
    }
    setError({ ...error, [id]: "" });
    setMemproses(id);
    const res = await fetch(`/api/admin/pendaftaran/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusAkun, lokasi: lokasiPilihan[id] }),
    });
    setMemproses(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError({ ...error, [id]: data.error ?? "Gagal memproses pendaftaran." });
      return;
    }
    muat();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Pendaftaran Menunggu Persetujuan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Karyawan yang mendaftar mandiri lewat halaman login sudah bisa
          login & onboarding, tapi belum tampil di Daftar Karyawan sampai
          disetujui di sini. Pilih lokasi kerja sebelum menekan &quot;Setujui&quot;.
        </p>
      </div>

      {daftar === null ? (
        <p className="text-slate-500">Memuat...</p>
      ) : daftar.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">
            Tidak ada pendaftaran yang menunggu persetujuan.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Telepon</th>
                <th className="py-2 pr-4">Tempat, Tgl Lahir</th>
                <th className="py-2 pr-4">Alamat</th>
                <th className="py-2 pr-4">Tgl Daftar</th>
                <th className="py-2 pr-4">Lokasi</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{p.nama}</td>
                  <td className="py-3 pr-4">
                    {p.phone ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {p.profil?.tempatLahir ?? "—"}
                    {p.profil?.tanggalLahir
                      ? `, ${formatTanggal(p.profil.tanggalLahir)}`
                      : ""}
                  </td>
                  <td className="py-3 pr-4 max-w-56 truncate" title={p.profil?.alamat ?? ""}>
                    {p.profil?.alamat ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {formatTanggal(p.createdAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      value={lokasiPilihan[p.id] ?? ""}
                      onChange={(e) =>
                        setLokasiPilihan({ ...lokasiPilihan, [p.id]: e.target.value })
                      }
                      className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Lokasi --</option>
                      {lokasiOpsi.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <button
                          onClick={() => ubahStatus(p.id, "AKTIF")}
                          disabled={memproses === p.id}
                          className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => ubahStatus(p.id, "DITOLAK")}
                          disabled={memproses === p.id}
                          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Tolak
                        </button>
                      </div>
                      {error[p.id] && (
                        <p className="text-xs text-red-600">{error[p.id]}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
