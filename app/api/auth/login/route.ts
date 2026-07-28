import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { buatToken } from "@/lib/auth";
import { cariUserByNama } from "@/lib/cari-user";

export async function POST(req: Request) {
  const { nama, password } = await req.json();

  if (!nama || !password) {
    return NextResponse.json(
      { error: "Nama dan password wajib diisi" },
      { status: 400 }
    );
  }

  // Nama login tidak membedakan huruf besar/kecil
  const user = await cariUserByNama(nama);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json(
      { error: "Nama atau password salah" },
      { status: 401 }
    );
  }

  if (user.statusAkun === "DITOLAK") {
    return NextResponse.json(
      {
        error:
          "Pendaftaran Anda ditolak oleh admin. Hubungi admin/owner toko untuk info lebih lanjut.",
      },
      { status: 403 }
    );
  }

  const token = await buatToken({
    userId: user.id,
    nama: user.nama,
    role: user.role,
    lokasiAkses: user.lokasiAkses,
  });

  const res = NextResponse.json({
    user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
  });
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return res;
}
