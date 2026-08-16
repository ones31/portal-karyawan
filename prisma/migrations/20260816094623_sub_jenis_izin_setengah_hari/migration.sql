-- CreateEnum
CREATE TYPE "SubJenisSetengahHari" AS ENUM ('TELAT', 'PERTENGAHAN', 'PULANG_CEPAT');

-- AlterTable
ALTER TABLE "Izin" ADD COLUMN     "jamKeluar" TEXT,
ADD COLUMN     "jamMasuk" TEXT,
ADD COLUMN     "jamPulang" TEXT,
ADD COLUMN     "subJenisSetengahHari" "SubJenisSetengahHari";
