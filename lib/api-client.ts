/**
 * Client-Side API Fetch Helper untuk AKAR
 *
 * Mengotomatisasi:
 * 1. Penyertaan header autentikasi demo (x-test-auth-id) berdasarkan peran aktif di localStorage
 * 2. Penyertaan token Supabase jika pengguna login secara riil
 * 3. Format respons seragam { data, error, meta } sesuai PRD Bagian 33.1
 */

import { UserRole } from "./use-current-role";

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  } | null;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: unknown;
  };
}

// Pemetaan peran demo ke authId akun seed PostgreSQL (prisma/seed.ts)
const ROLE_TO_SEED_AUTH: Record<UserRole, string | null> = {
  PUBLIK: null,
  WARGA: "seed_auth_ketua_a", // Rudi Hermawan (Ketua Kelompok Tani Muda / WARGA Aktif)
  PERANGKAT_DESA: "seed_auth_kades", // Pak Hendy (Kepala Desa / Perangkat)
  PENGAWAS: "seed_auth_pengawas", // Pak Bambang (Pengawas BPD)
  ADMIN: "seed_auth_admin", // Siti Rahma (Admin Desa)
};

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});

  // 1. Dapatkan peran demo dari localStorage
  if (typeof window !== "undefined") {
    try {
      const activeRole = localStorage.getItem("akar_user_role") as UserRole | null;
      if (activeRole && ROLE_TO_SEED_AUTH[activeRole]) {
        // Sisipkan x-test-auth-id untuk lingkungan pengujian/demo lokal
        headers.set("x-test-auth-id", ROLE_TO_SEED_AUTH[activeRole]!);
      }

      // Periksa juga apakah ada session Supabase di localStorage
      const supabaseToken = localStorage.getItem("akar_auth_token");
      if (supabaseToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${supabaseToken}`);
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }

  // 2. Set Content-Type default jika body berupa string/JSON dan bukan FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const json = await res.json();
      return json as ApiResponse<T>;
    }

    if (!res.ok) {
      return {
        data: null,
        error: {
          code: `HTTP_${res.status}`,
          message: `Permintaan gagal dengan status ${res.status}: ${res.statusText}`,
        },
      };
    }

    return {
      data: (await res.text()) as unknown as T,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
    return {
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message,
      },
    };
  }
}

export const apiClient = {
  get: <T = unknown>(url: string, options?: RequestInit) =>
    apiFetch<T>(url, { credentials: "omit", ...options, method: "GET" }),

  post: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(url, {
      credentials: "omit",
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = unknown>(url: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(url, {
      credentials: "omit",
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = unknown>(url: string, options?: RequestInit) =>
    apiFetch<T>(url, { credentials: "omit", ...options, method: "DELETE" }),
};

