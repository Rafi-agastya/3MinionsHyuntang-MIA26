import { z } from "zod";
import { Peran } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok } from "@/lib/api";
import { requireAuth, requireRole, requireAktif } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import { hashNik } from "@/lib/nik";

// Skema Validasi Pembuatan Kelompok Warga (PRD 33.2 #13 & PRD 35.2)
const anggotaSchema = z.object({
  nama: z
    .string({ required_error: "Nama anggota wajib diisi." })
    .min(3, "Nama anggota minimal 3 karakter.")
    .max(80, "Nama anggota maksimal 80 karakter."),
  rtRw: z
    .string({ required_error: "Nomor RT/RW anggota wajib diisi." })
    .regex(/^\d{2,3}\/\d{2,3}$/, "Format RT/RW anggota harus seperti '03/05'."),
  nik: z
    .string()
    .regex(/^\d{16}$/, "NIK harus berupa 16 digit angka.")
    .optional()
    .nullable(),
});

const buatKelompokSchema = z.object({
  nama: z
    .string({ required_error: "Nama kelompok wajib diisi." })
    .min(3, "Nama kelompok minimal 3 karakter.")
    .max(80, "Nama kelompok maksimal 80 karakter."),
  anggota: z
    .array(anggotaSchema)
    .min(2, "Kelompok minimal harus memiliki 2 orang anggota.")
    .max(30, "Kelompok maksimal terdiri dari 30 orang anggota."),
});

export const POST = apiHandler(async (req: Request) => {
  // 1. Verifikasi pengguna (hanya WARGA aktif yang boleh membuat kelompok)
  const user = await requireAuth(req);
  requireRole(user, Peran.WARGA);
  requireAktif(user);

  // 2. Validasi input Zod
  const rawBody = await req.json();
  const body = buatKelompokSchema.parse(rawBody);

  // 3. Transformasi anggota: NIK mentah diubah menjadi hash SHA-256 + garam server (FR-ID1)
  // Nilai NIK asli TIDAK disimpan dan TIDAK pernah dikembalikan ke klien.
  const anggotaData = body.anggota.map((ang, index) => {
    const nikHashed = ang.nik ? hashNik(ang.nik) : null;
    const isKetua = index === 0;

    return {
      nama: ang.nama.trim(),
      rtRw: ang.rtRw.trim(),
      nikHash: nikHashed,
      ketua: isKetua,
      penggunaId: isKetua ? user.id : null,
    };
  });

  // 4. Simpan kelompok dan anggota ke database
  const kelompok = await prisma.kelompok.create({
    data: {
      nama: body.nama.trim(),
      ketuaId: user.id,
      anggota: {
        create: anggotaData,
      },
    },
    include: {
      anggota: true,
    },
  });

  // 5. Catat ke AuditLog (append-only)
  await tulisAudit({
    aktorId: user.id,
    aksi: "BUAT_KELOMPOK",
    entitas: "Kelompok",
    entitasId: kelompok.id,
    sesudah: {
      id: kelompok.id,
      nama: kelompok.nama,
      ketuaId: user.id,
      jumlahAnggota: body.anggota.length,
    },
  });

  // 6. Kembalikan respons 201 dengan ID kelompok sesuai PRD 33.2 #13
  return ok(
    {
      id: kelompok.id,
      nama: kelompok.nama,
    },
    undefined,
    201
  );
});

// ================= GET: DAFTAR KELOMPOK PENGGUNA (PRD Modul E & FR-E2) =================
export const GET = apiHandler(async (req: Request) => {
  const user = await requireAuth(req);
  requireRole(user, Peran.WARGA, Peran.PERANGKAT, Peran.PENGAWAS, Peran.ADMIN);

  // Perangkat Desa, Pengawas, dan Admin dapat melihat seluruh kelompok untuk verifikasi;
  // Warga melihat kelompok yang diketuai atau di mana ia terdaftar sebagai anggota.
  const isInternal =
    user.peran === Peran.PERANGKAT ||
    user.peran === Peran.PENGAWAS ||
    user.peran === Peran.ADMIN;

  const whereClause = isInternal
    ? {}
    : {
        OR: [
          { ketuaId: user.id },
          { anggota: { some: { penggunaId: user.id } } },
        ],
      };

  const kelompokList = await prisma.kelompok.findMany({
    where: whereClause,
    include: {
      ketua: {
        select: {
          id: true,
          nama: true,
          email: true,
        },
      },
      anggota: {
        select: {
          id: true,
          nama: true,
          rtRw: true,
          ketua: true,
          // NIK mentah dan nikHash SENGAJA TIDAK DISERTAKAN demi privasi (FR-ID1)
        },
      },
      _count: {
        select: {
          anggota: true,
          proposal: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return ok(kelompokList);
});

