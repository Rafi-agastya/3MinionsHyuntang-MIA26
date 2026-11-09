import { z } from "zod";
import { Peran, StatusProyek, StatusAnalisis } from "@prisma/client";
import { prisma, serializeBigInt } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireAuth, requireAktif, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { sanitasiKelompok } from "@/lib/nik";
import {
  evaluasiKelengkapanProposal,
  isProyekMasaSanggahOrAfter,
} from "@/lib/proposal";
import {
  isPdfBuffer,
  unggahDokumenProposal,
  MAX_PDF_SIZE_BYTES,
  MAX_DOCUMENTS_PER_PROPOSAL,
} from "@/lib/storage";
import { hitungSkor, type HitungSkorResult } from "@/lib/scoring";

// Skema validasi proposal Zod (PRD 33.3 & PRD 35.2)
const ajukanProposalSchema = z.object({
  kelompokId: z
    .string({ required_error: "ID kelompok wajib diisi." })
    .min(1, "ID kelompok tidak boleh kosong."),
  paketId: z.string().optional().nullable(),
  penawaran: z.coerce
    .number({ required_error: "Nilai penawaran wajib diisi." })
    .int("Nilai penawaran harus berupa bilangan bulat.")
    .positive("Nilai penawaran harus lebih besar dari 0."),
  durasiHari: z.coerce
    .number({ required_error: "Durasi hari wajib diisi." })
    .int("Durasi harus berupa bilangan bulat.")
    .min(1, "Durasi minimal 1 hari.")
    .max(730, "Durasi maksimal 730 hari."),
  tenagaTotal: z.coerce
    .number({ required_error: "Total tenaga kerja wajib diisi." })
    .int("Total tenaga kerja harus berupa bilangan bulat.")
    .min(1, "Total tenaga kerja minimal 1 orang.")
    .max(500, "Total tenaga kerja maksimal 500 orang."),
  tenagaLokal: z.coerce
    .number({ required_error: "Tenaga kerja lokal wajib diisi." })
    .int("Tenaga lokal harus berupa bilangan bulat.")
    .min(0, "Tenaga kerja lokal minimal 0 orang.")
    .max(500, "Tenaga kerja lokal maksimal 500 orang."),
  narasiMetode: z
    .string({ required_error: "Narasi metode kerja wajib diisi." })
    .min(100, "Narasi metode kerja minimal 100 karakter.")
    .max(3000, "Narasi metode kerja maksimal 3000 karakter."),
  narasiJadwal: z
    .string({ required_error: "Narasi jadwal wajib diisi." })
    .min(50, "Narasi jadwal minimal 50 karakter.")
    .max(2000, "Narasi jadwal maksimal 2000 karakter."),
  narasiRisiko: z
    .string({ required_error: "Narasi manajemen risiko wajib diisi." })
    .min(30, "Narasi risiko minimal 30 karakter.")
    .max(2000, "Narasi risiko maksimal 2000 karakter."),
  dokumen: z.array(z.string()).optional(),
});

function parseKelengkapanCount(kelengkapan: unknown): number {
  if (typeof kelengkapan === "number") {
    return Math.min(5, Math.max(0, kelengkapan));
  }
  if (kelengkapan && typeof kelengkapan === "object") {
    if (Array.isArray(kelengkapan)) {
      return Math.min(5, kelengkapan.length);
    }
    const trueCount = Object.values(kelengkapan).filter(Boolean).length;
    return Math.min(5, trueCount);
  }
  return 0;
}

