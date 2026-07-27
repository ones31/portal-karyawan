import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "ganti-dengan-secret-acak-di-produksi"
);

export type SessionPayload = {
  userId: string;
  nama: string;
  role: "SUPER_ADMIN" | "ADMIN" | "KARYAWAN";
};

export function adalahAdmin(role: SessionPayload["role"]): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

// Password default karyawan (dipakai saat impor & saat admin reset password
// karyawan yang lupa password sendiri). Nilai sama dengan yang dipakai
// prisma/import-karyawan*.ts — JANGAN diubah tanpa diminta (lihat AGENTS.md).
export const PASSWORD_DEFAULT_KARYAWAN = "123";

export async function buatToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifikasiToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function sesiSaatIni(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifikasiToken(token);
}
