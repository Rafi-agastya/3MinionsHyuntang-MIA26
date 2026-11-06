import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { Peran, Prisma, StatusProyek } from "@prisma/client";

const verifikasiKompetensiSchema = z.object({
  proposalId: z.string().min(1, "proposalId wajib diisi"),
  nilaiRubrik: z
    .record(z.string(), z.number())
    .refine((val) => Object.keys(val).length > 0, "nilaiRubrik minimal memiliki 1 butir kriteria"),
  catatan: z.string().optional().nullable(),
});

export const POST = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id: proyekId } = await params;
    const bodyJson = await req.json();
    const body = verifikasiKompetensiSchema.parse(bodyJson);

    const proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
    });

    if (!proyek) {
      throw new ApiError("NOT_FOUND", "Proyek tidak ditemukan");
    }

    if (
      proyek.status !== StatusProyek.SELEKSI &&
      proyek.status !== StatusProyek.VERIFIKASI_KOMPETENSI
    ) {
      throw new ApiError(
        "CONFLICT",
        "Penilaian kompetensi hanya dapat dilakukan pada tahap SELEKSI atau VERIFIKASI_KOMPETENSI",
        { status: [proyek.status] }
      );
    }

    const proposal = await prisma.proposal.findFirst({
      where: {
        id: body.proposalId,
        proyekId: proyek.id,
      },
    });

    if (!proposal) {
      throw new ApiError(
        "NOT_FOUND",
        "Proposal tidak ditemukan pada proyek yang dimaksud"
      );
    }

    const verifikasi = await prisma.verifikasiKompetensi.create({
      data: {
        proposalId: body.proposalId,
        penilaiId: actor.id,
        nilaiRubrik: body.nilaiRubrik as Prisma.InputJsonValue,
        catatan: body.catatan,
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "NILAI_KOMPETENSI",
      entitas: "PROPOSAL",
      entitasId: body.proposalId,
      sesudah: {
        penilaiId: actor.id,
        nilaiRubrik: body.nilaiRubrik,
        catatan: body.catatan,
      },
    });

    return ok(verifikasi, undefined, 201);
  }
);

