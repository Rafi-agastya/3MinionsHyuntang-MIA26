import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Peran,
  StatusAkun,
  JenisEntri,
  LevelAkun,
  JenisBelanja,
  StatusVerifikasi,
  StatusProyek,
  Jalur,
} from "@prisma/client";
import { resetRateLimitStore } from "@/lib/rate-limit";
import {
  ANGGARAN_COLUMNS,
  PROYEK_COLUMNS,
  TERMIN_COLUMNS,
  KAS_COLUMNS,
  TIKET_AGREGAT_COLUMNS,
} from "@/lib/open-data";

// ================= IN-MEMORY PRISMA MOCK =================

let mockPosAnggaranStore: any[] = [];
let mockSumberDanaStore: any[] = [];
let mockEntriKasStore: any[] = [];
let mockRefAkunStore: any[] = [];
let mockProyekStore: any[] = [];
let mockTerminStore: any[] = [];

function resetDb() {
  resetRateLimitStore();

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
      id: "akun_bidang_2",
      kode: "02",
      uraian: "Bidang Pelaksanaan Pembangunan Desa",
      level: LevelAkun.BIDANG,
      parentId: null,
      sensitif: false,
    },
    {
      id: "akun_sub_2_3",
      kode: "2.3",
      uraian: "Sub Bidang Pekerjaan Umum",
      level: LevelAkun.SUB_BIDANG,
      parentId: "akun_bidang_2",
      sensitif: false,
    },
    {
      id: "akun_keg_balai",
      kode: "2.3.01",
      uraian: "Pembangunan Balai Pertemuan Warga",
      level: LevelAkun.KEGIATAN,
      parentId: "akun_sub_2_3",
      sensitif: false,
    },
    {
      id: "akun_keg_siltap",
      kode: "1.1.01",
      uraian: "Penghasilan Tetap Kepala Desa",
      level: LevelAkun.KEGIATAN,
      parentId: null,
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
      uraian: "Siltap Kepala Desa",
      anggaran: BigInt(60_000_000),
      sensitif: true,
    },
  ];

  mockProyekStore = [
    {
      id: "proyek_balai_1",
      desaId: "desa_1",
      posAnggaranId: "pos_balai",
      judul: "Pembangunan Balai Pertemuan Warga RW 02",
      deskripsi: "Fasilitas musyawarah warga",
      lokasi: "Dusun Krajan RW 02",
      kelas: "SEDERHANA",
      pagu: BigInt(140_000_000),
      status: StatusProyek.PENGERJAAN,
      jalur: Jalur.SAYEMBARA,
      durasiMin: 30,
      durasiMax: 90,
      syaratLokalMin: 70,
      createdAt: new Date("2026-11-01T08:00:00Z"),
    },
  ];

  mockTerminStore = [
    {
      id: "termin_1",
      proyekId: "proyek_balai_1",
      tahap: 1,
      nilai: BigInt(70_000_000),
      terbuka: true,
    },
    {
      id: "termin_2",
      proyekId: "proyek_balai_1",
      tahap: 2,
      nilai: BigInt(70_000_000),
      terbuka: false,
    },
  ];

  mockEntriKasStore = [
    {
      id: "entri_kas_1",
      desaId: "desa_1",
      nomorUrut: 1,
      jenis: JenisEntri.PEMBAYARAN,
      jumlah: BigInt(70_000_000),
      tanggal: new Date("2026-11-02T10:00:00Z"),
      uraian: "Pencairan dana Termin 1",
      sumberDanaId: "sd_dd",
      posId: "pos_balai",
      proyekId: "proyek_balai_1",
      terminId: "termin_1",
      koreksiDariId: null,
      penerima: "Bapak Supardi (Pribadi Tukang)",
      penerimaDisamarkan: true,
      buktiUrls: ["https://example.com/kwitansi.pdf"],
      pencatatId: "usr_perangkat_1",
      hashSebelumnya: null,
      hash: "a8f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
      dibuatPada: new Date("2026-11-02T10:00:00Z"),
    },
    {
      id: "entri_kas_2",
      desaId: "desa_1",
      nomorUrut: 2,
      jenis: JenisEntri.PEMBAYARAN,
      jumlah: BigInt(5_000_000),
      tanggal: new Date("2026-11-03T11:00:00Z"),
      uraian: "Siltap Kepala Desa Bulan November",
      sumberDanaId: "sd_dd",
      posId: "pos_siltap",
      proyekId: null,
      terminId: null,
      koreksiDariId: null,
      penerima: "Kepala Desa",
      penerimaDisamarkan: false,
      buktiUrls: ["https://example.com/slip.pdf"],
      pencatatId: "usr_perangkat_1",
      hashSebelumnya: "a8f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
      hash: "b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
      dibuatPada: new Date("2026-11-03T11:00:00Z"),
    },
  ];
}

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
      $queryRaw: vi.fn(async () => [{ 1: 1 }]),
      sumberDana: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockSumberDanaStore.filter(
            (s) => !where?.desaId || s.desaId === where.desaId
          );
        }),
      },
      refAkun: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockRefAkunStore.filter(
            (a) => !where?.level || a.level === where.level
          );
        }),
      },
      posAnggaran: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockPosAnggaranStore
            .filter((p) => !where?.desaId || p.desaId === where.desaId)
            .map((p) => {
              const akun = mockRefAkunStore.find((a) => a.id === p.akunId);
              const parent = akun?.parentId
                ? mockRefAkunStore.find((a) => a.id === akun.parentId)
                : null;
              const grandParent = parent?.parentId
                ? mockRefAkunStore.find((a) => a.id === parent.parentId)
                : null;
              const akunWithParent = akun
                ? {
                    ...akun,
                    parent: parent ? { ...parent, parent: grandParent } : null,
                  }
                : null;
              const sumberDana = mockSumberDanaStore.find(
                (s) => s.id === p.sumberDanaId
              );
              return { ...p, akun: akunWithParent, sumberDana };
            });
        }),
      },
      proyek: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockProyekStore.filter(
            (p) => !where?.desaId || p.desaId === where.desaId
          );
        }),
      },
      termin: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockTerminStore
            .filter(
              (t) =>
                !where?.proyek?.desaId ||
                mockProyekStore.some(
                  (p) => p.id === t.proyekId && p.desaId === where.proyek.desaId
                )
            )
            .map((t) => {
              const proyek = mockProyekStore.find((p) => p.id === t.proyekId);
              return { ...t, proyek };
            });
        }),
      },
      entriKas: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockEntriKasStore
            .filter((e) => !where?.desaId || e.desaId === where.desaId)
            .map((e) => {
              const sumberDana = mockSumberDanaStore.find(
                (s) => s.id === e.sumberDanaId
              );
              const pos = mockPosAnggaranStore.find((p) => p.id === e.posId);
              const proyek = mockProyekStore.find((p) => p.id === e.proyekId);
              return {
                ...e,
                sumberDana,
                pos,
                proyek,
                verifikasi: [
                  {
                    id: "v1",
                    keputusan: StatusVerifikasi.DISETUJUI,
                    waktu: new Date("2026-11-02T12:00:00Z"),
                  },
                ],
              };
            });
        }),
      },
    },
  };
});

