import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Peran,
  StatusAkun,
  StatusProyek,
  KelasProyek,
  Jalur,
  StatusAnalisis,
  StatusVerifikasi,
} from "@prisma/client";

// ================= IN-MEMORY DATA STORE =================
interface MockUser {
  id: string;
  authId: string;
  nama: string;
  email: string;
  peran: Peran;
  statusAkun: StatusAkun;
  desaId: string;
}

let mockUsers: MockUser[] = [];
let currentAuthUserId: string | null = null;

function resetStore() {
  mockUsers = [
    {
      id: "usr_warga_1",
      authId: "auth_warga_1",
      nama: "Budi Warga",
      email: "warga@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_perangkat_1",
      authId: "auth_perangkat_1",
      nama: "Pak Kades (Perangkat)",
      email: "kades@karangsari.desa.id",
      peran: Peran.PERANGKAT,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_pengawas_1",
      authId: "auth_pengawas_1",
      nama: "Ibu Siti (BPD/Pengawas)",
      email: "pengawas@karangsari.desa.id",
      peran: Peran.PENGAWAS,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_admin_1",
      authId: "auth_admin_1",
      nama: "Super Admin",
      email: "admin@karangsari.desa.id",
      peran: Peran.ADMIN,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
  ];
  currentAuthUserId = null;
}

function makeHeaders(authId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const target = authId !== undefined ? authId : currentAuthUserId;
  if (target) {
    headers["Authorization"] = `Bearer token_${target}`;
  }
  return headers;
}

// Mock Supabase
vi.mock("@/lib/supabase", () => {
  return {
    getSupabasePublicClient: () => ({
      auth: {
        getUser: vi.fn(async (token: string) => {
          if (!token || !token.startsWith("token_")) {
            return { data: { user: null }, error: new Error("Invalid token") };
          }
          const authId = token.replace("token_", "");
          const found = mockUsers.find((u) => u.authId === authId);
          if (!found) {
            return { data: { user: null }, error: new Error("User not found") };
          }
          return {
            data: {
              user: {
                id: found.authId,
                email: found.email,
              },
            },
            error: null,
          };
        }),
      },
    }),
    getSupabaseAdminClient: () => ({
      storage: {
        from: () => ({
          upload: vi.fn(async () => ({ data: { path: "dummy" }, error: null })),
          getPublicUrl: (p: string) => ({ data: { publicUrl: `https://storage/${p}` } }),
        }),
      },
    }),
  };
});

// Mock Prisma
vi.mock("@/lib/prisma", () => {
  return {
    serializeBigInt: (obj: any): any => JSON.parse(JSON.stringify(obj, (_, v) => typeof v === "bigint" ? v.toString() : v)),
    prisma: {
      pengguna: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id) return mockUsers.find((u) => u.id === where.id) || null;
          if (where.authId) return mockUsers.find((u) => u.authId === where.authId) || null;
          return null;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockUsers.findIndex((u) => u.id === where.id);
          if (idx !== -1) mockUsers[idx] = { ...mockUsers[idx], ...data };
          return mockUsers[idx] || null;
        }),
      },
      kelompok: {
        findUnique: vi.fn(async () => ({
          id: "kel_1",
          nama: "Pokmas Maju",
          ketuaId: "usr_warga_1",
          anggota: [],
        })),
        create: vi.fn(async ({ data }: any) => ({
          id: "kel_new",
          ...data,
          anggota: [],
        })),
      },
      proyek: {
        findMany: vi.fn(async () => [
          {
            id: "proyek_1",
            judul: "Proyek Balai",
            status: StatusProyek.TENDER_DIBUKA,
            pagu: BigInt(100_000_000),
            rab: [],
          },
        ]),
        findUnique: vi.fn(async ({ where }: any) => ({
          id: where.id || "proyek_1",
          judul: "Proyek Balai",
          pagu: BigInt(100_000_000),
          status: StatusProyek.TENDER_DIBUKA,
          tenggatProposal: null,
          keputusan: {
            proposal: {
              kelompok: {
                ketuaId: "usr_warga_1",
              },
            },
          },
          rab: [],
        })),
        create: vi.fn(async ({ data }: any) => ({
          id: "proyek_new",
          ...data,
          rab: [],
        })),
        update: vi.fn(async ({ data }: any) => ({
          id: "proyek_1",
          ...data,
        })),
      },
      proposal: {
        findMany: vi.fn(async () => [
          {
            id: "prop_1",
            proyekId: "proyek_1",
            kelompokId: "kel_1",
            penawaran: BigInt(90_000_000),
            statusAnalisis: StatusAnalisis.SELESAI,
            kelompok: {
              id: "kel_1",
              nama: "Pokmas Maju",
              ketuaId: "usr_warga_1",
              anggota: [],
            },
            skor: { skorTotal: 90 },
            ringkasan: { ringkasanEksekutif: "Ringkasan aman" },
          },
        ]),
        findUnique: vi.fn(async () => null),
      },
      flagKemiripan: {
        count: vi.fn(async () => 0),
        findMany: vi.fn(async () => []),
      },
      laporanProgres: {
        findUnique: vi.fn(async () => ({
          id: "lap_1",
          proyekId: "proyek_1",
          minggu: 1,
          persen: 35,
          status: StatusVerifikasi.MENUNGGU,
        })),
        update: vi.fn(async ({ data }: any) => ({
          id: "lap_1",
          proyekId: "proyek_1",
          status: data.status,
        })),
      },
      termin: {
        findMany: vi.fn(async () => []),
        update: vi.fn(async () => ({})),
      },
      posAnggaran: {
        create: vi.fn(async ({ data }: any) => ({ id: "pos_1", ...data })),
      },
      entriKas: {
        findUnique: vi.fn(async () => ({
          id: "entri_1",
          desaId: "desa_1",
          dibuatOlehId: "usr_perangkat_1",
        })),
      },
      ide: {
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: any) => ({ id: "ide_new", ...data })),
      },
      tiket: {
        create: vi.fn(async ({ data }: any) => ({ id: "tiket_new", nomor: "TKT-2026-001", ...data })),
      },
      auditLog: {
        create: vi.fn(async ({ data }: any) => ({ id: "audit_1", ...data })),
      },
    },
  };
});

