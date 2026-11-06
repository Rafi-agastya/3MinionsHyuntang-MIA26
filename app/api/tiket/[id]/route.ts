import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { Peran, StatusTiket } from "@prisma/client";

const patchTiketSchema = z.object({
  status: z.nativeEnum(StatusTiket, {
    errorMap: () => ({
      message:
        "Status tiket harus salah satu dari: BARU, DITINJAU, DITANGGAPI, SELESAI",
    }),
  }),
  tanggapan: z
    .string()
    .min(10, "Tanggapan resmi minimal 10 karakter")
    .max(2000, "Tanggapan resmi maksimal 2000 karakter")
    .optional()
    .nullable(),
});

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await requireAuth(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id: tiketId } = await params;
    const bodyJson = await req.json();
    const body = patchTiketSchema.parse(bodyJson);

    const tiket = await prisma.tiket.findUnique({
      where: { id: tiketId },
    });

    if (!tiket) {
      throw new ApiError("NOT_FOUND", "Tiket aduan tidak ditemukan");
    }

    const updated = await prisma.tiket.update({
      where: { id: tiket.id },
      data: {
        status: body.status,
        tanggapan: body.tanggapan ?? tiket.tanggapan,
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "UBAH_STATUS_TIKET",
      entitas: "TIKET",
      entitasId: tiket.id,
      sebelum: { status: tiket.status, tanggapan: tiket.tanggapan },
      sesudah: { status: updated.status, tanggapan: updated.tanggapan },
    });

    return ok({
      id: updated.id,
      nomor: updated.nomor,
      status: updated.status,
      tanggapan: updated.tanggapan,
    });
  }
);

