import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { JenisBelanja, LevelAkun, Peran } from "@prisma/client";

const createPosAnggaranSchema = z.object({
  akunId: z.string().min(1, "akunId wajib diisi"),
  sumberDanaId: z.string().min(1, "sumberDanaId wajib diisi"),
  jenisBelanja: z.nativeEnum(JenisBelanja),
  uraian: z
    .string()
    .min(3, "Uraian minimal 3 karakter")
    .max(300, "Uraian maksimal 300 karakter"),
  anggaran: z
    .number()
    .int("Anggaran harus bilangan bulat")
    .positive("Anggaran harus bilangan positif"),
  sensitif: z.boolean().optional().default(false),
});

export const POST = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id: desaId } = await params;
    const bodyJson = await req.json();
    const body = createPosAnggaranSchema.parse(bodyJson);

    let desa = await prisma.desa.findUnique({
      where: { id: desaId },
    });

    if (!desa && (desaId === "seed_desa_001" || desaId === "default")) {
      desa = await prisma.desa.findFirst();
    }

    if (!desa) {
      throw new ApiError("NOT_FOUND", `Desa dengan ID '${desaId}' tidak ditemukan`);
    }

    // 1. Verifikasi akun dan pastikan berada pada level KEGIATAN (PRD 44 K7)
    const akun = await prisma.refAkun.findUnique({
      where: { id: body.akunId },
    });

    if (!akun) {
      throw new ApiError("NOT_FOUND", "Akun referensi tidak ditemukan");
    }

    if (akun.level !== LevelAkun.KEGIATAN) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Akun harus berada pada level KEGIATAN untuk membuat pos anggaran",
        {
          akunId: ["Akun harus berada pada level KEGIATAN"],
        }
      );
    }

    // 2. Verifikasi sumber dana
    const sumberDana = await prisma.sumberDana.findFirst({
      where: {
        id: body.sumberDanaId,
        desaId: desa.id,
      },
    });

    if (!sumberDana) {
      throw new ApiError(
        "NOT_FOUND",
        "Sumber dana tidak ditemukan pada desa yang dimaksud"
      );
    }

    // 3. Simpan Pos Anggaran
    const pos = await prisma.posAnggaran.create({
      data: {
        desaId: desa.id,
        tahun: sumberDana.tahun,
        akunId: akun.id,
        sumberDanaId: sumberDana.id,
        jenisBelanja: body.jenisBelanja,
        uraian: body.uraian,
        anggaran: BigInt(body.anggaran),
        sensitif: body.sensitif ?? false,
      },
      include: {
        akun: true,
        sumberDana: true,
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "BUAT_POS_ANGGARAN",
      entitas: "POS_ANGGARAN",
      entitasId: pos.id,
      sesudah: {
        desaId: desa.id,
        akunId: akun.id,
        uraian: pos.uraian,
        anggaran: Number(pos.anggaran),
        jenisBelanja: pos.jenisBelanja,
      },
    });

    return ok(pos, undefined, 201);
  }
);

