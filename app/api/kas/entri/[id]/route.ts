import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna } from "@/lib/auth";
import { getStatusVerifikasiEntri } from "@/lib/kas-ringkasan";
import { samarkanEntri } from "@/lib/kas-sensitif";

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
    const statusVerifikasi = getStatusVerifikasiEntri(entry.verifikasi);

    const payload = {
      id: entry.id,
      desaId: entry.desaId,
      nomorUrut: entry.nomorUrut,
      jenis: entry.jenis,
      jumlah: Number(entry.jumlah),
      tanggal: entry.tanggal.toISOString(),
      uraian: entry.uraian,
      penerima: entry.penerima,
      penerimaDisamarkan: entry.penerimaDisamarkan,
      buktiUrls: entry.buktiUrls,
      hashSebelumnya: entry.hashSebelumnya,
      hash: entry.hash,
      hashPendek: entry.hash.slice(0, 8),
      statusVerifikasi,
      dibuatPada: entry.dibuatPada.toISOString(),
      sumberDana: entry.sumberDana,
      pos: entry.pos
        ? {
            id: entry.pos.id,
            uraian: entry.pos.uraian,
            sensitif: entry.pos.sensitif,
            anggaran: Number(entry.pos.anggaran),
          }
        : null,
      proyek: entry.proyek,
      termin: entry.termin
        ? {
            id: entry.termin.id,
            tahap: entry.termin.tahap,
            nilai: Number(entry.termin.nilai),
            terbuka: entry.termin.terbuka,
          }
        : null,
      koreksiDari: entry.koreksiDari,
      pencatat: entry.pencatat,
      pencatatId: entry.pencatatId,
      riwayatVerifikasi: entry.verifikasi.map((v) => ({
        id: v.id,
        keputusan: v.keputusan,
        catatan: v.catatan,
        waktu: v.waktu.toISOString(),
        pengawas: v.pengawas,
      })),
    };

    const masked = samarkanEntri(payload, actor?.peran);

    return ok(masked);
  }
);
