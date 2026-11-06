import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { hitungRingkasanKas } from "@/lib/kas-ringkasan";

export const GET = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const url = new URL(req.url);
    const tahunParam = url.searchParams.get("tahun");

    let desa = await prisma.desa.findUnique({
      where: { id },
    });

    // Fallback jika id seed digunakan sebelum ID custom terpasang
    if (!desa && (id === "seed_desa_001" || id === "default")) {
      desa = await prisma.desa.findFirst();
    }

    if (!desa) {
      throw new ApiError(
        "NOT_FOUND",
        `Desa dengan ID '${id}' tidak ditemukan`
      );
    }

    const tahun = tahunParam ? parseInt(tahunParam, 10) : desa.tahun;

    // 1. Ambil Sumber Dana desa
    const sumberDanaList = await prisma.sumberDana.findMany({
      where: {
        desaId: desa.id,
        ...(tahun ? { tahun } : {}),
      },
    });

    // 2. Ambil Pos Anggaran desa dengan relasi akun (termasuk hierarki akun induk)
    const posList = await prisma.posAnggaran.findMany({
      where: {
        desaId: desa.id,
        ...(tahun ? { tahun } : {}),
      },
      include: {
        akun: {
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        },
      },
    });

    // 3. Ambil seluruh Entri Kas desa beserta riwayat verifikasi
    const entriList = await prisma.entriKas.findMany({
      where: {
        desaId: desa.id,
      },
      include: {
        verifikasi: true,
      },
      orderBy: { nomorUrut: "asc" },
    });

    // 4. Ambil daftar Bidang utama (LevelAkun.BIDANG)
    const bidangList = await prisma.refAkun.findMany({
      where: { level: "BIDANG" },
      orderBy: { kode: "asc" },
    });

    // 5. Hitung agregasi kas murni
    const ringkasan = hitungRingkasanKas({
      sumberDanaList,
      posList,
      entriList,
      bidangList,
    });

    // 6. Buat daftar transaksi terakhir untuk kompatibilitas tampilan lama
    const transaksiTerakhir = entriList
      .slice(-10)
      .reverse()
      .map((e) => ({
        id: e.id,
        nomorUrut: e.nomorUrut,
        tanggal: e.tanggal.toISOString(),
        jenis: e.jenis,
        uraian: e.uraian,
        jumlah: Number(e.jumlah),
        hash: e.hash,
        hashPendek: e.hash.slice(0, 8),
      }));

    const responsePayload = {
      desaId: desa.id,
      namaDesa: desa.nama,
      sumberDana: ringkasan.sumberDana,
      total: ringkasan.total,
      perPos: ringkasan.perPos,
      perBidang: ringkasan.perBidang,
      hashTerakhir: ringkasan.hashTerakhir,
      diperbaruiPada: ringkasan.diperbaruiPada,
      // Kompatibilitas UI
      totalPemasukan: ringkasan.total.diterima,
      totalPengeluaran: ringkasan.total.terealisasi,
      sisaSaldo: ringkasan.total.kasTersediaUntukDibayar,
      transaksiTerakhir,
    };

    return ok(responsePayload);
  }
);
