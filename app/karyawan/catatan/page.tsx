import { prisma } from "@/lib/prisma";
import { sesiSaatIni } from "@/lib/auth";
import TombolTandaiDibaca from "@/components/TombolTandaiDibaca";

function formatWaktu(d: Date) {
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CatatanKaryawanPage() {
  const sesi = (await sesiSaatIni())!;
  const catatan = await prisma.catatan.findMany({
    where: { userId: sesi.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      judul: true,
      isi: true,
      dibacaPada: true,
      createdAt: true,
      pengirim: { select: { nama: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Catatan dari Admin</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pesan & pengumuman dari admin atau owner toko untuk Anda.
        </p>
      </div>

      {catatan.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Belum ada catatan untuk Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {catatan.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl bg-white p-5 shadow-sm ${
                c.dibacaPada ? "" : "border-l-4 border-blue-500"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{c.judul}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {c.pengirim?.nama ?? "Admin"} · {formatWaktu(c.createdAt)}
                  </p>
                </div>
                {c.dibacaPada ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Sudah dibaca
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Baru
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap text-slate-700">
                {c.isi}
              </p>
              {!c.dibacaPada && (
                <div className="mt-4">
                  <TombolTandaiDibaca id={c.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
