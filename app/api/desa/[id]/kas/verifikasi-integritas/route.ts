import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { verifikasiRantai } from "@/lib/kas-hash";

export const GET = apiHandler(
  async (_req, { params }: { params: Promise<{ id: string }> }) => {
    const { id: desaId } = await params;

    let desa = await prisma.desa.findUnique({
      where: { id: desaId },
    });

    if (!desa && (desaId === "seed_desa_001" || desaId === "default")) {
      desa = await prisma.desa.findFirst();
    }

    if (!desa) {
      throw new ApiError("NOT_FOUND", `Desa dengan ID '${desaId}' tidak ditemukan`);
    }

    const entries = await prisma.entriKas.findMany({
      where: { desaId: desa.id },
      orderBy: { nomorUrut: "asc" },
    });

    const hasil = verifikasiRantai(entries);

    return ok(hasil);
  }
);

