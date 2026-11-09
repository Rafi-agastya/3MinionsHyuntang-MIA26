import { z } from "zod";
import { Peran, StatusAkun } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireRole, requireAktif } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";

const verifikasiSchema = z
  .object({
    setujui: z.boolean({
      required_error: "Status persetujuan (setujui: true/false) wajib diisi.",
    }),
    alasan: z.string().optional(),
  })
  .refine(
    (data) => {
      // PRD 33.2 & 35.1: Alasan wajib ada bila ditolak
      if (data.setujui === false) {
        return typeof data.alasan === "string" && data.alasan.trim().length > 0;
      }
      return true;
    },
    {
      message: "Alasan penolakan wajib diisi jika verifikasi akun ditolak.",
      path: ["alasan"],
    }
  );

export const PATCH = apiHandler(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    // 1. Membaca sesi pengguna yang sedang login
    const actor = await requireAuth(req);

    // 2. Hanya peran PERANGKAT atau ADMIN yang berhak memverifikasi (PRD 33.2 & Matriks 8)
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    // 3. Akun verifikator wajib aktif
    requireAktif(actor);

    // 4. Resolusi ID target dari route parameter (Next.js 15 Promise params)
    const { id: targetId } = await context.params;

    if (!targetId) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Parameter ID pengguna wajib disertakan pada URL.",
        undefined,
        400
      );
    }

    // 5. Validasi body request Zod
    const rawBody = await req.json();
    const body = verifikasiSchema.parse(rawBody);

    // 6. Muat target Pengguna dari database
    const targetUser = await prisma.pengguna.findUnique({
      where: { id: targetId },
    });

    if (!targetUser) {
      throw new ApiError(
        "NOT_FOUND",
        `Pengguna dengan ID '${targetId}' tidak ditemukan.`,
        undefined,
        404
      );
    }

    // 7. Jika bukan ADMIN global, perangkat desa hanya boleh memverifikasi warga di desanya sendiri
    if (actor.peran !== Peran.ADMIN && targetUser.desaId !== actor.desaId) {
      throw new ApiError(
        "FORBIDDEN",
        "Perangkat desa hanya dapat memverifikasi warga di desa yang sama.",
        undefined,
        403
      );
    }

    const previousStatus = targetUser.statusAkun;
    const newStatus = body.setujui ? StatusAkun.AKTIF : StatusAkun.DITOLAK;

    // 8. Perbarui status akun target
    const updatedUser = await prisma.pengguna.update({
      where: { id: targetId },
      data: {
        statusAkun: newStatus,
      },
    });

    // 9. Catat di AuditLog (append-only)
    await tulisAudit({
      aktorId: actor.id,
      aksi: body.setujui ? "VERIFIKASI_AKUN_DISETUJUI" : "VERIFIKASI_AKUN_DITOLAK",
      entitas: "Pengguna",
      entitasId: targetUser.id,
      sebelum: {
        statusAkun: previousStatus,
      },
      sesudah: {
        statusAkun: newStatus,
        alasan: body.alasan?.trim() || null,
        diverifikasiOleh: actor.id,
      },
    });

    // 10. Kembalikan data pengguna terbarui
    return ok({
      id: updatedUser.id,
      nama: updatedUser.nama,
      email: updatedUser.email,
      peran: updatedUser.peran,
      statusAkun: updatedUser.statusAkun,
      desaId: updatedUser.desaId,
      rtRw: updatedUser.rtRw,
    });
  }
);
