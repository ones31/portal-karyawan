import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";

export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const profil = await prisma.profilKaryawan.findUnique({
    where: { userId: sesi.userId },
  });
  return NextResponse.json({ profil });
}

export async function PUT(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const data = await req.json();
  const fields = {
    nik: data.nik ?? null,
    tempatLahir: data.tempatLahir ?? null,
    tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : null,
    jenisKelamin: data.jenisKelamin ?? null,
    agama: data.agama ?? null,
    alamat: data.alamat ?? null,
    namaAyahIbu: data.namaAyahIbu ?? null,
    telepon: data.telepon ?? null,
    statusNikah: data.statusNikah ?? null,
    merokok: data.merokok ?? null,
    kontakDarurat: data.kontakDarurat ?? null,
    // NPWP & BPJS tidak diisi karyawan (form-nya dihapus); hanya diubah bila
    // dikirim eksplisit, supaya nilai yang diisi admin tidak ikut terhapus
    npwp: data.npwp !== undefined ? data.npwp || null : undefined,
    bpjs: data.bpjs !== undefined ? data.bpjs || null : undefined,
    rekeningBank: data.rekeningBank ?? null,
    pendidikan: data.pendidikan ?? null,
  };

  const profil = await prisma.profilKaryawan.upsert({
    where: { userId: sesi.userId },
    update: fields,
    create: { userId: sesi.userId, ...fields },
  });
  return NextResponse.json({ profil });
}
