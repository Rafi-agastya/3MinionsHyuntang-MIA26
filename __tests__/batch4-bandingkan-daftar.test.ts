import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as registerHandler } from "@/app/api/registrasi/route";
import { POST as winnerHandler } from "@/app/api/proyek/[id]/pemenang/route";
import { Peran, StatusAkun, StatusProyek } from "@prisma/client";

// Mock Prisma
const mockDesa = {
  id: "seed_desa_001",
  nama: "Desa Karang Sari",
  kode: "33.04.01.2001",
};

const mockPenggunaWarga = {
  id: "user_warga_new",
  nama: "Ahmad Dahlan",
  email: "ahmad.dahlan@karangsari.desa.id",
  peran: Peran.WARGA,
  statusAkun: StatusAkun.MENUNGGU,
  desaId: "seed_desa_001",
  rtRw: "03/01",
  setujuSyaratPada: new Date(),
};

const mockPenggunaKades = {
  id: "user_kades_01",
  nama: "Hendy (Kades)",
  email: "kades@karangsari.desa.id",
  peran: Peran.PERANGKAT,
  statusAkun: StatusAkun.AKTIF,
  desaId: "seed_desa_001",
  rtRw: "01/01",
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pengguna: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email === "duplikat@karangsari.desa.id") {
          return { id: "existing_user", email: where.email };
        }
        return null;
      }),
      create: vi.fn(async ({ data }: { data: any }) => ({
        id: "user_warga_new",
        ...data,
      })),
    },
    desa: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === "seed_desa_001") return mockDesa;
        return null;
      }),
    },
    auditLog: {
      create: vi.fn(async () => ({ id: "audit_01" })),
    },
    proyek: {
      findUnique: vi.fn(async () => ({
        id: "seed_proyek_001",
        judul: "Drainase",
        status: StatusProyek.TENDER_DIBUKA,
      })),
    },
    flagKemiripan: {
      count: vi.fn(async () => 0),
    },
    proposal: {
      findMany: vi.fn(async () => [
        { id: "prop_01", skor: { total: 90 } },
        { id: "prop_02", skor: { total: 80 } },
      ]),
    },
  },
  serializeBigInt: (v: any) => v,
}));

vi.mock("@/lib/ratelimit", () => ({
  assertRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getPengguna: vi.fn(async (req: Request) => {
      const authHeader = req.headers.get("x-test-auth-id");
      if (authHeader === "seed_auth_kades") return mockPenggunaKades;
      if (authHeader === "seed_auth_ketua_a") return mockPenggunaWarga;
      return null;
    }),
  };
});

describe("Batch 4: Registrasi Warga Baru & Perbandingan P1 (PRD 35.1 & Bagian 10 P1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/registrasi", () => {
    it("menolak registrasi jika format kata sandi tidak memuat kombinasi huruf dan angka (400 VALIDATION_ERROR)", async () => {
      const req = new Request("http://localhost:3000/api/registrasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: "Ahmad Dahlan",
          email: "ahmad@karangsari.desa.id",
          kataSandi: "hanyahuruf", // tidak ada angka
          desaId: "seed_desa_001",
          rtRw: "03/01",
          setujuSyarat: true,
          setujuPrivasi: true,
        }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("menolak registrasi jika format RT/RW tidak valid (400 VALIDATION_ERROR)", async () => {
      const req = new Request("http://localhost:3000/api/registrasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: "Ahmad Dahlan",
          email: "ahmad@karangsari.desa.id",
          kataSandi: "Password123",
          desaId: "seed_desa_001",
          rtRw: "RT 03 RW 01", // format harus '03/01'
          setujuSyarat: true,
          setujuPrivasi: true,
        }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(400);
    });

    it("menolak registrasi jika email sudah terpakai (409 CONFLICT)", async () => {
      const req = new Request("http://localhost:3000/api/registrasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: "Ahmad Dahlan",
          email: "duplikat@karangsari.desa.id",
          kataSandi: "Password123",
          desaId: "seed_desa_001",
          rtRw: "03/01",
          setujuSyarat: true,
          setujuPrivasi: true,
        }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(409);
    });

    it("berhasil mendaftarkan warga baru dengan statusAkun MENUNGGU (201 CREATED)", async () => {
      const req = new Request("http://localhost:3000/api/registrasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: "Ahmad Dahlan",
          email: "ahmad.baru@karangsari.desa.id",
          kataSandi: "KarangSari2026!",
          desaId: "seed_desa_001",
          rtRw: "03/01",
          kontak: "08123456789",
          setujuSyarat: true,
          setujuPrivasi: true,
        }),
      });

      const res = await registerHandler(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.statusAkun).toBe(StatusAkun.MENUNGGU);
    });
  });

  describe("POST /api/proyek/:id/pemenang (RBAC P1 Evaluasi)", () => {
    it("menolak penetapan pemenang oleh akun non-perangkat/publik (403 FORBIDDEN)", async () => {
      const req = new Request("http://localhost:3000/api/proyek/seed_proyek_001/pemenang", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-test-auth-id": "seed_auth_ketua_a", // Warga
        },
        body: JSON.stringify({
          proposalId: "prop_01",
          alasan: "A".repeat(40),
        }),
      });

      const res = await winnerHandler(req, { params: Promise.resolve({ id: "seed_proyek_001" }) });
      expect(res.status).toBe(403);
    });
  });
});

