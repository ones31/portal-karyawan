import { redirect } from "next/navigation";
import { sesiSaatIni } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function KaryawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesi = await sesiSaatIni();
  if (!sesi) redirect("/login");
  if (sesi.role !== "KARYAWAN") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        nama={sesi.nama}
        links={[
          { href: "/karyawan", label: "Beranda" },
          { href: "/karyawan/data-pribadi", label: "Data Pribadi" },
          { href: "/karyawan/kontrak", label: "Kontrak Kerja" },
          { href: "/karyawan/izin", label: "Izin" },
          { href: "/karyawan/ganti-password", label: "Ganti Password" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
    </div>
  );
}
