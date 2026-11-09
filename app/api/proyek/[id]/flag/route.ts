import { Peran } from "@prisma/client";
import { prisma, serializeBigInt } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireRole, requireAktif } from "@/lib/auth";
import { sanitasiKelompok } from "@/lib/nik";

export const GET = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    // 1. Otorisasi peran: PERANGKAT, PENGAWAS, ADMIN (PRD 33.2 #17)
    const actor = await requireAuth(req);
    requireRole(actor, Peran.PERANGKAT, Peran.PENGAWAS, Peran.ADMIN);
    requireAktif(actor);

    const { id: proyekId } = await context.params;

    // 2. Pastikan proyek ada
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

    // 3. Ambil seluruh flag kemiripan proyek
    const flags = await prisma.flagKemiripan.findMany({
      where: { proyekId },
      include: {
        proposalA: {
          include: {
            kelompok: {
              include: {
                ketua: true,
                anggota: true,
              },
            },
          },
        },
        proposalB: {
          include: {
            kelompok: {
              include: {
                ketua: true,
                anggota: true,
              },
            },
          },
        },
      },
      orderBy: {
        nilai: "desc",
      },
    });

    // 4. Sanitasi data identitas pada kelompok (FR-ID1: jangan bocorkan nikHash)
    const cleanedFlags = flags.map((f) => ({
      ...f,
      proposalA: {
        ...f.proposalA,
        kelompok: sanitasiKelompok(f.proposalA.kelompok),
      },
      proposalB: {
        ...f.proposalB,
        kelompok: sanitasiKelompok(f.proposalB.kelompok),
      },
    }));

    return ok(serializeBigInt(cleanedFlags), {
      total: cleanedFlags.length,
    });
  }
);

