"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotifikasiToggle from "@/components/NotifikasiToggle";

export default function Navbar({
  nama,
  links,
}: {
  nama: string;
  links: { href: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="font-bold text-blue-700">Portal Toko Marmo</span>
        <nav className="flex flex-wrap gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                pathname === l.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <NotifikasiToggle />
          <span className="text-sm text-slate-500">{nama}</span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
