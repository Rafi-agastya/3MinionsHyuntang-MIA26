import { describe, it, expect, beforeEach, vi } from "vitest";
import { Peran, StatusAkun, StatusProyek, StatusAnalisis, KelasProyek } from "@prisma/client";
import { hashNik } from "@/lib/nik";
import { isPdfBuffer } from "@/lib/storage";
import { evaluasiKelengkapanProposal } from "@/lib/proposal";

// ================= IN-MEMORY MOCK STORE =================

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

interface MockKelompok {
  id: string;
  nama: string;
  ketuaId: string;
  createdAt: Date;
  anggota?: MockAnggotaKelompok[];
}

interface MockAnggotaKelompok {
  id: string;
  kelompokId: string;
  penggunaId: string | null;
  nama: string;
  rtRw: string;
  nikHash: string | null;
  ketua: boolean;
}

interface MockProyek {
  id: string;
  desaId: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  pagu: bigint;
  kelas: KelasProyek;
  status: StatusProyek;
  tenggatProposal: Date | null;
  durasiMin: number;
  durasiMax: number;
  syaratLokalMin: number;
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
  dikirimPada: Date;
  statusAnalisis: StatusAnalisis;
}

let mockPenggunaStore: MockPengguna[] = [];
let mockKelompokStore: MockKelompok[] = [];
let mockAnggotaStore: MockAnggotaKelompok[] = [];
let mockProyekStore: MockProyek[] = [];
let mockProposalStore: MockProposal[] = [];
let mockAuditStore: any[] = [];

