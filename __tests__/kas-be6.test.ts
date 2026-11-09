import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Peran,
  StatusAkun,
  JenisEntri,
  LevelAkun,
  JenisBelanja,
  StatusVerifikasi,
  StatusProyek,
} from "@prisma/client";
import { onKomitmenDibuat, onProyekDibatalkan } from "@/lib/hooks";
import { hitungRingkasanKas } from "@/lib/kas-ringkasan";
import { samarkanEntri } from "@/lib/kas-sensitif";

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

interface MockProyek {
  id: string;
  desaId: string;
  posAnggaranId: string | null;
  judul: string;
  latarBelakang: string;
  lokasi: string;
  volume: string;
  pagu: bigint;
  status: StatusProyek;
}

interface MockTermin {
  id: string;
  proyekId: string;
  tahap: number;
  nilai: bigint;
  terbuka: boolean;
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
let mockProyekStore: MockProyek[] = [];
let mockTerminStore: MockTermin[] = [];
let mockEntriKasStore: MockEntriKas[] = [];
let mockVerifikasiEntriStore: MockVerifikasiEntri[] = [];
let mockAuditStore: any[] = [];

let currentAuthUserId: string | null = null;

function makeHeaders(authId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const target = authId !== undefined ? authId : currentAuthUserId;
  if (target) {
    headers["x-test-auth-id"] = target;
    headers["Authorization"] = `Bearer token_${target}`;
  }
  return headers;
}

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
      nama: "Siti Rahma (Warga)",
      email: "siti@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
  ];

  mockSumberDanaStore = [
    {
      id: "sd_dd",
      desaId: "desa_1",
      nama: "Dana Desa (DDS)",
      tahun: 2026,
      pagu: BigInt(1_000_000_000),
    },
  ];

  mockRefAkunStore = [
    {
      id: "akun_keg_balai",
      kode: "2.3.01",
      uraian: "Pembangunan Balai Pertemuan Warga",
      level: LevelAkun.KEGIATAN,
      parentId: null,
      kodeSiskeudes: "2301",
      sensitif: false,
    },
    {
      id: "akun_keg_siltap",
      kode: "1.1.01",
      uraian: "Penghasilan Tetap Kepala Desa dan Perangkat",
      level: LevelAkun.KEGIATAN,
      parentId: null,
      kodeSiskeudes: "1101",
      sensitif: true,
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
      id: "pos_siltap",
      desaId: "desa_1",
      tahun: 2026,
      akunId: "akun_keg_siltap",
      sumberDanaId: "sd_dd",
      jenisBelanja: JenisBelanja.PEGAWAI,
      uraian: "Siltap Perangkat Desa",
      anggaran: BigInt(200_000_000),
      sensitif: true,
    },
  ];

  mockProyekStore = [
    {
      id: "proyek_balai_1",
      desaId: "desa_1",
      posAnggaranId: "pos_balai",
      judul: "Pembangunan Balai Pertemuan Warga RW 02",
      latarBelakang: "Pembangunan tempat musyawarah warga desa",
      lokasi: "Dusun Krajan RW 02",
      volume: "1 unit 8x12m",
      pagu: BigInt(140_000_000),
      status: StatusProyek.PENGERJAAN,
    },
  ];

  mockTerminStore = [
    {
      id: "termin_1",
      proyekId: "proyek_balai_1",
      tahap: 1,
      nilai: BigInt(70_000_000),
      terbuka: false,
    },
    {
      id: "termin_2",
      proyekId: "proyek_balai_1",
      tahap: 2,
      nilai: BigInt(70_000_000),
      terbuka: false,
    },
  ];

  mockEntriKasStore = [];
  mockVerifikasiEntriStore = [];
  mockAuditStore = [];
  currentAuthUserId = null;
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
      },
      pengguna: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.authId) {
            return mockPenggunaStore.find((p) => p.authId === where.authId) || null;
          }
          if (where.id) {
            return mockPenggunaStore.find((p) => p.id === where.id) || null;
          }
          return null;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          if (where?.peran?.in) {
            return (
              mockPenggunaStore.find((p) => where.peran.in.includes(p.peran)) ||
              null
            );
          }
          return mockPenggunaStore[0] || null;
        }),
      },
      sumberDana: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockSumberDanaStore.filter((s) => s.desaId === where?.desaId);
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          return mockSumberDanaStore.find((s) => s.id === where.id) || null;
        }),
      },
      refAkun: {
        findMany: vi.fn(async () => mockRefAkunStore),
      },
      posAnggaran: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockPosAnggaranStore
            .filter((p) => p.desaId === where?.desaId)
            .map((p) => {
              const akun = mockRefAkunStore.find((a) => a.id === p.akunId);
              return { ...p, akun };
            });
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          return mockPosAnggaranStore.find((p) => p.id === where.id) || null;
        }),
      },
      proyek: {
        findUnique: vi.fn(async ({ where }: any) => {
          const proyek = mockProyekStore.find((p) => p.id === where.id);
          if (!proyek) return null;
          const pos = mockPosAnggaranStore.find((p) => p.id === proyek.posAnggaranId);
          return { ...proyek, posAnggaran: pos, keputusan: null };
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return mockProyekStore.find((p) => p.id === where.id) || null;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockProyekStore.findIndex((p) => p.id === where.id);
          if (idx === -1) throw new Error("Proyek tidak ditemukan");
          mockProyekStore[idx] = { ...mockProyekStore[idx], ...data };
          return mockProyekStore[idx];
        }),
      },
      termin: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockTerminStore.find((t) => t.id === where.id) || null;
        }),
        findFirst: vi.fn(async ({ where }: any) => {
          return (
            mockTerminStore.find(
              (t) =>
                t.proyekId === where.proyekId &&
                (where.tahap === undefined || t.tahap === where.tahap)
            ) || null
          );
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockTerminStore.findIndex((t) => t.id === where.id);
          if (idx === -1) throw new Error("Termin tidak ditemukan");
          mockTerminStore[idx] = { ...mockTerminStore[idx], ...data };
          return mockTerminStore[idx];
        }),
      },
      entriKas: {
        count: vi.fn(async ({ where }: any) => {
          return mockEntriKasStore.filter(
            (e) => !where?.desaId || e.desaId === where.desaId
          ).length;
        }),
        findFirst: vi.fn(async ({ where, orderBy }: any) => {
          let list = [...mockEntriKasStore];
          if (where?.desaId) list = list.filter((e) => e.desaId === where.desaId);
          if (where?.proyekId)
            list = list.filter((e) => e.proyekId === where.proyekId);
          if (where?.jenis) list = list.filter((e) => e.jenis === where.jenis);
          if (where?.koreksi?.none) {
            list = list.filter(
              (e) => !mockEntriKasStore.some((k) => k.koreksiDariId === e.id)
            );
          }
          if (where?.koreksiDariId) {
            list = list.filter((e) => e.koreksiDariId === where.koreksiDariId);
          }
          if (orderBy?.nomorUrut === "desc") {
            list.sort((a, b) => b.nomorUrut - a.nomorUrut);
          }
          return list[0] || null;
        }),
        findUnique: vi.fn(async ({ where }: any) => {
          const entri = mockEntriKasStore.find((e) => e.id === where.id);
          if (!entri) return null;
          const pos = mockPosAnggaranStore.find((p) => p.id === entri.posId);
          const termin = mockTerminStore.find((t) => t.id === entri.terminId);
          const koreksi = mockEntriKasStore.filter(
            (k) => k.koreksiDariId === entri.id
          );
          const verifikasi = mockVerifikasiEntriStore.filter(
            (v) => v.entriId === entri.id
          );
          return { ...entri, pos, termin, koreksi, verifikasi };
        }),
        findMany: vi.fn(async ({ where, orderBy }: any) => {
          let list = [...mockEntriKasStore];
          if (where?.desaId) list = list.filter((e) => e.desaId === where.desaId);
          if (where?.proyekId)
            list = list.filter((e) => e.proyekId === where.proyekId);
          if (where?.jenis) list = list.filter((e) => e.jenis === where.jenis);
          if (where?.koreksi?.none) {
            list = list.filter(
              (e) => !mockEntriKasStore.some((k) => k.koreksiDariId === e.id)
            );
          }
          if (orderBy?.nomorUrut === "desc") {
            list.sort((a, b) => b.nomorUrut - a.nomorUrut);
          }
          return list.map((e) => {
            const verifikasi = mockVerifikasiEntriStore.filter(
              (v) => v.entriId === e.id
            );
            const pos = mockPosAnggaranStore.find((p) => p.id === e.posId);
            const koreksi = mockEntriKasStore.filter(
              (k) => k.koreksiDariId === e.id
            );
            return { ...e, verifikasi, pos, koreksi };
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const newEntry: MockEntriKas = {
            id: `entri_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
      },
      verifikasiEntri: {
        create: vi.fn(async ({ data }: any) => {
          const newV: MockVerifikasiEntri = {
            id: `verif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            entriId: data.entriId,
            pengawasId: data.pengawasId,
            keputusan: data.keputusan,
            catatan: data.catatan ?? null,
            waktu: new Date(),
          };
          mockVerifikasiEntriStore.push(newV);
          return newV;
        }),
      },
      auditLog: {
        create: vi.fn(async ({ data }: any) => {
          const log = { id: `audit_${mockAuditStore.length + 1}`, ...data };
          mockAuditStore.push(log);
          return log;
        }),
      },
    },
  };
});

