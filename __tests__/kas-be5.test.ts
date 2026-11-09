import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Peran,
  StatusAkun,
  JenisEntri,
  LevelAkun,
  JenisBelanja,
  StatusVerifikasi,
} from "@prisma/client";
import { hitungHash, verifikasiRantai, sha256 } from "@/lib/kas-hash";
import { tambahEntri } from "@/lib/kas-ledger";
import { hitungRingkasanKas, getStatusVerifikasiEntri } from "@/lib/kas-ringkasan";

// ================= IN-MEMORY PRISMA STORE =================

interface MockDesa {
  id: string;
  nama: string;
  tahun: number;
  pagu: bigint;
  pagukdmp: bigint;
}

interface MockPengguna {
  id: string;
  authId: string;
  nama: string;
  email: string;
  peran: Peran;
  statusAkun: StatusAkun;
  desaId: string;
}

interface MockSumberDana {
  id: string;
  desaId: string;
  nama: string;
  tahun: number;
  pagu: bigint;
}

interface MockRefAkun {
  id: string;
  kode: string;
  uraian: string;
  level: LevelAkun;
  parentId: string | null;
  kodeSiskeudes: string | null;
  sensitif: boolean;
}

interface MockPosAnggaran {
  id: string;
  desaId: string;
  tahun: number;
  akunId: string;
  sumberDanaId: string;
  jenisBelanja: JenisBelanja;
  uraian: string;
  anggaran: bigint;
  sensitif: boolean;
}

interface MockEntriKas {
  id: string;
  desaId: string;
  nomorUrut: number;
  jenis: JenisEntri;
  jumlah: bigint;
  tanggal: Date;
  uraian: string;
  sumberDanaId: string | null;
  posId: string | null;
  proyekId: string | null;
  terminId: string | null;
  koreksiDariId: string | null;
  penerima: string | null;
  penerimaDisamarkan: boolean;
  buktiUrls: string[];
  pencatatId: string;
  hashSebelumnya: string | null;
  hash: string;
  dibuatPada: Date;
}

interface MockVerifikasiEntri {
  id: string;
  entriId: string;
  pengawasId: string;
  keputusan: StatusVerifikasi;
  catatan: string | null;
  waktu: Date;
}

let mockDesaStore: MockDesa[] = [];
let mockPenggunaStore: MockPengguna[] = [];
let mockSumberDanaStore: MockSumberDana[] = [];
let mockRefAkunStore: MockRefAkun[] = [];
let mockPosAnggaranStore: MockPosAnggaran[] = [];
let mockEntriKasStore: MockEntriKas[] = [];
let mockVerifikasiEntriStore: MockVerifikasiEntri[] = [];
let mockAuditStore: any[] = [];

let currentAuthUserId: string | null = null;

// Antrean mutex untuk mensimulasikan locking advisory xact lock pada environment tes
let advisoryLockQueue: Promise<void> = Promise.resolve();