function resetDb() {
  mockPenggunaStore = [
    {
      id: "usr_ketua_a",
      authId: "auth_ketua_a",
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
    {
      id: "usr_ketua_b",
      authId: "auth_ketua_b",
      nama: "Bambang Wijaya",
      email: "bambang@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "seed_desa_001",
      rtRw: "01/02",
      kontak: "081234567892",
      setujuSyaratPada: new Date(),
      createdAt: new Date(),
    },
    {
      id: "usr_warga_menunggu",
      authId: "auth_warga_menunggu",
      nama: "Warga Belum Verif",
      email: "menunggu@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.MENUNGGU,
      desaId: "seed_desa_001",
      rtRw: "03/01",
      kontak: null,
      setujuSyaratPada: new Date(),
      createdAt: new Date(),
    },
    {
      id: "usr_kades",
      authId: "auth_kades",
      nama: "Pak Kades Hendy",
      email: "kades@karangsari.desa.id",
      peran: Peran.PERANGKAT,
      statusAkun: StatusAkun.AKTIF,
      desaId: "seed_desa_001",
      rtRw: "01/01",
      kontak: "081234567890",
      setujuSyaratPada: new Date(),
      createdAt: new Date(),
    },
  ];

  mockKelompokStore = [
    {
      id: "kel_001",
      nama: "Kelompok Tani Muda",
      ketuaId: "usr_ketua_a",
      createdAt: new Date(),
    },
    {
      id: "kel_002",
      nama: "CV Karya Mandiri",
      ketuaId: "usr_ketua_b",
      createdAt: new Date(),
    },
  ];

  mockAnggotaStore = [
    {
      id: "ang_001",
      kelompokId: "kel_001",
      penggunaId: "usr_ketua_a",
      nama: "Rudi Hartono",
      rtRw: "02/03",
      nikHash: hashNik("3204051122334455"),
      ketua: true,
    },
    {
      id: "ang_002",
      kelompokId: "kel_001",
      penggunaId: null,
      nama: "Agus Santoso",
      rtRw: "02/03",
      nikHash: hashNik("3204051122334456"),
      ketua: false,
    },
    {
      id: "ang_003",
      kelompokId: "kel_002",
      penggunaId: "usr_ketua_b",
      nama: "Bambang Wijaya",
      rtRw: "01/02",
      nikHash: hashNik("3204051122334457"),
      ketua: true,
    },
    {
      id: "ang_004",
      kelompokId: "kel_002",
      penggunaId: null,
      nama: "Joko Prabowo",
      rtRw: "01/02",
      nikHash: hashNik("3204051122334458"),
      ketua: false,
    },
  ];

  mockProyekStore = [
    {
      id: "proyek_tender_aktif",
      desaId: "seed_desa_001",
      judul: "Pembangunan Drainase RT 03",
      deskripsi: "Proyek saluran drainase untuk mencegah banjir",
      lokasi: "RT 03 RW 02",
      pagu: BigInt(100_000_000), // Rp100 Juta
      kelas: KelasProyek.KECIL,
      status: StatusProyek.TENDER_DIBUKA,
      tenggatProposal: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari ke depan
      durasiMin: 30,
      durasiMax: 60,
      syaratLokalMin: 70,
    },
    {
      id: "proyek_tenggat_lewat",
      desaId: "seed_desa_001",
      judul: "Renovasi Pos Kamling",
      deskripsi: "Renovasi pos ronda RT 01",
      lokasi: "RT 01 RW 01",
      pagu: BigInt(25_000_000),
      kelas: KelasProyek.KECIL,
      status: StatusProyek.TENDER_DIBUKA,
      tenggatProposal: new Date(Date.now() - 24 * 60 * 60 * 1000), // Kemarin (lewat)
      durasiMin: 15,
      durasiMax: 30,
      syaratLokalMin: 70,
    },
    {
      id: "proyek_masa_sanggah",
      desaId: "seed_desa_001",
      judul: "Pembangunan Balai Pertemuan",
      deskripsi: "Pembangunan gedung balai pertemuan",
      lokasi: "Dusun 2",
      pagu: BigInt(150_000_000),
      kelas: KelasProyek.MENENGAH,
      status: StatusProyek.MASA_SANGGAH,
      tenggatProposal: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      durasiMin: 45,
      durasiMax: 90,
      syaratLokalMin: 70,
    },
  ];

  mockProposalStore = [];
  mockAuditStore = [];
}

resetDb();

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      pengguna: {
        findUnique: vi.fn(async ({ where }: { where: { id?: string; authId?: string; email?: string } }) => {
          if (where.id) return mockPenggunaStore.find((u) => u.id === where.id) || null;
          if (where.authId) return mockPenggunaStore.find((u) => u.authId === where.authId) || null;
          if (where.email) return mockPenggunaStore.find((u) => u.email === where.email) || null;
          return null;
        }),
      },
      proyek: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return mockProyekStore.find((p) => p.id === where.id) || null;
        }),
        findFirst: vi.fn(async () => mockProyekStore[0] || null),
      },
      kelompok: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          const k = mockKelompokStore.find((item) => item.id === where.id);
          if (!k) return null;
          const anggota = mockAnggotaStore.filter((a) => a.kelompokId === k.id);
          return { ...k, anggota };
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const id = `kel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const createdKelompok: MockKelompok = {
            id,
            nama: data.nama,
            ketuaId: data.ketuaId,
            createdAt: new Date(),
          };
          mockKelompokStore.push(createdKelompok);

          if (data.anggota?.create) {
            for (const ang of data.anggota.create) {
              const createdAnggota: MockAnggotaKelompok = {
                id: `ang_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                kelompokId: id,
                penggunaId: ang.penggunaId ?? null,
                nama: ang.nama,
                rtRw: ang.rtRw,
                nikHash: ang.nikHash ?? null,
                ketua: ang.ketua ?? false,
              };
              mockAnggotaStore.push(createdAnggota);
            }
          }
          return {
            ...createdKelompok,
            anggota: mockAnggotaStore.filter((a) => a.kelompokId === id),
          };
        }),
      },
      proposal: {
        findUnique: vi.fn(async ({ where }: { where: any }) => {
          if (where.proyekId_kelompokId) {
            return (
              mockProposalStore.find(
                (p) =>
                  p.proyekId === where.proyekId_kelompokId.proyekId &&
                  p.kelompokId === where.proyekId_kelompokId.kelompokId
              ) || null
            );
          }
          if (where.id) {
            return mockProposalStore.find((p) => p.id === where.id) || null;
          }
          return null;
        }),
        findMany: vi.fn(async ({ where }: { where: { proyekId: string } }) => {
          const matched = mockProposalStore.filter((p) => p.proyekId === where.proyekId);
          return matched.map((p) => {
            const kelompok = mockKelompokStore.find((k) => k.id === p.kelompokId);
            const anggota = mockAnggotaStore.filter((a) => a.kelompokId === p.kelompokId);
            const ketua = mockPenggunaStore.find((u) => u.id === kelompok?.ketuaId);

            return {
              ...p,
              kelompok: {
                ...kelompok,
                ketua,
                anggota,
              },
              ringkasan: null,
              skor: null,
              flagA: [],
              flagB: [],
            };
          });
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const id = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const record: MockProposal = {
            id,
            proyekId: data.proyekId,
            kelompokId: data.kelompokId,
            penawaran: BigInt(data.penawaran),
            durasiHari: data.durasiHari,
            tenagaTotal: data.tenagaTotal,
            tenagaLokal: data.tenagaLokal,
            narasiMetode: data.narasiMetode,
            narasiJadwal: data.narasiJadwal,
            narasiRisiko: data.narasiRisiko,
            dokumen: data.dokumen || [],
            kelengkapan: data.kelengkapan,
            dikirimPada: new Date(),
            statusAnalisis: data.statusAnalisis || StatusAnalisis.MENUNGGU,
          };
          mockProposalStore.push(record);
          return record;
        }),
      },
      auditLog: {
        create: vi.fn(async ({ data }: { data: any }) => {
          const record = { id: `audit_${Date.now()}`, ...data, waktu: new Date() };
          mockAuditStore.push(record);
          return record;
        }),
      },
    },
    serializeBigInt: (data: unknown) => {
      return JSON.parse(
        JSON.stringify(data, (_, value) =>
          typeof value === "bigint" ? Number(value) : value
        )
      );
    },
  };
});

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

