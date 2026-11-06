import { prisma } from "@/lib/prisma";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { requireAuth, requireAktif } from "@/lib/auth";
import { tulisAudit } from "@/lib/audit";
import {
  validateImageMagicBytes,
  extractExifMetadata,
  simpanFotoProgres,
  ExifMetadata,
} from "@/lib/foto-progres";
import { Peran, Prisma, StatusVerifikasi } from "@prisma/client";

export const POST = apiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const actor = await requireAuth(req);
    requireAktif(actor);

    const { id: proyekId } = await params;

    const proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
      include: {
        keputusan: {
          include: {
            proposal: {
              include: { kelompok: true },
            },
          },
        },
      },
    });

    if (!proyek) {
      throw new ApiError("NOT_FOUND", "Proyek tidak ditemukan");
    }

    // Hak Akses: Penanggung jawab proyek (ketua kelompok pemenang sayembara atau admin/perangkat)
    const isKetuaPemenang =
      proyek.keputusan?.proposal?.kelompok?.ketuaId === actor.id;
    const isInternal =
      actor.peran === Peran.ADMIN || actor.peran === Peran.PERANGKAT;

    if (!isKetuaPemenang && !isInternal) {
      throw new ApiError(
        "FORBIDDEN",
        "Hanya penanggung jawab proyek (ketua kelompok pemenang) yang berhak mengunggah laporan mingguan.",
        undefined,
        403
      );
    }

    // Parsing multipart/form-data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Format permintaan harus berupa multipart/form-data."
      );
    }

    const mingguRaw = formData.get("minggu");
    const persenRaw = formData.get("persen");
    const catatan = (formData.get("catatan") as string) || null;
    const fotoFiles = formData.getAll("foto") as File[];

    const minggu = parseInt(String(mingguRaw), 10);
    if (isNaN(minggu) || minggu < 1 || minggu > 104) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Minggu laporan harus berupa bilangan bulat antara 1 sampai 104.",
        { minggu: ["Minggu harus bernilai 1 sampai 104"] }
      );
    }

    const persen = parseInt(String(persenRaw), 10);
    if (isNaN(persen) || persen < 0 || persen > 100) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Persentase progres harus berupa angka bulat antara 0 sampai 100.",
        { persen: ["Persen harus antara 0 sampai 100"] }
      );
    }

    if (catatan && catatan.length > 1000) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Catatan laporan maksimal 1000 karakter.",
        { catatan: ["Catatan maksimal 1000 karakter"] }
      );
    }

    // Parsing 3 butir boolean checklist
    let checklist = {
      pekerjaSesuaiRencana: false,
      materialTersedia: false,
      pekerjaanSesuaiGambar: false,
    };
    const checklistRaw = formData.get("checklist");
    if (checklistRaw) {
      try {
        const parsed =
          typeof checklistRaw === "string"
            ? JSON.parse(checklistRaw)
            : checklistRaw;
        checklist = {
          pekerjaSesuaiRencana: Boolean(parsed.pekerjaSesuaiRencana),
          materialTersedia: Boolean(parsed.materialTersedia),
          pekerjaanSesuaiGambar: Boolean(parsed.pekerjaanSesuaiGambar),
        };
      } catch {
        // Fallback
      }
    } else {
      checklist = {
        pekerjaSesuaiRencana: formData.get("pekerjaSesuaiRencana") === "true",
        materialTersedia: formData.get("materialTersedia") === "true",
        pekerjaanSesuaiGambar: formData.get("pekerjaanSesuaiGambar") === "true",
      };
    }

    // 1. Validasi keunikan minggu pada proyek (Tolak 409 jika sudah ada)
    const existingLaporan = await prisma.laporanProgres.findUnique({
      where: {
        proyekId_minggu: {
          proyekId: proyek.id,
          minggu,
        },
      },
    });

    if (existingLaporan) {
      throw new ApiError(
        "CONFLICT",
        `Laporan progres untuk minggu ke-${minggu} sudah pernah diunggah pada proyek ini.`
      );
    }

    // 2. Validasi persentase progres tidak boleh turun dibanding laporan terverifikasi sebelumnya (Tolak 400)
    const lastVerified = await prisma.laporanProgres.findFirst({
      where: {
        proyekId: proyek.id,
        status: StatusVerifikasi.DISETUJUI,
      },
      orderBy: { persen: "desc" },
    });

    if (lastVerified && persen < lastVerified.persen) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `Persentase progres (${persen}%) tidak boleh lebih kecil dari progres terverifikasi sebelumnya (${lastVerified.persen}%).`,
        {
          persen: [
            `Persentase tidak boleh turun di bawah ${lastVerified.persen}%`,
          ],
        }
      );
    }

    // 3. Validasi jumlah berkas foto (1 sampai 5 berkas)
    if (!fotoFiles || fotoFiles.length < 1 || fotoFiles.length > 5) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Minimal 1 foto dan maksimal 5 foto progres wajib disertakan.",
        { foto: ["Jumlah berkas foto harus antara 1 sampai 5"] }
      );
    }

    // 4. Validasi isi biner / magic bytes dan ekstraksi EXIF per foto
    const fotoUrls: string[] = [];
    const exifList: ExifMetadata[] = [];

    for (let i = 0; i < fotoFiles.length; i++) {
      const file = fotoFiles[i];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const magicCheck = validateImageMagicBytes(buffer);
      if (!magicCheck.valid) {
        throw new ApiError(
          "VALIDATION_ERROR",
          `Berkas foto ke-${i + 1} tidak valid: ${magicCheck.error}`,
          { foto: [magicCheck.error || "Format gambar tidak didukung"] }
        );
      }

      const exifData = await extractExifMetadata(buffer);
      exifList.push(exifData);

      const uploadResult = await simpanFotoProgres(
        proyek.id,
        minggu,
        buffer,
        magicCheck.ext || "jpg"
      );
      fotoUrls.push(uploadResult.url);
    }

    // 5. Simpan ke tabel LaporanProgres
    const laporan = await prisma.laporanProgres.create({
      data: {
        proyekId: proyek.id,
        minggu,
        persen,
        fotoUrls,
        exif: exifList as unknown as Prisma.InputJsonValue,
        checklist: checklist as unknown as Prisma.InputJsonValue,
        catatan,
        status: StatusVerifikasi.MENUNGGU,
        pengunggahId: actor.id,
      },
    });

    await tulisAudit({
      aktorId: actor.id,
      aksi: "UNGGAH_LAPORAN_PROGRES",
      entitas: "LAPORAN_PROGRES",
      entitasId: laporan.id,
      sesudah: {
        proyekId: proyek.id,
        minggu,
        persen,
        jumlahFoto: fotoUrls.length,
        status: StatusVerifikasi.MENUNGGU,
      },
    });

    return ok(laporan, undefined, 201);
  }
);

export const GET = apiHandler(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id: proyekId } = await params;

    const proyek = await prisma.proyek.findUnique({
      where: { id: proyekId },
    });

    if (!proyek) {
      throw new ApiError("NOT_FOUND", "Proyek tidak ditemukan");
    }

    const laporanList = await prisma.laporanProgres.findMany({
      where: { proyekId: proyek.id },
      orderBy: { minggu: "asc" },
      include: {
        pengunggah: {
          select: { id: true, nama: true, peran: true },
        },
        pengawas: {
          select: { id: true, nama: true, peran: true },
        },
      },
    });

    // Deteksi linimasa minggu yang terlewat (FR-K5)
    const maxMinggu =
      laporanList.length > 0
        ? Math.max(...laporanList.map((l) => l.minggu))
        : 0;

    const reportedWeeks = new Set(laporanList.map((l) => l.minggu));
    const mingguTerlewat: number[] = [];

    for (let m = 1; m <= maxMinggu; m++) {
      if (!reportedWeeks.has(m)) {
        mingguTerlewat.push(m);
      }
    }

    return ok(laporanList, {
      total: laporanList.length,
      maxMinggu,
      mingguTerlewat,
    });
  }
);
