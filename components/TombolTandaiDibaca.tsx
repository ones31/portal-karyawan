"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Tombol karyawan menandai satu catatan sudah dibaca.
// Setelah berhasil, halaman di-refresh supaya banner di beranda ikut hilang
// dan admin melihat status "sudah dibaca" di daftar kirimannya.
export default function TombolTandaiDibaca({ id }: { id: string }) {
  const router = useRouter();
  const [mengirim, setMengirim] = useState(false);

  async function tandai() {
    setMengirim(true);
    await fetch(`/api/catatan/${id}`, { method: "PATCH" });
    setMengirim(false);
    router.refresh();
  }

  return (
    <button
      onClick={tandai}
      disabled={mengirim}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {mengirim ? "Menyimpan..." : "Tandai sudah dibaca"}
    </button>
  );
}
