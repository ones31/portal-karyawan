"use client";

import { useEffect, useState } from "react";

type Profil = Record<string, string>;

const FIELDS: {
  name: string;
  label: string;
  type?: string;
  options?: string[];
}[] = [
  { name: "nik", label: "NIK (No. KTP)" },
  { name: "tempatLahir", label: "Tempat Lahir" },
  { name: "tanggalLahir", label: "Tanggal Lahir", type: "date" },
  { name: "jenisKelamin", label: "Jenis Kelamin", options: ["Laki-laki", "Perempuan"] },
  {
    name: "agama",
    label: "Agama",
    options: ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"],
  },
  { name: "alamat", label: "Alamat Lengkap", type: "textarea" },
  { name: "namaAyahIbu", label: "Nama Ayah & Ibu" },
  { name: "telepon", label: "No. Telp Rumah & HP" },
  {
    name: "statusNikah",
    label: "Status Pernikahan",
    options: ["Belum Menikah", "Menikah", "Cerai"],
  },
  { name: "merokok", label: "Merokok / Tidak", options: ["Merokok", "Tidak Merokok"] },
  { name: "kontakDarurat", label: "Kontak Darurat (nama & nomor)" },
  { name: "rekeningBank", label: "Rekening Bank (bank & nomor)" },
  { name: "pendidikan", label: "Pendidikan Terakhir" },
];

export default function DataPribadiPage() {
  const [form, setForm] = useState<Profil>({});
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    fetch("/api/profil")
      .then((r) => r.json())
      .then(({ profil }) => {
        if (profil) {
          const f: Profil = {};
          for (const field of FIELDS) {
            const v = profil[field.name];
            if (v) {
              f[field.name] =
                field.type === "date" ? String(v).slice(0, 10) : String(v);
            }
          }
          setForm(f);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setMenyimpan(true);
    setPesan("");
    const res = await fetch("/api/profil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMenyimpan(false);
    setPesan(res.ok ? "Data pribadi berhasil disimpan." : "Gagal menyimpan data.");
  }

  if (loading) return <p className="text-slate-500">Memuat...</p>;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Data Pribadi</h1>
      <p className="mt-1 text-sm text-slate-500">
        Lengkapi data pribadi Anda. Data ini hanya digunakan untuk keperluan
        administrasi internal perusahaan.
      </p>
      <form onSubmit={simpan} className="mt-6 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
            <label className="block text-sm font-medium">{f.label}</label>
            {f.options ? (
              <select
                value={form[f.name] ?? ""}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Pilih --</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                value={form[f.name] ?? ""}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            ) : (
              <input
                type={f.type ?? "text"}
                value={form[f.name] ?? ""}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>
        ))}
        <div className="sm:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={menyimpan}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {menyimpan ? "Menyimpan..." : "Simpan"}
          </button>
          {pesan && <p className="text-sm text-green-600">{pesan}</p>}
        </div>
      </form>
    </div>
  );
}
