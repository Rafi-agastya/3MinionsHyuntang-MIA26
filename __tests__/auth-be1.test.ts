import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { Peran, StatusAkun } from "@prisma/client";
import { ok, fail, formatZodError, HTTP_STATUS_MAP } from "@/lib/api";
import { requireAuth, requireRole, requireAktif } from "@/lib/auth";
import { checkRateLimit, assertRateLimit, clearRateLimitStore } from "@/lib/ratelimit";

// In-memory mock database untuk pengujian unit & integrasi terisolasi
interface MockPengguna {
  id: string;
  authId: string;
  nama: string;
  email: string;
  peran: Peran;
  statusAkun: StatusAkun;
  desaId: string;
  rtRw: string;
  kontak: string | null;
  setujuSyaratPada: Date;
  createdAt: Date;
}

interface MockAudit {
  id: string;
  aktorId: string | null;
  aksi: string;
  entitas: string;
  entitasId: string;
  sebelum?: unknown;
  sesudah?: unknown;
  createdAt: Date;
}

const mockDesaStore = [
  {
    id: "seed_desa_001",
    nama: "Desa Karang Sari",
    kodeKemendagri: "32.04.05.2001",
    kecamatan: "Cilengkrang",
    kabupaten: "Bandung",
    provinsi: "Jawa Barat",
    tahunAnggaran: 2026,
  },
];

let mockPenggunaStore: MockPengguna[] = [];
let mockAuditStore: MockAudit[] = [];

function resetMockDb() {
  mockPenggunaStore = [
    {
      id: "seed_user_kades",
      authId: "seed_auth_kades",
      nama: "Pak Hendy",
      email: "kades@karangsari.desa.id",
      peran: Peran.PERANGKAT,
      statusAkun: StatusAkun.AKTIF,
      desaId: "seed_desa_001",
      rtRw: "01/01",
      kontak: "081234567890",
      setujuSyaratPada: new Date(),
      createdAt: new Date(),
    },
    {
      id: "seed_user_ketua_a",
      authId: "seed_auth_ketua_a",
      nama: "Rudi Hartono",
      email: "rudi@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "seed_desa_001",
      rtRw: "02/03",
      kontak: "081234567891",
      setujuSyaratPada: new Date(),
      createdAt: new Date(),
    },
  ];
  mockAuditStore = [];
}

resetMockDb();

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      pengguna: {
        findUnique: vi.fn(async ({ where }: { where: { id?: string; authId?: string; email?: string } }) => {
          if (where.id) {
            return mockPenggunaStore.find((u) => u.id === where.id) || null;
          }
          if (where.authId) {
            return mockPenggunaStore.find((u) => u.authId === where.authId) || null;
          }
          if (where.email) {
            return mockPenggunaStore.find((u) => u.email.toLowerCase() === where.email?.toLowerCase()) || null;
          }
          return null;
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const record: MockPengguna = {
            id: data.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            authId: data.authId || `auth_${Date.now()}`,
            nama: data.nama,
            email: data.email,
            peran: data.peran,
            statusAkun: data.statusAkun,
            desaId: data.desaId,
            rtRw: data.rtRw,
            kontak: data.kontak ?? null,
            setujuSyaratPada: data.setujuSyaratPada || new Date(),
            createdAt: new Date(),
          };
          mockPenggunaStore.push(record);
          return record;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
          const index = mockPenggunaStore.findIndex((u) => u.id === where.id);
          if (index === -1) throw new Error("Record not found");
          mockPenggunaStore[index] = { ...mockPenggunaStore[index], ...data };
          return mockPenggunaStore[index];
        }),
      },
      desa: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return mockDesaStore.find((d) => d.id === where.id) || null;
        }),
      },
      auditLog: {
        create: vi.fn(async ({ data }: { data: any }) => {
          const record: MockAudit = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            aktorId: data.aktorId ?? null,
            aksi: data.aksi,
            entitas: data.entitas,
            entitasId: data.entitasId,
            sebelum: data.sebelum,
            sesudah: data.sesudah,
            createdAt: new Date(),
          };
          mockAuditStore.push(record);
          return record;
        }),
        findFirst: vi.fn(async ({ where }: { where: any }) => {
          return (
            mockAuditStore.find((a) => {
              if (where.entitasId && a.entitasId !== where.entitasId) return false;
              if (where.aksi && a.aksi !== where.aksi) return false;
              return true;
            }) || null
          );
        }),
      },
    },
    serializeBigInt: (data: unknown) => data,
  };
});

