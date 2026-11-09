import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { Peran, StatusIde } from "@prisma/client";

const patchStatusIdeSchema = z.object({
  status: z.nativeEnum(StatusIde, {
    errorMap: () => ({
      message:
        "Status ide harus salah satu dari: DIAJUKAN, VERIFIKASI, DITERIMA, DITOLAK, JADI_PROYEK",
    }),
  }),
  alasan: z.string().max(1000, "Alasan maksimal 1000 karakter").optional().nullable(),
});

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await requireAuth(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id: ideId } = await params;
    const bodyJson = await req.json();
    const body = patchStatusIdeSchema.parse(bodyJson);

    const ide = await prisma.ide.findUnique({
      where: { id: ideId },
    });

    if (!ide) {
      throw new ApiError("NOT_FOUND", "Ide/aduan tidak ditemukan");
    }

    // Aturan FR-C3 & Bagian 33.2 #10: Alasan wajib diisi jika status DITOLAK
    if (body.status === StatusIde.DITOLAK) {
      if (!body.alasan || body.alasan.trim().length < 20) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Alasan penolakan minimal 20 karakter wajib diisi ketika menolak ide/aduan warga.",
          {
            alasan: [
              "Alasan penolakan minimal 20 karakter wajib disertakan saat status DITOLAK",
            ],
          },
          400
        );
      }
    }

    const updated = await prisma.ide.update({
      where: { id: ide.id },
      data: {
        status: body.status,
        alasan: body.alasan ?? ide.alasan,
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "UBAH_STATUS_IDE",
      entitas: "IDE",
      entitasId: ide.id,
      sebelum: { status: ide.status, alasan: ide.alasan },
      sesudah: { status: updated.status, alasan: updated.alasan },
    });

    return ok({
      id: updated.id,
      nomor: updated.nomor,
      status: updated.status,
      alasan: updated.alasan,
    });
  }
);

