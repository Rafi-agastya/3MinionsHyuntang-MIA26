import { describe, it, expect, beforeEach, vi } from "vitest";
import { Peran, StatusAkun, StatusIde, SumberIde } from "@prisma/client";

// In-Memory store for Prisma mock
const mockPengguna = {
  id: "usr_warga_01",
  authId: "seed_auth_ketua_a",
  nama: "Rudi Hermawan",
  email: "rudi@karangsari.desa.id",
  peran: Peran.WARGA,
  statusAkun: StatusAkun.AKTIF,
  desaId: "desa_karangsari",
};

const mockIde = {
  id: "ide_test_01",
  nomor: "IDE-2026-0001",
  judul: "Pemasangan Lampu Tenaga Surya",
  deskripsi: "Perlunya lampu penerangan di jalan tembus dusun sepanjang 500 meter",
  kategori: "Infrastruktur",
  sumber: SumberIde.WARGA,
  status: StatusIde.DIAJUKAN,
  desaId: "desa_karangsari",
  pengajuId: "usr_warga_01",
  anonim: false,
  tenggatTanggapan: new Date(),
  createdAt: new Date(),
};

const dukunganStore: Array<{ ideId: string; penggunaId: string }> = [];

vi.mock("@/lib/prisma", () => ({
  serializeBigInt: (v: any) => v,
  prisma: {
    pengguna: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; authId?: string } }) => {
        if (where.id === mockPengguna.id || where.authId === mockPengguna.authId) {
          return mockPengguna;
        }
        return null;
      }),
    },
    ide: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
        if (where.id === mockIde.id) {
          return mockIde;
        }
        return null;
      }),
    },
    dukunganIde: {
      findUnique: vi.fn(
        async ({ where }: { where: { ideId_penggunaId?: { ideId: string; penggunaId: string } } }) => {
          if (!where.ideId_penggunaId) return null;
          const { ideId, penggunaId } = where.ideId_penggunaId;
          const found = dukunganStore.find((d) => d.ideId === ideId && d.penggunaId === penggunaId);
          return found || null;
        }
      ),
      create: vi.fn(async ({ data }: { data: { ideId: string; penggunaId: string } }) => {
        dukunganStore.push(data);
        return data;
      }),
      count: vi.fn(async ({ where }: { where: { ideId: string } }) => {
        return dukunganStore.filter((d) => d.ideId === where.ideId).length;
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

describe("Batch 1: POST /api/ide/:id/dukung (PRD FR-C2 & PRD 33.2 #9)", () => {
  beforeEach(() => {
    dukunganStore.length = 0;
  });

  it("menolak dukungan jika pengguna belum login (401 UNAUTHENTICATED)", async () => {
    const { POST } = await import("@/app/api/ide/[id]/dukung/route");
    const req = new Request("http://localhost:3000/api/ide/ide_test_01/dukung", {
      method: "POST",
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "ide_test_01" }),
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error?.code).toBe("UNAUTHENTICATED");
  });

  it("menolak dukungan jika ide tidak ditemukan (404 NOT_FOUND)", async () => {
    const { POST } = await import("@/app/api/ide/[id]/dukung/route");
    const req = new Request("http://localhost:3000/api/ide/ide_tidak_ada/dukung", {
      method: "POST",
      headers: {
        "x-test-auth-id": "seed_auth_ketua_a",
      },
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "ide_tidak_ada" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error?.code).toBe("NOT_FOUND");
  });

  it("berhasil memberikan dukungan pertama kali (200 OK & { jumlahDukungan: 1 })", async () => {
    const { POST } = await import("@/app/api/ide/[id]/dukung/route");
    const req = new Request("http://localhost:3000/api/ide/ide_test_01/dukung", {
      method: "POST",
      headers: {
        "x-test-auth-id": "seed_auth_ketua_a",
      },
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: "ide_test_01" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual({ jumlahDukungan: 1, didukung: true });
    expect(body.error).toBeNull();
  });

  it("menolak dukungan kedua kali dari pengguna yang sama (409 CONFLICT)", async () => {
    const { POST } = await import("@/app/api/ide/[id]/dukung/route");
    const req1 = new Request("http://localhost:3000/api/ide/ide_test_01/dukung", {
      method: "POST",
      headers: {
        "x-test-auth-id": "seed_auth_ketua_a",
      },
    });

    const res1 = await POST(req1, {
      params: Promise.resolve({ id: "ide_test_01" }),
    });
    expect(res1.status).toBe(200);

    const req2 = new Request("http://localhost:3000/api/ide/ide_test_01/dukung", {
      method: "POST",
      headers: {
        "x-test-auth-id": "seed_auth_ketua_a",
      },
    });

    const res2 = await POST(req2, {
      params: Promise.resolve({ id: "ide_test_01" }),
    });
    expect(res2.status).toBe(409);
    const body = await res2.json();
    expect(body.error?.code).toBe("CONFLICT");
  });
});