describe("Paket BE-6: Buku Kas Lanjutan (K8, K9, K10, K11 & T17-T23)", () => {
  beforeEach(() => {
    resetDb();
  });

  // ================= T17 =================
  it("T17: Pemenang dipilih -> KOMITMEN otomatis dibuat via hook, sisa tersedia pos turun", async () => {
    // Awal: Pos balai warga dianggarkan 140 jt, terikat 0, tersedia 140 jt
    const posListAwal = mockPosAnggaranStore.map((p) => {
      const akun = mockRefAkunStore.find((a) => a.id === p.akunId);
      return { ...p, akun };
    });
    const summaryAwal = hitungRingkasanKas({
      sumberDanaList: mockSumberDanaStore as any,
      posList: posListAwal as any,
      entriList: mockEntriKasStore as any,
    });
    expect(summaryAwal.perPos["pos_balai"].tersedia).toBe(140_000_000);
    expect(summaryAwal.perPos["pos_balai"].terikat).toBe(0);

    // Eksekusi hook saat pemenang ditetapkan sebesar 135 jt
    await onKomitmenDibuat(
      "proyek_balai_1",
      "proposal_123",
      135_000_000,
      "usr_perangkat_1"
    );

    // Pastikan entri KOMITMEN tercipta
    expect(mockEntriKasStore).toHaveLength(1);
    const komitmen = mockEntriKasStore[0];
    expect(komitmen.jenis).toBe(JenisEntri.KOMITMEN);
    expect(Number(komitmen.jumlah)).toBe(135_000_000);
    expect(komitmen.proyekId).toBe("proyek_balai_1");
    expect(komitmen.posId).toBe("pos_balai");

    // Sisa tersedia pos turun menjadi 140 jt - 135 jt = 5 jt
    const posListSesudah = mockPosAnggaranStore.map((p) => {
      const akun = mockRefAkunStore.find((a) => a.id === p.akunId);
      return { ...p, akun };
    });
    const summarySesudah = hitungRingkasanKas({
      sumberDanaList: mockSumberDanaStore as any,
      posList: posListSesudah as any,
      entriList: mockEntriKasStore as any,
    });
    expect(summarySesudah.perPos["pos_balai"].terikat).toBe(135_000_000);
    expect(summarySesudah.perPos["pos_balai"].tersedia).toBe(5_000_000);
  });

  // ================= T18 =================
  it("T18: PEMBAYARAN tanpa bukti -> Ditolak (400)", async () => {
    currentAuthUserId = "auth_perangkat_1";

    const { POST: handlePostKas } = await import(
      "@/app/api/desa/[id]/kas/entri/route"
    );

    // Request dengan buktiUrls kosong
    const req = new Request("http://localhost:3000/api/desa/desa_1/kas/entri", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        jenis: "PEMBAYARAN",
        jumlah: 10_000_000,
        tanggal: new Date().toISOString(),
        uraian: "Pembayaran material semen dan pasir",
        buktiUrls: [], // KOSONG -> harus ditolak
      }),
    });

    const res = await handlePostKas(req, {
      params: Promise.resolve({ id: "desa_1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  // ================= T19 =================
  it("T19: Pembayaran melebihi nilai kontrak -> Ditolak (409)", async () => {
    currentAuthUserId = "auth_perangkat_1";

    // Buat KOMITMEN proyek sebesar 135 jt
    await onKomitmenDibuat(
      "proyek_balai_1",
      "proposal_123",
      135_000_000,
      "usr_perangkat_1"
    );

    const { POST: handlePostKas } = await import(
      "@/app/api/desa/[id]/kas/entri/route"
    );

    // Coba bayar 140 jt (melebihi komitmen 135 jt)
    const req = new Request("http://localhost:3000/api/desa/desa_1/kas/entri", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        jenis: "PEMBAYARAN",
        jumlah: 140_000_000,
        tanggal: new Date().toISOString(),
        uraian: "Pembayaran total proyek sekaligus",
        proyekId: "proyek_balai_1",
        buktiUrls: ["https://example.com/kwitansi.pdf"],
      }),
    });

    const res = await handlePostKas(req, {
      params: Promise.resolve({ id: "desa_1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.code).toBe("CONFLICT");
    expect(json.error.message).toContain("melebihi nilai kontrak/komitmen");
  });

  // ================= T20 =================
  it("T20: Pembayaran untuk termin belum terbuka -> Ditolak (409)", async () => {
    currentAuthUserId = "auth_perangkat_1";

    // Pastikan termin_1 berstatus terbuka = false
    expect(mockTerminStore[0].terbuka).toBe(false);

    const { POST: handlePostKas } = await import(
      "@/app/api/desa/[id]/kas/entri/route"
    );

    // Request pembayaran termin yang belum terbuka
    const req = new Request("http://localhost:3000/api/desa/desa_1/kas/entri", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        jenis: "PEMBAYARAN",
        jumlah: 70_000_000,
        tanggal: new Date().toISOString(),
        uraian: "Pencairan dana Termin 1",
        proyekId: "proyek_balai_1",
        terminId: "termin_1",
        buktiUrls: ["https://example.com/termin1.pdf"],
      }),
    });

    const res = await handlePostKas(req, {
      params: Promise.resolve({ id: "desa_1" }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.code).toBe("CONFLICT");
    expect(json.error.message).toContain("belum berstatus terbuka");

    // Sekarang buka termin lewat K11 (Pengawas)
    currentAuthUserId = "auth_pengawas_1";
    const { PATCH: handleBukaTermin } = await import(
      "@/app/api/proyek/[id]/termin/[tahap]/buka/route"
    );
    const reqBuka = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/termin/1/buka",
      {
        method: "PATCH",
        headers: makeHeaders(),
        body: JSON.stringify({ progresFisik: 0 }),
      }
    );
    const resBuka = await handleBukaTermin(reqBuka, {
      params: Promise.resolve({ id: "proyek_balai_1", tahap: "1" }),
    });
    expect(resBuka.status).toBe(200);
    expect(mockTerminStore[0].terbuka).toBe(true);

    // Coba bayar lagi setelah termin dibuka oleh Pengawas -> Berhasil (201)
    currentAuthUserId = "auth_perangkat_1";
    const reqValid = new Request(
      "http://localhost:3000/api/desa/desa_1/kas/entri",
      {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify({
          jenis: "PEMBAYARAN",
          jumlah: 70_000_000,
          tanggal: new Date().toISOString(),
          uraian: "Pencairan dana Termin 1",
          proyekId: "proyek_balai_1",
          terminId: "termin_1",
          buktiUrls: ["https://example.com/termin1.pdf"],
        }),
      }
    );
    const resValid = await handlePostKas(reqValid, {
      params: Promise.resolve({ id: "desa_1" }),
    });
    expect(resValid.status).toBe(201);
  });

  // ================= T21 =================
  it("T21: Pencatat mencoba memverifikasi entrinya sendiri -> Ditolak (409)", async () => {
    // 1. Entri dicatat oleh usr_pengawas_1 (misal pengawas mencatat entri atau pengguna dobel wewenang)
    currentAuthUserId = "auth_pengawas_1";

    mockEntriKasStore.push({
      id: "entri_pengawas",
      desaId: "desa_1",
      nomorUrut: 1,
      jenis: JenisEntri.PEMBAYARAN,
      jumlah: BigInt(5_000_000),
      tanggal: new Date(),
      uraian: "Pembayaran konsumsi musyawarah",
      sumberDanaId: null,
      posId: null,
      proyekId: null,
      terminId: null,
      koreksiDariId: null,
      penerima: "Warung Bu Siti",
      penerimaDisamarkan: true,
      buktiUrls: ["https://example.com/nota.jpg"],
      pencatatId: "usr_pengawas_1", // dicatat oleh usr_pengawas_1
      hashSebelumnya: null,
      hash: "hash_entri_1",
      dibuatPada: new Date(),
    });

    const { POST: handleVerifikasi } = await import(
      "@/app/api/kas/entri/[id]/verifikasi/route"
    );

    // Pengawas mencoba memverifikasi entrinya sendiri
    const req = new Request(
      "http://localhost:3000/api/kas/entri/entri_pengawas/verifikasi",
      {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify({
          keputusan: "DISETUJUI",
          catatan: "Diverifikasi",
        }),
      }
    );

    const res = await handleVerifikasi(req, {
      params: Promise.resolve({ id: "entri_pengawas" }),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.code).toBe("CONFLICT");
    expect(json.error.message).toContain(
      "Pencatat tidak boleh memverifikasi entrinya sendiri"
    );
  });

  // ================= T22 =================
  it("T22: Koreksi atas KOMITMEN -> Terikat dipulihkan kembali; entri KOREKSI mencatat alasan", async () => {
    // 1. Komitmen dibuat sebesar 135 jt
    await onKomitmenDibuat(
      "proyek_balai_1",
      "proposal_123",
      135_000_000,
      "usr_perangkat_1"
    );

    let posList = mockPosAnggaranStore.map((p) => {
      const akun = mockRefAkunStore.find((a) => a.id === p.akunId);
      return { ...p, akun };
    });
    let summary = hitungRingkasanKas({
      sumberDanaList: mockSumberDanaStore as any,
      posList: posList as any,
      entriList: mockEntriKasStore as any,
    });
    expect(summary.perPos["pos_balai"].terikat).toBe(135_000_000);
    expect(summary.perPos["pos_balai"].tersedia).toBe(5_000_000);

    // 2. Proyek dibatalkan -> onProyekDibatalkan dipanggil
    await onProyekDibatalkan(
      "proyek_balai_1",
      "Sayembara dibatalkan karena tidak ada sanggahan terselesaikan",
      "usr_perangkat_1"
    );

    // Harus tercipta entri KOREKSI yang merujuk ke entri KOMITMEN
    const koreksi = mockEntriKasStore.find((e) => e.jenis === JenisEntri.KOREKSI);
    expect(koreksi).toBeDefined();
    expect(koreksi?.uraian).toContain("KOREKSI: Pembatalan proyek");
    expect(koreksi?.koreksiDariId).toBe(mockEntriKasStore[0].id);

    // 3. Ringkasan kas: Anggaran terikat kembali ke 0, tersedia pulih 140 jt
    summary = hitungRingkasanKas({
      sumberDanaList: mockSumberDanaStore as any,
      posList: posList as any,
      entriList: mockEntriKasStore as any,
    });
    expect(summary.perPos["pos_balai"].terikat).toBe(0);
    expect(summary.perPos["pos_balai"].tersedia).toBe(140_000_000);
  });

  // ================= T23 =================
  it("T23: Respons publik untuk entri dengan penerimaDisamarkan -> Nama perorangan disamarkan", () => {
    const rawEntri = {
      id: "entri_1",
      desaId: "desa_1",
      nomorUrut: 1,
      jenis: "PEMBAYARAN",
      jumlah: 3_000_000,
      tanggal: new Date().toISOString(),
      uraian: "Honor tukang bangunan",
      penerima: "Bapak Joko Widodo",
      penerimaDisamarkan: true,
      buktiUrls: [],
      pencatatId: "usr_perangkat_1",
      hash: "abc",
      dibuatPada: new Date().toISOString(),
      pos: null,
    };

    // Akses oleh publik/warga: disamarkan
    const maskedWarga = samarkanEntri(rawEntri, Peran.WARGA);
    expect(maskedWarga.penerima).toBe("Penerima Perorangan (Disamarkan)");

    // Akses tanpa login (null/undefined): disamarkan
    const maskedPublik = samarkanEntri(rawEntri, null);
    expect(maskedPublik.penerima).toBe("Penerima Perorangan (Disamarkan)");

    // Akses oleh internal (PERANGKAT/PENGAWAS/ADMIN): tampil asli
    const perangkatView = samarkanEntri(rawEntri, Peran.PERANGKAT);
    expect(perangkatView.penerima).toBe("Bapak Joko Widodo");

    const pengawasView = samarkanEntri(rawEntri, Peran.PENGAWAS);
    expect(pengawasView.penerima).toBe("Bapak Joko Widodo");

    // Uji penyamaran pos belanja berkategori sensitif (PRD 45.2)
    const rawSensitif = {
      ...rawEntri,
      pos: { sensitif: true, uraian: "Siltap Kepala Desa" },
    };
    const wargaSensitif = samarkanEntri(rawSensitif, Peran.WARGA);
    expect(wargaSensitif.uraian).toBe("Belanja Pos Sensitif (Disamarkan)");

    const perangkatSensitif = samarkanEntri(rawSensitif, Peran.PERANGKAT);
    expect(perangkatSensitif.uraian).toBe("Honor tukang bangunan");
  });

  // ================= K8 (PENERIMAAN) =================
  it("K8: POST /api/desa/:id/kas/entri mencatat PENERIMAAN kas", async () => {
    currentAuthUserId = "auth_perangkat_1";

    const { POST: handlePostKas } = await import(
      "@/app/api/desa/[id]/kas/entri/route"
    );

    const req = new Request("http://localhost:3000/api/desa/desa_1/kas/entri", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        jenis: "PENERIMAAN",
        jumlah: 500_000_000,
        tanggal: new Date().toISOString(),
        uraian: "Pencairan Dana Desa Tahap 1",
        sumberDanaId: "sd_dd",
        buktiUrls: ["https://example.com/sp2d_dd1.pdf"],
      }),
    });

    const res = await handlePostKas(req, {
      params: Promise.resolve({ id: "desa_1" }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.jenis).toBe("PENERIMAAN");
    expect(json.data.jumlah).toBe(500_000_000);
    expect(json.meta).toHaveProperty("peringatan");
    expect(Array.isArray(json.meta.peringatan)).toBe(true);
  });

  // ================= K10 (VERIFIKASI PENGAWAS) =================
  it("K10: POST /api/kas/entri/:id/verifikasi mencatat persetujuan dan menolak verifikasi ulang (409)", async () => {
    // Entri dicatat oleh perangkat
    mockEntriKasStore.push({
      id: "entri_verif_target",
      desaId: "desa_1",
      nomorUrut: 1,
      jenis: JenisEntri.PEMBAYARAN,
      jumlah: BigInt(5_000_000),
      tanggal: new Date(),
      uraian: "Pembayaran bahan material",
      sumberDanaId: null,
      posId: null,
      proyekId: null,
      terminId: null,
      koreksiDariId: null,
      penerima: "Toko Bangunan",
      penerimaDisamarkan: false,
      buktiUrls: ["https://example.com/nota.pdf"],
      pencatatId: "usr_perangkat_1",
      hashSebelumnya: null,
      hash: "hash_verif_1",
      dibuatPada: new Date(),
    });

    currentAuthUserId = "auth_pengawas_1";
    const { POST: handleVerifikasi } = await import(
      "@/app/api/kas/entri/[id]/verifikasi/route"
    );

    // Pengawas memverifikasi DISETUJUI -> 201
    const req = new Request(
      "http://localhost:3000/api/kas/entri/entri_verif_target/verifikasi",
      {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify({
          keputusan: "DISETUJUI",
          catatan: "Kwitansi dan bukti fisik sesuai",
        }),
      }
    );

    const res = await handleVerifikasi(req, {
      params: Promise.resolve({ id: "entri_verif_target" }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.keputusan).toBe("DISETUJUI");

    // Coba verifikasi ulang setelah disetujui -> Ditolak (409)
    const reqUlang = new Request(
      "http://localhost:3000/api/kas/entri/entri_verif_target/verifikasi",
      {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify({
          keputusan: "DISETUJUI",
          catatan: "Verifikasi kedua kali",
        }),
      }
    );
    const resUlang = await handleVerifikasi(reqUlang, {
      params: Promise.resolve({ id: "entri_verif_target" }),
    });
    expect(resUlang.status).toBe(409);
    const jsonUlang = await resUlang.json();
    expect(jsonUlang.error.code).toBe("CONFLICT");
  });

  // ================= K11 (AMBANG PROGRES TERMIN) =================
  it("K11: PATCH /api/proyek/:id/termin/:tahap/buka menolak jika progres belum mencapai ambang (409)", async () => {
    currentAuthUserId = "auth_pengawas_1";

    const { PATCH: handleBukaTermin } = await import(
      "@/app/api/proyek/[id]/termin/[tahap]/buka/route"
    );

    // Termin tahap 2 membutuhkan progres minimal 30%. Coba kirim progresFisik: 20 -> Ditolak 409
    const req = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/termin/2/buka",
      {
        method: "PATCH",
        headers: makeHeaders(),
        body: JSON.stringify({ progresFisik: 20 }),
      }
    );

    const res = await handleBukaTermin(req, {
      params: Promise.resolve({ id: "proyek_balai_1", tahap: "2" }),
    });
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe("CONFLICT");
    expect(json.error.message).toContain("belum mencapai ambang minimal");

    // Kirim dengan progresFisik: 35% -> Berhasil (200)
    const reqLolos = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/termin/2/buka",
      {
        method: "PATCH",
        headers: makeHeaders(),
        body: JSON.stringify({ progresFisik: 35 }),
      }
    );

    const resLolos = await handleBukaTermin(reqLolos, {
      params: Promise.resolve({ id: "proyek_balai_1", tahap: "2" }),
    });
    expect(resLolos.status).toBe(200);
    const jsonLolos = await resLolos.json();
    expect(jsonLolos.data.terbuka).toBe(true);
  });

  // ================= K9 (KOREKSI MANUAL) =================
  it("K9: POST /api/kas/entri/:id/koreksi membuat entri KOREKSI dan menolak koreksi ulang (409)", async () => {
    currentAuthUserId = "auth_perangkat_1";

    // Buat entri target
    mockEntriKasStore.push({
      id: "entri_salah",
      desaId: "desa_1",
      nomorUrut: 1,
      jenis: JenisEntri.PEMBAYARAN,
      jumlah: BigInt(2_000_000),
      tanggal: new Date(),
      uraian: "Salah catat pos",
      sumberDanaId: null,
      posId: null,
      proyekId: null,
      terminId: null,
      koreksiDariId: null,
      penerima: "Toko ABC",
      penerimaDisamarkan: false,
      buktiUrls: ["https://example.com/nota.pdf"],
      pencatatId: "usr_perangkat_1",
      hashSebelumnya: null,
      hash: "hash_salah",
      dibuatPada: new Date(),
    });

    const { POST: handleKoreksi } = await import(
      "@/app/api/kas/entri/[id]/koreksi/route"
    );

    const req = new Request(
      "http://localhost:3000/api/kas/entri/entri_salah/koreksi",
      {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify({
          alasan: "Koreksi salah input pos anggaran oleh bendahara",
        }),
      }
    );

    const res = await handleKoreksi(req, {
      params: Promise.resolve({ id: "entri_salah" }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.jenis).toBe("KOREKSI");
    expect(json.data.uraian).toContain("KOREKSI: Koreksi salah input pos");

    // Coba koreksi ulang entri yang sama -> Ditolak (409)
    const reqUlang = new Request(
      "http://localhost:3000/api/kas/entri/entri_salah/koreksi",
      {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify({
          alasan: "Koreksi kedua kalinya terhadap entri yang sama",
        }),
      }
    );
    const resUlang = await handleKoreksi(reqUlang, {
      params: Promise.resolve({ id: "entri_salah" }),
    });
    expect(resUlang.status).toBe(409);
  });
});
