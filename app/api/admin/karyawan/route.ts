import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import { rentangPeriode } from "@/lib/periode";
import { ISI_KONTRAK_DEFAULT } from "@/lib/kontrak";
import { cariUserByNama } from "@/lib/cari-user";
import { lokasiValid } from "@/lib/lokasi";

export async function GET(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const periode = new URL(req.url).searchParams.get("periode");
  const tanggalMulai = rentangPeriode(periode);

  const karyawan = await prisma.user.findMany({
    // Akun yang masih MENUNGGU persetujuan admin belum tampil di sini
    // (lihat /admin/pendaftaran); akun DITOLAK juga disembunyikan.
    where: { role: "KARYAWAN", statusAkun: "AKTIF" },
    orderBy: { nama: "asc" },
    select: {
      id: true,
      nama: true,
      email: true,
      phone: true,
      lokasi: true,
      tanggalMasuk: true,
      profil: true,
      kontrak: {
        select: {
          mulaiKontrak: true,
          akhirKontrak: true,
          ditandatanganiPada: true,
          setujuTataTertib: true,
        },
      },
      izin: {
        where: tanggalMulai ? { tanggalMulai } : undefined,
        select: { jenis: true },
      },
    },
  });

  const hasil = karyawan.map((k) => ({
    id: k.id,
    nama: k.nama,
    email: k.email,
    phone: k.phone,
    lokasi: k.lokasi,
    tanggalMasuk: k.tanggalMasuk,
    tanggalLahir: k.profil?.tanggalLahir ?? null,
    profilLengkap: !!k.profil?.nik,
    kontrak: k.kontrak,
    jumlahIzinSakit: k.izin.filter((i) => i.jenis === "SAKIT").length,
    jumlahIzinLainnya: k.izin.filter((i) => i.jenis === "LAINNYA").length,
  }));

  return NextResponse.json({ karyawan: hasil });
}

// Buat akun karyawan baru + kontraknya (super admin juga bisa membuat akun admin)
export async function POST(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { nama, email, phone, lokasi, password, role, mulaiKontrak, akhirKontrak } =
    await req.json();

  const roleBaru = role === "ADMIN" ? "ADMIN" : "KARYAWAN";
  if (roleBaru === "ADMIN" && sesi.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Hanya super admin (owner) yang dapat membuat akun admin" },
      { status: 403 }
    );
  }

  if (!nama || !password) {
    return NextResponse.json(
      { error: "Nama dan password wajib diisi" },
      { status: 400 }
    );
  }
  if (roleBaru === "KARYAWAN" && (!mulaiKontrak || !akhirKontrak)) {
    return NextResponse.json(
      { error: "Masa kontrak wajib diisi untuk karyawan" },
      { status: 400 }
    );
  }
  if (roleBaru === "KARYAWAN" && !lokasiValid(lokasi)) {
    return NextResponse.json(
      { error: "Lokasi wajib dipilih (Tegal Alur atau Menceng)" },
      { status: 400 }
    );
  }

  const sudahAda = await cariUserByNama(nama);
  if (sudahAda) {
    return NextResponse.json(
      { error: "Nama sudah terdaftar, gunakan nama lain (nama dipakai untuk login)" },
      { status: 400 }
    );
  }
  if (email) {
    const emailAda = await prisma.user.findUnique({ where: { email } });
    if (emailAda) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
  }

  const user = await prisma.user.create({
    data: {
      nama,
      email: email || null,
      phone: phone || null,
      lokasi: lokasiValid(lokasi) ? lokasi : null,
      password: await bcrypt.hash(password, 10),
      role: roleBaru,
      ...(roleBaru === "KARYAWAN"
        ? {
            kontrak: {
              create: {
                mulaiKontrak: new Date(mulaiKontrak),
                akhirKontrak: new Date(akhirKontrak),
                isiKontrak: ISI_KONTRAK_DEFAULT,
              },
            },
          }
        : {}),
    },
  });

  return NextResponse.json(
    { user: { id: user.id, nama: user.nama, role: user.role } },
    { status: 201 }
  );
}