describe("Paket BE-10: Matriks Hak Akses (RBAC Matrix) PRD Bagian 8", () => {
  beforeEach(() => {
    resetStore();
  });

  // 1. Publik / Anonymous tests
  describe("Peran: PUBLIK (Unauthenticated / Anonim)", () => {
    it("dapat membaca daftar proyek publik (GET /api/proyek) -> 200", async () => {
      const { GET } = await import("@/app/api/proyek/route");
      const req = new Request("http://localhost:3000/api/proyek", {
        headers: makeHeaders(null),
      });
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toBeDefined();
    });

    it("dilarang membuat kelompok (POST /api/kelompok) -> 401 UNAUTHENTICATED", async () => {
      const { POST } = await import("@/app/api/kelompok/route");
      const req = new Request("http://localhost:3000/api/kelompok", {
        method: "POST",
        headers: makeHeaders(null),
        body: JSON.stringify({ nama: "Kelompok Ilegal", desaId: "desa_1", anggota: [] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("dilarang mematangkan/membuat proyek (POST /api/proyek) -> 401 UNAUTHENTICATED", async () => {
      const { POST } = await import("@/app/api/proyek/route");
      const req = new Request("http://localhost:3000/api/proyek", {
        method: "POST",
        headers: makeHeaders(null),
        body: JSON.stringify({
          judul: "Proyek Ilegal",
          deskripsi: "Deskripsi",
          lokasi: "Lokasi",
          desaId: "desa_1",
          pagu: 100000000,
          kelas: KelasProyek.KECIL,
          rab: [{ uraian: "Pekerjaan", volume: 1, satuan: "ls", hargaSatuan: 100000000 }],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("dilarang mengirim ide tanpa login (POST /api/ide) -> 401 UNAUTHENTICATED", async () => {
      const { POST } = await import("@/app/api/ide/route");
      const req = new Request("http://localhost:3000/api/ide", {
        method: "POST",
        headers: makeHeaders(null),
        body: JSON.stringify({ judul: "Ide Publik", deskripsi: "Deskripsi ide...", kategori: "INFRASTRUKTUR", desaId: "desa_1" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  // 2. Warga tests
  describe("Peran: WARGA (Warga Terverifikasi)", () => {
    it("berhak membuat kelompok (POST /api/kelompok) -> lolos auth/role", async () => {
      const { POST } = await import("@/app/api/kelompok/route");
      const req = new Request("http://localhost:3000/api/kelompok", {
        method: "POST",
        headers: makeHeaders("auth_warga_1"),
        body: JSON.stringify({
          nama: "Pokmas Warga",
          desaId: "desa_1",
          anggota: [
            { nama: "Budi Santoso", nik: "3201011234560001", rtRw: "01/02" },
            { nama: "Agus Wibowo", nik: "3201011234560002", rtRw: "01/02" },
          ],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

    it("dilarang mematangkan/membuat proyek (POST /api/proyek) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/proyek/route");
      const req = new Request("http://localhost:3000/api/proyek", {
        method: "POST",
        headers: makeHeaders("auth_warga_1"),
        body: JSON.stringify({
          judul: "Proyek Warga",
          deskripsi: "Deskripsi",
          lokasi: "Lokasi",
          desaId: "desa_1",
          pagu: 100000000,
          kelas: KelasProyek.KECIL,
          rab: [{ uraian: "Pekerjaan", volume: 1, satuan: "ls", hargaSatuan: 100000000 }],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("dilarang menetapkan pemenang (POST /api/proyek/:id/pemenang, T09) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/proyek/[id]/pemenang/route");
      const req = new Request("http://localhost:3000/api/proyek/proyek_1/pemenang", {
        method: "POST",
        headers: makeHeaders("auth_warga_1"),
        body: JSON.stringify({
          proposalId: "prop_1",
          alasan: "Alasan penetapan pemenang",
        }),
      });
      const res = await POST(req, { params: Promise.resolve({ id: "proyek_1" }) });
      expect(res.status).toBe(403);
    });

    it("dilarang memverifikasi laporan mingguan (PATCH /api/laporan/:id) -> 403 FORBIDDEN", async () => {
      const { PATCH } = await import("@/app/api/laporan/[id]/route");
      const req = new Request("http://localhost:3000/api/laporan/lap_1", {
        method: "PATCH",
        headers: makeHeaders("auth_warga_1"),
        body: JSON.stringify({
          status: "DISETUJUI",
          catatan: "Catatan verifikasi",
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "lap_1" }) });
      expect(res.status).toBe(403);
    });
  });

  // 3. Perangkat Desa tests
  describe("Peran: PERANGKAT (Perangkat Desa)", () => {
    it("dilarang membuat kelompok warga (POST /api/kelompok) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/kelompok/route");
      const req = new Request("http://localhost:3000/api/kelompok", {
        method: "POST",
        headers: makeHeaders("auth_perangkat_1"),
        body: JSON.stringify({
          nama: "Pokmas Perangkat",
          desaId: "desa_1",
          anggota: [{ nama: "Perangkat", nik: "3201011234560002", rtRw: "001/002" }],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("dilarang mengajukan proposal sayembara (POST /api/proyek/:id/proposal) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/proyek/[id]/proposal/route");
      const req = new Request("http://localhost:3000/api/proyek/proyek_1/proposal", {
        method: "POST",
        headers: makeHeaders("auth_perangkat_1"),
        body: JSON.stringify({
          kelompokId: "kel_1",
          penawaran: 90000000,
          durasiHari: 30,
          tenagaTotal: 10,
          tenagaLokal: 8,
          narasiMetode: "Metode kerja...",
          narasiJadwal: "Jadwal kerja...",
          narasiRisiko: "Manajemen risiko...",
        }),
      });
      const res = await POST(req, { params: Promise.resolve({ id: "proyek_1" }) });
      expect(res.status).toBe(403);
    });

    it("berhak mematangkan/membuat proyek (POST /api/proyek) -> lolos role check", async () => {
      const { POST } = await import("@/app/api/proyek/route");
      const req = new Request("http://localhost:3000/api/proyek", {
        method: "POST",
        headers: makeHeaders("auth_perangkat_1"),
        body: JSON.stringify({
          judul: "Pembangunan Jalan Usaha Tani",
          deskripsi: "Pembangunan jalan usaha tani sepanjang satu kilometer untuk mempermudah distribusi hasil panen warga desa.",
          lokasi: "Dusun 2",
          desaId: "desa_1",
          pagu: 100000000,
          kelas: KelasProyek.KECIL,
          rab: [{ uraian: "Pekerjaan badan jalan", volume: 1, satuan: "ls", hargaSatuan: 100000000 }],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

    it("dilarang memverifikasi laporan progres (PATCH /api/laporan/:id, wewenang pengawas) -> 403 FORBIDDEN", async () => {
      const { PATCH } = await import("@/app/api/laporan/[id]/route");
      const req = new Request("http://localhost:3000/api/laporan/lap_1", {
        method: "PATCH",
        headers: makeHeaders("auth_perangkat_1"),
        body: JSON.stringify({
          status: "DISETUJUI",
          catatan: "Catatan verifikasi",
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "lap_1" }) });
      expect(res.status).toBe(403);
    });
  });

  // 4. Pengawas tests
  describe("Peran: PENGAWAS (BPD / Pengawas)", () => {
    it("dilarang membuat kelompok (POST /api/kelompok) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/kelompok/route");
      const req = new Request("http://localhost:3000/api/kelompok", {
        method: "POST",
        headers: makeHeaders("auth_pengawas_1"),
        body: JSON.stringify({ nama: "Pokmas Pengawas", desaId: "desa_1", anggota: [] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("dilarang mematangkan/membuat proyek (POST /api/proyek) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/proyek/route");
      const req = new Request("http://localhost:3000/api/proyek", {
        method: "POST",
        headers: makeHeaders("auth_pengawas_1"),
        body: JSON.stringify({
          judul: "Proyek Pengawas",
          deskripsi: "Deskripsi",
          lokasi: "Lokasi",
          desaId: "desa_1",
          pagu: 100000000,
          kelas: KelasProyek.KECIL,
          rab: [{ uraian: "Pekerjaan", volume: 1, satuan: "ls", hargaSatuan: 100000000 }],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("dilarang memilih pemenang proyek (POST /api/proyek/:id/pemenang) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/proyek/[id]/pemenang/route");
      const req = new Request("http://localhost:3000/api/proyek/proyek_1/pemenang", {
        method: "POST",
        headers: makeHeaders("auth_pengawas_1"),
        body: JSON.stringify({
          proposalId: "prop_1",
          alasan: "Penetapan oleh pengawas",
        }),
      });
      const res = await POST(req, { params: Promise.resolve({ id: "proyek_1" }) });
      expect(res.status).toBe(403);
    });

    it("berhak memverifikasi laporan mingguan (PATCH /api/laporan/:id) -> lolos role check (200)", async () => {
      const { PATCH } = await import("@/app/api/laporan/[id]/route");
      const req = new Request("http://localhost:3000/api/laporan/lap_1", {
        method: "PATCH",
        headers: makeHeaders("auth_pengawas_1"),
        body: JSON.stringify({
          status: "DISETUJUI",
          catatan: "Pekerjaan telah sesuai spesifikasi dan dokumentasi lengkap.",
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "lap_1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe("DISETUJUI");
    });
  });

  // 5. Admin tests
  describe("Peran: ADMIN (Administrator)", () => {
    it("dilarang membuat kelompok (POST /api/kelompok, hanya warga) -> 403 FORBIDDEN", async () => {
      const { POST } = await import("@/app/api/kelompok/route");
      const req = new Request("http://localhost:3000/api/kelompok", {
        method: "POST",
        headers: makeHeaders("auth_admin_1"),
        body: JSON.stringify({ nama: "Pokmas Admin", desaId: "desa_1", anggota: [] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("berhak membuat proyek (POST /api/proyek) -> 201", async () => {
      const { POST } = await import("@/app/api/proyek/route");
      const req = new Request("http://localhost:3000/api/proyek", {
        method: "POST",
        headers: makeHeaders("auth_admin_1"),
        body: JSON.stringify({
          judul: "Pembangunan Pasar Desa",
          deskripsi: "Pembangunan los pasar desa terpadu guna mendorong perekonomian dan kemandirian usaha mikro masyarakat desa.",
          lokasi: "Dusun 1",
          desaId: "desa_1",
          pagu: 100000000,
          kelas: KelasProyek.KECIL,
          rab: [{ uraian: "Pekerjaan los pasar", volume: 1, satuan: "ls", hargaSatuan: 100000000 }],
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

    it("berhak memverifikasi pengguna baru (PATCH /api/pengguna/:id/verifikasi) -> 200", async () => {
      const { PATCH } = await import("@/app/api/pengguna/[id]/verifikasi/route");
      const req = new Request("http://localhost:3000/api/pengguna/usr_warga_1/verifikasi", {
        method: "PATCH",
        headers: makeHeaders("auth_admin_1"),
        body: JSON.stringify({
          setujui: true,
          alasan: "Berkas identitas sesuai dengan data kependudukan.",
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "usr_warga_1" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.statusAkun).toBe(StatusAkun.AKTIF);
    });

    it("berhak memverifikasi laporan mingguan (PATCH /api/laporan/:id) -> 200", async () => {
      const { PATCH } = await import("@/app/api/laporan/[id]/route");
      const req = new Request("http://localhost:3000/api/laporan/lap_1", {
        method: "PATCH",
        headers: makeHeaders("auth_admin_1"),
        body: JSON.stringify({
          status: "DISETUJUI",
          catatan: "Verifikasi administratif oleh super admin.",
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: "lap_1" }) });
      expect(res.status).toBe(200);
    });
  });
});
