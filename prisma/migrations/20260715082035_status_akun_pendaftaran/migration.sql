-- CreateEnum
CREATE TYPE "StatusAkun" AS ENUM ('MENUNGGU', 'AKTIF', 'DITOLAK');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "statusAkun" "StatusAkun" NOT NULL DEFAULT 'AKTIF';
