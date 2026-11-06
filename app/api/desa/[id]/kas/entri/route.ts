import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna } from "@/lib/auth";
import { getStatusVerifikasiEntri } from "@/lib/kas-ringkasan";
import { JenisEntri, Peran, Prisma } from "@prisma/client";

export const GET = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id: desaId } = await params;
    const url = new URL(req.url);

    const desa = await prisma.desa.findUnique({
      where: { id: desaId },
    });
    if (!desa) {
      throw new ApiError("NOT_FOUND", `Desa dengan ID '${desaId}' tidak ditemukan`);
    }

    const jenisParam = url.searchParams.get("jenis");
    const posIdParam = url.searchParams.get("posId");
    const proyekIdParam = url.searchParams.get("proyekId");
    const dariParam = url.searchParams.get("dari");
    const sampaiParam = url.searchParams.get("sampai");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10))
    );

    const where: Prisma.EntriKasWhereInput = { desaId: desa.id };

    if (
      jenisParam &&
      Object.values(JenisEntri).includes(jenisParam as JenisEntri)
    ) {
      where.jenis = jenisParam as JenisEntri;
    }
    if (posIdParam) where.posId = posIdParam;
    if (proyekIdParam) where.proyekId = proyekIdParam;
    if (dariParam || sampaiParam) {
      const tanggalFilter: Prisma.DateTimeFilter = {};
      if (dariParam) tanggalFilter.gte = new Date(dariParam);
      if (sampaiParam) tanggalFilter.lte = new Date(sampaiParam);
      where.tanggal = tanggalFilter;
    }

    const total = await prisma.entriKas.count({ where });

    const entries = await prisma.entriKas.findMany({
      where,
      orderBy: { nomorUrut: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        verifikasi: {
          orderBy: { waktu: "desc" },
        },
        pos: true,
      },
    });

    // Cek aktor untuk aturan penyamaran data sensitif (PRD 45.2)
    const actor = await getPengguna(req).catch(() => null);
    const isInternal =
      actor &&
      (actor.peran === Peran.PERANGKAT ||
        actor.peran === Peran.PENGAWAS ||
        actor.peran === Peran.ADMIN);

    const formatted = entries.map((e) => {
      const statusVerifikasi = getStatusVerifikasiEntri(e.verifikasi);
      let penerima = e.penerima;

      if (!isInternal && e.penerimaDisamarkan && e.penerima) {
        penerima = "Penerima Perorangan (Disamarkan)";
      }

      return {
        id: e.id,
        desaId: e.desaId,
        nomorUrut: e.nomorUrut,
        jenis: e.jenis,
        jumlah: Number(e.jumlah),
        tanggal: e.tanggal.toISOString(),
        uraian: e.uraian,
        sumberDanaId: e.sumberDanaId,
        posId: e.posId,
        proyekId: e.proyekId,
        terminId: e.terminId,
        koreksiDariId: e.koreksiDariId,
        penerima,
        penerimaDisamarkan: e.penerimaDisamarkan,
        buktiUrls: e.buktiUrls,
        pencatatId: e.pencatatId,
        statusVerifikasi,
        hashSebelumnya: e.hashSebelumnya,
        hash: e.hash,
        hashPendek: e.hash.slice(0, 8),
        dibuatPada: e.dibuatPada.toISOString(),
      };
    });

    return ok(formatted, { page, pageSize, total });
  }
);
