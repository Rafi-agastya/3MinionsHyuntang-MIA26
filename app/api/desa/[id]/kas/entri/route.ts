import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { getPengguna, requireRole } from "@/lib/auth";
import { getStatusVerifikasiEntri, hitungRingkasanKas } from "@/lib/kas-ringkasan";
import { tambahEntri } from "@/lib/kas-ledger";
import { tulisAudit } from "@/lib/audit";
import { samarkanEntri, samarkanDaftarEntri } from "@/lib/kas-sensitif";
import { JenisEntri, Peran, Prisma } from "@prisma/client";

const buatEntriKasSchema = z.object({
  jenis: z.enum([JenisEntri.PENERIMAAN, JenisEntri.PEMBAYARAN], {
    errorMap: () => ({
      message:
        "Jenis entri harus PENERIMAAN atau PEMBAYARAN. KOMITMEN dibuat otomatis dan KOREKSI melalui endpoint khusus",
    }),
  }),
  jumlah: z.coerce.number().positive("Jumlah transaksi harus lebih dari 0"),
  tanggal: z.coerce.date(),
  uraian: z
    .string()
    .min(10, "Uraian transaksi minimal 10 karakter")
    .max(300, "Uraian transaksi maksimal 300 karakter"),
  sumberDanaId: z.string().optional().nullable(),
  posId: z.string().optional().nullable(),
  proyekId: z.string().optional().nullable(),
  terminId: z.string().optional().nullable(),
  penerima: z
    .string()
    .max(120, "Nama penerima maksimal 120 karakter")
    .optional()
    .nullable(),
  penerimaDisamarkan: z.boolean().default(true),
  buktiUrls: z
    .array(z.string().min(1, "URL bukti tidak boleh kosong"))
    .min(1, "Minimal satu tautan bukti transaksi wajib disertakan"),
});

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

    const actor = await getPengguna(req).catch(() => null);

    const formatted = entries.map((e) => {
      const statusVerifikasi = getStatusVerifikasiEntri(e.verifikasi);
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
        penerima: e.penerima,
        penerimaDisamarkan: e.penerimaDisamarkan,
        buktiUrls: e.buktiUrls,
        pencatatId: e.pencatatId,
        statusVerifikasi,
        hashSebelumnya: e.hashSebelumnya,
        hash: e.hash,
        hashPendek: e.hash.slice(0, 8),
        dibuatPada: e.dibuatPada.toISOString(),
        pos: e.pos ? { sensitif: e.pos.sensitif, uraian: e.pos.uraian } : null,
      };
    });

    const masked = samarkanDaftarEntri(formatted, actor?.peran);

    return ok(masked, { page, pageSize, total });
  }
);

