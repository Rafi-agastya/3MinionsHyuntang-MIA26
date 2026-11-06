import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireAuth, requireAktif, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { checkAccountDailyLimit } from "@/lib/rate-limit";
import {
  generateNomorLacak,
  hitungTenggat,
  isIdeTenggatTerlewat,
  samarkanPengajuIde,
} from "@/lib/ide-tiket";
import { Peran, Prisma, StatusIde, SumberIde } from "@prisma/client";

const buatIdeSchema = z.object({
  judul: z
    .string()
    .min(10, "Judul ide minimal 10 karakter")
    .max(120, "Judul ide maksimal 120 karakter"),
  deskripsi: z
    .string()
    .min(30, "Deskripsi ide minimal 30 karakter")
    .max(2000, "Deskripsi ide maksimal 2000 karakter"),
  lokasi: z.string().max(120, "Lokasi maksimal 120 karakter").optional().nullable(),
  kategori: z.enum(
    [
      "Infrastruktur",
      "Ekonomi",
      "Kesehatan",
      "Pendidikan",
      "Lingkungan",
      "Lainnya",
    ],
    {
      errorMap: () => ({
        message:
          "Kategori ide harus salah satu dari: Infrastruktur, Ekonomi, Kesehatan, Pendidikan, Lingkungan, Lainnya",
      }),
    }
  ),
  anonim: z.boolean().default(false),
  sumber: z.nativeEnum(SumberIde).default(SumberIde.WARGA),
  dasarKebutuhan: z
    .string()
    .max(1000, "Dasar kebutuhan maksimal 1000 karakter")
    .optional()
    .nullable(),
});

export const POST = apiHandler(async (req: Request) => {
  const actor = await requireAuth(req);
  requireRole(actor, Peran.WARGA, Peran.PERANGKAT, Peran.ADMIN);
  requireAktif(actor);

  // Batas laju pengiriman ide harian (PRD 35.4: 5 ide/hari per akun)
  const rateLimit = checkAccountDailyLimit(actor.id, "ide", 5);
  if (!rateLimit.allowed) {
    throw new ApiError(
      "RATE_LIMITED",
      "Batas pengiriman ide harian terlampaui (maksimal 5 ide per hari per akun). Silakan coba lagi besok.",
      undefined,
      429
    );
  }

  const bodyJson = await req.json();
  const body = buatIdeSchema.parse(bodyJson);

  // Aturan FR-C6 & PRD 35.2: Ide sumber KADES wajib mengisi dasarKebutuhan minimal 30 karakter
  if (body.sumber === SumberIde.KADES) {
    if (!body.dasarKebutuhan || body.dasarKebutuhan.trim().length < 30) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Dasar kebutuhan minimal 30 karakter wajib diisi untuk ide yang bersumber dari Kepala Desa (KADES).",
        {
          dasarKebutuhan: [
            "Dasar kebutuhan minimal 30 karakter wajib diisi untuk ide KADES",
          ],
        }
      );
    }
  }

  // Buat nomor lacak unik terstruktur (IDE-YYYYMM-XXXXX)
  let nomor = generateNomorLacak("IDE");
  const existingWithNumber = await prisma.ide.findUnique({ where: { nomor } });
  if (existingWithNumber) {
    nomor = generateNomorLacak("IDE");
  }

  const tenggatTanggapan = hitungTenggat(14);

  const ide = await prisma.ide.create({
    data: {
      nomor,
      judul: body.judul,
      deskripsi: body.deskripsi,
      lokasi: body.lokasi ?? null,
      kategori: body.kategori,
      sumber: body.sumber,
      status: StatusIde.DIAJUKAN,
      dasarKebutuhan: body.dasarKebutuhan ?? null,
      anonim: body.anonim,
      tenggatTanggapan,
      desaId: actor.desaId,
      pengajuId: actor.id,
    },
  });

  await tulisAudit({
    aktorId: actor.id,
    aksi: "BUAT_IDE",
    entitas: "IDE",
    entitasId: ide.id,
    sesudah: {
      nomor: ide.nomor,
      judul: ide.judul,
      kategori: ide.kategori,
      status: ide.status,
      anonim: ide.anonim,
    },
  });

  return ok(
    {
      id: ide.id,
      nomor: ide.nomor,
      judul: ide.judul,
      status: ide.status,
      tenggatTanggapan: ide.tenggatTanggapan.toISOString(),
    },
    undefined,
    201
  );
});

export const GET = apiHandler(async (req: Request) => {
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const kategoriParam = url.searchParams.get("kategori");
  const desaIdParam = url.searchParams.get("desaId");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10))
  );

  const where: Prisma.IdeWhereInput = {};
  if (desaIdParam) where.desaId = desaIdParam;
  if (
    statusParam &&
    Object.values(StatusIde).includes(statusParam as StatusIde)
  ) {
    where.status = statusParam as StatusIde;
  }
  if (kategoriParam) where.kategori = kategoriParam;

  const actor = await getPengguna(req).catch(() => null);

  const [total, list] = await Promise.all([
    prisma.ide.count({ where }),
    prisma.ide.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        pengaju: {
          select: {
            id: true,
            nama: true,
            peran: true,
          },
        },
        _count: {
          select: { dukungan: true },
        },
      },
    }),
  ]);

  const formatted = list.map((ide) => {
    const tenggatTerlewat = isIdeTenggatTerlewat(
      ide.tenggatTanggapan,
      ide.status
    );

    const safeIde = samarkanPengajuIde(ide, actor?.peran);

    return {
      id: safeIde.id,
      nomor: safeIde.nomor,
      judul: safeIde.judul,
      deskripsi: safeIde.deskripsi,
      lokasi: safeIde.lokasi,
      kategori: safeIde.kategori,
      sumber: safeIde.sumber,
      status: safeIde.status,
      alasan: safeIde.alasan,
      dasarKebutuhan: safeIde.dasarKebutuhan,
      anonim: safeIde.anonim,
      tenggatTanggapan: safeIde.tenggatTanggapan.toISOString(),
      tenggatTerlewat,
      createdAt: safeIde.createdAt.toISOString(),
      pengajuId: safeIde.pengajuId,
      pengaju: safeIde.pengaju,
      jumlahDukungan: ide._count.dukungan,
    };
  });

  return ok(formatted, { page, pageSize, total });
});
