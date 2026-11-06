import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Peran,
  StatusAkun,
  StatusProyek,
  StatusSanggah,
  KeputusanFlag,
  KelasProyek,
  Jalur,
  StatusAnalisis,
} from "@prisma/client";
import { canTransition } from "@/lib/status-machine";
import * as hooks from "@/lib/hooks";

// ================= IN-MEMORY PRISMA STORE =================

interface MockPengguna {
  id: string;
  authId: string;
  nama: string;
  email: string;
  peran: Peran;
  statusAkun: StatusAkun;
  desaId: string;
}

interface MockRabItem {
  id: string;
  proyekId: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: bigint;
}

interface MockProyek {
  id: string;
  desaId: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  pagu: bigint;
  kelas: KelasProyek;
  jalur: Jalur | null;
  alasanJalur: string | null;
  status: StatusProyek;
  posAnggaranId: string | null;
  tenggatProposal: Date | null;
  akhirMasaSanggah: Date | null;
  syaratLokalMin: number;
  durasiMin: number;
  durasiMax: number;
  createdAt: Date;
}

interface MockProposal {
  id: string;
  proyekId: string;
  kelompokId: string;
  penawaran: bigint;
  durasiHari: number;
  tenagaTotal: number;
  tenagaLokal: number;
  narasiMetode: string;
  narasiJadwal: string;
  narasiRisiko: string;
  dokumen: string[];
  kelengkapan: any;
  statusAnalisis: StatusAnalisis;
  dikirimPada: Date;
}

interface MockKelompok {
  id: string;
  nama: string;
  ketuaId: string;
}

interface MockAnggotaKelompok {
  id: string;
  kelompokId: string;
  penggunaId: string | null;
  nama: string;
  nikHash: string | null;
  ketua: boolean;
}

interface MockSkor {
  id: string;
  proposalId: string;
  total: number;
  rincian: any;
  flags: any;
  versiBobot: string;
  dibuatPada: Date;
}

interface MockFlagKemiripan {
  id: string;
  proyekId: string;
  proposalAId: string;
  proposalBId: string;
  nilai: number;
  jenis: any;
  keputusan: KeputusanFlag;
  catatan?: string | null;
}

interface MockVerifikasiKompetensi {
  id: string;
  proposalId: string;
  penilaiId: string;
  nilaiRubrik: any;
  catatan?: string | null;
  dibuatPada: Date;
}

interface MockKeputusan {
  id: string;
  proyekId: string;
  proposalId: string;
  alasan: string;
  alasanTambahan?: string | null;
  dibuatOlehId: string;
  bukanPeringkatTeratas: boolean;
  dibuatPada: Date;
}

interface MockSanggahan {
  id: string;
  proposalId: string;
  penggunaId: string;
  isi: string;
  tanggapan?: string | null;
  status: StatusSanggah;
  dibuatPada: Date;
}

let mockPenggunaStore: MockPengguna[] = [];
let mockProyekStore: MockProyek[] = [];
let mockRabStore: MockRabItem[] = [];
let mockKelompokStore: MockKelompok[] = [];
let mockAnggotaStore: MockAnggotaKelompok[] = [];
let mockProposalStore: MockProposal[] = [];
let mockSkorStore: MockSkor[] = [];
let mockFlagStore: MockFlagKemiripan[] = [];
let mockVerifikasiStore: MockVerifikasiKompetensi[] = [];
let mockKeputusanStore: MockKeputusan[] = [];
let mockSanggahanStore: MockSanggahan[] = [];
let mockAuditStore: any[] = [];

let currentAuthUserId: string | null = null;

// ================= RESET STATE =================

