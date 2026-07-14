import { Fragment } from "react";

// Merender teks dokumen sederhana: "# " judul, "## " sub-judul,
// "N. " daftar bernomor, "- " butir, dan **teks** untuk cetak tebal.
function Inline({ teks }: { teks: string }) {
  const bagian = teks.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {bagian.map((b, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-slate-900">
            {b}
          </strong>
        ) : (
          <Fragment key={i}>{b}</Fragment>
        )
      )}
    </>
  );
}

export default function DokumenMarkdown({ teks }: { teks: string }) {
  const baris = teks.split("\n");
  return (
    <div className="text-sm leading-relaxed text-slate-700">
      {baris.map((b, i) => {
        const t = b.trim();
        if (!t) return null;
        if (t.startsWith("# ")) {
          return (
            <h2
              key={i}
              className="mb-4 text-center text-base font-bold tracking-wide text-slate-900"
            >
              {t.slice(2)}
            </h2>
          );
        }
        if (t.startsWith("## ")) {
          return (
            <h3
              key={i}
              className="mt-6 mb-2 border-b border-slate-200 pb-1 font-bold text-slate-900"
            >
              {t.slice(3)}
            </h3>
          );
        }
        const nomor = t.match(/^(\d+)\.\s+(.*)$/);
        if (nomor) {
          return (
            <p key={i} className="mt-2 flex gap-2 pl-1">
              <span className="w-5 shrink-0 text-right font-medium text-slate-500">
                {nomor[1]}.
              </span>
              <span>
                <Inline teks={nomor[2]} />
              </span>
            </p>
          );
        }
        if (t.startsWith("- ")) {
          return (
            <p key={i} className="mt-1.5 flex gap-2 pl-8">
              <span className="shrink-0 text-slate-400">•</span>
              <span>
                <Inline teks={t.slice(2)} />
              </span>
            </p>
          );
        }
        return (
          <p key={i} className="mt-3">
            <Inline teks={t} />
          </p>
        );
      })}
    </div>
  );
}
