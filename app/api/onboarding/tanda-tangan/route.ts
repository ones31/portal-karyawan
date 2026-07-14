import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";
import { tambahBulan } from "@/lib/cari-user";
import { KONTRAK_PERCOBAAN, kontrakSatuTahun } from "@/lib/dokumen-toko";
import { statusMasaKerja } from "@/lib/masa-kerja";

// Tanda tangan persetujuan peraturan toko & perjanjian kerja saat onboarding
export async function GET() {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const profil = await prisma.profilKaryawan.findUnique({
    where: { userId: sesi.userId },
    select: { tandaTangan: true, tandaTanganPada: true },
  });
  return NextResponse.json({
    tandaTangan: profil?.tandaTangan ?? null,
    tandaTanganPada: profil?.tandaTanganPada ?? null,
  });
}

export async function POST(req: Request) {
  const sesi = await sesiSaatIni();
  if (!sesi) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { tandaTangan } = await req.json();
  if (!tandaTangan || !String(tandaTangan).startsWith("data:image/")) {
    return NextResponse.json(
      { error: "Tanda tangan wajib digambar terlebih dahulu" },
      { status: 400 }
    );
  }

  const sekarang = new Date();
  const data = { tandaTangan, tandaTanganPada: sekarang };
  await prisma.profilKaryawan.upsert({
    where: { userId: sesi.userId },
    update: data,
    create: { userId: sesi.userId, ...data },
  });

  // Otomatis isi masa kontrak saat karyawan menandatangani:
  // - masa kerja < 3 bulan  -> kontrak percobaan 3 bulan terhitung dari tanggal masuk
  // - masa kerja >= 3 bulan -> kontrak 1 tahun terhitung dari akhir masa 3 bulannya
  const user = await prisma.user.findUnique({
    where: { id: sesi.userId },
    include: { kontrak: true },
  });
  if (user && user.role === "KARYAWAN") {
    const tanggalMasuk = user.tanggalMasuk ?? sekarang;
    if (!user.tanggalMasuk) {
      await prisma.user.update({
        where: { id: user.id },
        data: { tanggalMasuk },
      });
    }

    if (statusMasaKerja(tanggalMasuk) === "TETAP") {
      // Masa kerja > 3 tahun: sudah karyawan tetap, tidak terikat kontrak.
      // Masa kontrak dikosongkan (hapus kontrak lama jika ada).
      if (user.kontrak) {
        await prisma.kontrak.delete({ where: { userId: user.id } });
      }
    } else {
      const akhirTigaBulan = tambahBulan(tanggalMasuk, 3);
      let mulaiKontrak: Date;
      let akhirKontrak: Date;
      let isiKontrak: string;
      if (sekarang < akhirTigaBulan) {
        mulaiKontrak = tanggalMasuk;
        akhirKontrak = akhirTigaBulan;
        isiKontrak = KONTRAK_PERCOBAAN;
      } else {
        // Kontrak 1 tahun terhitung dari akhir masa 3 bulan; untuk karyawan lama,
        // periode bergulir per tahun sampai mencakup tanggal hari ini.
        mulaiKontrak = akhirTigaBulan;
        akhirKontrak = tambahBulan(mulaiKontrak, 12);
        while (akhirKontrak < sekarang) {
          mulaiKontrak = akhirKontrak;
          akhirKontrak = tambahBulan(mulaiKontrak, 12);
        }
        isiKontrak = kontrakSatuTahun(mulaiKontrak, akhirKontrak);
      }

      const dataTtd = {
        tandaTangan,
        setujuTataTertib: true,
        ditandatanganiPada: sekarang,
      };
      if (!user.kontrak) {
        await prisma.kontrak.create({
          data: {
            userId: user.id,
            mulaiKontrak,
            akhirKontrak,
            isiKontrak,
            ...dataTtd,
          },
        });
      } else if (!user.kontrak.ditandatanganiPada) {
        // Kontrak sudah dibuat admin tapi belum diteken: masa berlaku dari admin
        // dipertahankan, tanda tangan onboarding dipakai untuk menekennya.
        await prisma.kontrak.update({
          where: { userId: user.id },
          data: dataTtd,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