function resetDb() {
  mockPenggunaStore = [
    {
      id: "usr_perangkat_1",
      authId: "auth_perangkat_1",
      nama: "Bu Sari (Perangkat)",
      email: "sari@karangsari.desa.id",
      peran: Peran.PERANGKAT,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_warga_1",
      authId: "auth_warga_1",
      nama: "Pak Rudi (Warga)",
      email: "rudi@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_warga_2",
      authId: "auth_warga_2",
      nama: "Bambang (Warga Anggota)",
      email: "bambang@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_warga_lain",
      authId: "auth_warga_lain",
      nama: "Warga Luar Kelompok",
      email: "luar@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
  ];

  mockProyekStore = [
    {
      id: "proyek_pematangan_1",
      desaId: "desa_1",
      judul: "Pembangunan Saluran Drainase RT 03",
      deskripsi: "Proyek saluran drainase untuk penanganan banjir pemukiman warga.",
      lokasi: "RT 03 RW 01",
      pagu: BigInt(100_000_000),
      kelas: KelasProyek.KECIL,
      jalur: Jalur.SAYEMBARA,
      alasanJalur: null,
      status: StatusProyek.PEMATANGAN,
      posAnggaranId: null,
      tenggatProposal: new Date("2026-12-01"),
      akhirMasaSanggah: null,
      syaratLokalMin: 70,
      durasiMin: 30,
      durasiMax: 60,
      createdAt: new Date(),
    },
    {
      id: "proyek_seleksi_1",
      desaId: "desa_1",
      judul: "Rehabilitasi Balai Pertemuan Warga",
      deskripsi: "Perbaikan atap dan lantai balai pertemuan warga desa.",
      lokasi: "Dusun II",
      pagu: BigInt(140_000_000),
      kelas: KelasProyek.MENENGAH,
      jalur: Jalur.SAYEMBARA,
      alasanJalur: "Dikerjakan swakelola padat karya oleh warga dusun",
      status: StatusProyek.SELEKSI,
      posAnggaranId: null,
      tenggatProposal: new Date("2026-10-01"),
      akhirMasaSanggah: null,
      syaratLokalMin: 70,
      durasiMin: 30,
      durasiMax: 90,
      createdAt: new Date(),
    },
    {
      id: "proyek_sanggah_1",
      desaId: "desa_1",
      judul: "Paving Jalan Gang Lingkungan",
      deskripsi: "Pemasangan paving block gang pemukiman warga.",
      lokasi: "RW 02",
      pagu: BigInt(60_000_000),
      kelas: KelasProyek.KECIL,
      jalur: Jalur.SAYEMBARA,
      alasanJalur: "Swakelola warga RT",
      status: StatusProyek.MASA_SANGGAH,
      posAnggaranId: null,
      tenggatProposal: new Date("2026-10-01"),
      akhirMasaSanggah: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // aktif 2 hari lagi
      syaratLokalMin: 70,
      durasiMin: 15,
      durasiMax: 45,
      createdAt: new Date(),
    },
  ];

  mockRabStore = [];

  mockKelompokStore = [
    {
      id: "kelompok_1",
      nama: "Kelompok Tani Muda",
      ketuaId: "usr_warga_1",
    },
  ];

  mockAnggotaStore = [
    {
      id: "agt_1",
      kelompokId: "kelompok_1",
      penggunaId: "usr_warga_1",
      nama: "Pak Rudi",
      nikHash: "hash_rudi",
      ketua: true,
    },
    {
      id: "agt_2",
      kelompokId: "kelompok_1",
      penggunaId: "usr_warga_2",
      nama: "Bambang",
      nikHash: "hash_bambang",
      ketua: false,
    },
  ];

  mockProposalStore = [
    {
      id: "proposal_1",
      proyekId: "proyek_seleksi_1",
      kelompokId: "kelompok_1",
      penawaran: BigInt(88_000_000),
      durasiHari: 45,
      tenagaTotal: 10,
      tenagaLokal: 9,
      narasiMetode: "Metode galian manual dan pasang u-ditch secara gotong royong.",
      narasiJadwal: "Jadwal 45 hari terbagi 3 tahap.",
      narasiRisiko: "Risiko cuaca diatasi pompa air.",
      dokumen: ["doc1.pdf"],
      kelengkapan: {},
      statusAnalisis: StatusAnalisis.BERHASIL,
      dikirimPada: new Date(),
    },
    {
      id: "proposal_sanggah_1",
      proyekId: "proyek_sanggah_1",
      kelompokId: "kelompok_1",
      penawaran: BigInt(55_000_000),
      durasiHari: 30,
      tenagaTotal: 8,
      tenagaLokal: 8,
      narasiMetode: "Pemasangan paving block oleh warga RT.",
      narasiJadwal: "30 hari pengerjaan penuh.",
      narasiRisiko: "Material paving bermutu baik.",
      dokumen: ["paving.pdf"],
      kelengkapan: {},
      statusAnalisis: StatusAnalisis.BERHASIL,
      dikirimPada: new Date(),
    },
  ];

  mockSkorStore = [
    {
      id: "skor_1",
      proposalId: "proposal_1",
      total: 95,
      rincian: {},
      flags: [],
      versiBobot: "v1",
      dibuatPada: new Date(),
    },
  ];

  mockFlagStore = [];
  mockVerifikasiStore = [];
  mockKeputusanStore = [];
  mockSanggahanStore = [];
  mockAuditStore = [];

  currentAuthUserId = null;
}

// ================= MOCK SUPABASE AUTH & PRISMA =================

vi.mock("@/lib/supabase", () => {
  return {
    createClient: () => ({
      auth: {
        getUser: vi.fn(async () => {
          if (!currentAuthUserId) {
            return { data: { user: null }, error: new Error("No session") };
          }
          return {
            data: {
              user: {
                id: currentAuthUserId,
                email: "test@karangsari.desa.id",
              },
            },
            error: null,
          };
        }),
      },
    }),
  };
});

vi.mock("@/lib/prisma", () => {
  return {
    serializeBigInt: (obj: any): any => {
      return JSON.parse(
        JSON.stringify(obj, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );
    },
    prisma: {
      pengguna: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.authId) {
            return mockPenggunaStore.find((u) => u.authId === where.authId) || null;
          }
          if (where.id) {
            return mockPenggunaStore.find((u) => u.id === where.id) || null;
          }
          return null;
        }),
      },
      proyek: {
        findUnique: vi.fn(async ({ where, include }: any) => {
          const item = mockProyekStore.find((p) => p.id === where.id);
          if (!item) return null;
          const res: any = { ...item };
          if (include?.keputusan) {
            res.keputusan = mockKeputusanStore.find((k) => k.proyekId === item.id) || null;
          }
          return res;
        }),
        findMany: vi.fn(async () => {
          return mockProyekStore.map((p) => ({
            ...p,
            desa: { id: p.desaId, nama: "Desa Karang Sari" },
            rab: mockRabStore.filter((r) => r.proyekId === p.id),
            proposal: mockProposalStore
              .filter((pr) => pr.proyekId === p.id)
              .map((pr) => ({ id: pr.id })),
          }));
        }),
        create: vi.fn(async ({ data }: any) => {
          const id = `proyek_${Date.now()}`;
          const newProyek: MockProyek = {
            id,
            desaId: data.desaId,
            judul: data.judul,
            deskripsi: data.deskripsi,
            lokasi: data.lokasi,
            pagu: data.pagu,
            kelas: data.kelas,
            jalur: data.jalur ?? null,
            alasanJalur: data.alasanJalur ?? null,
            status: data.status,
            posAnggaranId: data.posAnggaranId ?? null,
            tenggatProposal: data.tenggatProposal ?? null,
            akhirMasaSanggah: null,
            syaratLokalMin: data.syaratLokalMin ?? 70,
            durasiMin: data.durasiMin ?? 30,
            durasiMax: data.durasiMax ?? 90,
            createdAt: new Date(),
          };
          mockProyekStore.push(newProyek);

          if (data.rab?.create) {
            for (const item of data.rab.create) {
              mockRabStore.push({
                id: `rab_${Date.now()}_${Math.random()}`,
                proyekId: id,
                uraian: item.uraian,
                volume: item.volume,
                satuan: item.satuan,
                hargaSatuan: item.hargaSatuan,
              });
            }
          }

          return {
            ...newProyek,
            rab: mockRabStore.filter((r) => r.proyekId === id),
          };
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const index = mockProyekStore.findIndex((p) => p.id === where.id);
          if (index === -1) throw new Error("Proyek not found");
          const updated = {
            ...mockProyekStore[index],
            ...data,
          };
          mockProyekStore[index] = updated;
          return updated;
        }),
      },
      proposal: {
        findUnique: vi.fn(async ({ where, include }: any) => {
          const prop = mockProposalStore.find((p) => p.id === where.id);
          if (!prop) return null;
          const res: any = { ...prop };
          if (include?.proyek) {
            res.proyek = mockProyekStore.find((p) => p.id === prop.proyekId) || null;
          }
          if (include?.kelompok) {
            const kel = mockKelompokStore.find((k) => k.id === prop.kelompokId);
            if (kel) {
              res.kelompok = {
                ...kel,
                anggota: mockAnggotaStore.filter((a) => a.kelompokId === kel.id),
              };
            }
          }
          if (include?.skor) {
            res.skor = mockSkorStore.find((s) => s.proposalId === prop.id) || null;
          }
          return res;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return (
            mockProposalStore.find(
              (p) =>
                (!where.id || p.id === where.id) &&
                (!where.proyekId || p.proyekId === where.proyekId)
            ) || null
          );
        }),
        findMany: vi.fn(async ({ where, include }: any) => {
          let list = [...mockProposalStore];
          if (where?.proyekId) {
            list = list.filter((p) => p.proyekId === where.proyekId);
          }
          return list.map((p) => ({
            ...p,
            skor: include?.skor
              ? mockSkorStore.find((s) => s.proposalId === p.id) || null
              : undefined,
          }));
        }),
        count: vi.fn(async ({ where }: any) => {
          let list = [...mockProposalStore];
          if (where?.proyekId) {
            list = list.filter((p) => p.proyekId === where.proyekId);
          }
          return list.length;
        }),
      },
      flagKemiripan: {
        count: vi.fn(async ({ where }: any) => {
          let list = [...mockFlagStore];
          if (where?.proyekId) {
            list = list.filter((f) => f.proyekId === where.proyekId);
          }
          if (where?.keputusan) {
            list = list.filter((f) => f.keputusan === where.keputusan);
          }
          return list.length;
        }),
      },
      sanggahan: {
        count: vi.fn(async ({ where }: any) => {
          let list = [...mockSanggahanStore];
          if (where?.status) {
            list = list.filter((s) => s.status === where.status);
          }
          if (where?.proposal?.proyekId) {
            const targetProposalIds = mockProposalStore
              .filter((p) => p.proyekId === where.proposal.proyekId)
              .map((p) => p.id);
            list = list.filter((s) => targetProposalIds.includes(s.proposalId));
          }
          return list.length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const id = `sanggah_${Date.now()}`;
          const newSanggahan: MockSanggahan = {
            id,
            proposalId: data.proposalId,
            penggunaId: data.penggunaId,
            isi: data.isi,
            status: data.status ?? StatusSanggah.TERBUKA,
            dibuatPada: new Date(),
          };
          mockSanggahanStore.push(newSanggahan);
          return newSanggahan;
        }),
      },
      verifikasiKompetensi: {
        create: vi.fn(async ({ data }: any) => {
          const id = `vk_${Date.now()}`;
          const newVk: MockVerifikasiKompetensi = {
            id,
            proposalId: data.proposalId,
            penilaiId: data.penilaiId,
            nilaiRubrik: data.nilaiRubrik,
            catatan: data.catatan ?? null,
            dibuatPada: new Date(),
          };
          mockVerifikasiStore.push(newVk);
          return newVk;
        }),
      },
      keputusan: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockKeputusanStore.find((k) => k.proyekId === where.proyekId) || null;
        }),
        upsert: vi.fn(async ({ where, create, update }: any) => {
          const idx = mockKeputusanStore.findIndex((k) => k.proyekId === where.proyekId);
          if (idx !== -1) {
            const updated = { ...mockKeputusanStore[idx], ...update };
            mockKeputusanStore[idx] = updated;
            return updated;
          }
          const id = `keputusan_${Date.now()}`;
          const created: MockKeputusan = {
            id,
            proyekId: create.proyekId,
            proposalId: create.proposalId,
            alasan: create.alasan,
            alasanTambahan: create.alasanTambahan ?? null,
            bukanPeringkatTeratas: create.bukanPeringkatTeratas ?? false,
            dibuatOlehId: create.dibuatOlehId,
            dibuatPada: new Date(),
          };
          mockKeputusanStore.push(created);
          return created;
        }),
      },
      auditLog: {
        create: vi.fn(async ({ data }: any) => {
          mockAuditStore.push(data);
          return { id: `audit_${Date.now()}`, ...data };
        }),
      },
    },
  };
});