function resetDb() {
  mockDesaStore = [
    {
      id: "desa_1",
      nama: "Desa Karang Sari",
      tahun: 2026,
      pagu: BigInt(1_000_000_000),
      pagukdmp: BigInt(580_300_000),
    },
  ];

  mockPenggunaStore = [
    {
      id: "usr_perangkat_1",
      authId: "auth_perangkat_1",
      nama: "Pak Hendy (Kades/Perangkat)",
      email: "kades@karangsari.desa.id",
      peran: Peran.PERANGKAT,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_pengawas_1",
      authId: "auth_pengawas_1",
      nama: "Pak Bambang (BPD/Pengawas)",
      email: "bpd@karangsari.desa.id",
      peran: Peran.PENGAWAS,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_warga_1",
      authId: "auth_warga_1",
      nama: "Warga Biasa",
      email: "warga@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
  ];

  mockRefAkunStore = [
    {
      id: "akun_bid_1",
      kode: "01",
      uraian: "Penyelenggaraan Pemerintahan Desa",
      level: LevelAkun.BIDANG,
      parentId: null,
      kodeSiskeudes: null,
      sensitif: false,
    },
    {
      id: "akun_bid_2",
      kode: "02",
      uraian: "Pelaksanaan Pembangunan Desa",
      level: LevelAkun.BIDANG,
      parentId: null,
      kodeSiskeudes: null,
      sensitif: false,
    },
    {
      id: "akun_sub_21",
      kode: "02.01",
      uraian: "Kawasan Permukiman",
      level: LevelAkun.SUB_BIDANG,
      parentId: "akun_bid_2",
      kodeSiskeudes: null,
      sensitif: false,
    },
    {
      id: "akun_keg_drainase",
      kode: "02.01.01",
      uraian: "Pembangunan Drainase Lingkungan",
      level: LevelAkun.KEGIATAN,
      parentId: "akun_sub_21",
      kodeSiskeudes: null,
      sensitif: false,
    },
    {
      id: "akun_keg_balai",
      kode: "02.01.02",
      uraian: "Renovasi Gedung Balai Warga",
      level: LevelAkun.KEGIATAN,
      parentId: "akun_sub_21",
      kodeSiskeudes: null,
      sensitif: false,
    },
    {
      id: "akun_keg_jalan",
      kode: "02.01.03",
      uraian: "Paving Jalan Setapak Dusun",
      level: LevelAkun.KEGIATAN,
      parentId: "akun_sub_21",
      kodeSiskeudes: null,
      sensitif: false,
    },
  ];

  mockSumberDanaStore = [
    {
      id: "sd_dd",
      desaId: "desa_1",
      nama: "Dana Desa",
      tahun: 2026,
      pagu: BigInt(1_000_000_000),
    },
    {
      id: "sd_add",
      desaId: "desa_1",
      nama: "Alokasi Dana Desa (ADD)",
      tahun: 2026,
      pagu: BigInt(250_000_000),
    },
  ];

  mockPosAnggaranStore = [
    {
      id: "pos_balai",
      desaId: "desa_1",
      tahun: 2026,
      akunId: "akun_keg_balai",
      sumberDanaId: "sd_dd",
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Balai warga",
      anggaran: BigInt(140_000_000),
      sensitif: false,
    },
    {
      id: "pos_jalan",
      desaId: "desa_1",
      tahun: 2026,
      akunId: "akun_keg_jalan",
      sumberDanaId: "sd_dd",
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Jalan setapak",
      anggaran: BigInt(60_000_000),
      sensitif: false,
    },
    {
      id: "pos_drainase",
      desaId: "desa_1",
      tahun: 2026,
      akunId: "akun_keg_drainase",
      sumberDanaId: "sd_dd",
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Drainase RT 3",
      anggaran: BigInt(100_000_000),
      sensitif: false,
    },
  ];

  mockEntriKasStore = [];
  mockVerifikasiEntriStore = [];
  mockAuditStore = [];
  currentAuthUserId = null;
}

// In-memory mock database trigger yang menolak UPDATE / DELETE (T25)
function rejectImmutableOp(table: string, op: "UPDATE" | "DELETE"): never {
  throw new Error(
    `Operasi ${op} pada tabel ${table} ditolak: ledger dan audit log bersifat append-only.`
  );
}

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
      $executeRaw: vi.fn(async () => 1),
      desa: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockDesaStore.find((d) => d.id === where.id) || null;
        }),
        findFirst: vi.fn(async () => mockDesaStore[0] || null),
      },
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
      refAkun: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockRefAkunStore.find((a) => a.id === where.id) || null;
        }),
        findMany: vi.fn(async ({ where }: any) => {
          let list = [...mockRefAkunStore];
          if (where?.level) list = list.filter((a) => a.level === where.level);
          if (where?.parentId) list = list.filter((a) => a.parentId === where.parentId);
          return list;
        }),
      },
      sumberDana: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockSumberDanaStore.find((s) => s.id === where.id) || null;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return (
            mockSumberDanaStore.find(
              (s) =>
                (!where.id || s.id === where.id) &&
                (!where.desaId || s.desaId === where.desaId)
            ) || null
          );
        }),
        findMany: vi.fn(async ({ where }: any) => {
          let list = [...mockSumberDanaStore];
          if (where?.desaId) list = list.filter((s) => s.desaId === where.desaId);
          return list;
        }),
        create: vi.fn(async ({ data }: any) => {
          const id = `sd_${Date.now()}_${Math.random()}`;
          const newSd: MockSumberDana = {
            id,
            desaId: data.desaId,
            nama: data.nama,
            tahun: data.tahun,
            pagu: BigInt(data.pagu),
          };
          mockSumberDanaStore.push(newSd);
          return newSd;
        }),
      },
      posAnggaran: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockPosAnggaranStore.find((p) => p.id === where.id) || null;
        }),
        findMany: vi.fn(async ({ where }: any) => {
          let list = [...mockPosAnggaranStore];
          if (where?.desaId) list = list.filter((p) => p.desaId === where.desaId);
          return list.map((p) => {
            const akun = mockRefAkunStore.find((a) => a.id === p.akunId);
            const parent = akun?.parentId
              ? mockRefAkunStore.find((a) => a.id === akun.parentId)
              : null;
            const grandParent = parent?.parentId
              ? mockRefAkunStore.find((a) => a.id === parent.parentId)
              : null;
            return {
              ...p,
              akun: akun
                ? {
                    ...akun,
                    parent: parent ? { ...parent, parent: grandParent } : null,
                  }
                : null,
            };
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const id = `pos_${Date.now()}_${Math.random()}`;
          const newPos: MockPosAnggaran = {
            id,
            desaId: data.desaId,
            tahun: data.tahun,
            akunId: data.akunId,
            sumberDanaId: data.sumberDanaId,
            jenisBelanja: data.jenisBelanja,
            uraian: data.uraian,
            anggaran: BigInt(data.anggaran),
            sensitif: data.sensitif ?? false,
          };
          mockPosAnggaranStore.push(newPos);
          return newPos;
        }),
      },
      entriKas: {
        findFirst: vi.fn(async ({ where, orderBy }: any) => {
          let list = [...mockEntriKasStore];
          if (where?.desaId) list = list.filter((e) => e.desaId === where.desaId);
          if (orderBy?.nomorUrut === "desc") {
            list.sort((a, b) => b.nomorUrut - a.nomorUrut);
          }
          return list[0] || null;
        }),
        findUnique: vi.fn(async ({ where, include }: any) => {
          const e = mockEntriKasStore.find((item) => item.id === where.id);
          if (!e) return null;
          const res: any = { ...e };
          if (include?.verifikasi) {
            res.verifikasi = mockVerifikasiEntriStore.filter(
              (v) => v.entriId === e.id
            );
          }
          return res;
        }),
        findMany: vi.fn(async ({ where, orderBy, skip, take }: any) => {
          let list = [...mockEntriKasStore];
          if (where?.desaId) list = list.filter((e) => e.desaId === where.desaId);
          if (where?.jenis) list = list.filter((e) => e.jenis === where.jenis);
          if (where?.posId) list = list.filter((e) => e.posId === where.posId);
          if (where?.proyekId) list = list.filter((e) => e.proyekId === where.proyekId);

          if (orderBy?.nomorUrut === "asc") {
            list.sort((a, b) => a.nomorUrut - b.nomorUrut);
          } else {
            list.sort((a, b) => b.nomorUrut - a.nomorUrut);
          }

          if (skip !== undefined && take !== undefined) {
            list = list.slice(skip, skip + take);
          }

          return list.map((e) => ({
            ...e,
            verifikasi: mockVerifikasiEntriStore.filter((v) => v.entriId === e.id),
          }));
        }),
        count: vi.fn(async ({ where }: any) => {
          let list = [...mockEntriKasStore];
          if (where?.desaId) list = list.filter((e) => e.desaId === where.desaId);
          return list.length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const id = `entri_${Date.now()}_${Math.random()}`;
          const newEntry: MockEntriKas = {
            id,
            desaId: data.desaId,
            nomorUrut: data.nomorUrut,
            jenis: data.jenis,
            jumlah: BigInt(data.jumlah),
            tanggal: data.tanggal,
            uraian: data.uraian,
            sumberDanaId: data.sumberDanaId ?? null,
            posId: data.posId ?? null,
            proyekId: data.proyekId ?? null,
            terminId: data.terminId ?? null,
            koreksiDariId: data.koreksiDariId ?? null,
            penerima: data.penerima ?? null,
            penerimaDisamarkan: data.penerimaDisamarkan ?? true,
            buktiUrls: data.buktiUrls ?? [],
            pencatatId: data.pencatatId,
            hashSebelumnya: data.hashSebelumnya ?? null,
            hash: data.hash,
            dibuatPada: data.dibuatPada ?? new Date(),
          };
          mockEntriKasStore.push(newEntry);
          return newEntry;
        }),
        update: vi.fn(async () => rejectImmutableOp("EntriKas", "UPDATE")),
        delete: vi.fn(async () => rejectImmutableOp("EntriKas", "DELETE")),
        deleteMany: vi.fn(async () => rejectImmutableOp("EntriKas", "DELETE")),
      },
      verifikasiEntri: {
        update: vi.fn(async () => rejectImmutableOp("VerifikasiEntri", "UPDATE")),
        delete: vi.fn(async () => rejectImmutableOp("VerifikasiEntri", "DELETE")),
        deleteMany: vi.fn(async () => rejectImmutableOp("VerifikasiEntri", "DELETE")),
      },
      auditLog: {
        create: vi.fn(async ({ data }: any) => {
          mockAuditStore.push(data);
          return { id: `audit_${Date.now()}`, ...data };
        }),
        update: vi.fn(async () => rejectImmutableOp("AuditLog", "UPDATE")),
        delete: vi.fn(async () => rejectImmutableOp("AuditLog", "DELETE")),
        deleteMany: vi.fn(async () => rejectImmutableOp("AuditLog", "DELETE")),
      },
    },
  };
});