// ================= TEST SUITE =================

describe("Paket BE-2: Validasi Helper NIK, Magic Byte PDF, & Evaluasi Kelengkapan", () => {
  it("hashNik menghasilkan hash SHA-256 yang deterministik dan konsisten", () => {
    const nikSample = "3204051234560001";
    const h1 = hashNik(nikSample);
    const h2 = hashNik(nikSample);

    expect(h1).toHaveLength(64);
    expect(h1).toBe(h2);
    // Pastikan tidak sama dengan NIK mentah
    expect(h1).not.toBe(nikSample);
  });

  it("isPdfBuffer mendeteksi magic byte %PDF- dan menolak berkas non-PDF", () => {
    // PDF valid (diawali %PDF-)
    const validPdfBuffer = Buffer.from("%PDF-1.4 header dummy content");
    expect(isPdfBuffer(validPdfBuffer)).toBe(true);

    // File non-PDF (misal gambar JPEG atau teks biasa)
    const textBuffer = Buffer.from("Ini berkas teks biasa bukan PDF");
    expect(isPdfBuffer(textBuffer)).toBe(false);

    const emptyBuffer = Buffer.from([]);
    expect(isPdfBuffer(emptyBuffer)).toBe(false);
  });

  it("evaluasiKelengkapanProposal menghitung 5 kriteria secara server-side", () => {
    // 1. Lengkap semua 5 kriteria
    const hasilLengkap = evaluasiKelengkapanProposal({
      narasiMetode: "A".repeat(105), // >= 100
      narasiJadwal: "B".repeat(55),  // >= 50
      narasiRisiko: "C".repeat(35),  // >= 30
      jumlahAnggotaLengkap: 3,       // >= 2
      adaDokumenPengalaman: true,    // ada berkas
    });

    expect(hasilLengkap.skor).toBe(5);
    expect(hasilLengkap.rincian.metode).toBe(true);
    expect(hasilLengkap.rincian.jadwal).toBe(true);
    expect(hasilLengkap.rincian.risiko).toBe(true);
    expect(hasilLengkap.rincian.anggota).toBe(true);
    expect(hasilLengkap.rincian.pengalaman).toBe(true);

    // 2. Parsial (hanya metode dan anggota yang memenuhi)
    const hasilParsial = evaluasiKelengkapanProposal({
      narasiMetode: "Metode kerja rapi ".repeat(10), // >= 100
      narasiJadwal: "Singkat", // < 50
      narasiRisiko: "Risiko kecil", // < 30
      jumlahAnggotaLengkap: 2,
      adaDokumenPengalaman: false,
    });

    expect(hasilParsial.skor).toBe(2);
    expect(hasilParsial.rincian.metode).toBe(true);
    expect(hasilParsial.rincian.jadwal).toBe(false);
    expect(hasilParsial.rincian.risiko).toBe(false);
    expect(hasilParsial.rincian.anggota).toBe(true);
    expect(hasilParsial.rincian.pengalaman).toBe(false);
  });
});

