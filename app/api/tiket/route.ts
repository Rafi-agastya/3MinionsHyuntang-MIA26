import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireAktif, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { checkAccountDailyLimit } from "@/lib/rate-limit";
import { generateNomorLacak, hitungTenggat } from "@/lib/ide-tiket";
import { Peran, StatusTiket } from "@prisma/client";

const buatTiketSchema = z.object({
  proyekId: z.string().optional().nullable(),
  kategori: z.enum(
    ["DUGAAN_PENYIMPANGAN", "KERUSAKAN", "KETERLAMBATAN", "LAINNYA"],
    {
      errorMap: () => ({
        message:
          "Kategori tiket harus salah satu dari: DUGAAN_PENYIMPANGAN, KERUSAKAN, KETERLAMBATAN, LAINNYA",
      }),
    }
  ),
  isi: z
    .string()
    .min(30, "Isi aduan tiket minimal 30 karakter")
    .max(2000, "Isi aduan tiket maksimal 2000 karakter"),
  anonim: z.boolean().default(false),
});

export const POST = apiHandler(async (req: Request) => {
  const actor = await requireAuth(req);
  requireRole(actor, Peran.WARGA, Peran.PERANGKAT, Peran.PENGAWAS, Peran.ADMIN);
  requireAktif(actor);

  // Batas laju pengiriman tiket harian (PRD 35.4: 5 tiket/hari per akun)
  const rateLimit = checkAccountDailyLimit(actor.id, "tiket", 5);
  if (!rateLimit.allowed) {
    throw new ApiError(
      "RATE_LIMITED",
      "Batas pengiriman tiket harian terlampaui (maksimal 5 tiket per hari per akun). Silakan coba lagi besok.",
      undefined,
      429
    );
  }

  const bodyJson = await req.json();
  const body = buatTiketSchema.parse(bodyJson);

  // Jika menyertakan proyekId, pastikan proyek tersebut ada
  if (body.proyekId) {
    const proyek = await prisma.proyek.findUnique({
      where: { id: body.proyekId },
    });
    if (!proyek) {
      throw new ApiError("NOT_FOUND", "Proyek terkait tidak ditemukan");
    }
  }

  // Buat nomor lacak unik (TKT-YYYYMM-XXXXX)
  let nomor = generateNomorLacak("TKT");
  const existing = await prisma.tiket.findUnique({ where: { nomor } });
  if (existing) {
    nomor = generateNomorLacak("TKT");
  }

  const tenggat = hitungTenggat(14);

  const tiket = await prisma.tiket.create({
    data: {
      nomor,
      proyekId: body.proyekId ?? null,
      pelaporId: actor.id,
      kategori: body.kategori,
      isi: body.isi,
      anonim: body.anonim,
      status: StatusTiket.BARU,
      tenggat,
    },
  });

  await tulisAudit({
    aktorId: actor.id,
    aksi: "BUAT_TIKET",
    entitas: "TIKET",
    entitasId: tiket.id,
    sesudah: {
      nomor: tiket.nomor,
      kategori: tiket.kategori,
      proyekId: tiket.proyekId,
      anonim: tiket.anonim,
      status: tiket.status,
    },
  });

  return ok(
    {
      id: tiket.id,
      nomor: tiket.nomor,
      status: tiket.status,
      tenggat: tiket.tenggat.toISOString(),
    },
    undefined,
    201
  );
});

export const GET = apiHandler(async (req: Request) => {
  const actor = await requireAuth(req);
  requireRole(actor, Peran.PERANGKAT, Peran.PENGAWAS, Peran.ADMIN);

  const tiketList = await prisma.tiket.findMany({
    orderBy: { dibuatPada: "desc" },
    include: {
      proyek: {
        select: { id: true, judul: true, lokasi: true },
      },
      pelapor: {
        select: { id: true, nama: true, peran: true },
      },
    },
  });

  return ok(tiketList, { total: tiketList.length });
});


