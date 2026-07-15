import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buatToken } from "@/lib/auth";
import { cariUserByNama } from "@/lib/cari-user";
import { kirimNotifKeAdmin } from "@/lib/push";

// Pendaftaran mandiri karyawan baru, mengikuti Formulir Karyawan Baru Toko H. Marmo.
// Role selalu KARYAWAN; lokasi kerja & kontrak ditentukan admin kemudian.
export async function POST(req: Request) {
  const {
    nama,
    password,
    tempatLahir,
    tanggalLahir,
    agama,
    alamat,
    namaAyahIbu,
    telepon,
    statusNikah,
    merokok,
    setujuPernyataan,
  } = await req.json();

  if (!nama || !password) {
    return NextResponse.json(
      { error: "Nama dan password wajib diisi" },
      { status: 400 }
    );
  }
  if (String(password).length < 6) {
    return NextResponse.json(
      { error: "Password minimal 6 karakter" },
      { status: 400 }
    );
  }
  if (
    !tempatLahir ||
    !tanggalLahir ||
    !agama ||
    !alamat ||
    !namaAyahIbu ||
    !telepon ||
    !statusNikah ||
    !merokok
  ) {
    return NextResponse.json(
      { error: "Semua kolom formulir wajib diisi" },
      { status: 400 }
    );
  }
  if (!setujuPernyataan) {
    return NextResponse.json(
      { error: "Anda harus menyetujui pernyataan kebenaran data" },
      { status: 400 }
    );
  }

  const sudahAda = await cariUserByNama(nama);
  if (sudahAda) {
    return NextResponse.json(
      {
        error:
          "Nama sudah terdaftar. Gunakan nama lain, atau hubungi admin jika ini nama Anda.",
      },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: {
      nama,
      password: await bcrypt.hash(password, 10),
      phone: telepon,
      role: "KARYAWAN",
      // Pendaftaran mandiri menunggu persetujuan admin: belum tampil di
      // Daftar Karyawan utama sampai disetujui. Karyawan tetap bisa login
      // & onboarding sementara menunggu (lihat lib/auth.ts, app/api/auth/login).
      statusAkun: "MENUNGGU",
      profil: {
        create: {
          tempatLahir,
          tanggalLahir: new Date(tanggalLahir),
          agama,
          alamat,
          namaAyahIbu,
          telepon,
          statusNikah,
          merokok,
        },
      },
    },
  });

  // Beri tahu admin & owner ada pendaftaran baru yang perlu disetujui
  await kirimNotifKeAdmin({
    judul: "Pendaftaran karyawan baru 📝",
    isi: `${user.nama} baru saja mendaftar dan menunggu persetujuan.`,
    url: "/admin/pendaftaran",
  }).catch(() => {});

  // Langsung login setelah daftar
  const token = await buatToken({
    userId: user.id,
    nama: user.nama,
    role: user.role,
  });
  const res = NextResponse.json(
    { user: { id: user.id, nama: user.nama, role: user.role } },
    { status: 201 }
  );
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
