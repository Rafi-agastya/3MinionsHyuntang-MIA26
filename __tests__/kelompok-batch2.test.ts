import { describe, it, expect, beforeEach, vi } from "vitest";
import { Peran, StatusAkun } from "@prisma/client";

// In-Memory store for Prisma mock
const mockWargaUser = {
  id: "usr_warga_01",
  authId: "seed_auth_ketua_a",
  nama: "Rudi Hermawan",
  email: "rudi@karangsari.desa.id",
  peran: Peran.WARGA,
  statusAkun: StatusAkun.AKTIF,
  desaId: "desa_karangsari",
};

const mockKelompokStore = [
  {
    id: "kel_01",
    nama: "Pokmas Guyub Rukun RT 03",
    ketuaId: "usr_warga_01",
    createdAt: new Date(),
    ketua: {
      id: "usr_warga_01",
      nama: "Rudi Hermawan",
      email: "rudi@karangsari.desa.id",
    },
    anggota: [
      {
        id: "ang_01",
        nama: "Rudi Hermawan",
        rtRw: "03/01",
        ketua: true,
      },
      {
        id: "ang_02",
        nama: "Slamet Riyadi",
        rtRw: "03/01",
        ketua: false,
      },
    ],
    _count: {
      anggota: 2,
      proposal: 1,
    },
  },
];

vi.mock("@/lib/prisma", () => ({
  serializeBigInt: (v: any) => v,
  prisma: {
    pengguna: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; authId?: string } }) => {
        if (where.id === mockWargaUser.id || where.authId === mockWargaUser.authId) {
          return mockWargaUser;
        }
        return null;
      }),
    },
    kelompok: {
      findMany: vi.fn(async ({ where }) => {
        return mockKelompokStore;
      }),
      create: vi.fn(async ({ data }) => {
        const newKel = {
          id: `kel_${Date.now()}`,
          nama: data.nama,
          ketuaId: data.ketuaId,
          createdAt: new Date(),
        };
        return newKel;
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }) => ({ id: "audit_1", ...data, waktu: new Date() })),
    },
  },
}));

vi.mock("@/lib/supabase", () => ({
  getSupabasePublicClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  }),
}));

describe("Batch 2: Kelompok Masyarakat (Pokmas) API (PRD FR-E2 & PRD 33.2 #13)", () => {
  it("GET /api/kelompok menolak jika belum masuk (401 UNAUTHENTICATED)", async () => {
    const { GET } = await import("@/app/api/kelompok/route");
    const req = new Request("http://localhost:3000/api/kelompok", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("GET /api/kelompok mengembalikan daftar kelompok pengguna dan sanitasi nikHash (200 OK & FR-ID1)", async () => {
    const { GET } = await import("@/app/api/kelompok/route");
    const req = new Request("http://localhost:3000/api/kelompok", {
      method: "GET",
      headers: {
        "x-test-auth-id": "seed_auth_ketua_a",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    const firstKelompok = body.data[0];
    expect(firstKelompok.nama).toBe("Pokmas Guyub Rukun RT 03");

    // Pastikan nikHash tidak pernah bocor ke respons (FR-ID1)
    for (const ang of firstKelompok.anggota) {
      expect(ang).not.toHaveProperty("nikHash");
      expect(ang).not.toHaveProperty("nik");
    }
  });

  it("POST /api/kelompok berhasil mendaftarkan kelompok baru beranggota min 2 orang (201 CREATED)", async () => {
    const { POST } = await import("@/app/api/kelompok/route");
    const req = new Request("http://localhost:3000/api/kelompok", {
      method: "POST",
      headers: {
        "x-test-auth-id": "seed_auth_ketua_a",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        nama: "Pokmas Tirta Lestari RW 02",
        anggota: [
          { nama: "Rudi Hermawan", rtRw: "02/01", nik: "3304123456789001" },
          { nama: "Sutrisno", rtRw: "02/01", nik: null },
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toHaveProperty("id");
    expect(body.data.nama).toBe("Pokmas Tirta Lestari RW 02");
  });
});