describe("Paket BE-7: Open Data (/api/data/:dataset), Kamus Data, Rate Limit & Health", () => {
  beforeEach(() => {
    resetDb();
  });

  // ================= T10 (PRIVASI DATA TERBUKA) =================
  it("T10: Respons API publik tidak memuat NIK, hash NIK, nama perorangan disamarkan, dan tiket agregat tanpa identitas", async () => {
    const { GET: handleGetDataset } = await import(
      "@/app/api/data/[dataset]/route"
    );

    const datasets = ["anggaran", "proyek", "termin", "kas", "tiket-agregat"];

    for (const dataset of datasets) {
      // 1. Uji JSON
      const reqJson = new Request(
        `http://localhost:3000/api/data/${dataset}?format=json`,
        {
          headers: { "x-forwarded-for": `10.0.0.${dataset.length}` },
        }
      );
      const resJson = await handleGetDataset(reqJson, {
        params: Promise.resolve({ dataset }),
      });
      expect(resJson.status).toBe(200);
      const json = await resJson.json();
      const stringifiedJson = JSON.stringify(json).toLowerCase();

      // Tidak boleh ada kata kunci NIK mentah atau hash NIK dalam respons publik
      expect(stringifiedJson).not.toContain("nikhash");
      expect(stringifiedJson).not.toContain("nik_hash");
      expect(stringifiedJson).not.toContain("nik");

      // 2. Uji CSV
      const reqCsv = new Request(
        `http://localhost:3000/api/data/${dataset}?format=csv`,
        {
          headers: { "x-forwarded-for": `10.0.1.${dataset.length}` },
        }
      );
      const resCsv = await handleGetDataset(reqCsv, {
        params: Promise.resolve({ dataset }),
      });
      expect(resCsv.status).toBe(200);
      const csvText = (await resCsv.text()).toLowerCase();

      expect(csvText).not.toContain("nikhash");
      expect(csvText).not.toContain("nik_hash");
    }

    // Khusus dataset KAS: pastikan data sensitif tersamarkan
    const reqKas = new Request(
      "http://localhost:3000/api/data/kas?format=json",
      {
        headers: { "x-forwarded-for": "10.0.2.1" },
      }
    );
    const resKas = await handleGetDataset(reqKas, {
      params: Promise.resolve({ dataset: "kas" }),
    });
    const jsonKas = await resKas.json();
    const rows = jsonKas.data;

    // Penerima perorangan wajib disamarkan
    const rowPribadi = rows.find((r: any) => r.nomor_urut === 1);
    expect(rowPribadi.penerima).toBe("Penerima Perorangan (Disamarkan)");
    expect(rowPribadi.penerima).not.toContain("Supardi");

    // Pos sensitif (Siltap) wajib disamarkan uraiannya
    const rowSiltap = rows.find((r: any) => r.nomor_urut === 2);
    expect(rowSiltap.uraian).toBe("Belanja Pos Sensitif (Disamarkan)");
    expect(rowSiltap.uraian).not.toContain("Siltap Kepala Desa");

    // Khusus dataset TIKET-AGREGAT: murni statistik, tanpa kolom pelapor
    const reqTiket = new Request(
      "http://localhost:3000/api/data/tiket-agregat?format=json",
      {
        headers: { "x-forwarded-for": "10.0.2.2" },
      }
    );
    const resTiket = await handleGetDataset(reqTiket, {
      params: Promise.resolve({ dataset: "tiket-agregat" }),
    });
    const jsonTiket = await resTiket.json();
    for (const stat of jsonTiket.data) {
      expect(stat).toHaveProperty("kategori");
      expect(stat).toHaveProperty("jumlah_total");
      expect(stat).not.toHaveProperty("pelapor");
      expect(stat).not.toHaveProperty("pelaporId");
      expect(stat).not.toHaveProperty("nik");
    }
  });

  // ================= T14 (OPEN DATA CSV & KAMUS DATA) =================
  it("T14: Unduh CSV menghasilkan file valid dengan header kolom sesuai kamus data", async () => {
    const { GET: handleGetDataset } = await import(
      "@/app/api/data/[dataset]/route"
    );

    const testCases: Array<{
      dataset: string;
      expectedColumns: string[];
    }> = [
      {
        dataset: "anggaran",
        expectedColumns: ANGGARAN_COLUMNS.map((c) => c.header),
      },
      {
        dataset: "proyek",
        expectedColumns: PROYEK_COLUMNS.map((c) => c.header),
      },
      {
        dataset: "termin",
        expectedColumns: TERMIN_COLUMNS.map((c) => c.header),
      },
      {
        dataset: "kas",
        expectedColumns: KAS_COLUMNS.map((c) => c.header),
      },
      {
        dataset: "tiket-agregat",
        expectedColumns: TIKET_AGREGAT_COLUMNS.map((c) => c.header),
      },
    ];

    for (const tc of testCases) {
      const req = new Request(
        `http://localhost:3000/api/data/${tc.dataset}?format=csv`,
        {
          headers: { "x-forwarded-for": `192.168.1.${tc.dataset.length}` },
        }
      );
      const res = await handleGetDataset(req, {
        params: Promise.resolve({ dataset: tc.dataset }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      expect(res.headers.get("content-disposition")).toContain(
        `attachment; filename="${tc.dataset}-`
      );

      // Verifikasi header Cache-Control
      expect(res.headers.get("cache-control")).toBe(
        "public, max-age=60, s-maxage=60, stale-while-revalidate=30"
      );

      const csvContent = await res.text();
      const lines = csvContent.split("\r\n");
      expect(lines.length).toBeGreaterThan(1);

      // Baris pertama (header) harus persis sama dengan urutan kolom kamus data
      const headers = lines[0].split(",");
      expect(headers).toEqual(tc.expectedColumns);
    }
  });

  // ================= 404 DATASET TIDAK DIKENAL =================
  it("Dataset tidak dikenal mengembalikan 404 NOT_FOUND", async () => {
    const { GET: handleGetDataset } = await import(
      "@/app/api/data/[dataset]/route"
    );

    const req = new Request("http://localhost:3000/api/data/dataset-fiktif", {
      headers: { "x-forwarded-for": "10.0.5.1" },
    });
    const res = await handleGetDataset(req, {
      params: Promise.resolve({ dataset: "dataset-fiktif" }),
    });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
    expect(json.error.message).toContain("tidak ditemukan");
  });

  // ================= RATE LIMITING 60/MENIT/IP (PRD 35.4) =================
  it("Rate limit 60 per menit per IP menolak permintaan ke-61 dengan 429 RATE_LIMITED", async () => {
    const { GET: handleGetDataset } = await import(
      "@/app/api/data/[dataset]/route"
    );

    const testIp = "203.0.113.42";

    // Panggilan ke 1 s.d. 60 harus berhasil (200)
    for (let i = 1; i <= 60; i++) {
      const req = new Request("http://localhost:3000/api/data/proyek", {
        headers: { "x-forwarded-for": testIp },
      });
      const res = await handleGetDataset(req, {
        params: Promise.resolve({ dataset: "proyek" }),
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("x-ratelimit-remaining")).toBe(String(60 - i));
    }

    // Panggilan ke-61 dengan IP yang sama harus ditolak dengan 429
    const reqExceeded = new Request("http://localhost:3000/api/data/proyek", {
      headers: { "x-forwarded-for": testIp },
    });
    const resExceeded = await handleGetDataset(reqExceeded, {
      params: Promise.resolve({ dataset: "proyek" }),
    });
    expect(resExceeded.status).toBe(429);
    const jsonExceeded = await resExceeded.json();
    expect(jsonExceeded.error.code).toBe("RATE_LIMITED");

    // IP lain tetap dapat mengakses (isolasi per IP)
    const reqOtherIp = new Request("http://localhost:3000/api/data/proyek", {
      headers: { "x-forwarded-for": "203.0.113.99" },
    });
    const resOtherIp = await handleGetDataset(reqOtherIp, {
      params: Promise.resolve({ dataset: "proyek" }),
    });
    expect(resOtherIp.status).toBe(200);
  });

  // ================= HEALTH CHECK (/api/health) =================
  it("GET /api/health mengembalikan 200 { status: 'ok' } saat basis data terhubung", async () => {
    const { GET: handleHealth } = await import("@/app/api/health/route");

    const req = new Request("http://localhost:3000/api/health");
    const res = await handleHealth(req, undefined as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("ok");
    expect(json.data.database).toBe("connected");
    expect(json.data).toHaveProperty("timestamp");
    expect(json.data).toHaveProperty("uptime");
  });
});

