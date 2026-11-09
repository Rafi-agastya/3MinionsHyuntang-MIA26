import { z } from "zod";
import { Peran, KeputusanFlag } from "@prisma/client";
import { prisma, serializeBigInt } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireRole, requireAktif } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";

const patchFlagSchema = z.object({
  keputusan: z.enum(
    [
      KeputusanFlag.BELUM,
      KeputusanFlag.WAJAR,
      KeputusanFlag.KLARIFIKASI,
      KeputusanFlag.TIDAK_SAH,
    ],
    {
      required_error:
        "Keputusan flag wajib diisi (BELUM, WAJAR, KLARIFIKASI, TIDAK_SAH).",
    }
  ),
  catatan: z.string().max(1000, "Catatan maksimal 1000 karakter.").optional().nullable(),
});

export const PATCH = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    // 1. Otorisasi peran: hanya PERANGKAT atau ADMIN (PRD 33.2 #18 & FR-G4)
    const actor = await requireAuth(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);
    requireAktif(actor);

    const { id: flagId } = await context.params;

    // 2. Validasi body Zod
    const rawBody = await req.json();
    const body = patchFlagSchema.parse(rawBody);

    // 3. Muat flag dari database
    const flag = await prisma.flagKemiripan.findUnique({
      where: { id: flagId },
    });

    if (!flag) {
      throw new ApiError(
        "NOT_FOUND",
        `Flag kemiripan dengan ID '${flagId}' tidak ditemukan.`,
        undefined,
        404
      );
    }

    const previousKeputusan = flag.keputusan;
    const previousCatatan = flag.catatan;

    // 4. Perbarui keputusan & catatan flag
    const updatedFlag = await prisma.flagKemiripan.update({
      where: { id: flagId },
      data: {
        keputusan: body.keputusan,
        catatan: body.catatan !== undefined ? body.catatan?.trim() || null : flag.catatan,
      },
    });

    // 5. Catat riwayat keputusan ke AuditLog (append-only)
    await tulisAudit({
      aktorId: actor.id,
      aksi: "PUTUSKAN_FLAG",
      entitas: "FlagKemiripan",
      entitasId: flag.id,
      sebelum: {
        keputusan: previousKeputusan,
        catatan: previousCatatan,
      },
      sesudah: {
        keputusan: updatedFlag.keputusan,
        catatan: updatedFlag.catatan,
        diputuskanOleh: actor.id,
      },
    });

    return ok(serializeBigInt(updatedFlag));
  }
);

