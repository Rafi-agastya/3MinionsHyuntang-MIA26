import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { Peran, StatusVerifikasi } from "@prisma/client";

const verifikasiSchema = z.object({
  keputusan: z.enum([StatusVerifikasi.DISETUJUI, StatusVerifikasi.DITOLAK], {
    errorMap: () => ({
      message: "Keputusan verifikasi harus DISETUJUI atau DITOLAK",
    }),
  }),
  catatan: z
    .string()
    .max(500, "Catatan verifikasi maksimal 500 karakter")
    .optional()
    .nullable(),
});

export const POST = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PENGAWAS, Peran.ADMIN);

    const { id: entriId } = await params;
    const bodyJson = await req.json();
    const body = verifikasiSchema.parse(bodyJson);

    const target = await prisma.entriKas.findUnique({
      where: { id: entriId },
      include: {
        verifikasi: {
          orderBy: { waktu: "desc" },
        },
      },
    });

    if (!target) {
      throw new ApiError("NOT_FOUND", "Entri kas tidak ditemukan");
    }

    // Pemisahan wewenang (Segregation of Duties - PRD Bagian 44.4 & T21):
    // Pencatat tidak boleh memverifikasi entrinya sendiri.
    if (target.pencatatId === actor.id) {
      throw new ApiError(
        "CONFLICT",
        "Pencatat tidak boleh memverifikasi entrinya sendiri (pemisahan wewenang pencatat dan pemverifikasi)"
      );
    }

    // Jika entri sudah pernah disetujui, tidak boleh diverifikasi ulang
    const sudahDisetujui = target.verifikasi.some(
      (v) => v.keputusan === StatusVerifikasi.DISETUJUI
    );
    if (sudahDisetujui) {
      throw new ApiError(
        "CONFLICT",
        "Entri kas sudah diverifikasi dan disetujui sebelumnya"
      );
    }

    const verifikasi = await prisma.verifikasiEntri.create({
      data: {
        entriId: target.id,
        pengawasId: actor.id,
        keputusan: body.keputusan,
        catatan: body.catatan ?? null,
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: `VERIFIKASI_ENTRI_${body.keputusan}`,
      entitas: "VERIFIKASI_ENTRI",
      entitasId: verifikasi.id,
      sesudah: {
        entriId: target.id,
        keputusan: body.keputusan,
        catatan: body.catatan,
      },
    });

    return ok(
      {
        id: verifikasi.id,
        entriId: verifikasi.entriId,
        pengawasId: verifikasi.pengawasId,
        keputusan: verifikasi.keputusan,
        catatan: verifikasi.catatan,
        waktu: verifikasi.waktu.toISOString(),
      },
      undefined,
      201
    );
  }
);

