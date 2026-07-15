import { tambahBulan } from "./cari-user";
import { KONTRAK_PERCOBAAN, kontrakSatuTahun } from "./dokumen-toko";
import { statusMasaKerja } from "./masa-kerja";

// Formula masa kontrak otomatis berdasarkan tanggal masuk kerja:
// - masa kerja < 3 bulan  -> kontrak percobaan 3 bulan terhitung dari tanggal masuk
// - masa kerja 3 bln-3 thn -> kontrak 1 tahun terhitung dari akhir masa 3 bulan,
//   periode bergulir per tahun sampai mencakup tanggal `sekarang`
// - masa kerja > 3 tahun  -> karyawan tetap, kembalikan null (tidak terikat kontrak)
export function hitungMasaKontrakOtomatis(
  tanggalMasuk: Date,
  sekarang: Date = new Date()
): { mulaiKontrak: Date; akhirKontrak: Date; isiKontrak: string } | null {
  if (statusMasaKerja(tanggalMasuk) === "TETAP") return null;

  const akhirTigaBulan = tambahBulan(tanggalMasuk, 3);
  let mulaiKontrak: Date;
  let akhirKontrak: Date;
  let isiKontrak: string;

  if (sekarang < akhirTigaBulan) {
    mulaiKontrak = tanggalMasuk;
    akhirKontrak = akhirTigaBulan;
    isiKontrak = KONTRAK_PERCOBAAN;
  } else {
    mulaiKontrak = akhirTigaBulan;
    akhirKontrak = tambahBulan(mulaiKontrak, 12);
    while (akhirKontrak < sekarang) {
      mulaiKontrak = akhirKontrak;
      akhirKontrak = tambahBulan(mulaiKontrak, 12);
    }
    isiKontrak = kontrakSatuTahun(mulaiKontrak, akhirKontrak);
  }

  return { mulaiKontrak, akhirKontrak, isiKontrak };
}
