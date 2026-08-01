-- CreateTable
CREATE TABLE "Catatan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "pengirimId" TEXT,
    "dibacaPada" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Catatan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Catatan_userId_dibacaPada_idx" ON "Catatan"("userId", "dibacaPada");

-- AddForeignKey
ALTER TABLE "Catatan" ADD CONSTRAINT "Catatan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Catatan" ADD CONSTRAINT "Catatan_pengirimId_fkey" FOREIGN KEY ("pengirimId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
