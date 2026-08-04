import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";
import { statusMasaKerja } from "@/lib/masa-kerja";
import { JENIS_IZIN, JENIS_TIDAK_HITUNG_KEHADIRAN, LABEL_JENIS_IZIN } from "@/lib/izin";
import { periodeBerjalan } from "@/lib/periode";
import { hitungPersenKehadiran, warnaKehadiran } from "@/lib/kehadiran";
import TombolTandaiDibaca from "@/components/TombolTandaiDibaca";

function formatTanggal(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BerandaKaryawan() {
  const sesi = (await sesiSaatIni())!;
  // Periode berjalan ala penggajian: tanggal 26 s/d 25 bulan berikutnya
  const periode = periodeBerjalan();
  const [profil, kontrak, rekapJenisIzin, izinPeriode, user, catatanBaru] =
    await Promise.all([
      prisma.profilKaryawan.findUnique({ where: { userId: sesi.userId } }),
      prisma.kontrak.findUnique({ where: { userId: sesi.userId } }),
      prisma.izin.groupBy({
        by: ["jenis"],
        where: {
          userId: sesi.userId,
          tanggalMulai: { gte: periode.gte, lt: periode.lt },
        },
        _count: true,
      }),
      // Untuk hitung kehadiran: izin yang beririsan dengan periode, tidak
      // ditolak, dan bukan jenis yang dikecualikan (Setengah Hari — lihat
      // JENIS_TIDAK_HITUNG_KEHADIRAN di lib/izin.ts)
      prisma.izin.findMany({
        where: {
          userId: sesi.userId,
          status: { not: "DITOLAK" },
          jenis: { notIn: [...JENIS_TIDAK_HITUNG_KEHADIRAN] },
          tanggalMulai: { lt: periode.lt },
          tanggalAkhir: { gte: periode.gte },
        },
        select: { tanggalMulai: true, tanggalAkhir: true },
      }),
      prisma.user.findUnique({
        where: { id: sesi.userId },
        select: { tanggalMasuk: true, tetapManual: true },
      }),
      // Catatan dari admin/owner yang belum ditandai dibaca (Feature 21)
      prisma.catatan.findMany({
        where: { userId: sesi.userId, dibacaPada: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          judul: true,
          isi: true,
          createdAt: true,
          pengirim: { select: { nama: true } },
        },
      }),
    ]);

  const tetap =
    statusMasaKerja(user?.tanggalMasuk, user?.tetapManual ?? false) === "TETAP";
  const jumlahPerJenis = Object.fromEntries(
    JENIS_IZIN.map((j) => [
      j,
      rekapJenisIzin.find((r) => r.jenis === j)?._count ?? 0,
    ])
  );
  const jumlahIzin = Object.values(jumlahPerJenis).reduce((a, b) => a + b, 0);

  // Tingkat kehadiran periode berjalan (formula bersama di lib/kehadiran.ts)
  const kehadiran = hitungPersenKehadiran(izinPeriode, periode);

  // Kontrak baru (dibuat/diperpanjang admin) menunggu tanda tangan karyawan
  const kontrakMenungguTtd = !tetap && !!kontrak && !kontrak.ditandatanganiPada;

  const langkah = [
    {
      href: "/karyawan/data-pribadi",
      judul: "1. Lengkapi Data Pribadi",
      selesai: !!profil?.nik,
      keterangan: profil?.nik
        ? "Data pribadi sudah diisi."
        : "Isi data pribadi Anda sebagai karyawan baru.",
    },
    {
      href: "/karyawan/kontrak",
      judul: "2. Tanda Tangani Kontrak Kerja",
      selesai: tetap || !!kontrak?.ditandatanganiPada || !!profil?.tandaTangan,
      keterangan: tetap
        ? "Karyawan tetap — tidak terikat masa kontrak."
        : kontrak?.ditandatanganiPada
          ? `Ditandatangani pada ${formatTanggal(kontrak.ditandatanganiPada)}.`
          : profil?.tandaTanganPada
            ? `Persetujuan ditandatangani saat pendaftaran (${formatTanggal(profil.tandaTanganPada)}).${kontrak ? "" : " Masa kontrak akan ditetapkan admin."}`
            : kontrak
              ? "Baca kontrak dan tata tertib, lalu tanda tangani."
              : "Kontrak belum dibuat oleh admin.",
    },
    {
      href: "/karyawan/izin",
      judul: "Pengajuan Izin",
      selesai: null,
      keterangan: `${jumlahIzin} pengajuan izin periode ${periode.label}.`,
    },
  ];

  return (
    <div className="space-y-4">
      {catatanBaru.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border-l-4 border-amber-400 bg-amber-50 p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold text-amber-900">
                <span aria-hidden>📌</span> {c.judul}
              </h2>
              <p className="mt-0.5 text-xs text-amber-700">
                Catatan dari {c.pengirim?.nama ?? "Admin"} ·{" "}
                {formatTanggal(c.createdAt)}
              </p>
            </div>
            <TombolTandaiDibaca id={c.id} />
          </div>
          <p className="mt-3 text-sm whitespace-pre-wrap text-amber-900">
            {c.isi}
          </p>
        </div>
      ))}
      {kontrakMenungguTtd && (
        <Link
          href="/karyawan/kontrak"
          className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-sm hover:bg-blue-100"
        >
          <span aria-hidden>🔔</span>
          <p>
            <strong>Notifikasi:</strong> Anda punya kontrak kerja baru yang
            menunggu tanda tangan
            {kontrak &&
              ` (berlaku ${formatTanggal(kontrak.mulaiKontrak)} — ${formatTanggal(kontrak.akhirKontrak)})`}
            . Klik di sini untuk membaca dan menandatangani.
          </p>
        </Link>
      )}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Selamat datang, {sesi.nama}</h1>
            {tetap ? (
              <p className="mt-1 text-sm font-medium text-green-700">
                Karyawan Tetap
              </p>
            ) : (
              kontrak && (
                <p className="mt-1 text-sm text-slate-500">
                  Masa kontrak: {formatTanggal(kontrak.mulaiKontrak)} —{" "}
                  {formatTanggal(kontrak.akhirKontrak)}
                </p>
              )
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`text-3xl font-bold ${warnaKehadiran(kehadiran)}`}>
                {kehadiran}%
              </p>
              <p className="text-xs text-slate-500">
                Tingkat Kehadiran
                <br />({periode.label})
              </p>
            </div>
            <a
              href="https://chat.whatsapp.com/DTCkLLvSdsnDLGU8lQVfl4"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              💬 WA Grup Toko Marmo
            </a>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {langkah.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-semibold">{l.judul}</h2>
              {l.selesai !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    l.selesai
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {l.selesai ? "Selesai" : "Belum"}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">{l.keterangan}</p>
            {l.href === "/karyawan/izin" && (
              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                {JENIS_IZIN.map((j) => (
                  <li key={j} className="flex items-center justify-between">
                    <span className="text-slate-500">{LABEL_JENIS_IZIN[j]}</span>
                    <span className="font-medium">{jumlahPerJenis[j]}</span>
                  </li>
                ))}
              </ul>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
