import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, bolehAksesLokasi } from "@/lib/auth";
import { lokasiValid } from "@/lib/lokasi";
import { ISI_KONTRAK_DEFAULT } from "@/lib/kontrak";
import { cariUserByNama } from "@/lib/cari-user";
import { DIR_SURAT_DOKTER } from "@/lib/surat-dokter";

// Detail satu karyawan: akun, profil, kontrak, dan riwayat izin (termasuk surat dokter)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const karyawan = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nama: true,
      email: true,
      phone: true,
      lokasi: true,
      tanggalMasuk: true,
      role: true,
      profil: true,
      kontrak: true,
      izin: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!karyawan || karyawan.role !== "KARYAWAN") {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }
  if (!bolehAksesLokasi(sesi, karyawan.lokasi)) {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }
  return NextResponse.json({ karyawan });
}

// Edit data karyawan (admin & owner)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "KARYAWAN") {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }
  if (!bolehAksesLokasi(sesi, user.lokasi)) {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }

  const {
    nama,
    email,
    phone,
    lokasi,
    tanggalMasuk,
    passwordBaru,
    mulaiKontrak,
    akhirKontrak,
    profil,
  } = await req.json();

  if (!nama) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  }
  if (nama !== user.nama) {
    const namaDipakai = await cariUserByNama(nama);
    if (namaDipakai && namaDipakai.id !== id) {
      return NextResponse.json(
        { error: "Nama sudah dipakai akun lain (nama dipakai untuk login)" },
        { status: 400 }
      );
    }
  }
  if (email && email !== user.email) {
    const emailDipakai = await prisma.user.findUnique({ where: { email } });
    if (emailDipakai) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
  }
  if (lokasi && !lokasiValid(lokasi)) {
    return NextResponse.json({ error: "Lokasi tidak valid" }, { status: 400 });
  }
  if (
    lokasi &&
    sesi.role === "ADMIN" &&
    sesi.lokasiAkses &&
    lokasi !== sesi.lokasiAkses
  ) {
    return NextResponse.json(
      { error: `Anda hanya dapat memindahkan karyawan ke lokasi ${sesi.lokasiAkses}` },
      { status: 403 }
    );
  }
  if (passwordBaru && String(passwordBaru).length < 6) {
    return NextResponse.json(
      { error: "Password baru minimal 6 karakter" },
      { status: 400 }
    );
  }
  if (
    mulaiKontrak &&
    akhirKontrak &&
    new Date(akhirKontrak) < new Date(mulaiKontrak)
  ) {
    return NextResponse.json(
      { error: "Akhir kontrak tidak boleh sebelum mulai kontrak" },
      { status: 400 }
    );
  }

  const hasil = await prisma.user.update({
    where: { id },
    data: {
      nama,
      email: email || null,
      phone: phone || null,
      lokasi: lokasi || null,
      tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : null,
      ...(passwordBaru
        ? { password: await bcrypt.hash(passwordBaru, 10) }
        : {}),
      ...(mulaiKontrak && akhirKontrak
        ? {
            kontrak: {
              upsert: {
                update: {
                  mulaiKontrak: new Date(mulaiKontrak),
                  akhirKontrak: new Date(akhirKontrak),
                },
                create: {
                  mulaiKontrak: new Date(mulaiKontrak),
                  akhirKontrak: new Date(akhirKontrak),
                  isiKontrak: ISI_KONTRAK_DEFAULT,
                },
              },
            },
          }
        : {}),
    },
    select: { id: true, nama: true, email: true, phone: true, lokasi: true },
  });

  // Admin juga bisa memperbarui data pribadi (profil) karyawan
  if (profil && typeof profil === "object") {
    const fields = {
      nik: profil.nik || null,
      tempatLahir: profil.tempatLahir || null,
      tanggalLahir: profil.tanggalLahir ? new Date(profil.tanggalLahir) : null,
      jenisKelamin: profil.jenisKelamin || null,
      agama: profil.agama || null,
      alamat: profil.alamat || null,
      namaAyahIbu: profil.namaAyahIbu || null,
      telepon: profil.telepon || null,
      statusNikah: profil.statusNikah || null,
      merokok: profil.merokok || null,
      kontakDarurat: profil.kontakDarurat || null,
      npwp: profil.npwp || null,
      bpjs: profil.bpjs || null,
      rekeningBank: profil.rekeningBank || null,
      pendidikan: profil.pendidikan || null,
    };
    await prisma.profilKaryawan.upsert({
      where: { userId: id },
      update: fields,
      create: { userId: id, ...fields },
    });
  }

  return NextResponse.json({ karyawan: hasil });
}

// Hapus akun karyawan (mis. karyawan resign). Hanya akun role KARYAWAN
// yang bisa dihapus lewat sini — akun admin/owner tidak boleh dihapus di sini.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { izin: { where: { suratDokter: { not: null } } } },
  });
  if (!user || user.role !== "KARYAWAN") {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }
  if (!bolehAksesLokasi(sesi, user.lokasi)) {
    return NextResponse.json(
      { error: "Karyawan tidak ditemukan" },
      { status: 404 }
    );
  }

  // Hapus file surat dokter milik karyawan ini dari disk sebelum record-nya hilang
  for (const izin of user.izin) {
    if (izin.suratDokter) {
      await unlink(path.join(DIR_SURAT_DOKTER, izin.suratDokter)).catch(
        () => {}
      );
    }
  }

  // Profil, kontrak, izin, tukar libur, dan langganan notifikasi ikut terhapus
  // otomatis (onDelete: Cascade di schema)
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
