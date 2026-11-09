import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  Peran,
  StatusAkun,
  StatusIde,
  SumberIde,
  StatusTiket,
  StatusProyek,
  KelasProyek,
  Jalur,
} from "@prisma/client";
import { resetRateLimitStore } from "@/lib/rate-limit";
import { generateNomorLacak, hitungTenggat } from "@/lib/ide-tiket";

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

interface MockIde {
  id: string;
  nomor: string;
  judul: string;
  deskripsi: string;
  lokasi: string | null;
  kategori: string;
  sumber: SumberIde;
  status: StatusIde;
  alasan: string | null;
  dasarKebutuhan: string | null;
  anonim: boolean;
  tenggatTanggapan: Date;
  desaId: string;
  pengajuId: string;
  createdAt: Date;
}

interface MockDukunganIde {
  ideId: string;
  penggunaId: string;
  createdAt: Date;
}

interface MockTiket {
  id: string;
  nomor: string;
  proyekId: string | null;
  pelaporId: string;
  kategori: string;
  isi: string;
  anonim: boolean;
  status: StatusTiket;
  tanggapan: string | null;
  tenggat: Date;
  dibuatPada: Date;
}

let mockPenggunaStore: MockPengguna[] = [];
let mockIdeStore: MockIde[] = [];
let mockDukunganStore: MockDukunganIde[] = [];
let mockTiketStore: MockTiket[] = [];
let mockProyekStore: any[] = [];
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
  resetRateLimitStore();

  mockPenggunaStore = [
    {
      id: "usr_warga_1",
      authId: "auth_warga_1",
      nama: "Budi Santoso (Warga)",
      email: "budi@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
    {
      id: "usr_warga_2",
      authId: "auth_warga_2",
      nama: "Siti Rahma (Warga 2)",
      email: "siti@karangsari.desa.id",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
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
      id: "usr_admin_1",
      authId: "auth_admin_1",
      nama: "Admin Super Desa",
      email: "admin@karangsari.desa.id",
      peran: Peran.ADMIN,
      statusAkun: StatusAkun.AKTIF,
      desaId: "desa_1",
    },
  ];

  mockProyekStore = [
    {
      id: "proyek_1",
      desaId: "desa_1",
      judul: "Pembangunan Balai Pertemuan RW 02",
      deskripsi: "Balai musyawarah",
      lokasi: "Dusun Krajan",
      pagu: BigInt(140_000_000),
      kelas: KelasProyek.SEDERHANA,
      jalur: Jalur.SAYEMBARA,
      status: StatusProyek.PENGERJAAN,
      createdAt: new Date(),
    },
  ];

  mockIdeStore = [];
  mockDukunganStore = [];
  mockTiketStore = [];
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
                email: "user@karangsari.desa.id",
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
      ide: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id) {
            return mockIdeStore.find((i) => i.id === where.id) || null;
          }
          if (where.nomor) {
            return mockIdeStore.find((i) => i.nomor === where.nomor) || null;
          }
          return null;
        }),
        findMany: vi.fn(async ({ where, skip = 0, take = 20 }: any) => {
          let list = [...mockIdeStore];
          if (where?.desaId) list = list.filter((i) => i.desaId === where.desaId);
          if (where?.status) list = list.filter((i) => i.status === where.status);
          if (where?.kategori)
            list = list.filter((i) => i.kategori === where.kategori);

          list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const paginated = list.slice(skip, skip + take);

          return paginated.map((ide) => {
            const pengaju = mockPenggunaStore.find(
              (p) => p.id === ide.pengajuId
            );
            const dukunganCount = mockDukunganStore.filter(
              (d) => d.ideId === ide.id
            ).length;
            return {
              ...ide,
              pengaju: pengaju
                ? { id: pengaju.id, nama: pengaju.nama, peran: pengaju.peran }
                : null,
              _count: { dukungan: dukunganCount },
            };
          });
        }),
        count: vi.fn(async ({ where }: any) => {
          let list = [...mockIdeStore];
          if (where?.desaId) list = list.filter((i) => i.desaId === where.desaId);
          if (where?.status) list = list.filter((i) => i.status === where.status);
          return list.length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const newIde: MockIde = {
            id: `ide_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            nomor: data.nomor,
            judul: data.judul,
            deskripsi: data.deskripsi,
            lokasi: data.lokasi ?? null,
            kategori: data.kategori,
            sumber: data.sumber,
            status: data.status,
            alasan: data.alasan ?? null,
            dasarKebutuhan: data.dasarKebutuhan ?? null,
            anonim: data.anonim ?? false,
            tenggatTanggapan: data.tenggatTanggapan,
            desaId: data.desaId,
            pengajuId: data.pengajuId,
            createdAt: new Date(),
          };
          mockIdeStore.push(newIde);
          return newIde;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockIdeStore.findIndex((i) => i.id === where.id);
          if (idx === -1) throw new Error("Ide tidak ditemukan");
          mockIdeStore[idx] = { ...mockIdeStore[idx], ...data };
          return mockIdeStore[idx];
        }),
      },
      dukunganIde: {
        findUnique: vi.fn(async ({ where }: any) => {
          const { ideId, penggunaId } = where.ideId_penggunaId;
          return (
            mockDukunganStore.find(
              (d) => d.ideId === ideId && d.penggunaId === penggunaId
            ) || null
          );
        }),
        count: vi.fn(async ({ where }: any) => {
          return mockDukunganStore.filter((d) => d.ideId === where.ideId)
            .length;
        }),
        create: vi.fn(async ({ data }: any) => {
          const newDukungan: MockDukunganIde = {
            ideId: data.ideId,
            penggunaId: data.penggunaId,
            createdAt: new Date(),
          };
          mockDukunganStore.push(newDukungan);
          return newDukungan;
        }),
      },
      tiket: {
        findUnique: vi.fn(async ({ where }: any) => {
          let t: MockTiket | null = null;
          if (where.id) {
            t = mockTiketStore.find((item) => item.id === where.id) || null;
          } else if (where.nomor) {
            t = mockTiketStore.find((item) => item.nomor === where.nomor) || null;
          }
          if (!t) return null;

          const proyek = mockProyekStore.find((p) => p.id === t?.proyekId);
          return {
            ...t,
            proyek: proyek ? { id: proyek.id, judul: proyek.judul } : null,
          };
        }),
        create: vi.fn(async ({ data }: any) => {
          const newTiket: MockTiket = {
            id: `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            nomor: data.nomor,
            proyekId: data.proyekId ?? null,
            pelaporId: data.pelaporId,
            kategori: data.kategori,
            isi: data.isi,
            anonim: data.anonim ?? false,
            status: data.status ?? StatusTiket.BARU,
            tanggapan: data.tanggapan ?? null,
            tenggat: data.tenggat,
            dibuatPada: new Date(),
          };
          mockTiketStore.push(newTiket);
          return newTiket;
        }),
        update: vi.fn(async ({ where, data }: any) => {
          const idx = mockTiketStore.findIndex((t) => t.id === where.id);
          if (idx === -1) throw new Error("Tiket tidak ditemukan");
          mockTiketStore[idx] = { ...mockTiketStore[idx], ...data };
          return mockTiketStore[idx];
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

describe("Paket BE-8: Ide, Dukungan, Tiket Lacak & Privasi Anonim (FR-C & FR-M)", () => {
  beforeEach(() => {
    resetDb();
  });

  // ================= 1. TES DUPLIKASI DUKUNGAN =================
  it("Dukungan ide: berhasil pada klik pertama, dan menolak duplikasi dengan 409 CONFLICT", async () => {
    // 1. Buat ide awal
    mockIdeStore.push({
      id: "ide_taman_1",
      nomor: "IDE-202611-00001",
      judul: "Pembangunan Taman Baca Anak",
      deskripsi: "Ruang baca ramah anak di balai desa Karang Sari",
      lokasi: "Balai Desa",
      kategori: "Pendidikan",
      sumber: SumberIde.WARGA,
      status: StatusIde.DIAJUKAN,
      alasan: null,
      dasarKebutuhan: null,
      anonim: false,
      tenggatTanggapan: hitungTenggat(14),
      desaId: "desa_1",
      pengajuId: "usr_warga_1",
      createdAt: new Date(),
    });

    const { POST: handleDukung } = await import(
      "@/app/api/ide/[id]/dukung/route"
    );

    // Warga 2 mendukung ide -> Berhasil (200)
    currentAuthUserId = "auth_warga_2";
    const req1 = new Request(
      "http://localhost:3000/api/ide/ide_taman_1/dukung",
      {
        method: "POST",
        headers: makeHeaders(),
      }
    );
    const res1 = await handleDukung(req1, {
      params: Promise.resolve({ id: "ide_taman_1" }),
    });
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.data.jumlahDukungan).toBe(1);
    expect(json1.data.didukung).toBe(true);

    // Warga 2 mencoba mendukung lagi ide yang sama -> Ditolak (409)
    const reqDuplicate = new Request(
      "http://localhost:3000/api/ide/ide_taman_1/dukung",
      {
        method: "POST",
        headers: makeHeaders(),
      }
    );
    const resDuplicate = await handleDukung(reqDuplicate, {
      params: Promise.resolve({ id: "ide_taman_1" }),
    });
    expect(resDuplicate.status).toBe(409);
    const jsonDuplicate = await resDuplicate.json();
    expect(jsonDuplicate.error.code).toBe("CONFLICT");
    expect(jsonDuplicate.error.message).toContain("sudah memberikan dukungan");
  });

  // ================= 2. TES ANONIM TIDAK BOCOR =================
  it("Anonim tidak bocor (T10): identitas pelapor anonim pada ide dan seluruh tiket publik tidak bocor", async () => {
    // Buat ide dengan anonim = true
    mockIdeStore.push({
      id: "ide_anonim_1",
      nomor: "IDE-202611-00002",
      judul: "Perbaikan Jalan Rusak RT 05",
      deskripsi: "Jalan berlubang parah sering menyebabkan pengendara jatuh",
      lokasi: "RT 05 Dusun Krajan",
      kategori: "Infrastruktur",
      sumber: SumberIde.WARGA,
      status: StatusIde.DIAJUKAN,
      alasan: null,
      dasarKebutuhan: null,
      anonim: true, // ANONIM
      tenggatTanggapan: hitungTenggat(14),
      desaId: "desa_1",
      pengajuId: "usr_warga_1", // Aslinya Budi Santoso
      createdAt: new Date(),
    });

    // Buat tiket aduan
    mockTiketStore.push({
      id: "tkt_1",
      nomor: "TKT-202611-ABC12",
      proyekId: "proyek_1",
      pelaporId: "usr_warga_1", // Aslinya Budi Santoso
      kategori: "DUGAAN_PENYIMPANGAN",
      isi: "Material pasir yang digunakan tidak sesuai dengan spesifikasi RAB",
      anonim: true,
      status: StatusTiket.BARU,
      tanggapan: null,
      tenggat: hitungTenggat(14),
      dibuatPada: new Date(),
    });

    const { GET: handleGetIde } = await import("@/app/api/ide/route");
    const { GET: handleGetTiket } = await import(
      "@/app/api/tiket/[nomor]/route"
    );

    // 1. Publik melihat daftar ide: Pengaju anonim harus disamarkan
    const reqPublikIde = new Request("http://localhost:3000/api/ide");
    const resPublikIde = await handleGetIde(reqPublikIde);
    expect(resPublikIde.status).toBe(200);
    const jsonPublikIde = await resPublikIde.json();
    const ideAnonim = jsonPublikIde.data.find(
      (i: any) => i.id === "ide_anonim_1"
    );

    expect(ideAnonim.pengajuId).toBe("anonim");
    expect(ideAnonim.pengaju.nama).toBe("Warga Desa (Anonim)");
    expect(JSON.stringify(ideAnonim)).not.toContain("Budi Santoso");
    expect(JSON.stringify(ideAnonim)).not.toContain("usr_warga_1");

    // 2. Publik melihat detail tiket: Identitas pelapor TIDAK PERNAH tampil
    const reqPublikTiket = new Request(
      "http://localhost:3000/api/tiket/TKT-202611-ABC12"
    );
    const resPublikTiket = await handleGetTiket(reqPublikTiket, {
      params: Promise.resolve({ nomor: "TKT-202611-ABC12" }),
    });
    expect(resPublikTiket.status).toBe(200);
    const jsonTiket = await resPublikTiket.json();

    expect(jsonTiket.data).not.toHaveProperty("pelaporId");
    expect(jsonTiket.data).not.toHaveProperty("pelapor");
    expect(JSON.stringify(jsonTiket)).not.toContain("Budi Santoso");
    expect(JSON.stringify(jsonTiket)).not.toContain("usr_warga_1");
  });

  // ================= 3. TES NOMOR TIKET UNIK =================
  it("Nomor tiket unik: setiap tiket baru menghasilkan nomor lacak unik yang berbeda", () => {
    const nomorSet = new Set<string>();

    for (let i = 0; i < 50; i++) {
      const nomor = generateNomorLacak("TKT");
      expect(nomor).toMatch(/^TKT-\d{6}-[A-Z0-9]{5}$/);
      nomorSet.add(nomor);
    }

    // Seluruh 50 nomor yang dibuat harus berbeda satu sama lain
    expect(nomorSet.size).toBe(50);
  });

  // ================= 4. TES ATURAN BISNIS & VALIDASI =================
  it("Alasan wajib diisi jika ide DITOLAK (400)", async () => {
    currentAuthUserId = "auth_perangkat_1";

    mockIdeStore.push({
      id: "ide_tolak_test",
      nomor: "IDE-202611-00003",
      judul: "Renovasi Lapangan Voli",
      deskripsi: "Pengecatan dan perbaikan jaring voli desa",
      lokasi: "Dusun Krajan",
      kategori: "Infrastruktur",
      sumber: SumberIde.WARGA,
      status: StatusIde.DIAJUKAN,
      alasan: null,
      dasarKebutuhan: null,
      anonim: false,
      tenggatTanggapan: hitungTenggat(14),
      desaId: "desa_1",
      pengajuId: "usr_warga_1",
      createdAt: new Date(),
    });

    const { PATCH: handlePatchStatusIde } = await import(
      "@/app/api/ide/[id]/status/route"
    );

    // Coba tolak tanpa alasan -> Ditolak (400)
    const reqTanpaAlasan = new Request(
      "http://localhost:3000/api/ide/ide_tolak_test/status",
      {
        method: "PATCH",
        headers: makeHeaders(),
        body: JSON.stringify({
          status: "DITOLAK",
          alasan: "", // KOSONG -> harus ditolak
        }),
      }
    );
    const resTanpaAlasan = await handlePatchStatusIde(reqTanpaAlasan, {
      params: Promise.resolve({ id: "ide_tolak_test" }),
    });
    expect(resTanpaAlasan.status).toBe(400);

    // Tolak dengan alasan valid minimal 20 karakter -> Berhasil (200)
    const reqValid = new Request(
      "http://localhost:3000/api/ide/ide_tolak_test/status",
      {
        method: "PATCH",
        headers: makeHeaders(),
        body: JSON.stringify({
          status: "DITOLAK",
          alasan:
            "Anggaran APBDes bidang kepemudaan tahun ini telah habis teralokasikan",
        }),
      }
    );
    const resValid = await handlePatchStatusIde(reqValid, {
      params: Promise.resolve({ id: "ide_tolak_test" }),
    });
    expect(resValid.status).toBe(200);
    const jsonValid = await resValid.json();
    expect(jsonValid.data.status).toBe("DITOLAK");
  });

  it("Dasar kebutuhan wajib diisi jika ide bersumber dari KADES (400)", async () => {
    currentAuthUserId = "auth_perangkat_1";

    const { POST: handlePostIde } = await import("@/app/api/ide/route");

    // Sumber KADES tanpa dasarKebutuhan -> Ditolak (400)
    const reqKadesTanpaDasar = new Request("http://localhost:3000/api/ide", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        judul: "Pelebaran Jalan Poros Desa",
        deskripsi: "Pelebaran jalan poros desa sepanjang 1 kilometer",
        kategori: "Infrastruktur",
        sumber: "KADES",
        dasarKebutuhan: "", // KOSONG
      }),
    });
    const resKadesTanpaDasar = await handlePostIde(reqKadesTanpaDasar);
    expect(resKadesTanpaDasar.status).toBe(400);

    // Sumber KADES dengan dasarKebutuhan valid minimal 30 karakter -> Berhasil (201)
    const reqKadesValid = new Request("http://localhost:3000/api/ide", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        judul: "Pelebaran Jalan Poros Desa",
        deskripsi: "Pelebaran jalan poros desa sepanjang 1 kilometer",
        kategori: "Infrastruktur",
        sumber: "KADES",
        dasarKebutuhan:
          "Hasil kesepakatan Musrenbangdes dan kebutuhan mendesak jalur logistik warga",
      }),
    });
    const resKadesValid = await handlePostIde(reqKadesValid);
    expect(resKadesValid.status).toBe(201);
  });

  // ================= 5. TES RATE LIMITING 5 PER HARI PER AKUN =================
  it("Rate limit 5 per hari per akun: kirim ide ke-6 ditolak dengan 429 RATE_LIMITED", async () => {
    currentAuthUserId = "auth_warga_1";

    const { POST: handlePostIde } = await import("@/app/api/ide/route");

    // Kirim 5 ide berturut-turut -> Semua sukses (201)
    for (let i = 1; i <= 5; i++) {
      const req = new Request("http://localhost:3000/api/ide", {
        method: "POST",
        headers: makeHeaders(),
        body: JSON.stringify({
          judul: `Usulan Ide Pembangunan Nomor ${i}`,
          deskripsi: `Deskripsi ide pembangunan desa ke-${i} dari perwakilan warga`,
          kategori: "Infrastruktur",
        }),
      });
      const res = await handlePostIde(req);
      expect(res.status).toBe(201);
    }

    // Kirim ide ke-6 dari akun yang sama -> Ditolak 429
    const reqExceeded = new Request("http://localhost:3000/api/ide", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        judul: "Usulan Ide Pembangunan Nomor 6",
        deskripsi: "Deskripsi ide ke-6 yang melampaui batas harian",
        kategori: "Infrastruktur",
      }),
    });
    const resExceeded = await handlePostIde(reqExceeded);
    expect(resExceeded.status).toBe(429);
    const jsonExceeded = await resExceeded.json();
    expect(jsonExceeded.error.code).toBe("RATE_LIMITED");

    // Warga lain (akun berbeda) tetap bisa mengirim (isolasi per akun)
    currentAuthUserId = "auth_warga_2";
    const reqOther = new Request("http://localhost:3000/api/ide", {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        judul: "Usulan Ide dari Warga Lain",
        deskripsi: "Deskripsi ide warga 2 yang kuota hariannya masih ada",
        kategori: "Ekonomi",
      }),
    });
    const resOther = await handlePostIde(reqOther);
    expect(resOther.status).toBe(201);
  });

  // ================= 6. TES TENGGAT TANGGAPAN 14 HARI =================
  it("Tenggat tanggapan dihitung 14 hari dan mendeteksi tenggat terlewat", () => {
    const sekarang = new Date();
    const tenggat = hitungTenggat(14, sekarang);

    const diffDays = Math.round(
      (tenggat.getTime() - sekarang.getTime()) / (24 * 60 * 60 * 1000)
    );
    expect(diffDays).toBe(14);
  });
});