// Import route handlers
import { POST as createProyekRoute } from "@/app/api/proyek/route";
import { PATCH as updateStatusRoute } from "@/app/api/proyek/[id]/status/route";
import { POST as nilaiKompetensiRoute } from "@/app/api/proyek/[id]/kompetensi/route";
import { POST as tetapkanPemenangRoute } from "@/app/api/proyek/[id]/pemenang/route";
import { POST as kirimSanggahanRoute } from "@/app/api/proposal/[id]/sanggah/route";

// Helper untuk membuat request dengan header test auth
function createTestRequest(url: string, method: string, body?: any, authId?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const targetAuth = authId !== undefined ? authId : currentAuthUserId;
  if (targetAuth) {
    headers["x-test-auth-id"] = targetAuth;
  }
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Paket BE-4: Status Machine, Transisi, dan Endpoint Terkait", () => {
  beforeEach(() => {
    resetDb();
  });

  // ================= UNIT TEST STATUS MACHINE =================
  describe("1. Unit Test canTransition() di /lib/status-machine.ts", () => {
    it("T07 (Unit): Membuka tender tanpa alasan jalur ditolak", () => {
      const res = canTransition(
        StatusProyek.PEMATANGAN,
        StatusProyek.TENDER_DIBUKA,
        { alasanJalur: "" }
      );
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/alasan jalur wajib/i);
    });

    it("Membuka tender dengan alasan jalur diizinkan", () => {
      const res = canTransition(
        StatusProyek.PEMATANGAN,
        StatusProyek.TENDER_DIBUKA,
        { alasanJalur: "Dikerjakan swakelola warga padat karya" }
      );
      expect(res.ok).toBe(true);
    });

    it("Transisi ke SELEKSI butuh minimal 1 proposal", () => {
      const resGagal = canTransition(
        StatusProyek.TENDER_DIBUKA,
        StatusProyek.SELEKSI,
        { jumlahProposal: 0 }
      );
      expect(resGagal.ok).toBe(false);
      expect(resGagal.reason).toMatch(/minimal 1 proposal/i);

      const resSukses = canTransition(
        StatusProyek.TENDER_DIBUKA,
        StatusProyek.SELEKSI,
        { jumlahProposal: 2 }
      );
      expect(resSukses.ok).toBe(true);
    });

    it("Transisi ke VERIFIKASI_KOMPETENSI ditolak jika masih ada flag belum ditinjau", () => {
      const res = canTransition(
        StatusProyek.SELEKSI,
        StatusProyek.VERIFIKASI_KOMPETENSI,
        { flagBelumDitinjau: 1 }
      );
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/semua flag kemiripan harus ditinjau/i);
    });

    it("T08 (Unit): Memulai pengerjaan saat ada sanggahan terbuka ditolak", () => {
      const res = canTransition(
        StatusProyek.MASA_SANGGAH,
        StatusProyek.PENGERJAAN,
        { sanggahanTerbuka: 2 }
      );
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/sanggahan terbuka/i);
    });

    it("Memulai pengerjaan diizinkan saat tidak ada sanggahan terbuka", () => {
      const res = canTransition(
        StatusProyek.MASA_SANGGAH,
        StatusProyek.PENGERJAAN,
        { sanggahanTerbuka: 0 }
      );
      expect(res.ok).toBe(true);
    });

    it("Menyelesaikan proyek ditolak jika progres belum 100% terverifikasi", () => {
      const res = canTransition(
        StatusProyek.PENGERJAAN,
        StatusProyek.SELESAI,
        { progresTerverifikasi: 80 }
      );
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/100% terverifikasi/i);
    });

    it("Membatalkan proyek wajib menyertakan alasan publik", () => {
      const resGagal = canTransition(
        StatusProyek.TENDER_DIBUKA,
        StatusProyek.DIBATALKAN,
        { alasanBatal: "" }
      );
      expect(resGagal.ok).toBe(false);
      expect(resGagal.reason).toMatch(/alasan pembatalan/i);

      const resSukses = canTransition(
        StatusProyek.TENDER_DIBUKA,
        StatusProyek.DIBATALKAN,
        { alasanBatal: "Musyawarah desa memutuskan pengalihan anggaran bencana" }
      );
      expect(resSukses.ok).toBe(true);
    });

    it("Proyek SELESAI tidak dapat dibatalkan atau diubah statusnya", () => {
      const res = canTransition(
        StatusProyek.SELESAI,
        StatusProyek.DIBATALKAN,
        { alasanBatal: "Dibatalkan setelah selesai" }
      );
      expect(res.ok).toBe(false);
      expect(res.reason).toMatch(/sudah selesai tidak dapat dibatalkan/i);
    });
  });

  // ================= INTEGRATION TEST POST /api/proyek =================
  describe("2. POST /api/proyek (Total RAB = Pagu)", () => {
    it("Menolak jika belum login / tanpa sesi (401)", async () => {
      const req = createTestRequest("http://localhost/api/proyek", "POST", {
        judul: "Pembangunan Jalan Desa Baru",
        deskripsi: "Pembangunan jalan baru sepanjang 500 meter di dusun timur.",
        lokasi: "Dusun Timur RT 01",
        pagu: 50_000_000,
        kelas: KelasProyek.KECIL,
        rab: [
          {
            uraian: "Semen",
            volume: 100,
            satuan: "sak",
            hargaSatuan: 500_000,
          },
        ],
      }, null);

      const res = await createProyekRoute(req);
      const json = await res.json();
      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });

    it("Menolak jika aktor bukan PERANGKAT atau ADMIN (403)", async () => {
      currentAuthUserId = "auth_warga_1";

      const req = createTestRequest("http://localhost/api/proyek", "POST", {
        judul: "Pembangunan Jalan Desa Baru",
        deskripsi: "Pembangunan jalan baru sepanjang 500 meter di dusun timur.",
        lokasi: "Dusun Timur RT 01",
        pagu: 50_000_000,
        kelas: KelasProyek.KECIL,
        rab: [
          {
            uraian: "Semen",
            volume: 100,
            satuan: "sak",
            hargaSatuan: 500_000,
          },
        ],
      });

      const res = await createProyekRoute(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("Menolak dengan 400 VALIDATION_ERROR jika total RAB != pagu", async () => {
      currentAuthUserId = "auth_perangkat_1";

      const req = createTestRequest("http://localhost/api/proyek", "POST", {
        judul: "Pembangunan Jalan Desa Baru",
        deskripsi: "Pembangunan jalan baru sepanjang 500 meter di dusun timur.",
        lokasi: "Dusun Timur RT 01",
        pagu: 50_000_000,
        kelas: KelasProyek.KECIL,
        rab: [
          {
            uraian: "Semen",
            volume: 10,
            satuan: "sak",
            hargaSatuan: 70_000, // total = 700.000 != 50.000.000
          },
        ],
      });

      const res = await createProyekRoute(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toMatch(/harus sama dengan pagu proyek/i);
    });

    it("Berhasil membuat proyek dengan total RAB == pagu (201)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      const req = createTestRequest("http://localhost/api/proyek", "POST", {
        judul: "Pembangunan Jalan Dusun Timur",
        deskripsi: "Pembangunan jalan semenisasi dusun sepanjang 200 meter.",
        lokasi: "Dusun Timur RT 01",
        pagu: 20_000_000,
        kelas: KelasProyek.KECIL,
        rab: [
          {
            uraian: "Semen Portland 50kg",
            volume: 200,
            satuan: "sak",
            hargaSatuan: 70_000, // 14.000.000
          },
          {
            uraian: "Pasir Beton",
            volume: 30,
            satuan: "m3",
            hargaSatuan: 200_000, // 6.000.000
          },
        ],
      });

      const res = await createProyekRoute(req);
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.data.judul).toBe("Pembangunan Jalan Dusun Timur");
      expect(json.data.status).toBe(StatusProyek.PEMATANGAN);
      expect(json.data.rab).toHaveLength(2);

      // Pastikan audit log tercatat
      const audit = mockAuditStore.find((a) => a.aksi === "BUAT_PROYEK");
      expect(audit).toBeDefined();
      expect(audit.entitas).toBe("PROYEK");
    });
  });

  // ================= INTEGRATION TEST PATCH /api/proyek/:id/status =================
  describe("3. PATCH /api/proyek/:id/status (Transisi & Alasan)", () => {
    it("T07 (Integration): Mencoba membuka tender tanpa alasan jalur ditolak 409", async () => {
      currentAuthUserId = "auth_perangkat_1";

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_pematangan_1/status",
        "PATCH",
        {
          status: StatusProyek.TENDER_DIBUKA,
        }
      );

      const res = await updateStatusRoute(req, {
        params: Promise.resolve({ id: "proyek_pematangan_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error.code).toBe("CONFLICT");
      expect(json.error.message).toMatch(/alasan jalur wajib/i);
    });

    it("Berhasil membuka tender bila alasan jalur diberikan (200)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_pematangan_1/status",
        "PATCH",
        {
          status: StatusProyek.TENDER_DIBUKA,
          alasanJalur: "Dikerjakan melalui sayembara padat karya tunai desa",
        }
      );

      const res = await updateStatusRoute(req, {
        params: Promise.resolve({ id: "proyek_pematangan_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.status).toBe(StatusProyek.TENDER_DIBUKA);

      const audit = mockAuditStore.find((a) => a.aksi === "UBAH_STATUS_PROYEK");
      expect(audit).toBeDefined();
    });

    it("T08 (Integration): Mencoba memulai pengerjaan saat ada sanggahan terbuka ditolak 409", async () => {
      currentAuthUserId = "auth_perangkat_1";

      // Tambahkan sanggahan berstatus TERBUKA pada proyek_sanggah_1
      mockSanggahanStore.push({
        id: "sanggah_dummy_1",
        proposalId: "proposal_sanggah_1",
        penggunaId: "usr_warga_1",
        isi: "Terdapat dugaan ketidaksesuaian penilaian",
        status: StatusSanggah.TERBUKA,
        dibuatPada: new Date(),
      });

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_sanggah_1/status",
        "PATCH",
        {
          status: StatusProyek.PENGERJAAN,
        }
      );

      const res = await updateStatusRoute(req, {
        params: Promise.resolve({ id: "proyek_sanggah_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error.code).toBe("CONFLICT");
      expect(json.error.message).toMatch(/sanggahan terbuka/i);
    });

    it("Membatalkan proyek memicu hook onProyekDibatalkan", async () => {
      currentAuthUserId = "auth_perangkat_1";
      const hookSpy = vi.spyOn(hooks, "onProyekDibatalkan");

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_pematangan_1/status",
        "PATCH",
        {
          status: StatusProyek.DIBATALKAN,
          alasanBatal: "Dibatalkan karena perubahan alokasi prioritas APBDes",
        }
      );

      const res = await updateStatusRoute(req, {
        params: Promise.resolve({ id: "proyek_pematangan_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.status).toBe(StatusProyek.DIBATALKAN);
      expect(hookSpy).toHaveBeenCalledWith(
        "proyek_pematangan_1",
        "Dibatalkan karena perubahan alokasi prioritas APBDes"
      );
    });
  });

  // ================= INTEGRATION TEST POST /api/proyek/:id/kompetensi =================
  describe("4. POST /api/proyek/:id/kompetensi (Verifikasi Kompetensi LITE)", () => {
    it("Menolak jika status proyek belum SELEKSI (409)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_pematangan_1/kompetensi",
        "POST",
        {
          proposalId: "proposal_1",
          nilaiRubrik: { pengalaman: 85, alat: 90 },
          catatan: "Kesiapan alat memadai",
        }
      );

      const res = await nilaiKompetensiRoute(req, {
        params: Promise.resolve({ id: "proyek_pematangan_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error.code).toBe("CONFLICT");
    });

    it("Berhasil menilai kompetensi jika proyek dalam tahap SELEKSI (201)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_seleksi_1/kompetensi",
        "POST",
        {
          proposalId: "proposal_1",
          nilaiRubrik: {
            pengalaman: 90,
            alatDanTenaga: 85,
            referensiRtRw: 95,
          },
          catatan: "Kelompok memiliki tukang bersertifikat dan referensi RT jelas",
        }
      );

      const res = await nilaiKompetensiRoute(req, {
        params: Promise.resolve({ id: "proyek_seleksi_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.data.proposalId).toBe("proposal_1");
      expect(json.data.penilaiId).toBe("usr_perangkat_1");

      const audit = mockAuditStore.find((a) => a.aksi === "NILAI_KOMPETENSI");
      expect(audit).toBeDefined();
    });
  });

  // ================= INTEGRATION TEST POST /api/proyek/:id/pemenang =================
  describe("5. POST /api/proyek/:id/pemenang", () => {
    it("T09: Warga memanggil endpoint pemenang ditolak 403", async () => {
      currentAuthUserId = "auth_warga_1";

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_seleksi_1/pemenang",
        "POST",
        {
          proposalId: "proposal_1",
          alasan: "Memilih kelompok sendiri secara sepihak untuk memenangkan tender",
        }
      );

      const res = await tetapkanPemenangRoute(req, {
        params: Promise.resolve({ id: "proyek_seleksi_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });

    it("Menolak jika masih ada flag kemiripan berstatus BELUM (409)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      mockFlagStore.push({
        id: "flag_1",
        proyekId: "proyek_seleksi_1",
        proposalAId: "proposal_1",
        proposalBId: "proposal_lain",
        nilai: 0.85,
        jenis: "TEKS",
        keputusan: KeputusanFlag.BELUM,
      });

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_seleksi_1/pemenang",
        "POST",
        {
          proposalId: "proposal_1",
          alasan: "Proposal dengan nilai teknis dan serapan tenaga lokal terbaik.",
        }
      );

      const res = await tetapkanPemenangRoute(req, {
        params: Promise.resolve({ id: "proyek_seleksi_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error.code).toBe("CONFLICT");
      expect(json.error.message).toMatch(/masih ada flag kemiripan yang belum ditinjau/i);
    });

    it("Menolak jika memilih bukan peringkat teratas tanpa alasan tambahan (400)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      // Tambahkan proposal kedua dengan skor lebih tinggi (skor 98 > skor proposal_1 yang 95)
      mockProposalStore.push({
        id: "proposal_top",
        proyekId: "proyek_seleksi_1",
        kelompokId: "kelompok_lain",
        penawaran: BigInt(85_000_000),
        durasiHari: 40,
        tenagaTotal: 10,
        tenagaLokal: 10,
        narasiMetode: "Metode unggulan",
        narasiJadwal: "Jadwal rapi",
        narasiRisiko: "Risiko aman",
        dokumen: [],
        kelengkapan: {},
        statusAnalisis: StatusAnalisis.BERHASIL,
        dikirimPada: new Date(),
      });
      mockSkorStore.push({
        id: "skor_top",
        proposalId: "proposal_top",
        total: 98,
        rincian: {},
        flags: [],
        versiBobot: "v1",
        dibuatPada: new Date(),
      });

      // Pilih proposal_1 (skor 95, bukan top) tanpa alasanTambahan
      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_seleksi_1/pemenang",
        "POST",
        {
          proposalId: "proposal_1",
          alasan: "Kelompok memiliki rekam jejak kerja bagus di dusun setempat.",
        }
      );

      const res = await tetapkanPemenangRoute(req, {
        params: Promise.resolve({ id: "proyek_seleksi_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toMatch(/alasan tambahan wajib diisi/i);
    });

    it("Berhasil menetapkan pemenang: set MASA_SANGGAH 3 hari, panggil onKomitmenDibuat, catat audit (201)", async () => {
      currentAuthUserId = "auth_perangkat_1";
      const komitmenSpy = vi.spyOn(hooks, "onKomitmenDibuat");

      const req = createTestRequest(
        "http://localhost/api/proyek/proyek_seleksi_1/pemenang",
        "POST",
        {
          proposalId: "proposal_1",
          alasan: "Skor tertinggi 95, serapan tenaga lokal 90%, dan tidak ada flag kemiripan.",
        }
      );

      const res = await tetapkanPemenangRoute(req, {
        params: Promise.resolve({ id: "proyek_seleksi_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.data.keputusan.proposalId).toBe("proposal_1");
      expect(json.data.proyek.status).toBe(StatusProyek.MASA_SANGGAH);

      // Cek durasi masa sanggah 3 hari
      const akhirSanggah = new Date(json.data.proyek.akhirMasaSanggah);
      const diffDays = Math.round(
        (akhirSanggah.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      expect(diffDays).toBe(3);

      expect(komitmenSpy).toHaveBeenCalledWith(
        "proyek_seleksi_1",
        "proposal_1",
        BigInt(88_000_000)
      );

      const audit = mockAuditStore.find((a) => a.aksi === "TETAPKAN_PEMENANG");
      expect(audit).toBeDefined();
    });
  });

  // ================= INTEGRATION TEST POST /api/proposal/:id/sanggah =================
  describe("6. POST /api/proposal/:id/sanggah", () => {
    it("Menolak jika pengguna bukan peserta proposal (403)", async () => {
      // Login sebagai warga luar kelompok
      currentAuthUserId = "auth_warga_lain";

      const req = createTestRequest(
        "http://localhost/api/proposal/proposal_sanggah_1/sanggah",
        "POST",
        {
          isi: "Saya warga luar ingin menyanggah hasil pemilihan pemenang tender ini.",
        }
      );

      const res = await kirimSanggahanRoute(req, {
        params: Promise.resolve({ id: "proposal_sanggah_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toMatch(/hanya peserta/i);
    });

    it("Menolak jika masa sanggah tidak aktif atau sudah lewat (409)", async () => {
      // Login sebagai ketua kelompok
      currentAuthUserId = "auth_warga_1";

      // Ubah status proyek menjadi PENGERJAAN
      const proyek = mockProyekStore.find((p) => p.id === "proyek_sanggah_1");
      proyek!.status = StatusProyek.PENGERJAAN;

      const req = createTestRequest(
        "http://localhost/api/proposal/proposal_sanggah_1/sanggah",
        "POST",
        {
          isi: "Menyanggah hasil lelang karena terdapat kesalahan penilaian teknis.",
        }
      );

      const res = await kirimSanggahanRoute(req, {
        params: Promise.resolve({ id: "proposal_sanggah_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(409);
      expect(json.error.code).toBe("CONFLICT");
      expect(json.error.message).toMatch(/selama masa sanggah aktif/i);
    });

    it("Berhasil mengirim sanggahan jika peserta (ketua/anggota) saat masa sanggah aktif (201)", async () => {
      // Bambang adalah anggota kelompok_1
      currentAuthUserId = "auth_warga_2";

      // Pastikan status MASA_SANGGAH dan masa aktif masih berlaku
      const proyek = mockProyekStore.find((p) => p.id === "proyek_sanggah_1");
      proyek!.status = StatusProyek.MASA_SANGGAH;
      proyek!.akhirMasaSanggah = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      const req = createTestRequest(
        "http://localhost/api/proposal/proposal_sanggah_1/sanggah",
        "POST",
        {
          isi: "Kami merasa verifikasi pengalaman kelompok kami belum dinilai dengan seksama.",
        }
      );

      const res = await kirimSanggahanRoute(req, {
        params: Promise.resolve({ id: "proposal_sanggah_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.data.proposalId).toBe("proposal_sanggah_1");
      expect(json.data.status).toBe(StatusSanggah.TERBUKA);

      const audit = mockAuditStore.find((a) => a.aksi === "KIRIM_SANGGAHAN");
      expect(audit).toBeDefined();
    });
  });
});