// Import prisma mock reference after vi.mock
import { prisma } from "@/lib/prisma";

// Mock helper untuk Next.js Request
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}) {
  const headers = new Headers(options.headers || {});
  const reqInit: RequestInit = {
    method: options.method || "GET",
    headers,
  };
  if (options.body) {
    reqInit.body = JSON.stringify(options.body);
    headers.set("content-type", "application/json");
  }
  return new Request(options.url || "http://localhost:3000/api/test", reqInit);
}

describe("Paket BE-1: /lib/api.ts (Format Respons & Penanganan Galat)", () => {
  it("ok() mengembalikan respons dengan struktur { data, error: null } dan status 200/201", async () => {
    const res = ok({ nama: "Desa Karang Sari" }, { page: 1 }, 200);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      data: { nama: "Desa Karang Sari" },
      error: null,
      meta: { page: 1 },
    });
  });

  it("fail() memetakan kode galat ke HTTP status code yang tepat sesuai PRD 33.1", async () => {
    expect(HTTP_STATUS_MAP.VALIDATION_ERROR).toBe(400);
    expect(HTTP_STATUS_MAP.UNAUTHENTICATED).toBe(401);
    expect(HTTP_STATUS_MAP.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS_MAP.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS_MAP.CONFLICT).toBe(409);
    expect(HTTP_STATUS_MAP.RATE_LIMITED).toBe(429);
    expect(HTTP_STATUS_MAP.AI_FAILED).toBe(502);
    expect(HTTP_STATUS_MAP.INTERNAL).toBe(500);

    const res401 = fail("UNAUTHENTICATED", "Belum masuk");
    expect(res401.status).toBe(401);
    const json401 = await res401.json();
    expect(json401).toEqual({
      data: null,
      error: { code: "UNAUTHENTICATED", message: "Belum masuk" },
    });

    const res403 = fail("FORBIDDEN", "Tidak berhak");
    expect(res403.status).toBe(403);

    const res409 = fail("CONFLICT", "Email sudah terdaftar");
    expect(res409.status).toBe(409);
  });

  it("formatZodError mengonversi ZodError menjadi Record pesan per kolom", () => {
    const testSchema = z.object({
      email: z.string().email("Format email salah"),
      kataSandi: z.string().min(8, "Minimal 8 karakter"),
    });

    const parsed = testSchema.safeParse({ email: "invalid", kataSandi: "123" });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const formatted = formatZodError(parsed.error);
      expect(formatted).toHaveProperty("email");
      expect(formatted).toHaveProperty("kataSandi");
      expect(formatted.email).toContain("Format email salah");
      expect(formatted.kataSandi).toContain("Minimal 8 karakter");
    }
  });
});

describe("Paket BE-1: /lib/auth.ts (Sesi, Peran, & Status Akun)", () => {
  const mockUserAktif = {
    id: "usr_001",
    authId: "auth_001",
    nama: "Pak Hendy",
    email: "kades@karangsari.desa.id",
    peran: Peran.PERANGKAT,
    statusAkun: StatusAkun.AKTIF,
    desaId: "seed_desa_001",
    rtRw: "01/01",
    kontak: null,
    setujuSyaratPada: new Date(),
    createdAt: new Date(),
  };

  const mockUserMenunggu = {
    ...mockUserAktif,
    id: "usr_002",
    authId: "auth_002",
    nama: "Warga Baru",
    email: "warga@karangsari.desa.id",
    peran: Peran.WARGA,
    statusAkun: StatusAkun.MENUNGGU,
  };

  const mockUserDitolak = {
    ...mockUserAktif,
    id: "usr_003",
    statusAkun: StatusAkun.DITOLAK,
  };

  it("requireAuth() melempar ApiError 401 UNAUTHENTICATED jika tidak ada sesi", async () => {
    const req = createMockRequest({});

    await expect(requireAuth(req)).rejects.toThrowError(
      expect.objectContaining({
        code: "UNAUTHENTICATED",
        status: 401,
      })
    );
  });

  it("requireRole() melempar ApiError 403 FORBIDDEN jika peran tidak sesuai", () => {
    // Warga mencoba mengakses fungsi PERANGKAT / ADMIN
    expect(() => {
      requireRole(mockUserMenunggu, Peran.PERANGKAT, Peran.ADMIN);
    }).toThrowError(
      expect.objectContaining({
        code: "FORBIDDEN",
        status: 403,
      })
    );

    // Perangkat berhasil mengakses fungsi PERANGKAT
    expect(() => {
      requireRole(mockUserAktif, Peran.PERANGKAT);
    }).not.toThrow();
  });

  it("requireAktif() melempar ApiError 403 dengan pesan spesifik jika akun MENUNGGU", () => {
    expect(() => {
      requireAktif(mockUserMenunggu);
    }).toThrowError(
      expect.objectContaining({
        code: "FORBIDDEN",
        status: 403,
        message: "Akun Anda menunggu konfirmasi perangkat desa.",
      })
    );
  });

  it("requireAktif() menolak akun yang DITOLAK atau DINONAKTIFKAN", () => {
    expect(() => {
      requireAktif(mockUserDitolak);
    }).toThrowError(
      expect.objectContaining({
        code: "FORBIDDEN",
        status: 403,
      })
    );
  });

  it("requireAktif() lolos tanpa error jika akun sudah AKTIF", () => {
    expect(() => {
      requireAktif(mockUserAktif);
    }).not.toThrow();
  });
});

