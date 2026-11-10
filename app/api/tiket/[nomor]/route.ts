import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { samarkanTiketPublik } from "@/lib/ide-tiket";
import { Peran, StatusTiket } from "@prisma/client";

// ================= GET: LACAK TIKET PUBLIK (PRD 33.2 #26 & FR-M4) =================
export const GET = apiHandler(
  async (req: Request, { params }: { params: Promise<{ nomor: string }> }) => {
    const { nomor } = await params;

    const tiket =
      (await prisma.tiket.findUnique({
        where: { nomor },
        include: {
          proyek: {
            select: {
              id: true,
              judul: true,
            },
          },
        },
      })) ||
      (await prisma.tiket.findUnique({
        where: { id: nomor },
        include: {
          proyek: {
            select: {
              id: true,
              judul: true,
            },
          },
        },
      }));

    if (!tiket) {
      throw new ApiError(
        "NOT_FOUND",
        `Tiket dengan nomor lacak '${nomor}' tidak ditemukan`
      );
    }

    // Aturan Privasi Publik Mutlak (PRD FR-M4 & 33.2 #26 & T10):
    // Identitas pelapor (pelaporId, nama, dsb.) TIDAK PERNAH tampil ke publik.
    const safePayload = samarkanTiketPublik(tiket);

    return ok(safePayload);
  }
);

// ================= PATCH: TANGGAPAN & STATUS TIKET (PRD 33.2 #27) =================
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
  async (req: Request, { params }: { params: Promise<{ nomor: string }> }) => {
    const actor = await requireAuth(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { nomor: tiketIdOrNomor } = await params;
    const bodyJson = await req.json();
    const body = patchTiketSchema.parse(bodyJson);

    const tiket =
      (await prisma.tiket.findUnique({ where: { id: tiketIdOrNomor } })) ||
      (await prisma.tiket.findUnique({ where: { nomor: tiketIdOrNomor } }));

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