describe("Paket BE-2: POST /api/kelompok (Pendaftaran Kelompok & Privasi NIK FR-ID1)", () => {
  beforeEach(() => {
    resetDb();
  });

  it("berhasil membuat kelompok (201) dan NIK mentah/hash TIDAK pernah dikembalikan di respons", async () => {
    const { POST: kelompokHandler } = await import("@/app/api/kelompok/route");

    const req = createMockRequest({
      method: "POST",
      url: "http://localhost:3000/api/kelompok",
      headers: {
        "x-test-auth-id": "auth_ketua_a", // Warga aktif
      },
      body: {
        nama: "Kelompok Gotong Royong RW 3",
        anggota: [
          {
            nama: "Rudi Hartono",
            rtRw: "02/03",
            nik: "3204051122334400",
          },
          {
            nama: "Ahmad Dahlan",
            rtRw: "02/03",
            nik: "3204051122334401",
          },
        ],
      },
    });

    const res = await kelompokHandler(req);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.data.id).toBeDefined();

    // Pastikan tidak ada NIK mentah maupun nikHash di seluruh JSON respons
    const rawJsonString = JSON.stringify(json);
    expect(rawJsonString).not.toContain("3204051122334400");
    expect(rawJsonString).not.toContain("3204051122334401");
    expect(rawJsonString).not.toContain("nikHash");

    // Pastikan tersimpan di DB dengan nikHash
    const savedAnggota = mockAnggotaStore.filter((a) => a.kelompokId === json.data.id);
    expect(savedAnggota.length).toBe(2);
    expect(savedAnggota[0].nikHash).not.toBeNull();
    expect(savedAnggota[0].nikHash).toHaveLength(64);
  });

  it("menolak pembuatan kelompok jika akun belum aktif (MENUNGGU -> 403)", async () => {
    const { POST: kelompokHandler } = await import("@/app/api/kelompok/route");

    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_warga_menunggu",
      },
      body: {
        nama: "Kelompok Belum Aktif",
        anggota: [
          { nama: "Warga A", rtRw: "01/01" },
          { nama: "Warga B", rtRw: "01/01" },
        ],
      },
    });

    const res = await kelompokHandler(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("menolak kelompok jika anggota kurang dari 2 orang (400 VALIDATION_ERROR)", async () => {
    const { POST: kelompokHandler } = await import("@/app/api/kelompok/route");

    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_ketua_a",
      },
      body: {
        nama: "Kelompok Sendirian",
        anggota: [{ nama: "Rudi Hartono", rtRw: "02/03" }],
      },
    });

    const res = await kelompokHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("Paket BE-2: POST /api/proyek/:id/proposal (Pengajuan Proposal & Validasi Server)", () => {
  beforeEach(() => {
    resetDb();
  });

  it("T02: menolak jika nilai penawaran melebihi pagu anggaran proyek (400 VALIDATION_ERROR)", async () => {
    const { POST: proposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    // Pagu proyek_tender_aktif adalah Rp100.000.000
    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_ketua_a",
      },
      body: {
        kelompokId: "kel_001",
        penawaran: 105_000_000, // MELEBIHI PAGU (105 Juta > 100 Juta)
        durasiHari: 45,
        tenagaTotal: 10,
        tenagaLokal: 8,
        narasiMetode: "Metode pekerjaan drainase dilakukan dengan penggalian tanah bertahap sesuai kontur air tanah desa.".padEnd(120, "."),
        narasiJadwal: "Jadwal pengerjaan terbagi ke dalam 4 minggu konstruksi fisik.".padEnd(60, "."),
        narasiRisiko: "Risiko hujan diatasi dengan pompa penyedot air lumpur.".padEnd(40, "."),
      },
    });

    const res = await proposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields).toHaveProperty("penawaran");
  });

  it("menolak jika tenagaLokal melebihi tenagaTotal (400 VALIDATION_ERROR)", async () => {
    const { POST: proposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_ketua_a",
      },
      body: {
        kelompokId: "kel_001",
        penawaran: 88_000_000,
        durasiHari: 45,
        tenagaTotal: 8,
        tenagaLokal: 10, // SALAH: lokal 10 > total 8
        narasiMetode: "Metode pekerjaan drainase dilakukan dengan penggalian tanah bertahap sesuai kontur air tanah desa.".padEnd(120, "."),
        narasiJadwal: "Jadwal pengerjaan terbagi ke dalam 4 minggu konstruksi fisik.".padEnd(60, "."),
        narasiRisiko: "Risiko hujan diatasi dengan pompa penyedot air lumpur.".padEnd(40, "."),
      },
    });

    const res = await proposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.fields).toHaveProperty("tenagaLokal");
  });

  it("menolak pengajuan jika tenggat waktu proyek telah berakhir (409 CONFLICT)", async () => {
    const { POST: proposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_ketua_a",
      },
      body: {
        kelompokId: "kel_001",
        penawaran: 20_000_000,
        durasiHari: 20,
        tenagaTotal: 5,
        tenagaLokal: 5,
        narasiMetode: "Metode renovasi pos ronda cepat dan tepat sasaran bersama warga kampung setempat.".padEnd(120, "."),
        narasiJadwal: "Jadwal kerja 2 minggu terbagi material dan pengerjaan.".padEnd(60, "."),
        narasiRisiko: "Risiko kekurangan bahan semen diantisipasi toko mitra.".padEnd(40, "."),
      },
    });

    const res = await proposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tenggat_lewat" }),
    });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe("CONFLICT");
    expect(json.error.message).toContain("telah berakhir");
  });

  it("menolak jika pengguna bukan ketua kelompok yang bersangkutan (403 FORBIDDEN)", async () => {
    const { POST: proposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    // Pengguna usr_ketua_b mencoba mengirim atas nama kelompok kel_001 (milik usr_ketua_a)
    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_ketua_b",
      },
      body: {
        kelompokId: "kel_001",
        penawaran: 85_000_000,
        durasiHari: 40,
        tenagaTotal: 10,
        tenagaLokal: 9,
        narasiMetode: "Metode pekerjaan drainase terstandarisasi dengan pengukuran ketinggian kontur tanah desa.".padEnd(120, "."),
        narasiJadwal: "Jadwal pekerjaan 40 hari kalender kerja bakti warga.".padEnd(60, "."),
        narasiRisiko: "Manajemen risiko genangan air saat hujan deras melanda.".padEnd(40, "."),
      },
    });

    const res = await proposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toContain("Hanya ketua kelompok");
  });

  it("berhasil mengirim proposal valid (201), statusAnalisis MENUNGGU, dan kelengkapan dihitung di server", async () => {
    const { POST: proposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_ketua_a",
      },
      body: {
        kelompokId: "kel_001",
        penawaran: 88_000_000,
        durasiHari: 45,
        tenagaTotal: 10,
        tenagaLokal: 9,
        narasiMetode: "Metode penggalian saluran drainase dengan kemiringan optimal untuk mencegah sedimentasi lumpur.".padEnd(120, "."),
        narasiJadwal: "Tahap 1 pengukuran lapangan, tahap 2 pemasangan u-ditch, tahap 3 penutupan dan plester semen.".padEnd(80, "."),
        narasiRisiko: "Mitigasi musim hujan disediakan terpal penutup dan pompa air cadangan mandiri warga.".padEnd(50, "."),
        dokumen: ["proposal-docs/prop_sample/sk-kelompok.pdf"],
      },
    });

    const res = await proposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.data.id).toBeDefined();
    expect(json.data.statusAnalisis).toBe(StatusAnalisis.MENUNGGU);

    // Cek di DB mock
    const created = mockProposalStore.find((p) => p.id === json.data.id);
    expect(created).toBeDefined();
    expect(created?.statusAnalisis).toBe(StatusAnalisis.MENUNGGU);
    expect(created?.kelengkapan).toEqual({
      metode: true,
      jadwal: true,
      risiko: true,
      anggota: true,
      pengalaman: true,
    });
  });

  it("menolak pengiriman proposal ganda oleh kelompok yang sama (409 CONFLICT)", async () => {
    const { POST: proposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    // Masukkan proposal awal untuk kel_001 pada proyek_tender_aktif
    mockProposalStore.push({
      id: "prop_existing_001",
      proyekId: "proyek_tender_aktif",
      kelompokId: "kel_001",
      penawaran: BigInt(88_000_000),
      durasiHari: 45,
      tenagaTotal: 10,
      tenagaLokal: 9,
      narasiMetode: "Metode lama yang sudah disubmit",
      narasiJadwal: "Jadwal lama yang sudah disubmit",
      narasiRisiko: "Risiko lama yang sudah disubmit",
      dokumen: [],
      kelengkapan: { metode: true, jadwal: true, risiko: true, anggota: true, pengalaman: true },
      dikirimPada: new Date(),
      statusAnalisis: StatusAnalisis.MENUNGGU,
    });

    const req = createMockRequest({
      method: "POST",
      headers: {
        "x-test-auth-id": "auth_ketua_a",
      },
      body: {
        kelompokId: "kel_001",
        penawaran: 80_000_000,
        durasiHari: 40,
        tenagaTotal: 10,
        tenagaLokal: 8,
        narasiMetode: "Proposal cadangan metode drainase desa terlengkap dan termurah dari kelompok tani mandiri.".padEnd(120, "."),
        narasiJadwal: "Jadwal pengerjaan proyek tahap kedua selama empat puluh hari.".padEnd(60, "."),
        narasiRisiko: "Risiko ditanggung bersama pengurus kelompok tani desa.".padEnd(40, "."),
      },
    });

    const res = await proposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.code).toBe("CONFLICT");
    expect(json.error.message).toContain("sudah mengajukan proposal");
  });
});

