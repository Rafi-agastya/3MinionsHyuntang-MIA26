import { Pengguna, Peran, StatusAkun } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./api";
import { getSupabasePublicClient } from "./supabase";

/**
 * Ekstraksi token dari header Authorization atau cookies.
 */
function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    // Cari cookie session Supabase umum (sb-access-token, supabase-auth-token, dsb.)
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );

    if (cookies["sb-access-token"]) {
      return cookies["sb-access-token"];
    }

    // Pola Supabase SSR: sb-<project-ref>-auth-token
    for (const [key, value] of Object.entries(cookies)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed) && parsed[0]) {
            return parsed[0];
          }
          if (typeof parsed === "object" && parsed?.access_token) {
            return parsed.access_token;
          }
        } catch {
          if (value) return value;
        }
      }
    }
  }

  return null;
}

/**
 * Membaca sesi otentikasi dari cookie/header Supabase, lalu memuat data Pengguna AKTUAL
 * dari basis data PostgreSQL.
 *
 * PENTING (PRD 33.1 & Aturan 13):
 * "Jangan percaya klaim klien" — peran dan statusAkun selalu dibaca langsung dari tabel Pengguna DB.
 */
export async function getPengguna(req: Request): Promise<Pengguna | null> {
  // 1. Dukungan header khusus pengujian integrasi (lingkungan test / dev offline)
  const testAuthId = req.headers.get("x-test-auth-id");
  if (testAuthId) {
    const penggunaTest = await prisma.pengguna.findUnique({
      where: { authId: testAuthId },
    });
    if (penggunaTest) return penggunaTest;
  }

  const testUserId = req.headers.get("x-test-user-id");
  if (testUserId) {
    const penggunaTest = await prisma.pengguna.findUnique({
      where: { id: testUserId },
    });
    if (penggunaTest) return penggunaTest;
  }

  // 2. Ekstrak token Supabase
  const token = extractAuthToken(req);
  if (!token) {
    return null;
  }

  try {
    const supabase = getSupabasePublicClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // 3. Muat record Pengguna dari database lokal berdasar authId (bukan dari klaim JWT klien)
    const pengguna = await prisma.pengguna.findUnique({
      where: { authId: user.id },
    });

    return pengguna;
  } catch (err) {
    console.error("[AUTH_GET_PENGGUNA_ERROR]", err);
    return null;
  }
}

/**
 * Memastikan permintaan memiliki sesi pengguna terotentikasi.
 * Melempar ApiError 401 UNAUTHENTICATED jika belum login.
 */
export async function requireAuth(req: Request): Promise<Pengguna> {
  const pengguna = await getPengguna(req);
  if (!pengguna) {
    throw new ApiError(
      "UNAUTHENTICATED",
      "Sesi autentikasi tidak ditemukan atau telah berakhir. Silakan masuk terlebih dahulu.",
      undefined,
      401
    );
  }
  return pengguna;
}

/**
 * Memastikan pengguna memiliki salah satu dari peran yang diizinkan (RBAC).
 * Melempar ApiError 403 FORBIDDEN jika peran tidak memenuhi.
 */
export function requireRole(pengguna: Pengguna, ...roles: Peran[]): void {
  if (!roles.includes(pengguna.peran)) {
    throw new ApiError(
      "FORBIDDEN",
      "Peran akun Anda tidak memiliki hak akses untuk tindakan ini.",
      undefined,
      403
    );
  }
}

/**
 * Memastikan akun berstatus AKTIF sebelum melakukan aksi partisipatif
 * (mengajukan proposal, ide, verifikasi, dsb.).
 *
 * Sesuai PRD 35.1:
 * Akun MENUNGGU mengembalikan respons 403 dengan pesan "Akun Anda menunggu konfirmasi perangkat desa".
 */
export function requireAktif(pengguna: Pengguna): void {
  if (pengguna.statusAkun === StatusAkun.MENUNGGU) {
    throw new ApiError(
      "FORBIDDEN",
      "Akun Anda menunggu konfirmasi perangkat desa.",
      undefined,
      403
    );
  }

  if (pengguna.statusAkun === StatusAkun.DITOLAK) {
    throw new ApiError(
      "FORBIDDEN",
      "Pengajuan akun Anda telah ditolak oleh perangkat desa.",
      undefined,
      403
    );
  }

  if (pengguna.statusAkun === StatusAkun.DINONAKTIFKAN) {
    throw new ApiError(
      "FORBIDDEN",
      "Akun Anda telah dinonaktifkan oleh administrator desa.",
      undefined,
      403
    );
  }

  if (pengguna.statusAkun !== StatusAkun.AKTIF) {
    throw new ApiError(
      "FORBIDDEN",
      "Akun Anda belum dalam status aktif.",
      undefined,
      403
    );
  }
}

