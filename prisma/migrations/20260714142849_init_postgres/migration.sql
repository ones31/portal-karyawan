-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'KARYAWAN');

-- CreateEnum
CREATE TYPE "JenisIzin" AS ENUM ('SAKIT', 'LAINNYA', 'TUGAS_NEGARA', 'MENIKAH');

-- CreateEnum
CREATE TYPE "StatusIzin" AS ENUM ('MENUNGGU', 'DISETUJUI', 'DITOLAK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "phone" TEXT,
    "lokasi" TEXT,
    "tanggalMasuk" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'KARYAWAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilKaryawan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nik" TEXT,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "agama" TEXT,
    "alamat" TEXT,
    "telepon" TEXT,
    "namaAyahIbu" TEXT,
    "merokok" TEXT,
    "statusNikah" TEXT,
    "kontakDarurat" TEXT,
    "npwp" TEXT,
    "bpjs" TEXT,
    "rekeningBank" TEXT,
    "pendidikan" TEXT,
    "tandaTangan" TEXT,
    "tandaTanganPada" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilKaryawan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kontrak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mulaiKontrak" TIMESTAMP(3) NOT NULL,
    "akhirKontrak" TIMESTAMP(3) NOT NULL,
    "isiKontrak" TEXT NOT NULL,
    "tandaTangan" TEXT,
    "setujuTataTertib" BOOLEAN NOT NULL DEFAULT false,
    "ditandatanganiPada" TIMESTAMP(3),

    CONSTRAINT "Kontrak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Izin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jenis" "JenisIzin" NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalAkhir" TIMESTAMP(3) NOT NULL,
    "alasan" TEXT NOT NULL,
    "suratDokter" TEXT,
    "status" "StatusIzin" NOT NULL DEFAULT 'MENUNGGU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Izin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TukarLibur" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tanggalLibur" TIMESTAMP(3) NOT NULL,
    "tukarDengan" TEXT NOT NULL,
    "tanggalPengganti" TIMESTAMP(3),
    "keterangan" TEXT,
    "status" "StatusIzin" NOT NULL DEFAULT 'MENUNGGU',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TukarLibur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nama_key" ON "User"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilKaryawan_userId_key" ON "ProfilKaryawan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Kontrak_userId_key" ON "Kontrak"("userId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilKaryawan" ADD CONSTRAINT "ProfilKaryawan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kontrak" ADD CONSTRAINT "Kontrak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Izin" ADD CONSTRAINT "Izin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TukarLibur" ADD CONSTRAINT "TukarLibur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