describe("Paket BE-1: /lib/ratelimit.ts (In-memory Rate Limiting)", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("mengizinkan permintaan di bawah batas dan memblokir jika melewati batas (429)", () => {
    const key = "test:127.0.0.1";
    const limit = 3;
    const windowSec = 60;

    // 1st request
    const r1 = checkRateLimit(key, limit, windowSec);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    // 2nd request
    const r2 = checkRateLimit(key, limit, windowSec);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    // 3rd request
    const r3 = checkRateLimit(key, limit, windowSec);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request (over limit)
    const r4 = checkRateLimit(key, limit, windowSec);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);

    // assertRateLimit melempar 429
    expect(() => {
      assertRateLimit(key, limit, windowSec);
    }).toThrowError(
      expect.objectContaining({
        code: "RATE_LIMITED",
        status: 429,
      })
    );
  });
});

describe("Paket BE-1: Validasi Kata Sandi Sesuai PRD 35.1", () => {
  const kataSandiSchema = z
    .string()
    .min(8, "Kata sandi minimal 8 karakter.")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Kata sandi harus memuat kombinasi huruf dan angka."
    );

  it("menolak kata sandi yang kurang dari 8 karakter", () => {
    const result = kataSandiSchema.safeParse("abc12");
    expect(result.success).toBe(false);
  });

  it("menolak kata sandi yang hanya huruf tanpa angka", () => {
    const result = kataSandiSchema.safeParse("hanyahurufaja");
    expect(result.success).toBe(false);
  });

  it("menolak kata sandi yang hanya angka tanpa huruf", () => {
    const result = kataSandiSchema.safeParse("1234567890");
    expect(result.success).toBe(false);
  });

  it("menerima kata sandi valid yang memuat minimal 8 karakter dengan kombinasi huruf dan angka", () => {
    const result = kataSandiSchema.safeParse("DesaMaju2026");
    expect(result.success).toBe(true);
  });
});

