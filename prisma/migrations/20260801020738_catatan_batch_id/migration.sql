/*
  Warnings:

  - Added the required column `batchId` to the `Catatan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Catatan" ADD COLUMN     "batchId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Catatan_batchId_idx" ON "Catatan"("batchId");
