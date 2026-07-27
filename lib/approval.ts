import { prisma } from "./prisma";
import { kirimNotifKeUser } from "./push";
import { LABEL_JENIS_IZIN } from "./izin";

// Logika setujui/tolak izin & tukar libur — SATU tempat, dipakai baik oleh rute
// admin ber-sesi (app/api/admin/izin|tukar-libur/[id]) maupun endpoint agen
// ber-token (app/api/admin/agent-approval). Setiap perubahan status selalu
// mengirim notifikasi hasil ke karyawan ybs (gagal kirim tidak menggagalkan).

export type StatusKeputusan = "DISETUJUI" | "DITOLAK";

export async function prosesIzin(id: string, status: StatusKeputusan) {
  const izin = await prisma.izin.update({ where: { id }, data: { status } });

  await kirimNotifKeUser(izin.userId, {
    judul: `Izin Anda ${status === "DISETUJUI" ? "disetujui ✅" : "ditolak ❌"}`,
    isi: `${LABEL_JENIS_IZIN[izin.jenis]} ${izin.tanggalMulai.toLocaleDateString(
      "id-ID",
      { day: "numeric", month: "short" }
    )} ${status === "DISETUJUI" ? "telah disetujui" : "ditolak"}.`,
    url: "/karyawan/izin",
  }).catch(() => {});

  return izin;
}

export async function prosesTukarLibur(id: string, status: StatusKeputusan) {
  const tukarLibur = await prisma.tukarLibur.update({
    where: { id },
    data: { status },
  });

  await kirimNotifKeUser(tukarLibur.userId, {
    judul: `Tukar libur ${status === "DISETUJUI" ? "disetujui ✅" : "ditolak ❌"}`,
    isi: `Tukar libur ${tukarLibur.tanggalLibur.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    })} dengan ${tukarLibur.tukarDengan} ${
      status === "DISETUJUI" ? "telah disetujui" : "ditolak"
    }.`,
    url: "/karyawan/izin",
  }).catch(() => {});

  return tukarLibur;
}
