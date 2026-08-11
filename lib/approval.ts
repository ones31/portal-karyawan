import { prisma } from "./prisma";
import { kirimNotifKeUser } from "./push";
import { LABEL_JENIS_IZIN } from "./izin";

// Logika setujui/tolak izin & tukar libur — SATU tempat, dipakai baik oleh rute
// admin ber-sesi (app/api/admin/izin|tukar-libur/[id]) maupun endpoint agen
// ber-token (app/api/admin/agent-approval). Setiap perubahan status selalu
// mengirim notifikasi hasil ke karyawan ybs (gagal kirim tidak menggagalkan).

export type StatusKeputusan = "DISETUJUI" | "DITOLAK";

// feedback: catatan opsional admin/owner (mis. alasan penolakan), disimpan di
// feedbackAdmin & ikut ditampilkan ke karyawan di riwayat pengajuannya serta
// disertakan dalam isi notifikasi push kalau diisi.
export async function prosesIzin(
  id: string,
  status: StatusKeputusan,
  feedback?: string
) {
  const izin = await prisma.izin.update({
    where: { id },
    data: { status, feedbackAdmin: feedback?.trim() || null },
  });

  const inti = `${LABEL_JENIS_IZIN[izin.jenis]} ${izin.tanggalMulai.toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "short" }
  )} ${status === "DISETUJUI" ? "telah disetujui" : "ditolak"}.`;
  await kirimNotifKeUser(izin.userId, {
    judul: `Izin Anda ${status === "DISETUJUI" ? "disetujui ✅" : "ditolak ❌"}`,
    isi: izin.feedbackAdmin ? `${inti} Catatan: ${izin.feedbackAdmin}` : inti,
    url: "/karyawan/izin",
  }).catch(() => {});

  return izin;
}

export async function prosesTukarLibur(
  id: string,
  status: StatusKeputusan,
  feedback?: string
) {
  const tukarLibur = await prisma.tukarLibur.update({
    where: { id },
    data: { status, feedbackAdmin: feedback?.trim() || null },
  });

  const inti = `Tukar libur ${tukarLibur.tanggalLibur.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })} dengan ${tukarLibur.tukarDengan} ${
    status === "DISETUJUI" ? "telah disetujui" : "ditolak"
  }.`;
  await kirimNotifKeUser(tukarLibur.userId, {
    judul: `Tukar libur ${status === "DISETUJUI" ? "disetujui ✅" : "ditolak ❌"}`,
    isi: tukarLibur.feedbackAdmin ? `${inti} Catatan: ${tukarLibur.feedbackAdmin}` : inti,
    url: "/karyawan/izin",
  }).catch(() => {});

  return tukarLibur;
}