describe("Paket BE-1: Integrasi Endpoint Registrasi & Verifikasi", () => {
  it("POST /api/registrasi berhasil mendaftarkan warga baru dengan status MENUNGGU (201)", async () => {
    // Dynamic import route handler
    const { POST: registrasiHandler } = await import("@/app/api/registrasi/route");

    const uniqueEmail = `warga_test_${Date.now()}@karangsari.desa.id`;
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/registrasi",
      body: {
        nama: "Rizky Firmansyah",
        email: uniqueEmail,
        kataSandi: "AmanBanget2026",
        desaId: "seed_desa_001",
        rtRw: "02/03",
        kontak: "081299998888",
        setuju: true,
      },
    });

    const res = await registrasiHandler(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.data.statusAkun).toBe(StatusAkun.MENUNGGU);
    expect(json.data.id).toBeDefined();

    // Pastikan tercatat di database dengan status MENUNGGU
    const createdInDb = await prisma.pengguna.findUnique({
      where: { id: json.data.id },
    });
    expect(createdInDb).not.toBeNull();
    expect(createdInDb?.statusAkun).toBe(StatusAkun.MENUNGGU);
    expect(createdInDb?.peran).toBe(Peran.WARGA);

    // Cek AuditLog
    const auditRecord = await prisma.auditLog.findFirst({
      where: { entitasId: json.data.id, aksi: "REGISTRASI_PENGGUNA" },
    });
    expect(auditRecord).not.toBeNull();
  });

  it("POST /api/registrasi menolak jika email sudah terdaftar (409 CONFLICT)", async () => {
    const { POST: registrasiHandler } = await import("@/app/api/registrasi/route");

    // Gunakan email yang sudah di-seed
    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/registrasi",
      body: {
        nama: "Kembaran Rudi",
        email: "rudi@karangsari.desa.id", // sudah ada di seed
        kataSandi: "Password123",
        desaId: "seed_desa_001",
        rtRw: "01/02",
        setuju: true,
      },
    });

    const res = await registrasiHandler(req);
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.data).toBeNull();
    expect(json.error.code).toBe("CONFLICT");
  });

  it("GET /api/me mengembalikan 401 UNAUTHENTICATED jika belum login", async () => {
    const { GET: meHandler } = await import("@/app/api/me/route");

    const req = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/me",
    });

    const res = await meHandler(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.data).toBeNull();
    expect(json.error.code).toBe("UNAUTHENTICATED");
  });

  it("GET /api/me mengembalikan data profil jika terautentikasi", async () => {
    const { GET: meHandler } = await import("@/app/api/me/route");

    const req = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/me",
      headers: {
        "x-test-auth-id": "seed_auth_kades",
      },
    });

    const res = await meHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.data.peran).toBe(Peran.PERANGKAT);
    expect(json.data.statusAkun).toBe(StatusAkun.AKTIF);
  });

  it("PATCH /api/pengguna/:id/verifikasi: Hanya PERANGKAT yang berhak memverifikasi akun", async () => {
    const { PATCH: verifikasiHandler } = await import("@/app/api/pengguna/[id]/verifikasi/route");

    // 1. Buat target warga berstatus MENUNGGU
    const targetWarga = await prisma.pengguna.create({
      data: {
        authId: `auth_verif_target_${Date.now()}`,
        nama: "Target Verifikasi Warga",
        email: `target_${Date.now()}@karangsari.desa.id`,
        peran: Peran.WARGA,
        statusAkun: StatusAkun.MENUNGGU,
        desaId: "seed_desa_001",
        rtRw: "01/01",
        setujuSyaratPada: new Date(),
      },
    });

    // 2. Jika diakses oleh WARGA biasa -> harus DITOLAK (403 FORBIDDEN)
    const reqWarga = createMockRequest({
      method: "PATCH",
      headers: {
        "x-test-auth-id": "seed_auth_ketua_a", // Peran WARGA
      },
      body: {
        setujui: true,
      },
    });

    const resWarga = await verifikasiHandler(reqWarga, {
      params: Promise.resolve({ id: targetWarga.id }),
    });
    expect(resWarga.status).toBe(403);
    const jsonWarga = await resWarga.json();
    expect(jsonWarga.error.code).toBe("FORBIDDEN");

    // 3. Jika diakses oleh PERANGKAT (Kades) -> berhasil disetujui (200 OK)
    const reqKades = createMockRequest({
      method: "PATCH",
      headers: {
        "x-test-auth-id": "seed_auth_kades", // Peran PERANGKAT
      },
      body: {
        setujui: true,
      },
    });

    const resKades = await verifikasiHandler(reqKades, {
      params: Promise.resolve({ id: targetWarga.id }),
    });
    expect(resKades.status).toBe(200);

    const jsonKades = await resKades.json();
    expect(jsonKades.error).toBeNull();
    expect(jsonKades.data.statusAkun).toBe(StatusAkun.AKTIF);

    // Cek di DB
    const refreshed = await prisma.pengguna.findUnique({
      where: { id: targetWarga.id },
    });
    expect(refreshed?.statusAkun).toBe(StatusAkun.AKTIF);

    // Cek AuditLog
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        entitasId: targetWarga.id,
        aksi: "VERIFIKASI_AKUN_DISETUJUI",
      },
    });
    expect(auditRecord).not.toBeNull();
  });

  it("PATCH /api/pengguna/:id/verifikasi: Penolakan akun mewajibkan field alasan (400)", async () => {
    const { PATCH: verifikasiHandler } = await import("@/app/api/pengguna/[id]/verifikasi/route");

    const reqRejectTanpaAlasan = createMockRequest({
      method: "PATCH",
      headers: {
        "x-test-auth-id": "seed_auth_kades",
      },
      body: {
        setujui: false,
        // alasan sengaja dikosongkan
      },
    });

    const res = await verifikasiHandler(reqRejectTanpaAlasan, {
      params: Promise.resolve({ id: "seed_dummy_id" }),
    });
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields).toHaveProperty("alasan");
  });
});