export const POST = apiHandler(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await getPengguna(req);
    requireRole(actor, Peran.PERANGKAT, Peran.ADMIN);

    const { id: desaId } = await params;
    const desa = await prisma.desa.findUnique({
      where: { id: desaId },
    });
    if (!desa) {
      throw new ApiError("NOT_FOUND", `Desa dengan ID '${desaId}' tidak ditemukan`);
    }

    const bodyJson = await req.json();
    const body = buatEntriKasSchema.parse(bodyJson);

    // Validasi aturan bisnis spesifik PEMBAYARAN
    if (body.jenis === JenisEntri.PEMBAYARAN) {
      // 1. Cek batasan termin jika terminId ditentukan
      if (body.terminId) {
        const termin = await prisma.termin.findUnique({
          where: { id: body.terminId },
        });
        if (!termin) {
          throw new ApiError("NOT_FOUND", "Data termin tidak ditemukan");
        }
        if (!termin.terbuka) {
          throw new ApiError(
            "CONFLICT",
            "Termin belum berstatus terbuka. Pengawas harus membuka termin terlebih dahulu sebelum pembayaran dicairkan."
          );
        }
        if (BigInt(body.jumlah) !== termin.nilai) {
          throw new ApiError(
            "CONFLICT",
            `Nominal pembayaran (Rp ${body.jumlah.toLocaleString("id-ID")}) harus sesuai dengan nilai termin yang ditetapkan (Rp ${Number(termin.nilai).toLocaleString("id-ID")})`
          );
        }
      }

      // 2. Cek batasan akumulasi pembayaran terhadap kontrak proyek jika proyekId ditentukan
      if (body.proyekId) {
        const proyek = await prisma.proyek.findUnique({
          where: { id: body.proyekId },
        });
        if (!proyek) {
          throw new ApiError("NOT_FOUND", "Proyek tidak ditemukan");
        }

        // Ambil komitmen aktif proyek
        const komitmenEntri = await prisma.entriKas.findFirst({
          where: {
            proyekId: body.proyekId,
            jenis: JenisEntri.KOMITMEN,
            koreksi: { none: {} },
          },
        });

        const nilaiKontrak = komitmenEntri
          ? Number(komitmenEntri.jumlah)
          : Number(proyek.pagu);

        // Ambil akumulasi pembayaran sebelumnya yang tidak dikoreksi
        const priorPayments = await prisma.entriKas.findMany({
          where: {
            proyekId: body.proyekId,
            jenis: JenisEntri.PEMBAYARAN,
            koreksi: { none: {} },
          },
        });

        const totalPrior = priorPayments.reduce(
          (acc, p) => acc + Number(p.jumlah),
          0
        );

        if (totalPrior + body.jumlah > nilaiKontrak) {
          throw new ApiError(
            "CONFLICT",
            `Akumulasi pembayaran (Rp ${(totalPrior + body.jumlah).toLocaleString("id-ID")}) melebihi nilai kontrak/komitmen proyek (Rp ${nilaiKontrak.toLocaleString("id-ID")})`
          );
        }
      }
    }

    // Tulis ke ledger lewat fungsi murni tambahEntri
    const newEntry = await tambahEntri(prisma, {
      desaId: desa.id,
      jenis: body.jenis,
      jumlah: body.jumlah,
      tanggal: body.tanggal,
      uraian: body.uraian,
      sumberDanaId: body.sumberDanaId ?? null,
      posId: body.posId ?? null,
      proyekId: body.proyekId ?? null,
      terminId: body.terminId ?? null,
      penerima: body.penerima ?? null,
      penerimaDisamarkan: body.penerimaDisamarkan,
      buktiUrls: body.buktiUrls,
      pencatatId: actor.id,
    });

    // Tulis ke audit_log
    await tulisAudit({
      aktorId: actor.id,
      aksi: `CATAT_KAS_${body.jenis}`,
      entitas: "ENTRI_KAS",
      entitasId: newEntry.id,
      sesudah: {
        nomorUrut: newEntry.nomorUrut,
        jenis: newEntry.jenis,
        jumlah: Number(newEntry.jumlah),
        uraian: newEntry.uraian,
      },
    });

    // Hitung status peringatan non-blocking (PRD Bagian 44 & 48.3)
    const peringatan: string[] = [];

    // Ambil data untuk ringkasan terkini
    const [sumberDanaList, posList, entriList] = await Promise.all([
      prisma.sumberDana.findMany({ where: { desaId: desa.id } }),
      prisma.posAnggaran.findMany({
        where: { desaId: desa.id },
        include: {
          akun: {
            include: {
              parent: {
                include: { parent: true },
              },
            },
          },
        },
      }),
      prisma.entriKas.findMany({
        where: { desaId: desa.id },
        include: { verifikasi: true, pos: true },
      }),
    ]);

    const ringkasan = hitungRingkasanKas({
      sumberDanaList,
      posList,
      entriList,
    });

    // Peringatan 1: Sisa tersedia pos anggaran menjadi negatif
    if (body.posId && ringkasan.perPos[body.posId]?.tersedia < 0) {
      peringatan.push(
        "Komitmen/pengeluaran melebihi anggaran pos yang tersedia (sisa pos negatif)"
      );
    }

    // Peringatan 2: Kas tersedia untuk dibayar menjadi negatif
    if (ringkasan.total.kasTersediaUntukDibayar < 0) {
      peringatan.push(
        "Kas tersedia untuk dibayar berada dalam posisi defisit (negatif)"
      );
    }

    // Peringatan 3: Ada entri yang menunggu verifikasi lebih dari 14 hari
    const empatBelasHariLalu = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const hasOverdueUnverified = entriList.some(
      (e) =>
        e.dibuatPada < empatBelasHariLalu &&
        getStatusVerifikasiEntri(e.verifikasi) === "MENUNGGU"
    );
    if (hasOverdueUnverified) {
      peringatan.push(
        "Terdapat entri kas yang belum diverifikasi selama lebih dari 14 hari"
      );
    }

    const pos = body.posId
      ? await prisma.posAnggaran.findUnique({ where: { id: body.posId } })
      : null;

    const formatted = {
      id: newEntry.id,
      desaId: newEntry.desaId,
      nomorUrut: newEntry.nomorUrut,
      jenis: newEntry.jenis,
      jumlah: Number(newEntry.jumlah),
      tanggal: newEntry.tanggal.toISOString(),
      uraian: newEntry.uraian,
      sumberDanaId: newEntry.sumberDanaId,
      posId: newEntry.posId,
      proyekId: newEntry.proyekId,
      terminId: newEntry.terminId,
      koreksiDariId: newEntry.koreksiDariId,
      penerima: newEntry.penerima,
      penerimaDisamarkan: newEntry.penerimaDisamarkan,
      buktiUrls: newEntry.buktiUrls,
      pencatatId: newEntry.pencatatId,
      statusVerifikasi: "MENUNGGU",
      hashSebelumnya: newEntry.hashSebelumnya,
      hash: newEntry.hash,
      hashPendek: newEntry.hash.slice(0, 8),
      dibuatPada: newEntry.dibuatPada.toISOString(),
      pos: pos ? { sensitif: pos.sensitif, uraian: pos.uraian } : null,
    };

    const masked = samarkanEntri(formatted, actor.peran);

    return ok(masked, { peringatan }, 201);
  }
);
