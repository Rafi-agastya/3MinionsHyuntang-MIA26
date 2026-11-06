import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { canTransition } from "@/lib/status-machine";
import { onProyekDibatalkan } from "@/lib/hooks";
import { Jalur, KeputusanFlag, Peran, StatusProyek, StatusSanggah } from "@prisma/client";

const patchStatusSchema = z.object({
  status: z.nativeEnum(StatusProyek),
  jalur: z.nativeEnum(Jalur).optional().nullable(),
  alasanJalur: z.string().max(500).optional().nullable(),
  alasanBatal: z.string().optional().nullable(),
  catatan: z.string().optional().nullable(),
});

export const PATCH = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id } = await params;
    const bodyJson = await req.json();
    const body = patchStatusSchema.parse(bodyJson);

    const proyek = await prisma.proyek.findUnique({
      where: { id },
      include: {
        keputusan: true,
      },
    });

    if (!proyek) {
      throw new ApiError("NOT_FOUND", "Proyek tidak ditemukan");
    }

    const alasanJalur = body.alasanJalur ?? proyek.alasanJalur;
    const flagBelumDitinjau = await prisma.flagKemiripan.count({
      where: {
        proyekId: proyek.id,
        keputusan: KeputusanFlag.BELUM,
      },
    });
    const sanggahanTerbuka = await prisma.sanggahan.count({
      where: {
        proposal: { proyekId: proyek.id },
        status: StatusSanggah.TERBUKA,
      },
    });
    const jumlahProposal = await prisma.proposal.count({
      where: { proyekId: proyek.id },
    });

    const check = canTransition(proyek.status, body.status, {
      alasanJalur,
      flagBelumDitinjau,
      sanggahanTerbuka,
      jumlahProposal,
      progresTerverifikasi: 0,
      alasanKeputusan: proyek.keputusan?.alasan ?? null,
      alasanBatal: body.alasanBatal ?? null,
    });

    if (!check.ok) {
      throw new ApiError("CONFLICT", check.reason || "Transisi status tidak sah", {
        reason: check.reason,
      });
    }

    if (body.status === StatusProyek.DIBATALKAN) {
      await onProyekDibatalkan(proyek.id, body.alasanBatal || "");
    }

    const updated = await prisma.proyek.update({
      where: { id: proyek.id },
      data: {
        status: body.status,
        ...(body.jalur !== undefined ? { jalur: body.jalur } : {}),
        ...(body.alasanJalur !== undefined ? { alasanJalur: body.alasanJalur } : {}),
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "UBAH_STATUS_PROYEK",
      entitas: "PROYEK",
      entitasId: proyek.id,
      sebelum: {
        status: proyek.status,
        jalur: proyek.jalur,
        alasanJalur: proyek.alasanJalur,
      },
      sesudah: {
        status: updated.status,
        jalur: updated.jalur,
        alasanJalur: updated.alasanJalur,
        alasanBatal: body.alasanBatal,
        catatan: body.catatan,
      },
    });

    return ok(updated);
  }
);

