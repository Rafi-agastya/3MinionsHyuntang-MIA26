import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tambahEntri } from "@/lib/kas-ledger";
import { tulisAudit } from "@/lib/audit";
import { samarkanEntri } from "@/lib/kas-sensitif";
import { JenisEntri, Peran } from "@prisma/client";

const koreksiSchema = z.object({
  alasan: z
    .string()
    .min(20, "Alasan koreksi minimal 20 karakter")
    .max(500, "Alasan koreksi maksimal 500 karakter"),
});

export const POST = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id: targetId } = await params;
    const bodyJson = await req.json();
    const body = koreksiSchema.parse(bodyJson);

    const target = await prisma.entriKas.findUnique({
      where: { id: targetId },
      include: {
        pos: true,
        koreksi: true,
      },
    });

    if (!target) {
      throw new ApiError("NOT_FOUND", "Entri kas target tidak ditemukan");
    }

    if (target.jenis === JenisEntri.KOREKSI) {
      throw new ApiError(
        "CONFLICT",
        "Entri bertipe KOREKSI tidak dapat dikoreksi kembali"
      );
    }

    if (target.koreksi && target.koreksi.length > 0) {
      throw new ApiError(
        "CONFLICT",
        "Entri ini sudah pernah dikoreksi sebelumnya"
      );
    }

    const koreksi = await tambahEntri(prisma, {
      desaId: target.desaId,
      jenis: JenisEntri.KOREKSI,
      jumlah: target.jumlah,
      tanggal: new Date(),
      uraian: `KOREKSI: ${body.alasan}`,
      sumberDanaId: target.sumberDanaId,
      posId: target.posId,
      proyekId: target.proyekId,
      terminId: target.terminId,
      koreksiDariId: target.id,
      penerima: target.penerima,
      penerimaDisamarkan: target.penerimaDisamarkan,
      buktiUrls: target.buktiUrls,
      pencatatId: actor.id,
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "BUAT_KOREKSI",
      entitas: "ENTRI_KAS",
      entitasId: koreksi.id,
      sebelum: {
        targetId: target.id,
        jenis: target.jenis,
        jumlah: Number(target.jumlah),
      },
      sesudah: {
        id: koreksi.id,
        alasan: body.alasan,
      },
    });

    const formatted = {
      id: koreksi.id,
      desaId: koreksi.desaId,
      nomorUrut: koreksi.nomorUrut,
      jenis: koreksi.jenis,
      jumlah: Number(koreksi.jumlah),
      tanggal: koreksi.tanggal.toISOString(),
      uraian: koreksi.uraian,
      sumberDanaId: koreksi.sumberDanaId,
      posId: koreksi.posId,
      proyekId: koreksi.proyekId,
      terminId: koreksi.terminId,
      koreksiDariId: koreksi.koreksiDariId,
      penerima: koreksi.penerima,
      penerimaDisamarkan: koreksi.penerimaDisamarkan,
      buktiUrls: koreksi.buktiUrls,
      pencatatId: koreksi.pencatatId,
      statusVerifikasi: "MENUNGGU",
      hashSebelumnya: koreksi.hashSebelumnya,
      hash: koreksi.hash,
      hashPendek: koreksi.hash.slice(0, 8),
      dibuatPada: koreksi.dibuatPada.toISOString(),
      pos: target.pos
        ? { sensitif: target.pos.sensitif, uraian: target.pos.uraian }
        : null,
    };

    const masked = samarkanEntri(formatted, actor.peran);

    return ok(masked, undefined, 201);
  }
);