describe("Paket BE-2: GET /api/proyek/:id/proposal (Aturan Visibilitas PRD 33.2 Aturan #15 & RBAC)", () => {
  beforeEach(() => {
    resetDb();

    // Buat 2 proposal pada proyek_tender_aktif
    mockProposalStore = [
      {
        id: "prop_001",
        proyekId: "proyek_tender_aktif",
        kelompokId: "kel_001", // Ketua: usr_ketua_a
        penawaran: BigInt(88_000_000),
        durasiHari: 45,
        tenagaTotal: 10,
        tenagaLokal: 9,
        narasiMetode: "Metode A",
        narasiJadwal: "Jadwal A",
        narasiRisiko: "Risiko A",
        dokumen: [],
        kelengkapan: { metode: true, jadwal: true, risiko: true, anggota: true, pengalaman: true },
        dikirimPada: new Date("2026-11-01T10:00:00Z"),
        statusAnalisis: StatusAnalisis.MENUNGGU,
      },
      {
        id: "prop_002",
        proyekId: "proyek_tender_aktif",
        kelompokId: "kel_002", // Ketua: usr_ketua_b
        penawaran: BigInt(92_000_000),
        durasiHari: 50,
        tenagaTotal: 12,
        tenagaLokal: 10,
        narasiMetode: "Metode B",
        narasiJadwal: "Jadwal B",
        narasiRisiko: "Risiko B",
        dokumen: [],
        kelengkapan: { metode: true, jadwal: true, risiko: true, anggota: true, pengalaman: true },
        dikirimPada: new Date("2026-11-02T10:00:00Z"),
        statusAnalisis: StatusAnalisis.MENUNGGU,
      },
      // 1 proposal pada proyek_masa_sanggah
      {
        id: "prop_003",
        proyekId: "proyek_masa_sanggah",
        kelompokId: "kel_001",
        penawaran: BigInt(140_000_000),
        durasiHari: 60,
        tenagaTotal: 15,
        tenagaLokal: 12,
        narasiMetode: "Metode C",
        narasiJadwal: "Jadwal C",
        narasiRisiko: "Risiko C",
        dokumen: [],
        kelengkapan: { metode: true, jadwal: true, risiko: true, anggota: true, pengalaman: true },
        dikirimPada: new Date("2026-10-25T10:00:00Z"),
        statusAnalisis: StatusAnalisis.BERHASIL,
      },
    ];
  });

  it("PUBLIK (belum login) saat status TENDER_DIBUKA hanya melihat JUMLAH proposal (data kosong)", async () => {
    const { GET: listProposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "GET",
      url: "http://localhost:3000/api/proyek/proyek_tender_aktif/proposal",
    });

    const res = await listProposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]); // data rincian kosong
    expect(json.meta.total).toBe(2); // hanya melihat total jumlah proposal
    expect(json.meta.keterangan).toContain("masa sanggah");
  });

  it("WARGA saat status TENDER_DIBUKA hanya dapat melihat proposal miliknya sendiri", async () => {
    const { GET: listProposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "GET",
      headers: {
        "x-test-auth-id": "auth_ketua_a", // Warga pemilik kel_001
      },
    });

    const res = await listProposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBe(1); // Hanya melihat 1 (prop_001 miliknya)
    expect(json.data[0].id).toBe("prop_001");
    expect(json.data[0].kelompokId).toBe("kel_001");
  });

  it("PERANGKAT / PENGAWAS / ADMIN dapat melihat SEMUA proposal pada status TENDER_DIBUKA", async () => {
    const { GET: listProposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "GET",
      headers: {
        "x-test-auth-id": "auth_kades", // Peran PERANGKAT
      },
    });

    const res = await listProposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBe(2); // Melihat semua proposal
    expect(json.data.map((p: any) => p.id)).toEqual(["prop_001", "prop_002"]);
  });

  it("PUBLIK dapat melihat seluruh daftar proposal jika status proyek sudah mencapai MASA_SANGGAH", async () => {
    const { GET: listProposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "GET",
      // Tanpa header auth (Publik anonim)
    });

    const res = await listProposalHandler(req, {
      params: Promise.resolve({ id: "proyek_masa_sanggah" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBe(1); // Melihat proposal prop_003
    expect(json.data[0].id).toBe("prop_003");
  });

  it("Jaminan Privasi (FR-ID1): NIK mentah dan nikHash TIDAK PERNAH muncul di respons GET proposal", async () => {
    const { GET: listProposalHandler } = await import("@/app/api/proyek/[id]/proposal/route");

    const req = createMockRequest({
      method: "GET",
      headers: {
        "x-test-auth-id": "auth_kades",
      },
    });

    const res = await listProposalHandler(req, {
      params: Promise.resolve({ id: "proyek_tender_aktif" }),
    });

    const json = await res.json();
    const rawString = JSON.stringify(json);

    // Pastikan tidak ada key nikHash sama sekali di JSON respons
    expect(rawString).not.toContain("nikHash");
    expect(rawString).not.toContain("3204051122334455");
  });
});
