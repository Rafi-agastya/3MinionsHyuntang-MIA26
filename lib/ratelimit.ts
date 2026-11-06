import { ApiError } from "./api";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * Penyimpanan rate limit berbasis in-memory Map per kunci.
 *
 * PERINGATAN ARSITEKTUR PRODUKSI:
 * Implementasi in-memory ini hanya ditujukan untuk keperluan development, demo, dan pengujian.
 * Pada lingkungan produksi multi-instance atau serverless (seperti Vercel / Cloud Run),
 * implementasi ini WAJIB digantikan oleh penyimpanan bersama (shared storage) seperti
 * Redis, Upstash, atau database distributed lock agar kuota sinkron antar instance.
 */
const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Memeriksa batasan frekuensi panggilan (rate limit) untuk suatu kunci.
 *
 * @param key Identifier unik (misalnya: `registrasi:ip` atau `login:email`)
 * @param limit Batas maksimal permintaan dalam jendela waktu
 * @param windowSeconds Durasi jendela waktu dalam detik
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetAt) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, record);
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt: record.resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/**
 * Helper untuk melempar ApiError RATE_LIMITED (429) jika rate limit terlampaui.
 */
export function assertRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  customMessage?: string
): void {
  const result = checkRateLimit(key, limit, windowSeconds);
  if (!result.allowed) {
    const waitSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    throw new ApiError(
      "RATE_LIMITED",
      customMessage ??
        `Terlalu banyak permintaan. Silakan coba kembali dalam ${waitSeconds} detik.`,
      undefined,
      429
    );
  }
}

/**
 * Helper untuk membersihkan store saat testing
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

