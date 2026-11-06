import {
  Prisma,
  StatusAnalisis,
  JenisFlag,
  KeputusanFlag,
} from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./api";
import { tulisAudit } from "./audit";
import { cariAnggotaTumpangTindih } from "./overlap";
import { hitungKemiripan } from "./similarity";
import { ringkasProposalAi } from "./ai/summarizer";
import { hitungSkor, type HitungSkorResult } from "./scoring";

export interface AnalisisOptions {
  ulang?: boolean;
  aktorId?: string | null;
}

export interface HasilAnalisisProposal {
  ringkasan: Record<string, unknown> | null;
  skor: HitungSkorResult;
  flags: string[];
  statusAnalisis: StatusAnalisis;
}

function hitungJumlahKelengkapan(kelengkapan: unknown): number {
  if (typeof kelengkapan === "number") {
    return Math.min(5, Math.max(0, kelengkapan));
  }
  if (kelengkapan && typeof kelengkapan === "object") {
    if (Array.isArray(kelengkapan)) {
      return Math.min(5, kelengkapan.length);
    }
    const count = Object.values(kelengkapan).filter(Boolean).length;
    return Math.min(5, count);
  }
  return 0;
}

/**
 * Service utama analisis proposal sayembara:
 * Menggabungkan deteksi tumpang tindih anggota, kemiripan teks narasi,
 * kalkulasi skor aturan murni, serta pembuatan ringkasan AI.
 *
 * Ketahanan (PRD FR-F6 & AGENTS.md Aturan 5):
 * Jika AI gagal, skor dan flag TETAP tersimpan di database dan status menjadi GAGAL.
 */
