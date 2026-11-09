import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireAktif } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { StatusProyek, StatusSanggah } from "@prisma/client";

const sanggahanSchema = z.object({
  isi: z
    .string()
    .min(30, "Isi sanggahan minimal 30 karakter")
    .max(1000, "Isi sanggahan maksimal 1000 karakter"),
});

export const POST = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireAktif(actor);

    const { id: proposalId } = await params;
    const bodyJson = await req.json();
    const body = sanggahanSchema.parse(bodyJson);

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        proyek: true,
        kelompok: {
          include: {
            anggota: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new ApiError("NOT_FOUND", "Proposal tidak ditemukan");
    }

    // Hanya peserta proposal (ketua atau anggota kelompok) yang berhak menyanggah
    const isKetua = proposal.kelompok.ketuaId === actor.id;
    const isAnggota = proposal.kelompok.anggota.some(
      (anggota) => anggota.penggunaId === actor.id
    );

    if (!isKetua && !isAnggota) {
      throw new ApiError(
        "FORBIDDEN",
        "Hanya peserta yang tergabung dalam proposal ini yang berhak mengajukan sanggahan"
      );
    }

    // Hanya pada MASA_SANGGAH aktif
    const now = new Date();
    const isActiveMasaSanggah =
      proposal.proyek.status === StatusProyek.MASA_SANGGAH &&
      proposal.proyek.akhirMasaSanggah !== null &&
      now <= proposal.proyek.akhirMasaSanggah;

    if (!isActiveMasaSanggah) {
      throw new ApiError(
        "CONFLICT",
        "Pengajuan sanggah hanya dapat dilakukan selama masa sanggah aktif",
        {
          status: [proposal.proyek.status],
          akhirMasaSanggah: [proposal.proyek.akhirMasaSanggah?.toISOString() ?? null],
        }
      );
    }

    const sanggahan = await prisma.sanggahan.create({
      data: {
        proposalId: proposal.id,
        penggunaId: actor.id,
        isi: body.isi,
        status: StatusSanggah.TERBUKA,
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "KIRIM_SANGGAHAN",
      entitas: "SANGGAHAN",
      entitasId: sanggahan.id,
      sesudah: {
        proposalId: proposal.id,
        status: StatusSanggah.TERBUKA,
      },
    });

    return ok(sanggahan, undefined, 201);
  }
);

