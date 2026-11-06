import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireAktif, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { Peran, StatusIde } from "@prisma/client";

export const POST = apiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await requireAuth(req);
    requireRole(actor, Peran.WARGA, Peran.PERANGKAT, Peran.ADMIN);
    requireAktif(actor);

    const { id: ideId } = await params;

    const ide = await prisma.ide.findUnique({
      where: { id: ideId },
    });

    if (!ide) {
      throw new ApiError("NOT_FOUND", "Ide/aduan tidak ditemukan");
    }

    if (ide.status === StatusIde.DITOLAK) {
      throw new ApiError(
        "CONFLICT",
        "Ide/aduan yang berstatus DITOLAK tidak dapat diberikan dukungan"
      );
    }

    // Cek duplikasi dukungan (FR-C2 & Bagian 33.2 #9: satu dukungan per akun, 409 jika ganda)
    const existingDukungan = await prisma.dukunganIde.findUnique({
      where: {
        ideId_penggunaId: {
          ideId: ide.id,
          penggunaId: actor.id,
        },
      },
    });

    if (existingDukungan) {
      throw new ApiError(
        "CONFLICT",
        "Anda sudah memberikan dukungan untuk ide ini sebelumnya"
      );
    }

    await prisma.dukunganIde.create({
      data: {
        ideId: ide.id,
        penggunaId: actor.id,
      },
    });

    const jumlahDukungan = await prisma.dukunganIde.count({
      where: { ideId: ide.id },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "DUKUNG_IDE",
      entitas: "IDE",
      entitasId: ide.id,
      sesudah: { ideId: ide.id, jumlahDukungan },
    });

    return ok({
      ideId: ide.id,
      jumlahDukungan,
      didukung: true,
    });
  }
);

