import { redirect } from "next/navigation";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesi = await sesiSaatIni();
  if (!sesi) redirect("/login");
  if (!adalahAdmin(sesi.role)) redirect("/karyawan");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        nama={sesi.nama}
        links={[
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/karyawan", label: "Daftar Karyawan" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</main>
    </div>
  );
}
