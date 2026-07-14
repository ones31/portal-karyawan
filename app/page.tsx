import { redirect } from "next/navigation";
import { sesiSaatIni, adalahAdmin } from "@/lib/auth";

export default async function Home() {
  const sesi = await sesiSaatIni();
  if (!sesi) redirect("/login");
  redirect(adalahAdmin(sesi.role) ? "/admin" : "/karyawan");
}