// ================= POST: AJUKAN PROPOSAL =================
export const POST = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    // 1. Autentikasi dan pengecekan status akun aktif serta peran WARGA
    const user = await requireAuth(req);
    requireRole(user, Peran.WARGA);
    requireAktif(user);

    const { id: proyekId } = await context.params;

    // 2. Ambil data proyek dari database
    const proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
    });

    if (!proyek) {
      throw new ApiError(
        "NOT_FOUND",
        `Proyek dengan ID '${proyekId}' tidak ditemukan.`,
        undefined,
        404
      );
    }

    // 3. Validasi status proyek: hanya boleh TENDER_DIBUKA
    if (proyek.status !== StatusProyek.TENDER_DIBUKA) {
      throw new ApiError(
        "CONFLICT",
        `Pengajuan proposal hanya dapat dilakukan pada saat status proyek TENDER_DIBUKA (status saat ini: ${proyek.status}).`,
        undefined,
        409
      );
    }

    // 4. Validasi tenggat waktu proposal
    if (proyek.tenggatProposal && new Date() > new Date(proyek.tenggatProposal)) {
      throw new ApiError(
        "CONFLICT",
        "Tenggat waktu pengiriman proposal untuk proyek ini telah berakhir.",
        undefined,
        409
      );
    }

    // 5. Ekstraksi data (mendukung application/json dan multipart/form-data)
    let rawBody: Record<string, unknown> = {};
    const uploadedBuffers: { buffer: Buffer; fileName: string }[] = [];

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      rawBody = {
        kelompokId: formData.get("kelompokId"),
        paketId: formData.get("paketId") || null,
        penawaran: formData.get("penawaran"),
        durasiHari: formData.get("durasiHari"),
        tenagaTotal: formData.get("tenagaTotal"),
        tenagaLokal: formData.get("tenagaLokal"),
        narasiMetode: formData.get("narasiMetode"),
        narasiJadwal: formData.get("narasiJadwal"),
        narasiRisiko: formData.get("narasiRisiko"),
      };

      const fileEntries = formData.getAll("dokumen");
      for (const entry of fileEntries) {
        if (entry instanceof Blob) {
          const file = entry as File;
          const arrayBuffer = await file.arrayBuffer();
          uploadedBuffers.push({
            buffer: Buffer.from(arrayBuffer),
            fileName: file.name || "dokumen.pdf",
          });
        }
      }
    } else {
      rawBody = await req.json();
    }

    // 6. Validasi skema Zod
    const body = ajukanProposalSchema.parse(rawBody);

    // 7. Validasi penawaran <= pagu anggaran proyek (PRD Kasus Uji T02)
    const paguProyek = Number(proyek.pagu);
    if (body.penawaran > paguProyek) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `Nilai penawaran (Rp${body.penawaran.toLocaleString(
          "id-ID"
        )}) tidak boleh melebihi pagu anggaran proyek (Rp${paguProyek.toLocaleString(
          "id-ID"
        )}).`,
        { penawaran: ["Penawaran melebihi pagu anggaran proyek."] },
        400
      );
    }

    // 8. Validasi serapan tenaga kerja lokal <= total tenaga kerja
    if (body.tenagaLokal > body.tenagaTotal) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Jumlah tenaga kerja lokal tidak boleh melebihi total tenaga kerja.",
        { tenagaLokal: ["Tenaga lokal tidak boleh melebihi tenaga total."] },
        400
      );
    }

    // 9. Validasi kelompok dan kepemimpinan (hanya ketua kelompok yang berhak)
    const kelompok = await prisma.kelompok.findUnique({
      where: { id: body.kelompokId },
      include: { anggota: true },
    });

    if (!kelompok) {
      throw new ApiError(
        "NOT_FOUND",
        "Kelompok pengaju tidak ditemukan dalam sistem.",
        { kelompokId: ["Kelompok tidak valid."] },
        404
      );
    }

    if (kelompok.ketuaId !== user.id) {
      throw new ApiError(
        "FORBIDDEN",
        "Hanya ketua kelompok yang memiliki hak akses untuk mengajukan proposal.",
        undefined,
        403
      );
    }

    // 10. Validasi satu proposal per kelompok per proyek
    const existingProposal = await prisma.proposal.findUnique({
      where: {
        proyekId_kelompokId: {
          proyekId: proyek.id,
          kelompokId: kelompok.id,
        },
      },
    });

    if (existingProposal) {
      throw new ApiError(
        "CONFLICT",
        "Kelompok Anda sudah mengajukan proposal untuk proyek ini.",
        undefined,
        409
      );
    }

    // 11. Pemeriksaan dan pengunggahan dokumen PDF (berdasarkan isi berkas / magic bytes)
    const dokumenPaths: string[] = [];

    // Jika ada berkas terunggah langsung via multipart
    if (uploadedBuffers.length > MAX_DOCUMENTS_PER_PROPOSAL) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `Jumlah berkas dokumen maksimal ${MAX_DOCUMENTS_PER_PROPOSAL} berkas.`,
        { dokumen: ["Terlalu banyak berkas dokumen."] },
        400
      );
    }

    const tempProposalId = `prop_${Date.now()}`;
    for (const item of uploadedBuffers) {
      if (item.buffer.length > MAX_PDF_SIZE_BYTES) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Ukuran berkas dokumen melebihi batas maksimal 10 MB.",
          { dokumen: ["Ukuran berkas maksimal 10 MB."] },
          400
        );
      }

      // Validasi tipe berkas berdasarkan ISI BERKAS (magic bytes %PDF-), bukan sekadar ekstensi
      if (!isPdfBuffer(item.buffer)) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Berkas dokumen wajib berformat PDF asli yang valid.",
          { dokumen: ["Isi berkas bukan dokumen PDF yang valid."] },
          400
        );
      }

      const pathStorage = await unggahDokumenProposal({
        proposalId: tempProposalId,
        buffer: item.buffer,
      });
      dokumenPaths.push(pathStorage);
    }

    // Jika ada daftar dokumen yang sudah dikirim berupa string path dari JSON
    if (body.dokumen && Array.isArray(body.dokumen)) {
      for (const doc of body.dokumen) {
        if (typeof doc === "string" && doc.trim().length > 0) {
          dokumenPaths.push(doc.trim());
        }
      }
    }

    // 12. PENTING: Evaluasi kelengkapan dihitung murni di SERVER (jangan terima dari klien)
    const jumlahAnggotaLengkap = (kelompok.anggota || []).filter(
      (a) => a.nama && a.nama.trim().length >= 3 && a.rtRw
    ).length;

    const evaluasiKelengkapan = evaluasiKelengkapanProposal({
      narasiMetode: body.narasiMetode,
      narasiJadwal: body.narasiJadwal,
      narasiRisiko: body.narasiRisiko,
      jumlahAnggotaLengkap,
      adaDokumenPengalaman: dokumenPaths.length > 0,
    });

    // 13. Simpan proposal ke basis data
    const proposal = await prisma.proposal.create({
      data: {
        proyekId: proyek.id,
        kelompokId: kelompok.id,
        penawaran: BigInt(body.penawaran),
        durasiHari: body.durasiHari,
        tenagaTotal: body.tenagaTotal,
        tenagaLokal: body.tenagaLokal,
        narasiMetode: body.narasiMetode.trim(),
        narasiJadwal: body.narasiJadwal.trim(),
        narasiRisiko: body.narasiRisiko.trim(),
        dokumen: dokumenPaths,
        kelengkapan: evaluasiKelengkapan.rincian,
        statusAnalisis: StatusAnalisis.MENUNGGU,
      },
    });

    // 14. Catat riwayat keputusan ke AuditLog
    await tulisAudit({
      aktorId: user.id,
      aksi: "AJUKAN_PROPOSAL",
      entitas: "Proposal",
      entitasId: proposal.id,
      sesudah: {
        id: proposal.id,
        proyekId: proyek.id,
        kelompokId: kelompok.id,
        penawaran: body.penawaran,
        durasiHari: body.durasiHari,
        statusAnalisis: proposal.statusAnalisis,
        kelengkapan: evaluasiKelengkapan.rincian,
      },
    });

    // 15. Kembalikan respons 201 sesuai PRD 33.2 #14
    return ok(
      {
        id: proposal.id,
        statusAnalisis: StatusAnalisis.MENUNGGU,
      },
      undefined,
      201
    );
  }
);

