import { Peran } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireAktif, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";

// ================= POST: DUKUNG IDE WARGA (PRD 33.2 #9 & FR-C2) =================
export const POST = apiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: ideId } = await params;
    const actor = await requireAuth(req);
    requireRole(actor, Peran.WARGA, Peran.PERANGKAT, Peran.PENGAWAS, Peran.ADMIN);
    requireAktif(actor);

    // 1. Pastikan ide ada di database
    const ide = await prisma.ide.findUnique({
      where: { id: ideId },
    });
    if (!ide) {
      throw new ApiError("NOT_FOUND", "Ide tidak ditemukan", undefined, 404);
    }

    // 2. Cek apakah pengguna sudah pernah mendukung (PRD 33.2 #9: 409 sudah mendukung)
    const existing = await prisma.dukunganIde.findUnique({
      where: {
        ideId_penggunaId: {
          ideId,
          penggunaId: actor.id,
        },
      },
    });

    if (existing) {
      throw new ApiError(
        "CONFLICT",
        "Anda sudah memberikan dukungan untuk ide ini.",
        undefined,
        409
      );
    }

    // 3. Simpan dukungan ide
    await prisma.dukunganIde.create({
      data: {
        ideId,
        penggunaId: actor.id,
      },
    });

    // 4. Hitung total dukungan terbaru
    const jumlahDukungan = await prisma.dukunganIde.count({
      where: { ideId },
    });

    // 5. Catat log audit
    await tulisAudit({
      aktorId: actor.id,
      aksi: "DUKUNG_IDE",
      entitas: "IDE",
      entitasId: ide.id,
      sesudah: { jumlahDukungan },
    });

    return ok({ jumlahDukungan, didukung: true }, undefined, 200);
  }
);
