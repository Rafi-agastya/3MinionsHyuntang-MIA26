import { z } from "zod";
import { Peran, StatusAnalisis } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, fail, ApiError } from "@/lib/api";
import { requireAuth, requireRole, requireAktif } from "@/lib/auth";
import { assertRateLimit } from "@/lib/ratelimit";
import { analisisProposal } from "@/lib/analisis";

const analisisRequestSchema = z.object({
  ulang: z.boolean().optional(),
});

export const POST = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    // 1. Otorisasi peran: hanya PERANGKAT atau ADMIN (PRD 33.2 #16)
    const actor = await requireAuth(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);
    requireAktif(actor);

    const { id: proposalId } = await context.params;

    // 2. Ambil informasi proposal untuk identifikasi desa
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { proyek: true },
    });

    if (!proposal) {
      throw new ApiError(
        "NOT_FOUND",
        `Proposal dengan ID '${proposalId}' tidak ditemukan.`,
        undefined,
        404
      );
    }

    // 3. Batas Permintaan / Rate Limit (PRD 35.4)
    // - 1 per menit per proposal
    assertRateLimit(
      `analisis:prop:${proposalId}`,
      1,
      60,
      "Analisis proposal dibatasi maksimal 1 kali per menit per proposal."
    );

    // - 20 per hari per desa
    assertRateLimit(
      `analisis:desa:${proposal.proyek.desaId}`,
      20,
      86400,
      "Batas harian analisis proposal desa (20 per hari) telah tercapai."
    );

    // 4. Parse request body
    let rawBody = {};
    try {
      rawBody = await req.json();
    } catch {
      // Body kosong diperbolehkan (default ulang: false)
    }
    const body = analisisRequestSchema.parse(rawBody);

    // 5. Jalankan alur analisis lengkap
    const hasil = await analisisProposal(proposalId, {
      ulang: body.ulang,
      aktorId: actor.id,
    });

    // 6. Jika AI gagal, sistem mengembalikan kode 502 AI_FAILED sesuai PRD 33.2 #16,
    // namun data skor dan flag tetap tersimpan.
    if (hasil.statusAnalisis === StatusAnalisis.GAGAL) {
      return fail(
        "AI_FAILED",
        "Pemanggilan model AI gagal setelah model cadangan dicoba, namun perhitungan skor dan deteksi flag tetap tersimpan.",
        {
          skor: hasil.skor,
          flags: hasil.flags,
        },
        502
      );
    }

    // 7. Respons sukses 200
    return ok({
      ringkasan: hasil.ringkasan,
      skor: hasil.skor,
      flags: hasil.flags,
    });
  }
);