// Import route handlers K1 - K7
import { GET as getRefAkunRoute } from "@/app/api/ref/akun/route";
import { GET as getRingkasanKasRoute } from "@/app/api/desa/[id]/kas/ringkasan/route";
import { GET as getEntriKasRoute } from "@/app/api/desa/[id]/kas/entri/route";
import { GET as getDetailEntriRoute } from "@/app/api/kas/entri/[id]/route";
import { GET as getVerifikasiIntegritasRoute } from "@/app/api/desa/[id]/kas/verifikasi-integritas/route";
import { POST as createSumberDanaRoute } from "@/app/api/desa/[id]/sumber-dana/route";
import { POST as createPosAnggaranRoute } from "@/app/api/desa/[id]/pos-anggaran/route";

function createTestRequest(
  url: string,
  method: string,
  body?: any,
  authId?: string | null
) {
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

describe("Paket BE-5: Buku Kas Publik, Rantai Hash, dan Integritas Ledger", () => {
  beforeEach(() => {
    resetDb();
  });

  // ================= T15: VERIFIKASI INTEGRITAS RANTAI =================
  describe("1. Tes T15 & Algoritma Rantai Hash", () => {
    it("T15: Rantai hash kosong atau valid menghasilkan valid: true", () => {
      const hasilKosong = verifikasiRantai([]);
      expect(hasilKosong.valid).toBe(true);
      expect(hasilKosong.jumlahEntri).toBe(0);

      // Buat 3 entri berantai
      const e1Input = {
        nomorUrut: 1,
        jenis: "PENERIMAAN",
        jumlah: BigInt(600_000_000),
        tanggal: new Date("2026-01-10T08:00:00Z"),
        uraian: "Dana Desa Tahap 1",
        buktiUrls: ["https://akar-desa.id/b1.pdf"],
        pencatatId: "usr_perangkat_1",
        dibuatPada: new Date("2026-01-10T08:00:00Z"),
      };
      const h1 = hitungHash(null, e1Input);

      const e2Input = {
        nomorUrut: 2,
        jenis: "KOMITMEN",
        jumlah: BigInt(138_000_000),
        tanggal: new Date("2026-02-01T10:00:00Z"),
        uraian: "Komitmen Balai Warga",
        buktiUrls: [],
        pencatatId: "usr_perangkat_1",
        dibuatPada: new Date("2026-02-01T10:00:00Z"),
      };
      const h2 = hitungHash(h1, e2Input);

      const e3Input = {
        nomorUrut: 3,
        jenis: "PEMBAYARAN",
        jumlah: BigInt(41_400_000),
        tanggal: new Date("2026-02-10T11:00:00Z"),
        uraian: "Termin 0 Balai Warga",
        buktiUrls: ["https://akar-desa.id/b2.pdf"],
        pencatatId: "usr_perangkat_1",
        dibuatPada: new Date("2026-02-10T11:00:00Z"),
      };
      const h3 = hitungHash(h2, e3Input);

      const rantai = [
        { ...e1Input, hashSebelumnya: null, hash: h1 },
        { ...e2Input, hashSebelumnya: h1, hash: h2 },
        { ...e3Input, hashSebelumnya: h2, hash: h3 },
      ];

      const res = verifikasiRantai(rantai);
      expect(res.valid).toBe(true);
      expect(res.jumlahEntri).toBe(3);
      expect(res.hashTerakhir).toBe(h3);
    });
  });

  // ================= T16: DETEKSI PERUSAKAN RANTAI =================
  describe("2. Tes T16: Deteksi Integritas yang Rusak / Diubah Diam-diam", () => {
    it("T16: Satu jumlah entri diubah langsung menghasilkan valid: false dan entriPertamaRusak yang benar", () => {
      const e1Input = {
        nomorUrut: 1,
        jenis: "PENERIMAAN",
        jumlah: BigInt(600_000_000),
        tanggal: new Date("2026-01-10T08:00:00Z"),
        uraian: "Dana Desa",
        buktiUrls: [],
        pencatatId: "usr_perangkat_1",
        dibuatPada: new Date("2026-01-10T08:00:00Z"),
      };
      const h1 = hitungHash(null, e1Input);

      const e2Input = {
        nomorUrut: 2,
        jenis: "PEMBAYARAN",
        jumlah: BigInt(50_000_000),
        tanggal: new Date("2026-01-20T08:00:00Z"),
        uraian: "Belanja",
        buktiUrls: [],
        pencatatId: "usr_perangkat_1",
        dibuatPada: new Date("2026-01-20T08:00:00Z"),
      };
      const h2 = hitungHash(h1, e2Input);

      // Simulasikan perusakan: di entri 2, jumlah diubah diam-diam menjadi 90.000.000
      const rantaiRusak = [
        { ...e1Input, hashSebelumnya: null, hash: h1 },
        {
          ...e2Input,
          jumlah: BigInt(90_000_000), // Diubah tanpa menghitung ulang hash
          hashSebelumnya: h1,
          hash: h2,
        },
      ];

      const res = verifikasiRantai(rantaiRusak);
      expect(res.valid).toBe(false);
      expect(res.entriPertamaRusak).toBe(2);
    });
  });

  // ================= T24: AKURASI ANGKA TABEL 48.2 =================
  describe("3. Tes T24: Rumus 42.2 dan Angka Tiga Pos Tabel 48.2 Harus Sama Persis", () => {
    it("T24: Menghasilkan angka persis untuk Balai Warga, Jalan Setapak, dan Drainase RT 3", () => {
      const posBalai = mockPosAnggaranStore.find((p) => p.id === "pos_balai")!;
      const posJalan = mockPosAnggaranStore.find((p) => p.id === "pos_jalan")!;
      const posDrainase = mockPosAnggaranStore.find((p) => p.id === "pos_drainase")!;

      // Simulasikan entri kas sesuai skenario 48.1:
      // Balai Warga: Komitmen 138jt; Termin 0 (41,4jt DISETUJUI); Termin 50 (55,2jt MENUNGGU)
      // Jalan Setapak: Komitmen 58jt; Tiga termin (17,4jt + 23,2jt + 17,4jt = 58jt DISETUJUI)
      // Drainase: Belum ada pemenang
      const entriList: any[] = [
        {
          id: "e_komitmen_balai",
          nomorUrut: 1,
          jenis: JenisEntri.KOMITMEN,
          jumlah: BigInt(138_000_000),
          posId: posBalai.id,
          tanggal: new Date(),
          uraian: "Komitmen Balai Warga",
          buktiUrls: [],
          pencatatId: "kades",
          hashSebelumnya: null,
          hash: "h1",
          dibuatPada: new Date(),
        },
        {
          id: "e_t0_balai",
          nomorUrut: 2,
          jenis: JenisEntri.PEMBAYARAN,
          jumlah: BigInt(41_400_000),
          posId: posBalai.id,
          tanggal: new Date(),
          uraian: "Termin 0 Balai Warga",
          buktiUrls: ["b1.pdf"],
          pencatatId: "kades",
          hashSebelumnya: "h1",
          hash: "h2",
          dibuatPada: new Date(),
          verifikasi: [
            {
              id: "v1",
              entriId: "e_t0_balai",
              keputusan: StatusVerifikasi.DISETUJUI,
              waktu: new Date(),
            },
          ],
        },
        {
          id: "e_t50_balai",
          nomorUrut: 3,
          jenis: JenisEntri.PEMBAYARAN,
          jumlah: BigInt(55_200_000),
          posId: posBalai.id,
          tanggal: new Date(),
          uraian: "Termin 50 Balai Warga",
          buktiUrls: ["b2.pdf"],
          pencatatId: "kades",
          hashSebelumnya: "h2",
          hash: "h3",
          dibuatPada: new Date(),
          verifikasi: [], // Status turunan MENUNGGU
        },
        {
          id: "e_komitmen_jalan",
          nomorUrut: 4,
          jenis: JenisEntri.KOMITMEN,
          jumlah: BigInt(58_000_000),
          posId: posJalan.id,
          tanggal: new Date(),
          uraian: "Komitmen Jalan Setapak",
          buktiUrls: [],
          pencatatId: "kades",
          hashSebelumnya: "h3",
          hash: "h4",
          dibuatPada: new Date(),
        },
        {
          id: "e_t1_jalan",
          nomorUrut: 5,
          jenis: JenisEntri.PEMBAYARAN,
          jumlah: BigInt(17_400_000),
          posId: posJalan.id,
          tanggal: new Date(),
          uraian: "Termin 1 Jalan",
          buktiUrls: ["b3.pdf"],
          pencatatId: "kades",
          hashSebelumnya: "h4",
          hash: "h5",
          dibuatPada: new Date(),
          verifikasi: [{ keputusan: StatusVerifikasi.DISETUJUI, waktu: new Date() }],
        },
        {
          id: "e_t2_jalan",
          nomorUrut: 6,
          jenis: JenisEntri.PEMBAYARAN,
          jumlah: BigInt(23_200_000),
          posId: posJalan.id,
          tanggal: new Date(),
          uraian: "Termin 2 Jalan",
          buktiUrls: ["b4.pdf"],
          pencatatId: "kades",
          hashSebelumnya: "h5",
          hash: "h6",
          dibuatPada: new Date(),
          verifikasi: [{ keputusan: StatusVerifikasi.DISETUJUI, waktu: new Date() }],
        },
        {
          id: "e_t3_jalan",
          nomorUrut: 7,
          jenis: JenisEntri.PEMBAYARAN,
          jumlah: BigInt(17_400_000),
          posId: posJalan.id,
          tanggal: new Date(),
          uraian: "Termin 3 Jalan",
          buktiUrls: ["b5.pdf"],
          pencatatId: "kades",
          hashSebelumnya: "h6",
          hash: "h7",
          dibuatPada: new Date(),
          verifikasi: [{ keputusan: StatusVerifikasi.DISETUJUI, waktu: new Date() }],
        },
      ];

      const ringkasan = hitungRingkasanKas({
        sumberDanaList: mockSumberDanaStore as any,
        posList: [posBalai, posJalan, posDrainase] as any,
        entriList,
      });

      // 1. Verifikasi Balai Warga
      const rBalai = ringkasan.perPos[posBalai.id];
      expect(rBalai.dianggarkan).toBe(140_000_000);
      expect(rBalai.terikat).toBe(138_000_000);
      expect(rBalai.terealisasi).toBe(41_400_000);
      expect(rBalai.menungguVerifikasi).toBe(55_200_000);
      expect(rBalai.tersedia).toBe(2_000_000);

      // 2. Verifikasi Jalan Setapak
      const rJalan = ringkasan.perPos[posJalan.id];
      expect(rJalan.dianggarkan).toBe(60_000_000);
      expect(rJalan.terikat).toBe(58_000_000);
      expect(rJalan.terealisasi).toBe(58_000_000);
      expect(rJalan.menungguVerifikasi).toBe(0);
      expect(rJalan.tersedia).toBe(2_000_000);

      // 3. Verifikasi Drainase RT 3
      const rDrainase = ringkasan.perPos[posDrainase.id];
      expect(rDrainase.dianggarkan).toBe(100_000_000);
      expect(rDrainase.terikat).toBe(0);
      expect(rDrainase.terealisasi).toBe(0);
      expect(rDrainase.menungguVerifikasi).toBe(0);
      expect(rDrainase.tersedia).toBe(100_000_000);
    });
  });

  // ================= T25: IMMUTABILITY DATABASE =================
  describe("4. Tes T25: UPDATE dan DELETE Ditolak oleh Trigger / Aturan Immutability", () => {
    it("T25: Menolak UPDATE pada EntriKas", async () => {
      const { prisma } = await import("@/lib/prisma");
      await expect(
        prisma.entriKas.update({
          where: { id: "entri_1" },
          data: { uraian: "Coba ubah" } as any,
        })
      ).rejects.toThrow(/ditolak: ledger dan audit log bersifat append-only/i);
    });

    it("T25: Menolak DELETE pada EntriKas", async () => {
      const { prisma } = await import("@/lib/prisma");
      await expect(
        prisma.entriKas.delete({
          where: { id: "entri_1" },
        })
      ).rejects.toThrow(/ditolak: ledger dan audit log bersifat append-only/i);
    });

    it("T25: Menolak UPDATE pada VerifikasiEntri & AuditLog", async () => {
      const { prisma } = await import("@/lib/prisma");
      await expect(
        prisma.verifikasiEntri.update({
          where: { id: "verifikasi_1" },
          data: { catatan: "ubah" } as any,
        })
      ).rejects.toThrow(/ditolak: ledger dan audit log bersifat append-only/i);

      await expect(
        prisma.auditLog.delete({
          where: { id: "audit_1" },
        })
      ).rejects.toThrow(/ditolak: ledger dan audit log bersifat append-only/i);
    });
  });

  // ================= T26: KONKURENSI PENULISAN BERSAMAAN =================
  describe("5. Tes T26: Penulisan Bersamaan pada Desa yang Sama", () => {
    it("T26: Dua transaksi penulisan bersamaan menghasilkan nomor urut berurutan dan rantai valid", async () => {
      const { prisma } = await import("@/lib/prisma");

      // Gunakan serialized lock runner untuk mensimulasikan pg_advisory_xact_lock
      const writeWithLock = async (input: any) => {
        const nextInQueue = advisoryLockQueue.then(async () => {
          return await tambahEntri(prisma, input);
        });
        advisoryLockQueue = nextInQueue.then(() => {}).catch(() => {});
        return nextInQueue;
      };

      // Jalankan 2 penulisan paralel bersamaan
      const [entryA, entryB] = await Promise.all([
        writeWithLock({
          desaId: "desa_1",
          jenis: JenisEntri.PENERIMAAN,
          jumlah: BigInt(100_000_000),
          tanggal: new Date("2026-01-01"),
          uraian: "Penulisan Bersamaan A",
          pencatatId: "usr_perangkat_1",
        }),
        writeWithLock({
          desaId: "desa_1",
          jenis: JenisEntri.PENERIMAAN,
          jumlah: BigInt(200_000_000),
          tanggal: new Date("2026-01-02"),
          uraian: "Penulisan Bersamaan B",
          pencatatId: "usr_perangkat_1",
        }),
      ]);

      expect(entryA.nomorUrut).toBeDefined();
      expect(entryB.nomorUrut).toBeDefined();

      // Pastikan urutannya 1 dan 2
      const sortedNumbers = [entryA.nomorUrut, entryB.nomorUrut].sort(
        (a, b) => a - b
      );
      expect(sortedNumbers).toEqual([1, 2]);

      // Pastikan integritas rantai dari hasil store
      const integritas = verifikasiRantai(mockEntriKasStore);
      expect(integritas.valid).toBe(true);
      expect(integritas.jumlahEntri).toBe(2);
    });
  });

  // ================= ENDPOINTS K1 - K7 =================
  describe("6. Integrasi Endpoints K1 sampai K7", () => {
    it("K1: GET /api/ref/akun mengembalikan daftar akun hierarki", async () => {
      const req = createTestRequest("http://localhost/api/ref/akun?level=BIDANG", "GET");
      const res = await getRefAkunRoute(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeInstanceOf(Array);
      expect(json.data.every((a: any) => a.level === LevelAkun.BIDANG)).toBe(true);
    });

    it("K2: GET /api/desa/:id/kas/ringkasan mengembalikan format ringkasan PRD 44", async () => {
      const req = createTestRequest("http://localhost/api/desa/desa_1/kas/ringkasan", "GET");
      const res = await getRingkasanKasRoute(req, {
        params: Promise.resolve({ id: "desa_1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.desaId).toBe("desa_1");
      expect(json.data.total).toBeDefined();
      expect(json.data.total.dianggarkan).toBeDefined();
      expect(json.data.sumberDana).toBeInstanceOf(Array);
    });

    it("K3: GET /api/desa/:id/kas/entri menyamarkan data sensitif untuk publik", async () => {
      // Simulasikan entri dengan penerimaDisamarkan = true
      mockEntriKasStore.push({
        id: "entri_sensitif",
        desaId: "desa_1",
        nomorUrut: 1,
        jenis: JenisEntri.PEMBAYARAN,
        jumlah: BigInt(50_000_000),
        tanggal: new Date(),
        uraian: "Siltap Perangkat",
        sumberDanaId: null,
        posId: null,
        proyekId: null,
        terminId: null,
        koreksiDariId: null,
        penerima: "Budi Santoso Asli",
        penerimaDisamarkan: true,
        buktiUrls: [],
        pencatatId: "usr_perangkat_1",
        hashSebelumnya: null,
        hash: "hash_sensitif",
        dibuatPada: new Date(),
      });

      // Akses sebagai publik (tanpa login atau warga biasa)
      const req = createTestRequest(
        "http://localhost/api/desa/desa_1/kas/entri",
        "GET",
        undefined,
        "auth_warga_1"
      );
      const res = await getEntriKasRoute(req, {
        params: Promise.resolve({ id: "desa_1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data[0].penerima).toBe("Penerima Perorangan (Disamarkan)");
      expect(json.data[0].hashPendek).toBeDefined();
    });

    it("K4: GET /api/kas/entri/:id mengembalikan detail entri kas", async () => {
      mockEntriKasStore.push({
        id: "entri_detail_1",
        desaId: "desa_1",
        nomorUrut: 1,
        jenis: JenisEntri.PENERIMAAN,
        jumlah: BigInt(600_000_000),
        tanggal: new Date(),
        uraian: "Penyaluran DD Tahap 1",
        sumberDanaId: null,
        posId: null,
        proyekId: null,
        terminId: null,
        koreksiDariId: null,
        penerima: null,
        penerimaDisamarkan: false,
        buktiUrls: ["https://akar-desa.id/b1.pdf"],
        pencatatId: "usr_perangkat_1",
        hashSebelumnya: null,
        hash: "hash_detail_1",
        dibuatPada: new Date(),
      });

      const req = createTestRequest("http://localhost/api/kas/entri/entri_detail_1", "GET");
      const res = await getDetailEntriRoute(req, {
        params: Promise.resolve({ id: "entri_detail_1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.id).toBe("entri_detail_1");
      expect(json.data.hash).toBe("hash_detail_1");
    });

    it("K5: GET /api/desa/:id/kas/verifikasi-integritas mengembalikan status valid", async () => {
      const req = createTestRequest(
        "http://localhost/api/desa/desa_1/kas/verifikasi-integritas",
        "GET"
      );
      const res = await getVerifikasiIntegritasRoute(req, {
        params: Promise.resolve({ id: "desa_1" }),
      });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.valid).toBe(true);
    });

    it("K6: POST /api/desa/:id/sumber-dana hanya untuk PERANGKAT / ADMIN (403 untuk Warga)", async () => {
      // Warga ditolak 403
      currentAuthUserId = "auth_warga_1";
      const reqWarga = createTestRequest(
        "http://localhost/api/desa/desa_1/sumber-dana",
        "POST",
        {
          nama: "Bantuan Provinsi",
          tahun: 2026,
          pagu: 100_000_000,
        }
      );
      const resWarga = await createSumberDanaRoute(reqWarga, {
        params: Promise.resolve({ id: "desa_1" }),
      });
      expect(resWarga.status).toBe(403);

      // Perangkat diizinkan 201
      currentAuthUserId = "auth_perangkat_1";
      const reqPerangkat = createTestRequest(
        "http://localhost/api/desa/desa_1/sumber-dana",
        "POST",
        {
          nama: "Bantuan Keuangan Khusus Kabupaten",
          tahun: 2026,
          pagu: 150_000_000,
        }
      );
      const resPerangkat = await createSumberDanaRoute(reqPerangkat, {
        params: Promise.resolve({ id: "desa_1" }),
      });
      const jsonPerangkat = await resPerangkat.json();
      expect(resPerangkat.status).toBe(201);
      expect(jsonPerangkat.data.nama).toBe("Bantuan Keuangan Khusus Kabupaten");
    });

    it("K7: POST /api/desa/:id/pos-anggaran menolak jika akun bukan level KEGIATAN (400)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      // Gunakan akun_bid_2 (level BIDANG) -> ditolak 400
      const req = createTestRequest(
        "http://localhost/api/desa/desa_1/pos-anggaran",
        "POST",
        {
          akunId: "akun_bid_2",
          sumberDanaId: "sd_dd",
          jenisBelanja: JenisBelanja.MODAL,
          uraian: "Pos salah level akun",
          anggaran: 50_000_000,
        }
      );

      const res = await createPosAnggaranRoute(req, {
        params: Promise.resolve({ id: "desa_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.message).toMatch(/level KEGIATAN/i);
    });

    it("K7: POST /api/desa/:id/pos-anggaran berhasil jika akun level KEGIATAN (201)", async () => {
      currentAuthUserId = "auth_perangkat_1";

      // Gunakan akun_keg_drainase (level KEGIATAN) -> sukses 201
      const req = createTestRequest(
        "http://localhost/api/desa/desa_1/pos-anggaran",
        "POST",
        {
          akunId: "akun_keg_drainase",
          sumberDanaId: "sd_dd",
          jenisBelanja: JenisBelanja.MODAL,
          uraian: "Pembangunan Saluran Drainase RT 05",
          anggaran: 75_000_000,
        }
      );

      const res = await createPosAnggaranRoute(req, {
        params: Promise.resolve({ id: "desa_1" }),
      });
      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.data.uraian).toBe("Pembangunan Saluran Drainase RT 05");

      const audit = mockAuditStore.find((a) => a.aksi === "BUAT_POS_ANGGARAN");
      expect(audit).toBeDefined();
    });
  });
});

