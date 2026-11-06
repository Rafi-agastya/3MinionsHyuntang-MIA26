import crypto from "crypto";

/**
 * Mengubah NIK 16 digit menjadi hash SHA-256 dengan garam server (FR-ID1).
 * Nilai NIK asli tidak pernah disimpan di database atau dikembalikan ke klien.
 */
export function hashNik(nik: string): string {
  const salt = process.env.NIK_HASH_SALT || "akar_garam_desa_rahasia_2026";
  return crypto
    .createHash("sha256")
    .update(`${salt}:${nik.trim()}`)
    .digest("hex");
}

/**
 * Menghapus kolom sensitif nikHash dari objek anggota sebelum dikirim ke klien.
 */
export function sanitasiAnggota<T extends { nikHash?: string | null }>(
  anggota: T
): Omit<T, "nikHash"> {
  const clean = { ...anggota };
  delete clean.nikHash;
  return clean;
}

/**
 * Menghapus nikHash dari seluruh anggota di dalam data kelompok.
 */
export function sanitasiKelompok<
  T extends { anggota?: Array<{ nikHash?: string | null }> }
>(kelompok: T): T {
  if (!kelompok) return kelompok;
  if (Array.isArray(kelompok.anggota)) {
    return {
      ...kelompok,
      anggota: kelompok.anggota.map((a) => sanitasiAnggota(a)),
    } as T;
  }
  return kelompok;
}
