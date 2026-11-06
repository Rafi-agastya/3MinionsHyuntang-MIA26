/**
 * /lib/rate-limit.ts
 * Utilitas pembatasan laju permintaan (rate limiting) in-memory berbasis IP klien.
 * Sesuai PRD Bagian 35.4 (Unduh data /api/data/*: 60 per menit per IP).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Mengambil IP klien dari header umum (x-forwarded-for, x-real-ip) atau fallback.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Memeriksa apakah permintaan melampaui batas yang diizinkan.
 *
 * @param key Pengenal unik pemohon (biasanya IP klien)
 * @param limit Batas maksimal permintaan dalam satu jendela waktu (default: 60)
 * @param windowMs Panjang jendela waktu dalam milidetik (default: 60.000 ms = 1 menit)
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Pembatasan harian per akun pengguna (PRD Bagian 35.4: 5 ide/hari dan 5 tiket/hari per akun).
 *
 * @param userId ID pengguna terotentikasi
 * @param action Jenis aksi ("ide" | "tiket")
 * @param limit Batas harian (default: 5)
 */
export function checkAccountDailyLimit(
  userId: string,
  action: "ide" | "tiket",
  limit = 5
): RateLimitResult {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return checkRateLimit(`account:${action}:${userId}`, limit, ONE_DAY_MS);
}

/**
 * Membersihkan seluruh catatan rate limit (berguna untuk isolasi pengujian Vitest).
 */
export function resetRateLimitStore(): void {
  store.clear();
}

