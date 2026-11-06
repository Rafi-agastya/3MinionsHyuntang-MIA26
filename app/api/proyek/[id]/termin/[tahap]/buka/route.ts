import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { Peran } from "@prisma/client";

const bukaTerminSchema = z
  .object({
    progresFisik: z.number().min(0).max(100).optional(),
    catatan: z.string().max(500).optional().nullable(),
  })
  .optional();

export const PATCH = apiHandler(
  async (
    req,
    { params }: { params: Promise<{ id: string; tahap: string }> }
  ) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PENGAWAS, Peran.ADMIN);

    const { id: proyekId, tahap } = await params;
    const tahapNum = parseInt(tahap, 10);
    if (isNaN(tahapNum)) {
      throw new ApiError("VALIDATION_ERROR", "Tahap termin harus berupa angka");
    }

    const bodyJson = await req.json().catch(() => ({}));
    const body = bukaTerminSchema.parse(bodyJson) || {};

    const proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
    });
    if (!proyek) {
      throw new ApiError("NOT_FOUND", "Proyek tidak ditemukan");
    }

    const termin = await prisma.termin.findFirst({
      where: {
        proyekId: proyek.id,
        tahap: tahapNum,
      },
    });

    if (!termin) {
      throw new ApiError(
        "NOT_FOUND",
        `Termin tahap ${tahapNum} tidak ditemukan pada proyek ini`
      );
    }

    if (termin.terbuka) {
      return ok({
        id: termin.id,
        proyekId: termin.proyekId,
        tahap: termin.tahap,
        nilai: Number(termin.nilai),
        terbuka: termin.terbuka,
        pesan: "Termin sudah berstatus terbuka",
      });
    }

    // Ambang batas progres fisik untuk membuka termin berikutnya:
    // Tahap 1: 0% (uang muka/awal pengerjaan)
    // Tahap 2+: jika ditentukan progresFisik, periksa kecukupan progres
    if (tahapNum > 1 && body.progresFisik !== undefined) {
      const ambangMin = (tahapNum - 1) * 30; // misal Tahap 2 butuh minimal 30%
      if (body.progresFisik < ambangMin) {
        throw new ApiError(
          "CONFLICT",
          `Progres fisik terverifikasi (${body.progresFisik}%) belum mencapai ambang minimal untuk membuka termin tahap ${tahapNum} (${ambangMin}%)`
        );
      }
    }

    const updated = await prisma.termin.update({
      where: { id: termin.id },
      data: { terbuka: true },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "BUKA_TERMIN",
      entitas: "TERMIN",
      entitasId: updated.id,
      sebelum: { terbuka: false },
      sesudah: {
        terbuka: true,
        tahap: updated.tahap,
        proyekId: proyek.id,
        catatan: body.catatan,
      },
    });

    return ok({
      id: updated.id,
      proyekId: updated.proyekId,
      tahap: updated.tahap,
      nilai: Number(updated.nilai),
      terbuka: updated.terbuka,
    });
  }
);

