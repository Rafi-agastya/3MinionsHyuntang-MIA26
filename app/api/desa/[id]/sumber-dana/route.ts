import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { Peran } from "@prisma/client";

const createSumberDanaSchema = z.object({
  nama: z
    .string()
    .min(3, "Nama sumber dana minimal 3 karakter")
    .max(100, "Nama sumber dana maksimal 100 karakter"),
  tahun: z
    .number()
    .int("Tahun harus bilangan bulat")
    .min(2020, "Tahun minimal 2020")
    .max(2050, "Tahun maksimal 2050"),
  pagu: z
    .number()
    .int("Pagu harus bilangan bulat")
    .positive("Pagu harus bilangan positif"),
});

export const POST = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id: desaId } = await params;
    const bodyJson = await req.json();
    const body = createSumberDanaSchema.parse(bodyJson);

    let desa = await prisma.desa.findUnique({
      where: { id: desaId },
    });

    if (!desa && (desaId === "seed_desa_001" || desaId === "default")) {
      desa = await prisma.desa.findFirst();
    }

    if (!desa) {
      throw new ApiError("NOT_FOUND", `Desa dengan ID '${desaId}' tidak ditemukan`);
    }

    const sumberDana = await prisma.sumberDana.create({
      data: {
        desaId: desa.id,
        nama: body.nama,
        tahun: body.tahun,
        pagu: BigInt(body.pagu),
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "BUAT_SUMBER_DANA",
      entitas: "SUMBER_DANA",
      entitasId: sumberDana.id,
      sesudah: {
        nama: sumberDana.nama,
        tahun: sumberDana.tahun,
        pagu: Number(sumberDana.pagu),
      },
    });

    return ok(sumberDana, undefined, 201);
  }
);

