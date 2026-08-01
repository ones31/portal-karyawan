import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni, adalahAdmin, filterLokasiSesi } from "@/lib/auth";
import { kirimCatatan } from "@/lib/kirim-catatan";

// Daftar catatan yang pernah dikirim, dikelompokkan per kiriman (batchId).
// Kiriman massal tampil sebagai SATU baris beserta jumlah penerima & yang sudah membaca.
export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  // Hanya catatan untuk karyawan dalam scope lokasi admin ybs
  const baris = await prisma.catatan.findMany({
    where: { user: filterLokasiSesi(sesi) },
    orderBy: { createdAt: "desc" },
    select: {
      batchId: true,
      judul: true,
      isi: true,
      dibacaPada: true,
      createdAt: true,
      user: { select: { nama: true, lokasi: true } },
      pengirim: { select: { nama: true } },
    },
  });

  const perBatch = new Map<
    string,
    {
      batchId: string;
      judul: string;
      isi: string;
      pengirim: string | null;
      createdAt: Date;
      jumlahPenerima: number;
      jumlahDibaca: number;
      penerima: { nama: string; lokasi: string | null; dibacaPada: Date | null }[];
    }
  >();

  for (const b of baris) {
    let entri = perBatch.get(b.batchId);
    if (!entri) {
      entri = {
        batchId: b.batchId,
        judul: b.judul,
        isi: b.isi,
        pengirim: b.pengirim?.nama ?? null,
        createdAt: b.createdAt,
        jumlahPenerima: 0,
        jumlahDibaca: 0,
        penerima: [],
      };
      perBatch.set(b.batchId, entri);
    }
    entri.jumlahPenerima++;
    if (b.dibacaPada) entri.jumlahDibaca++;
    entri.penerima.push({
      nama: b.user.nama,
      lokasi: b.user.lokasi,
      dibacaPada: b.dibacaPada,
    });
  }

  return NextResponse.json({ catatan: [...perBatch.values()] });
}

// Kirim catatan baru ke satu karyawan / semua karyawan / semua di satu lokasi
export async function POST(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi || !adalahAdmin(sesi.role)) {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  const { tujuan, judul, isi } = await req.json();
  const hasil = await kirimCatatan({ sesi, tujuan, judul, isi });
  if (!hasil.ok) {
    return NextResponse.json({ error: hasil.pesan }, { status: hasil.status });
  }

  return NextResponse.json(
    { jumlah: hasil.jumlah, namaPenerima: hasil.namaPenerima },
    { status: 201 }
  );
}
