import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { samarkanTiketPublik } from "@/lib/ide-tiket";

export const GET = apiHandler(
  async (req: Request, { params }: { params: Promise<{ nomor: string }> }) => {
    const { nomor } = await params;

    const tiket = await prisma.tiket.findUnique({
      where: { nomor },
      include: {
        proyek: {
          select: {
            id: true,
            judul: true,
          },
        },
      },
    });

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

