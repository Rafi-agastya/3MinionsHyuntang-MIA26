import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/proyek/[id]/proposal/route";
import { Peran, StatusAkun, StatusProyek, StatusAnalisis } from "@prisma/client";
import { ApiError } from "@/lib/api";

// Mock Prisma
const mockProyek = {
  id: "seed_proyek_001",
  desaId: "desa_001",
  posAnggaranId: "pos_001",
  judul: "Pembangunan Saluran Drainase RT 3",
  deskripsi: "Proyek drainase padat karya",
  lokasi: "Dusun Krajan RT 03 / RW 01",
  pagu: BigInt(50_000_000),
  kelas: "KECIL",
  status: StatusProyek.TENDER_DIBUKA,
  tenggatProposal: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  durasiMin: 30,
  durasiMax: 45,
  syaratLokalMin: 70,
};

const mockKelompok = {
  id: "kel_001",
  nama: "Pokmas Makmur Jaya",
  ketuaId: "user_warga_001",
  anggota: [
    { id: "ang_1", nama: "Budi Santoso", rtRw: "03/01", ketua: true, nikHash: "hash1" },
    { id: "ang_2", nama: "Slamet", rtRw: "03/01", ketua: false, nikHash: "hash2" },
  ],
};

const mockUserWarga = {
  id: "user_warga_001",
  authId: "seed_auth_ketua_a",
  email: "budi@karangsari.desa.id",
  nama: "Budi Santoso",
  peran: Peran.WARGA,
  statusAkun: StatusAkun.AKTIF,
  desaId: "desa_001",
  rtRw: "03/01",
  kontak: "08123456789",
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    proyek: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === "seed_proyek_001") return mockProyek;
        return null;
      }),
    },
    pengguna: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; authId?: string } }) => {
        if (where.authId === "seed_auth_ketua_a" || where.id === "user_warga_001") {
          return mockUserWarga;
        }
        return null;
      }),
      findFirst: vi.fn(async () => mockUserWarga),
    },
    kelompok: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id === "kel_001") return mockKelompok;
        return null;
      }),
    },
    proposal: {
      findUnique: vi.fn(async () => null), // belum pernah mengajukan
      create: vi.fn(async ({ data }: { data: any }) => ({
        id: "prop_new_001",
        ...data,
        statusAnalisis: StatusAnalisis.MENUNGGU,
      })),
    },
    auditLog: {
      create: vi.fn(async () => ({ id: "audit_001" })),
    },
  },
  serializeBigInt: (val: any) => {
    if (typeof val === "bigint") return Number(val);
    if (val && typeof val === "object") {
      const copy: any = Array.isArray(val) ? [] : {};
      for (const k of Object.keys(val)) {
        copy[k] = typeof val[k] === "bigint" ? Number(val[k]) : val[k];
      }
      return copy;
    }
    return val;
  },
}));

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    requireAuth: vi.fn(async (req: Request) => {
      const authHeader = req.headers.get("x-test-auth-id") || req.headers.get("authorization");
      if (!authHeader) {
        throw new ApiError("UNAUTHENTICATED", "Sesi tidak valid", undefined, 401);
      }
      return mockUserWarga;
    }),
  };
});

describe("Batch 3: Alur Pengajuan Proposal Sayembara Warga (PRD FR-E & PRD 33.3 & 35.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menolak pengajuan jika pengguna belum terautentikasi (401 UNAUTHENTICATED)", async () => {
    const req = new Request("http://localhost:3000/api/proyek/seed_proyek_001/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kelompokId: "kel_001",
        penawaran: 45_000_000,
        durasiHari: 30,
        tenagaTotal: 15,
        tenagaLokal: 12,
        narasiMetode: "A".repeat(120),
        narasiJadwal: "B".repeat(60),
        narasiRisiko: "C".repeat(40),
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "seed_proyek_001" }) });
    expect(res.status).toBe(401);
  });

  it("menolak pengajuan jika nilai penawaran melebihi pagu proyek (400 VALIDATION_ERROR)", async () => {
    const req = new Request("http://localhost:3000/api/proyek/seed_proyek_001/proposal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-auth-id": "seed_auth_ketua_a",
      },
      body: JSON.stringify({
        kelompokId: "kel_001",
        penawaran: 60_000_000, // melebihi pagu 50_000_000
        durasiHari: 30,
        tenagaTotal: 15,
        tenagaLokal: 12,
        narasiMetode: "A".repeat(120),
        narasiJadwal: "B".repeat(60),
        narasiRisiko: "C".repeat(40),
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "seed_proyek_001" }) });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toContain("tidak boleh melebihi pagu anggaran");
  });

  it("berhasil menerima proposal jika valid dan mengembalikan statusAnalisis MENUNGGU (201 CREATED)", async () => {
    const req = new Request("http://localhost:3000/api/proyek/seed_proyek_001/proposal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-auth-id": "seed_auth_ketua_a",
      },
      body: JSON.stringify({
        kelompokId: "kel_001",
        penawaran: 46_000_000,
        durasiHari: 35,
        tenagaTotal: 15,
        tenagaLokal: 12,
        narasiMetode: "A".repeat(150),
        narasiJadwal: "B".repeat(80),
        narasiRisiko: "C".repeat(50),
        dokumen: ["proposal.pdf"],
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "seed_proyek_001" }) });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.id).toBe("prop_new_001");
    expect(json.data.statusAnalisis).toBe("MENUNGGU");
  });
});
