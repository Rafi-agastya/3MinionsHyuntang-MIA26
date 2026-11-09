import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { bukaTerminOtomatis } from "@/lib/termin-service";
import { Peran, StatusVerifikasi } from "@prisma/client";

const patchLaporanSchema = z.object({
  status: z.enum([StatusVerifikasi.DISETUJUI, StatusVerifikasi.DITOLAK], {
    errorMap: () => ({
      message: "Status verifikasi harus DISETUJUI atau DITOLAK",
    }),
  }),
  catatan: z
    .string()
    .max(1000, "Catatan pengawas maksimal 1000 karakter")
    .optional()
    .nullable(),
});

export const PATCH = apiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await requireAuth(req);
    requireRole(actor, Peran.PENGAWAS, Peran.ADMIN);

    const { id: laporanId } = await params;
    const bodyJson = await req.json();
    const body = patchLaporanSchema.parse(bodyJson);

    const laporan = await prisma.laporanProgres.findUnique({
      where: { id: laporanId },
    });

    if (!laporan) {
      throw new ApiError("NOT_FOUND", "Laporan progres tidak ditemukan");
    }

    const updatedLaporan = await prisma.laporanProgres.update({
      where: { id: laporan.id },
      data: {
        status: body.status,
        catatanPengawas: body.catatan ?? laporan.catatanPengawas,
        pengawasId: actor.id,
      },
    });

    // Jika disetujui, periksa apakah pencapaian persen memicu pembukaan termin kas berikutnya (FR-K3 & K11)
    let terminDibuka: unknown[] = [];
    if (body.status === StatusVerifikasi.DISETUJUI) {
      terminDibuka = await bukaTerminOtomatis(
        laporan.proyekId,
        laporan.persen,
        actor.id
      );
    }

    await tulisAudit({
      aktorId: actor.id,
      aksi: `VERIFIKASI_LAPORAN_${body.status}`,
      entitas: "LAPORAN_PROGRES",
      entitasId: updatedLaporan.id,
      sebelum: { status: laporan.status },
      sesudah: {
        status: updatedLaporan.status,
        catatanPengawas: body.catatan,
        terminDibukaCount: terminDibuka.length,
      },
    });

    return ok({
      id: updatedLaporan.id,
      minggu: updatedLaporan.minggu,
      persen: updatedLaporan.persen,
      status: updatedLaporan.status,
      catatanPengawas: updatedLaporan.catatanPengawas,
      terminDibuka,
    });
  }
);

