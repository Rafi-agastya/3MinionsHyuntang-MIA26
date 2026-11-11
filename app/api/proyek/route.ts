import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { KelasProyek, Jalur, Peran, StatusProyek } from "@prisma/client";

const createProyekSchema = z.object({
  ideId: z.string().optional().nullable(),
  desaId: z.string().optional(),
  judul: z
    .string()
    .min(10, "Judul minimal 10 karakter")
    .max(120, "Judul maksimal 120 karakter"),
  deskripsi: z
    .string()
    .min(50, "Deskripsi minimal 50 karakter")
    .max(3000, "Deskripsi maksimal 3000 karakter"),
  lokasi: z
    .string()
    .min(1, "Lokasi wajib diisi")
    .max(120, "Lokasi maksimal 120 karakter"),
  pagu: z.number().int().positive("Pagu harus berupa bilangan bulat positif"),
  kelas: z.nativeEnum(KelasProyek),
  jalur: z.nativeEnum(Jalur).optional().nullable(),
  alasanJalur: z.string().max(500).optional().nullable(),
  posAnggaranId: z.string().optional().nullable(),
  syaratLokalMin: z.number().int().min(0).max(100).default(70).optional(),
  durasiMin: z.number().int().positive().default(30).optional(),
  durasiMax: z.number().int().positive().default(90).optional(),
  tenggatProposal: z.string().datetime().optional().nullable(),
  rab: z
    .array(
      z.object({
        uraian: z.string().min(1, "Uraian wajib diisi"),
        volume: z.number().positive("Volume harus lebih besar dari 0"),
        satuan: z.string().min(1, "Satuan wajib diisi"),
        hargaSatuan: z
          .number()
          .int()
          .positive("Harga satuan harus bilangan bulat positif"),
      })
    )
    .min(1, "RAB minimal memiliki 1 butir item"),
});

export const GET = apiHandler(async () => {
  const proyekList = await prisma.proyek.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      desa: true,
      rab: true,
      proposal: {
        select: {
          id: true,
          kelompok: {
            select: { id: true, nama: true },
          },
        },
      },
      keputusan: {
        include: {
          proposal: {
            include: {
              kelompok: {
                select: { id: true, nama: true },
              },
            },
          },
        },
      },
    },
  });

  return ok(proyekList, { total: proyekList.length });
});

export const POST = apiHandler(async (req) => {
  const actor = await getPengguna(req);
  requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

  const bodyJson = await req.json();
  const body = createProyekSchema.parse(bodyJson);

  // Aturan integritas: total RAB harus sama dengan pagu
  const totalRab = body.rab.reduce(
    (acc, item) => acc + item.volume * item.hargaSatuan,
    0
  );

  if (Math.round(totalRab) !== body.pagu) {
    throw new ApiError(
      "VALIDATION_ERROR",
      `Total RAB (Rp ${Math.round(totalRab).toLocaleString("id-ID")}) harus sama dengan pagu proyek (Rp ${body.pagu.toLocaleString("id-ID")})`,
      { rab: ["Total RAB tidak sama dengan nilai pagu proyek"] }
    );
  }

  const desaId = body.desaId || actor.desaId;

  const proyek = await prisma.proyek.create({
    data: {
      desaId,
      posAnggaranId: body.posAnggaranId,
      judul: body.judul,
      deskripsi: body.deskripsi,
      lokasi: body.lokasi,
      pagu: BigInt(body.pagu),
      kelas: body.kelas,
      jalur: body.jalur,
      alasanJalur: body.alasanJalur,
      status: StatusProyek.PEMATANGAN,
      tenggatProposal: body.tenggatProposal ? new Date(body.tenggatProposal) : null,
      syaratLokalMin: body.syaratLokalMin ?? 70,
      durasiMin: body.durasiMin ?? 30,
      durasiMax: body.durasiMax ?? 90,
      rab: {
        create: body.rab.map((item) => ({
          uraian: item.uraian,
          volume: item.volume,
          satuan: item.satuan,
          hargaSatuan: BigInt(item.hargaSatuan),
        })),
      },
    },
    include: {
      rab: true,
    },
  });

  await tulisAudit({
    aktorId: actor.id,
    aksi: "BUAT_PROYEK",
    entitas: "PROYEK",
    entitasId: proyek.id,
    sesudah: {
      judul: proyek.judul,
      pagu: Number(proyek.pagu),
      kelas: proyek.kelas,
      status: proyek.status,
    },
  });

  return ok(proyek, undefined, 201);
});
