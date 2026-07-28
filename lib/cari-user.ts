import { prisma } from "@/lib/prisma";

type UserRow = {
  id: string;
  nama: string;
  email: string | null;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
  statusAkun: "MENUNGGU" | "AKTIF" | "DITOLAK";
  lokasiAkses: string | null;
};

// Cari user berdasarkan nama TANPA membedakan huruf besar/kecil
// (PostgreSQL mendukung mode "insensitive" secara native di Prisma).
export async function cariUserByNama(nama: string): Promise<UserRow | null> {
  return prisma.user.findFirst({
    where: { nama: { equals: nama, mode: "insensitive" } },
    select: {
      id: true,
      nama: true,
      email: true,
      password: true,
      role: true,
      statusAkun: true,
      lokasiAkses: true,
    },
  });
}

export function tambahBulan(d: Date, n: number): Date {
  const hasil = new Date(d);
  hasil.setMonth(hasil.getMonth() + n);
  return hasil;
}