// ================= GET: DAFTAR PROPOSAL DENGAN ATURAN VISIBILITAS =================
export const GET = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id: proyekId } = await context.params;

    // 1. Ambil data proyek
    let proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
    });

    if (!proyek && (proyekId === "seed_proyek_001" || proyekId === "default")) {
      proyek = await prisma.proyek.findFirst();
    }

    if (!proyek) {
      throw new ApiError(
        "NOT_FOUND",
        `Proyek dengan ID '${proyekId}' tidak ditemukan`,
        undefined,
        404
      );
    }

    // 2. Ambil sesi pengguna saat ini (bisa null jika pengunjung publik anonim)
    const actor = await getPengguna(req);

    // 3. Ambil seluruh proposal proyek dari basis data
    const allProposals = await prisma.proposal.findMany({
      where: { proyekId: proyek.id },
      include: {
        kelompok: {
          include: {
            ketua: true,
            anggota: true,
          },
        },
        ringkasan: true,
        skor: true,
        flagA: true,
        flagB: true,
      },
      orderBy: {
        dikirimPada: "asc",
      },
    });

    const isTerbukaPublik = isProyekMasaSanggahOrAfter(proyek.status);

    // 4. Terapkan Aturan Visibilitas PRD 33.2 Aturan #15 & RBAC:
    // - PERANGKAT, PENGAWAS, ADMIN: melihat semua proposal.
    // - WARGA: jika belum MASA_SANGGAH, hanya melihat proposal kelompoknya; jika sudah MASA_SANGGAH, melihat semua.
    // - PUBLIK: jika belum MASA_SANGGAH, hanya melihat total jumlah proposal; jika sudah MASA_SANGGAH, melihat semua.
    let visibleProposals = allProposals;

    const isPerangkatOrAdmin =
      actor &&
      (actor.peran === Peran.PERANGKAT ||
        actor.peran === Peran.PENGAWAS ||
        actor.peran === Peran.ADMIN);

    if (isPerangkatOrAdmin) {
      // Akses penuh
      visibleProposals = allProposals;
    } else if (actor && actor.peran === Peran.WARGA) {
      if (!isTerbukaPublik) {
        // Hanya proposal milik kelompok warga yang bersangkutan
        visibleProposals = allProposals.filter((p) => {
          const isKetua = p.kelompok.ketuaId === actor.id;
          const isAnggota = (p.kelompok.anggota || []).some(
            (ang) => ang.penggunaId === actor.id
          );
          return isKetua || isAnggota;
        });
      }
    } else {
      // Pengunjung publik tanpa login
      if (!isTerbukaPublik) {
        // Sebelum masa sanggah: HANYA melihat jumlah proposal masuk, data rincian kosong
        return ok([], {
          total: allProposals.length,
          keterangan:
            "Daftar rincian dan skor proposal akan dibuka untuk publik setelah mencapai tahap masa sanggah.",
        });
      }
    }

    // 5. Hitung skor untuk proposal yang terlihat dan sanitasi data identitas (FR-ID1)
    const proposalsWithScoring = visibleProposals.map((proposal) => {
      let scoringResult: HitungSkorResult;

      try {
        scoringResult = hitungSkor({
          pagu: Number(proyek.pagu),
          penawaran: Number(proposal.penawaran),
          tenagaTotal: proposal.tenagaTotal,
          tenagaLokal: proposal.tenagaLokal,
          durasi: proposal.durasiHari,
          durasiMin: proyek.durasiMin,
          durasiMax: proyek.durasiMax,
          kelengkapan: parseKelengkapanCount(proposal.kelengkapan),
          syaratLokalMin: proyek.syaratLokalMin,
        });
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : "Penawaran tidak valid";
        scoringResult = {
          total: 0,
          rincian: { biaya: 0, lokal: 0, jadwal: 0, lengkap: 0 },
          flags: [errMsg],
          versiBobot: "v1",
        };
      }

      const databaseFlags = [
        ...(proposal.flagA || []).map(
          (f) => f.catatan || `Flag ${f.jenis}: ${f.nilai}`
        ),
        ...(proposal.flagB || []).map(
          (f) => f.catatan || `Flag ${f.jenis}: ${f.nilai}`
        ),
      ];

      const mergedFlags = Array.from(
        new Set([...scoringResult.flags, ...databaseFlags])
      );

      // Sanitasi kelompok: NIK dan nikHash TIDAK PERNAH dikembalikan ke klien (FR-ID1)
      const cleanKelompok = sanitasiKelompok(proposal.kelompok);

      return {
        ...proposal,
        kelompok: cleanKelompok,
        flags: mergedFlags,
        scoring: {
          total: scoringResult.total,
          rincian: scoringResult.rincian,
          flags: mergedFlags,
          versiBobot: scoringResult.versiBobot,
        },
      };
    });

    return ok(serializeBigInt(proposalsWithScoring), {
      total: visibleProposals.length,
      totalMasuk: allProposals.length,
    });
  }
);
