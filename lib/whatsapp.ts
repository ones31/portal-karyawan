// Ambil nomor HP Indonesia yang bisa dipakai WhatsApp dari field telepon bebas
// format (kadang berisi 2 nomor sekaligus, mis. "021555123 / 081311112222" —
// nomor rumah/kantor tidak dipakai, cuma yang polanya nomor HP "08...").
export function nomorWhatsapp(telepon: string | null | undefined): string | null {
  if (!telepon) return null;
  const kandidat = telepon.split(/[/,;]+/).map((s) => s.replace(/\D/g, ""));
  for (const digit of kandidat) {
    if (/^08\d{7,11}$/.test(digit)) return "62" + digit.slice(1);
    if (/^628\d{7,11}$/.test(digit)) return digit;
  }
  return null;
}

// Link chat WhatsApp langsung (wa.me), null kalau tidak ada nomor HP valid
export function tautanWhatsapp(telepon: string | null | undefined): string | null {
  const nomor = nomorWhatsapp(telepon);
  return nomor ? `https://wa.me/${nomor}` : null;
}