export async function analisisProposal(
  proposalId: string,
  options?: AnalisisOptions
): Promise<HasilAnalisisProposal> {
  // 1. Muat proposal beserta proyek dan kelompoknya
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      proyek: true,
      kelompok: {
        include: {
          anggota: true,
        },
      },
      ringkasan: true,
      skor: true,
      flagA: true,
      flagB: true,
    },
  });

  if (!proposal) {
    throw new ApiError(
      "NOT_FOUND",
      `Proposal dengan ID '${proposalId}' tidak ditemukan.`,
      undefined,
      404
    );
  }

  // 2. Cegah analisis ganda jika tidak menyertakan opsi 'ulang: true'
  const sudahDianalisis =
    proposal.statusAnalisis === StatusAnalisis.BERHASIL ||
    Boolean(proposal.skor && proposal.ringkasan);

  if (sudahDianalisis && !options?.ulang) {
    throw new ApiError(
      "CONFLICT",
      "Proposal ini sudah pernah dianalisis. Sertakan parameter 'ulang: true' jika ingin melakukan analisis ulang.",
      undefined,
      409
    );
  }

  const proyek = proposal.proyek;

  // 3. Deteksi tumpang tindih anggota (overlap.ts)
  const flagAnggotaBaru = await cariAnggotaTumpangTindih(proyek.id);
  for (const flag of flagAnggotaBaru) {
    // Simpan hanya jika flag melibatkan proposal ini
    if (flag.proposalAId === proposal.id || flag.proposalBId === proposal.id) {
      const existing = await prisma.flagKemiripan.findFirst({
        where: {
          proyekId: proyek.id,
          jenis: JenisFlag.ANGGOTA,
          OR: [
            { proposalAId: flag.proposalAId, proposalBId: flag.proposalBId },
            { proposalAId: flag.proposalBId, proposalBId: flag.proposalAId },
          ],
        },
      });

      if (!existing) {
        await prisma.flagKemiripan.create({
          data: {
            proyekId: proyek.id,
            proposalAId: flag.proposalAId,
            proposalBId: flag.proposalBId,
            jenis: JenisFlag.ANGGOTA,
            nilai: flag.nilai,
            keputusan: KeputusanFlag.BELUM,
            catatan: flag.catatan,
          },
        });
      }
    }
  }

  // 4. Deteksi kemiripan teks narasi (similarity.ts)
  const flagTeksBaru = await hitungKemiripan(proyek.id);
  for (const flag of flagTeksBaru) {
    if (flag.proposalAId === proposal.id || flag.proposalBId === proposal.id) {
      const existing = await prisma.flagKemiripan.findFirst({
        where: {
          proyekId: proyek.id,
          jenis: JenisFlag.TEKS,
          OR: [
            { proposalAId: flag.proposalAId, proposalBId: flag.proposalBId },
            { proposalAId: flag.proposalBId, proposalBId: flag.proposalAId },
          ],
        },
      });

      if (!existing) {
        await prisma.flagKemiripan.create({
          data: {
            proyekId: proyek.id,
            proposalAId: flag.proposalAId,
            proposalBId: flag.proposalBId,
            jenis: JenisFlag.TEKS,
            nilai: flag.nilai,
            keputusan: KeputusanFlag.BELUM,
            catatan: flag.catatan,
          },
        });
      }
    }
  }

  // 5. Muat flag aktual yang terhubung ke proposal ini
  const flagsTersimpan = await prisma.flagKemiripan.findMany({
    where: {
      proyekId: proyek.id,
      OR: [{ proposalAId: proposal.id }, { proposalBId: proposal.id }],
    },
  });

  const databaseFlagMessages = flagsTersimpan.map(
    (f) => f.catatan || `Flag ${f.jenis} (${f.nilai})`
  );

  // 6. Hitung skor murni (scoring.ts) sesuai PRD Bagian 25
  const kelengkapanPoin = hitungJumlahKelengkapan(proposal.kelengkapan);

  let skorHasil: HitungSkorResult;
  try {
    skorHasil = hitungSkor({
      pagu: Number(proyek.pagu),
      penawaran: Number(proposal.penawaran),
      tenagaTotal: proposal.tenagaTotal,
      tenagaLokal: proposal.tenagaLokal,
      durasi: proposal.durasiHari,
      durasiMin: proyek.durasiMin,
      durasiMax: proyek.durasiMax,
      kelengkapan: kelengkapanPoin,
      syaratLokalMin: proyek.syaratLokalMin,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Penawaran tidak valid.";
    skorHasil = {
      total: 0,
      rincian: { biaya: 0, lokal: 0, jadwal: 0, lengkap: 0 },
      flags: [msg],
      versiBobot: "v1",
    };
  }

  const mergedFlags = Array.from(
    new Set([...skorHasil.flags, ...databaseFlagMessages])
  );
  skorHasil.flags = mergedFlags;

  // 7. Simpan record Skor ke database (upsert)
  const existingSkor = await prisma.skor.findUnique({
    where: { proposalId: proposal.id },
  });

  if (existingSkor) {
    await prisma.skor.update({
      where: { proposalId: proposal.id },
      data: {
        total: skorHasil.total,
        rincian: skorHasil.rincian as unknown as Prisma.InputJsonValue,
        flags: mergedFlags as unknown as Prisma.InputJsonValue,
        versiBobot: skorHasil.versiBobot,
      },
    });
  } else {
    await prisma.skor.create({
      data: {
        proposalId: proposal.id,
        total: skorHasil.total,
        rincian: skorHasil.rincian as unknown as Prisma.InputJsonValue,
        flags: mergedFlags as unknown as Prisma.InputJsonValue,
        versiBobot: skorHasil.versiBobot,
      },
    });
  }

  // 8. Eksekusi ringkasan AI (ai/summarizer.ts)
  let ringkasanData: Record<string, unknown> | null = null;
  let statusAkhir: StatusAnalisis = StatusAnalisis.BERHASIL;

  try {
    const hasilAi = await ringkasProposalAi({
      narasiMetode: proposal.narasiMetode,
      narasiJadwal: proposal.narasiJadwal,
      narasiRisiko: proposal.narasiRisiko,
      namaKelompok: proposal.kelompok.nama,
      judulProyek: proyek.judul,
    });

    if (hasilAi) {
      ringkasanData = hasilAi.json as unknown as Record<string, unknown>;

      const existingRingkasan = await prisma.ringkasanAi.findUnique({
        where: { proposalId: proposal.id },
      });

      if (existingRingkasan) {
        await prisma.ringkasanAi.update({
          where: { proposalId: proposal.id },
          data: {
            json: hasilAi.json as unknown as Prisma.InputJsonValue,
            model: hasilAi.model,
            versiPrompt: hasilAi.versiPrompt,
          },
        });
      } else {
        await prisma.ringkasanAi.create({
          data: {
            proposalId: proposal.id,
            json: hasilAi.json as unknown as Prisma.InputJsonValue,
            model: hasilAi.model,
            versiPrompt: hasilAi.versiPrompt,
          },
        });
      }
    } else {
      // AI gagal setelah retry & fallback model
      statusAkhir = StatusAnalisis.GAGAL;
    }
  } catch (errAi) {
    console.error("[ANALISIS_AI_FAILED] Kegagalan proses AI:", errAi);
    statusAkhir = StatusAnalisis.GAGAL;
  }

  // 9. Perbarui statusAnalisis pada proposal
  await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      statusAnalisis: statusAkhir,
    },
  });

  // 10. Catat ke AuditLog
  await tulisAudit({
    aktorId: options?.aktorId ?? null,
    aksi: "ANALISIS_PROPOSAL",
    entitas: "Proposal",
    entitasId: proposal.id,
    sesudah: {
      skorTotal: skorHasil.total,
      statusAnalisis: statusAkhir,
      jumlahFlag: mergedFlags.length,
      aiSukses: statusAkhir === StatusAnalisis.BERHASIL,
    },
  });

  return {
    ringkasan: ringkasanData,
    skor: skorHasil,
    flags: mergedFlags,
    statusAnalisis: statusAkhir,
  };
}
