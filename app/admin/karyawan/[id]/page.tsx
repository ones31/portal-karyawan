"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LABEL_JENIS_IZIN, MAKS_HARI_MENIKAH, jumlahHari, type JenisIzin } from "@/lib/izin";

const DAFTAR_LOKASI = ["Tegal Alur", "Menceng"];

const PROFIL_FIELDS: {
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
  { name: "npwp", label: "NPWP" },
  { name: "bpjs", label: "No. BPJS" },
  { name: "rekeningBank", label: "Rekening Bank" },
  { name: "pendidikan", label: "Pendidikan Terakhir" },
];

type Detail = {
  id: string;
  nama: string;
  email: string | null;
  phone: string | null;
  lokasi: string | null;
  tanggalMasuk: string | null;
  profil: (Record<string, string | null> & {
    tandaTangan: string | null;
    tandaTanganPada: string | null;
  }) | null;
  kontrak: {
    mulaiKontrak: string;
    akhirKontrak: string;
    ditandatanganiPada: string | null;
  } | null;
  izin: {
    id: string;
    jenis: JenisIzin;
    tanggalMulai: string;
    tanggalAkhir: string;
    alasan: string;
    suratDokter: string | null;
    status: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  }[];
};

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

export default function EditKaryawanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [tidakDitemukan, setTidakDitemukan] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    phone: "",
    lokasi: "",
    tanggalMasuk: "",
    passwordBaru: "",
    mulaiKontrak: "",
    akhirKontrak: "",
  });
  const [profilForm, setProfilForm] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState<{ jenis: "sukses" | "error"; teks: string } | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [mereset, setMereset] = useState(false);
  const [lokasiAksesAdmin, setLokasiAksesAdmin] = useState<string | null>(null);
  const [superAdmin, setSuperAdmin] = useState(false);

  // Form "Ajukan Izin untuk Karyawan Ini" — solusi kalau karyawan terkendala
  // membuka portal sendiri. Meniru form di app/karyawan/izin/page.tsx.
  const [tampilFormIzin, setTampilFormIzin] = useState(false);
  const [jenisIzinBaru, setJenisIzinBaru] = useState<JenisIzin>("SAKIT");
  const [tipeSakitBaru, setTipeSakitBaru] = useState<"TANPA" | "DENGAN">("TANPA");
  const [fileIzinBaru, setFileIzinBaru] = useState<File | null>(null);
  const inputFileIzinRef = useRef<HTMLInputElement>(null);
  const [tanggalMulaiBaru, setTanggalMulaiBaru] = useState("");
  const [tanggalAkhirBaru, setTanggalAkhirBaru] = useState("");
  const [alasanBaru, setAlasanBaru] = useState("");
  const [errorIzin, setErrorIzin] = useState("");
  const [mengirimIzin, setMengirimIzin] = useState(false);

  // Admin ber-lokasiAkses hanya boleh memindahkan karyawan ke lokasinya sendiri
  const lokasiOpsi =
    !superAdmin && lokasiAksesAdmin ? [lokasiAksesAdmin] : DAFTAR_LOKASI;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setSuperAdmin(d.user?.role === "SUPER_ADMIN");
        setLokasiAksesAdmin(d.user?.lokasiAkses ?? null);
      });
  }, []);

  function muatDetail() {
    return fetch(`/api/admin/karyawan/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ karyawan }: { karyawan: Detail }) => {
        setDetail(karyawan);
        setForm({
          nama: karyawan.nama,
          email: karyawan.email ?? "",
          phone: karyawan.phone ?? "",
          lokasi: karyawan.lokasi ?? "",
          tanggalMasuk: karyawan.tanggalMasuk?.slice(0, 10) ?? "",
          passwordBaru: "",
          mulaiKontrak: karyawan.kontrak?.mulaiKontrak.slice(0, 10) ?? "",
          akhirKontrak: karyawan.kontrak?.akhirKontrak.slice(0, 10) ?? "",
        });
        const pf: Record<string, string> = {};
        for (const f of PROFIL_FIELDS) {
          const v = karyawan.profil?.[f.name];
          if (v) pf[f.name] = f.type === "date" ? String(v).slice(0, 10) : String(v);
        }
        setProfilForm(pf);
      })
      .catch(() => setTidakDitemukan(true));
  }

  useEffect(() => {
    muatDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setPesan(null);
    setMenyimpan(true);
    const res = await fetch(`/api/admin/karyawan/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, profil: profilForm }),
    });
    setMenyimpan(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPesan({ jenis: "error", teks: data.error ?? "Gagal menyimpan." });
      return;
    }
    setPesan({ jenis: "sukses", teks: "Perubahan tersimpan." });
    setForm((f) => ({ ...f, passwordBaru: "" }));
    router.refresh();
  }

  async function resetPasswordDefault() {
    if (!detail) return;
    if (
      !confirm(
        `Reset password "${detail.nama}" ke default ("123")? Beri tahu karyawan yang bersangkutan password barunya.`
      )
    )
      return;
    setPesan(null);
    setMereset(true);
    const res = await fetch(`/api/admin/karyawan/${id}/reset-password`, {
      method: "POST",
    });
    setMereset(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPesan({ jenis: "error", teks: data.error ?? "Gagal mereset password." });
      return;
    }
    const data = await res.json();
    setPesan({
      jenis: "sukses",
      teks: `Password direset ke default: "${data.password}". Beri tahu karyawan yang bersangkutan.`,
    });
  }

  async function ajukanIzin(e: React.FormEvent) {
    e.preventDefault();
    setErrorIzin("");
    if (jenisIzinBaru === "SAKIT" && tipeSakitBaru === "DENGAN" && !fileIzinBaru) {
      setErrorIzin("Silakan pilih file surat dokter terlebih dahulu.");
      return;
    }
    const akhir = jenisIzinBaru === "TUGAS_NEGARA" ? tanggalMulaiBaru : tanggalAkhirBaru;
    if (
      jenisIzinBaru === "MENIKAH" &&
      tanggalMulaiBaru &&
      akhir &&
      jumlahHari(tanggalMulaiBaru, akhir) > MAKS_HARI_MENIKAH
    ) {
      setErrorIzin(`Izin menikah maksimal ${MAKS_HARI_MENIKAH} hari.`);
      return;
    }
    setMengirimIzin(true);
    const fd = new FormData();
    fd.append("jenis", jenisIzinBaru);
    fd.append("tanggalMulai", tanggalMulaiBaru);
    fd.append("tanggalAkhir", akhir);
    fd.append("alasan", alasanBaru);
    if (jenisIzinBaru === "SAKIT" && tipeSakitBaru === "DENGAN" && fileIzinBaru) {
      fd.append("suratDokter", fileIzinBaru);
    }
    const res = await fetch(`/api/admin/karyawan/${id}/izin`, {
      method: "POST",
      body: fd,
    });
    setMengirimIzin(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorIzin(data.error ?? "Gagal mengajukan izin.");
      return;
    }
    setJenisIzinBaru("SAKIT");
    setTipeSakitBaru("TANPA");
    setFileIzinBaru(null);
    if (inputFileIzinRef.current) inputFileIzinRef.current.value = "";
    setTanggalMulaiBaru("");
    setTanggalAkhirBaru("");
    setAlasanBaru("");
    setTampilFormIzin(false);
    muatDetail();
  }

  async function hapus() {
    if (!detail) return;
    if (
      !confirm(
        `Hapus akun karyawan "${detail.nama}"? Seluruh data pribadi, kontrak, riwayat izin, dan surat dokter miliknya akan ikut terhapus permanen. Gunakan ini untuk karyawan yang sudah resign.`
      )
    )
      return;
    setMenghapus(true);
    const res = await fetch(`/api/admin/karyawan/${id}`, { method: "DELETE" });
    setMenghapus(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPesan({ jenis: "error", teks: data.error ?? "Gagal menghapus karyawan." });
      return;
    }
    router.push("/admin/karyawan");
  }

  if (tidakDitemukan) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-slate-500">Karyawan tidak ditemukan.</p>
        <Link href="/admin/karyawan" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          ← Kembali ke daftar karyawan
        </Link>
      </div>
    );
  }
  if (!detail) return <p className="text-slate-500">Memuat...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Karyawan: {detail.nama}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={hapus}
            disabled={menghapus}
            className="rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {menghapus ? "Menghapus..." : "Hapus Karyawan (Resign)"}
          </button>
          <Link
            href="/admin/karyawan"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Kembali
          </Link>
        </div>
      </div>

      <form
        onSubmit={simpan}
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
          <label className="block text-sm font-medium">Lokasi</label>
          <select
            required
            value={form.lokasi}
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- Pilih Lokasi --</option>
            {lokasiOpsi.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
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
        <div>
          <label className="block text-sm font-medium">
            Tanggal Masuk Kerja
          </label>
          <input
            type="date"
            value={form.tanggalMasuk}
            onChange={(e) => setForm({ ...form, tanggalMasuk: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email (opsional)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Password Baru (kosongkan jika tidak diganti)
          </label>
          <input
            type="text"
            value={form.passwordBaru}
            onChange={(e) => setForm({ ...form, passwordBaru: e.target.value })}
            placeholder="minimal 6 karakter"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={resetPasswordDefault}
            disabled={mereset}
            className="mt-2 rounded-lg border border-amber-600 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            {mereset ? "Mereset..." : "Reset ke Password Default (\"123\")"}
          </button>
          <p className="mt-1 text-xs text-slate-500">
            Untuk karyawan yang mengubah password sendiri lalu lupa.
          </p>
        </div>
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
        {detail.kontrak?.ditandatanganiPada && (
          <p className="sm:col-span-2 text-xs text-slate-500">
            Kontrak sudah ditandatangani pada{" "}
            {formatTanggal(detail.kontrak.ditandatanganiPada)}. Mengubah masa
            kontrak di sini berarti perpanjangan/penyesuaian masa berlaku.
          </p>
        )}

        <h2 className="sm:col-span-2 mt-2 border-t border-slate-200 pt-4 font-semibold">
          Data Pribadi Karyawan
        </h2>
        {PROFIL_FIELDS.map((f) => (
          <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
            <label className="block text-sm font-medium">{f.label}</label>
            {f.options ? (
              <select
                value={profilForm[f.name] ?? ""}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, [f.name]: e.target.value })
                }
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
                value={profilForm[f.name] ?? ""}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, [f.name]: e.target.value })
                }
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            ) : (
              <input
                type={f.type ?? "text"}
                value={profilForm[f.name] ?? ""}
                onChange={(e) =>
                  setProfilForm({ ...profilForm, [f.name]: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>
        ))}
        {pesan && (
          <p
            className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${
              pesan.jenis === "sukses"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {pesan.teks}
          </p>
        )}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={menyimpan}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {menyimpan ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      {detail.profil?.tandaTangan && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Tanda Tangan Persetujuan Onboarding</h2>
          <p className="mt-1 text-sm text-slate-500">
            Persetujuan peraturan toko, kontrak percobaan, dan perjanjian kerja
            {detail.profil.tandaTanganPada &&
              ` — ditandatangani pada ${formatTanggal(detail.profil.tandaTanganPada)}`}
            .
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={detail.profil.tandaTangan}
            alt="Tanda tangan onboarding"
            className="mt-3 h-28 rounded-lg border border-slate-200 bg-white"
          />
        </div>
      )}

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Riwayat Izin &amp; Surat Dokter</h2>
          <button
            type="button"
            onClick={() => setTampilFormIzin(!tampilFormIzin)}
            className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
          >
            {tampilFormIzin ? "Batal" : "+ Ajukan Izin untuk Karyawan Ini"}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Untuk karyawan yang terkendala membuka portal sendiri (mis. HP
          rusak/tidak ada sinyal) — pengajuan tetap berstatus Menunggu seperti
          biasa, perlu disetujui/ditolak seperti pengajuan lainnya.
        </p>

        {tampilFormIzin && (
          <form
            onSubmit={ajukanIzin}
            className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <div>
              <label className="block text-sm font-medium">Jenis Pengajuan</label>
              <select
                value={jenisIzinBaru}
                onChange={(e) => setJenisIzinBaru(e.target.value as JenisIzin)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="SAKIT">Izin Sakit</option>
                <option value="LAINNYA">Izin Lain-lain</option>
                <option value="MENIKAH">Izin Menikah</option>
                <option value="TUGAS_NEGARA">Tugas Negara</option>
              </select>
            </div>

            {jenisIzinBaru === "SAKIT" && (
              <div>
                <label className="block text-sm font-medium">Tipe Izin Sakit</label>
                <div className="mt-1 space-y-2">
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm has-checked:border-blue-500 has-checked:bg-blue-50">
                    <input
                      type="radio"
                      name="tipeSakitBaru"
                      checked={tipeSakitBaru === "TANPA"}
                      onChange={() => {
                        setTipeSakitBaru("TANPA");
                        setFileIzinBaru(null);
                        if (inputFileIzinRef.current) inputFileIzinRef.current.value = "";
                      }}
                    />
                    Tanpa surat dokter
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm has-checked:border-blue-500 has-checked:bg-blue-50">
                    <input
                      type="radio"
                      name="tipeSakitBaru"
                      checked={tipeSakitBaru === "DENGAN"}
                      onChange={() => setTipeSakitBaru("DENGAN")}
                    />
                    Dengan surat dokter
                  </label>
                </div>
                {tipeSakitBaru === "DENGAN" && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium">
                      Upload Surat Dokter (PDF/JPG/PNG, maks 5 MB)
                    </label>
                    <input
                      ref={inputFileIzinRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={(e) => setFileIzinBaru(e.target.files?.[0] ?? null)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                    />
                  </div>
                )}
              </div>
            )}

            {jenisIzinBaru === "TUGAS_NEGARA" ? (
              <div>
                <label className="block text-sm font-medium">Tanggal</label>
                <input
                  type="date"
                  required
                  value={tanggalMulaiBaru}
                  onChange={(e) => setTanggalMulaiBaru(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Dari Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggalMulaiBaru}
                    onChange={(e) => setTanggalMulaiBaru(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Sampai Tanggal</label>
                  <input
                    type="date"
                    required
                    value={tanggalAkhirBaru}
                    onChange={(e) => setTanggalAkhirBaru(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
            {jenisIzinBaru === "MENIKAH" && (
              <p className="text-xs text-slate-500">
                Izin menikah maksimal {MAKS_HARI_MENIKAH} hari sesuai perjanjian kerja.
              </p>
            )}

            <div>
              <label className="block text-sm font-medium">
                Alasan{jenisIzinBaru === "TUGAS_NEGARA" ? " (opsional)" : ""}
              </label>
              <textarea
                required={jenisIzinBaru !== "TUGAS_NEGARA"}
                value={alasanBaru}
                onChange={(e) => setAlasanBaru(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {errorIzin && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {errorIzin}
              </p>
            )}
            <button
              type="submit"
              disabled={mengirimIzin}
              className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {mengirimIzin ? "Mengirim..." : "Ajukan Izin"}
            </button>
          </form>
        )}

        {detail.izin.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Belum ada pengajuan izin.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {detail.izin.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <div>
                  <span className="font-medium">
                    {LABEL_JENIS_IZIN[i.jenis]}
                  </span>
                  <span className="ml-2 text-slate-500">
                    {formatTanggal(i.tanggalMulai)} — {formatTanggal(i.tanggalAkhir)}
                  </span>
                  <span className="ml-2 text-slate-500">{i.alasan}</span>
                  {i.jenis === "SAKIT" &&
                    (i.suratDokter ? (
                      <a
                        href={`/api/izin/surat/${i.suratDokter}`}
                        target="_blank"
                        className="ml-2 text-xs font-medium text-blue-600 hover:underline"
                      >
                        📎 Lihat surat dokter
                      </a>
                    ) : (
                      <span className="ml-2 text-xs text-slate-400">
                        (tanpa surat dokter)
                      </span>
                    ))}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[i.status]}`}
                >
                  {i.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
