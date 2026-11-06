import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna } from "@/lib/auth";
import { getStatusVerifikasiEntri } from "@/lib/kas-ringkasan";
import { Peran } from "@prisma/client";

export const GET = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    const entry = await prisma.entriKas.findUnique({
      where: { id },
      include: {
        verifikasi: {
          include: {
            pengawas: {
              select: { id: true, nama: true, peran: true },
            },
          },
          orderBy: { waktu: "desc" },
        },
        sumberDana: true,
        pos: true,
        proyek: true,
        termin: true,
        koreksiDari: true,
        pencatat: {
          select: { id: true, nama: true, peran: true },
        },
      },
    });

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entri kas tidak ditemukan");
    }

    const actor = await getPengguna(req).catch(() => null);
    const isInternal =
      actor &&
      (actor.peran === Peran.PERANGKAT ||
        actor.peran === Peran.PENGAWAS ||
        actor.peran === Peran.ADMIN);

    let penerima = entry.penerima;
    if (!isInternal && entry.penerimaDisamarkan && entry.penerima) {
      penerima = "Penerima Perorangan (Disamarkan)";
    }

    const statusVerifikasi = getStatusVerifikasiEntri(entry.verifikasi);

    const payload = {
      id: entry.id,
      desaId: entry.desaId,
      nomorUrut: entry.nomorUrut,
      jenis: entry.jenis,
      jumlah: Number(entry.jumlah),
      tanggal: entry.tanggal.toISOString(),
      uraian: entry.uraian,
      penerima,
      penerimaDisamarkan: entry.penerimaDisamarkan,
      buktiUrls: entry.buktiUrls,
      hashSebelumnya: entry.hashSebelumnya,
      hash: entry.hash,
      hashPendek: entry.hash.slice(0, 8),
      statusVerifikasi,
      dibuatPada: entry.dibuatPada.toISOString(),
      sumberDana: entry.sumberDana,
      pos: entry.pos,
      proyek: entry.proyek,
      termin: entry.termin,
      koreksiDari: entry.koreksiDari,
      pencatat: entry.pencatat,
      riwayatVerifikasi: entry.verifikasi.map((v) => ({
        id: v.id,
        keputusan: v.keputusan,
        catatan: v.catatan,
        waktu: v.waktu.toISOString(),
        pengawas: v.pengawas,
      })),
    };

    return ok(payload);
  }
);

