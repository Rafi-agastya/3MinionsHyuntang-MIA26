import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Peran,
  StatusAkun,
  StatusProyek,
  KelasProyek,
  Jalur,
  StatusVerifikasi,
} from "@prisma/client";

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

interface MockLaporanProgres {
  id: string;
  proyekId: string;
  minggu: number;
  persen: number;
  fotoUrls: string[];
  exif: any;
  checklist: any;
  catatan: string | null;
  status: StatusVerifikasi;
  catatanPengawas: string | null;
  pengunggahId: string;
  pengawasId: string | null;
  dibuatPada: Date;
}

interface MockTermin {
  id: string;
  proyekId: string;
  tahap: number;
  nilai: bigint;
  terbuka: boolean;
}

let mockPenggunaStore: MockPengguna[] = [];
let mockProyekStore: any[] = [];
let mockLaporanStore: MockLaporanProgres[] = [];
let mockTerminStore: MockTermin[] = [];
let mockAuditStore: any[] = [];

let currentAuthUserId: string | null = null;

function makeHeaders(authId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {};
  const target = authId !== undefined ? authId : currentAuthUserId;
  if (target) {
    headers["x-test-auth-id"] = target;
    headers["Authorization"] = `Bearer token_${target}`;
  }
  return headers;
}

function resetDb() {
  mockPenggunaStore = [
    {
      id: "usr_ketua_pemenang",
      authId: "auth_ketua_pemenang",
      nama: "Budi Mandor (Ketua Pokmas)",
      email: "mandor@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_warga_biasa",
      authId: "auth_warga_biasa",
      nama: "Warga Biasa",
      email: "warga@karangsari.desa.id",
      peran: Peran.WARGA,
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
  ];

  mockProyekStore = [
    {
      id: "proyek_balai_1",
      desaId: "desa_1",
      judul: "Pembangunan Balai Pertemuan RW 02",
      deskripsi: "Balai musyawarah",
      lokasi: "Dusun Krajan",
      pagu: BigInt(140_000_000),
      kelas: KelasProyek.SEDERHANA,
      jalur: Jalur.SAYEMBARA,
      status: StatusProyek.PENGERJAAN,
      createdAt: new Date(),
      keputusan: {
        proposal: {
          kelompok: {
            ketuaId: "usr_ketua_pemenang",
          },
        },
      },
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

  mockLaporanStore = [];
  mockAuditStore = [];
  currentAuthUserId = null;
}

// Biner gambar tiruan untuk pengujian magic bytes
const VALID_JPEG_BUFFER = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);
const INVALID_TEXT_BUFFER = Buffer.from("Ini adalah teks biasa bukan gambar");

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
                email: "user@karangsari.desa.id",
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
          getPublicUrl: (path: string) => ({
            data: {
              publicUrl: `https://storage.karangsari.desa.id/progress-photos/${path}`,
            },
          }),
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
            return (
              mockPenggunaStore.find((p) => p.authId === where.authId) || null
            );
          }
          if (where.id) {
            return mockPenggunaStore.find((p) => p.id === where.id) || null;
          }
          return null;
        }),
      },
      proyek: {
        findUnique: vi.fn(async ({ where }: any) => {
          return mockProyekStore.find((p) => p.id === where.id) || null;
        }),
      },
      termin: {
        findMany: vi.fn(async ({ where }: any) => {
          return mockTerminStore.filter((t) => t.proyekId === where.proyekId);
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockTerminStore.findIndex((t) => t.id === where.id);
          if (idx === -1) throw new Error("Termin tidak ditemukan");
          mockTerminStore[idx] = { ...mockTerminStore[idx], ...data };
          return mockTerminStore[idx];
        }),
      },
      laporanProgres: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id) {
            return mockLaporanStore.find((l) => l.id === where.id) || null;
          }
          if (where.proyekId_minggu) {
            const { proyekId, minggu } = where.proyekId_minggu;
            return (
              mockLaporanStore.find(
                (l) => l.proyekId === proyekId && l.minggu === minggu
              ) || null
            );
          }
          return null;
        }),
        findFirst: vi.fn(async ({ where, orderBy }: any) => {
          let list = [...mockLaporanStore];
          if (where?.proyekId)
            list = list.filter((l) => l.proyekId === where.proyekId);
          if (where?.status)
            list = list.filter((l) => l.status === where.status);
          if (orderBy?.persen === "desc") {
            list.sort((a, b) => b.persen - a.persen);
          }
          return list[0] || null;
        }),
        findMany: vi.fn(async ({ where, orderBy }: any) => {
          let list = [...mockLaporanStore];
          if (where?.proyekId)
            list = list.filter((l) => l.proyekId === where.proyekId);
          if (orderBy?.minggu === "asc") {
            list.sort((a, b) => a.minggu - b.minggu);
          }
          return list.map((l) => {
            const pengunggah = mockPenggunaStore.find(
              (p) => p.id === l.pengunggahId
            );
            const pengawas = mockPenggunaStore.find(
              (p) => p.id === l.pengawasId
            );
            return {
              ...l,
              pengunggah: pengunggah
                ? { id: pengunggah.id, nama: pengunggah.nama, peran: pengunggah.peran }
                : null,
              pengawas: pengawas
                ? { id: pengawas.id, nama: pengawas.nama, peran: pengawas.peran }
                : null,
            };
          });
        }),
        create: vi.fn(async ({ data }: any) => {
          const newLaporan: MockLaporanProgres = {
            id: `lap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            proyekId: data.proyekId,
            minggu: data.minggu,
            persen: data.persen,
            fotoUrls: data.fotoUrls,
            exif: data.exif ?? null,
            checklist: data.checklist,
            catatan: data.catatan ?? null,
            status: data.status ?? StatusVerifikasi.MENUNGGU,
            catatanPengawas: null,
            pengunggahId: data.pengunggahId,
            pengawasId: null,
            dibuatPada: new Date(),
          };
          mockLaporanStore.push(newLaporan);
          return newLaporan;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockLaporanStore.findIndex((l) => l.id === where.id);
          if (idx === -1) throw new Error("Laporan tidak ditemukan");
          mockLaporanStore[idx] = { ...mockLaporanStore[idx], ...data };
          return mockLaporanStore[idx];
        }),
      },
      auditLog: {
        create: vi.fn(async ({ data }: any) => {
          const entry = { id: `audit_${mockAuditStore.length + 1}`, ...data };
          mockAuditStore.push(entry);
          return entry;
        }),
      },
    },
  };
});

describe("Paket BE-9: Pelaksanaan & Laporan Progres Mingguan (FR-K, T11, T12)", () => {
  beforeEach(() => {
    resetDb();
  });

  // ================= 1. KASUS UJI T11 =================
  it("T11: Pengunggahan laporan mingguan valid (minggu unik, persen meningkat, checklist 3 butir, ekstraksi EXIF)", async () => {
    currentAuthUserId = "auth_ketua_pemenang";

    const { POST: handlePostLaporan } = await import(
      "@/app/api/proyek/[id]/laporan/route"
    );

    const formData = new FormData();
    formData.append("minggu", "1");
    formData.append("persen", "20");
    formData.append(
      "checklist",
      JSON.stringify({
        pekerjaSesuaiRencana: true,
        materialTersedia: true,
        pekerjaanSesuaiGambar: true,
      })
    );
    formData.append("catatan", "Pondasi dan perataan tanah selesai.");

    const fotoBlob = new Blob([VALID_JPEG_BUFFER], { type: "image/jpeg" });
    formData.append("foto", fotoBlob, "pondasi.jpg");

    const req = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/laporan",
      {
        method: "POST",
        headers: makeHeaders(),
        body: formData,
      }
    );

    const res = await handlePostLaporan(req, {
      params: Promise.resolve({ id: "proyek_balai_1" }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.minggu).toBe(1);
    expect(json.data.persen).toBe(20);
    expect(json.data.status).toBe(StatusVerifikasi.MENUNGGU);
    expect(json.data.fotoUrls.length).toBe(1);
    expect(json.data.fotoUrls[0]).toContain("progress-photos/proyek_balai_1/1/");
    expect(json.data.checklist.pekerjaSesuaiRencana).toBe(true);
    expect(json.data.checklist.materialTersedia).toBe(true);
    expect(json.data.checklist.pekerjaanSesuaiGambar).toBe(true);
  });

  // ================= 2. KASUS UJI T12 =================
  it("T12: Penolakan laporan jika minggu duplikat (409) atau persen turun dibanding laporan terverifikasi (400)", async () => {
    currentAuthUserId = "auth_ketua_pemenang";

    const { POST: handlePostLaporan } = await import(
      "@/app/api/proyek/[id]/laporan/route"
    );

    // 1. Simulasikan laporan minggu 1 yang sudah DISETUJUI pada 25%
    mockLaporanStore.push({
      id: "lap_1",
      proyekId: "proyek_balai_1",
      minggu: 1,
      persen: 25,
      fotoUrls: ["https://example.com/m1.jpg"],
      exif: null,
      checklist: {
        pekerjaSesuaiRencana: true,
        materialTersedia: true,
        pekerjaanSesuaiGambar: true,
      },
      catatan: "Minggu 1",
      status: StatusVerifikasi.DISETUJUI,
      catatanPengawas: "Bagus",
      pengunggahId: "usr_ketua_pemenang",
      pengawasId: "usr_pengawas_1",
      dibuatPada: new Date(),
    });

    // Uji Duplikasi Minggu: Mencoba unggah lagi untuk minggu 1 -> Ditolak (409)
    const formDataDup = new FormData();
    formDataDup.append("minggu", "1");
    formDataDup.append("persen", "30");
    formDataDup.append("pekerjaSesuaiRencana", "true");
    formDataDup.append("materialTersedia", "true");
    formDataDup.append("pekerjaanSesuaiGambar", "true");
    formDataDup.append(
      "foto",
      new Blob([VALID_JPEG_BUFFER], { type: "image/jpeg" }),
      "m1_dup.jpg"
    );

    const reqDup = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/laporan",
      {
        method: "POST",
        headers: makeHeaders(),
        body: formDataDup,
      }
    );

    const resDup = await handlePostLaporan(reqDup, {
      params: Promise.resolve({ id: "proyek_balai_1" }),
    });
    expect(resDup.status).toBe(409);
    const jsonDup = await resDup.json();
    expect(jsonDup.error.code).toBe("CONFLICT");

    // Uji Progres Turun: Minggu 2 dilaporkan 20% (lebih kecil dari 25% terverifikasi) -> Ditolak (400)
    const formDataTurun = new FormData();
    formDataTurun.append("minggu", "2");
    formDataTurun.append("persen", "20"); // 20 < 25
    formDataTurun.append("pekerjaSesuaiRencana", "true");
    formDataTurun.append("materialTersedia", "true");
    formDataTurun.append("pekerjaanSesuaiGambar", "true");
    formDataTurun.append(
      "foto",
      new Blob([VALID_JPEG_BUFFER], { type: "image/jpeg" }),
      "m2.jpg"
    );

    const reqTurun = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/laporan",
      {
        method: "POST",
        headers: makeHeaders(),
        body: formDataTurun,
      }
    );

    const resTurun = await handlePostLaporan(reqTurun, {
      params: Promise.resolve({ id: "proyek_balai_1" }),
    });
    expect(resTurun.status).toBe(400);
    const jsonTurun = await resTurun.json();
    expect(jsonTurun.error.code).toBe("VALIDATION_ERROR");
    expect(jsonTurun.error.message).toContain("tidak boleh lebih kecil");
  });

  // ================= 3. VALIDASI BINER MAGIC BYTES =================
  it("Menolak berkas foto jika biner/magic bytes tidak valid (400)", async () => {
    currentAuthUserId = "auth_ketua_pemenang";

    const { POST: handlePostLaporan } = await import(
      "@/app/api/proyek/[id]/laporan/route"
    );

    const formData = new FormData();
    formData.append("minggu", "2");
    formData.append("persen", "30");
    formData.append("pekerjaSesuaiRencana", "true");
    formData.append("materialTersedia", "true");
    formData.append("pekerjaanSesuaiGambar", "true");

    // Berkas teks palsu
    const fakeBlob = new Blob([INVALID_TEXT_BUFFER], { type: "image/jpeg" });
    formData.append("foto", fakeBlob, "palsu.jpg");

    const req = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/laporan",
      {
        method: "POST",
        headers: makeHeaders(),
        body: formData,
      }
    );

    const res = await handlePostLaporan(req, {
      params: Promise.resolve({ id: "proyek_balai_1" }),
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toContain("tidak valid");
  });

  // ================= 4. VERIFIKASI PENGAWAS & BUKA TERMIN OTOMATIS =================
  it("Verifikasi pengawas DISETUJUI dengan progres >= 30% otomatis membuka termin ke-2", async () => {
    // 1. Buat laporan minggu 2 dengan progres 35%
    mockLaporanStore.push({
      id: "lap_target_verif",
      proyekId: "proyek_balai_1",
      minggu: 2,
      persen: 35,
      fotoUrls: ["https://example.com/foto.jpg"],
      exif: null,
      checklist: {
        pekerjaSesuaiRencana: true,
        materialTersedia: true,
        pekerjaanSesuaiGambar: true,
      },
      catatan: "Pemasangan atap",
      status: StatusVerifikasi.MENUNGGU,
      catatanPengawas: null,
      pengunggahId: "usr_ketua_pemenang",
      pengawasId: null,
      dibuatPada: new Date(),
    });

    // Pastikan termin 2 masih tertutup
    expect(mockTerminStore[1].terbuka).toBe(false);

    // Pengawas memverifikasi laporan
    currentAuthUserId = "auth_pengawas_1";
    const { PATCH: handleVerifikasiLaporan } = await import(
      "@/app/api/laporan/[id]/route"
    );

    const req = new Request(
      "http://localhost:3000/api/laporan/lap_target_verif",
      {
        method: "PATCH",
        headers: makeHeaders(),
        body: JSON.stringify({
          status: "DISETUJUI",
          catatan: "Kualitas material dan rangka atap terverifikasi baik.",
        }),
      }
    );

    const res = await handleVerifikasiLaporan(req, {
      params: Promise.resolve({ id: "lap_target_verif" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe("DISETUJUI");
    expect(json.data.terminDibuka.length).toBeGreaterThanOrEqual(1);

    // Termin ke-2 sekarang otomatis terbuka!
    expect(mockTerminStore[1].terbuka).toBe(true);
  });

  // ================= 5. LINIMASA & MINGGU TERLEWAT (FR-K5) =================
  it("GET /api/proyek/:id/laporan: menampilkan linimasa dan mendeteksi minggu yang terlewat", async () => {
    // Ada laporan minggu 1 dan minggu 3 (minggu 2 terlewat)
    mockLaporanStore.push(
      {
        id: "l1",
        proyekId: "proyek_balai_1",
        minggu: 1,
        persen: 15,
        fotoUrls: ["https://example.com/1.jpg"],
        exif: null,
        checklist: {},
        catatan: "M1",
        status: StatusVerifikasi.DISETUJUI,
        catatanPengawas: null,
        pengunggahId: "usr_ketua_pemenang",
        pengawasId: null,
        dibuatPada: new Date("2026-11-01"),
      },
      {
        id: "l3",
        proyekId: "proyek_balai_1",
        minggu: 3,
        persen: 45,
        fotoUrls: ["https://example.com/3.jpg"],
        exif: null,
        checklist: {},
        catatan: "M3",
        status: StatusVerifikasi.DISETUJUI,
        catatanPengawas: null,
        pengunggahId: "usr_ketua_pemenang",
        pengawasId: null,
        dibuatPada: new Date("2026-11-15"),
      }
    );

    const { GET: handleGetLaporan } = await import(
      "@/app/api/proyek/[id]/laporan/route"
    );

    const req = new Request(
      "http://localhost:3000/api/proyek/proyek_balai_1/laporan"
    );
    const res = await handleGetLaporan(req, {
      params: Promise.resolve({ id: "proyek_balai_1" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBe(2);
    expect(json.meta.maxMinggu).toBe(3);
    // Minggu 2 harus terdeteksi sebagai minggu terlewat
    expect(json.meta.mingguTerlewat).toEqual([2]);
  });
});

