-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nip" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nip_key" ON "User"("nip");
