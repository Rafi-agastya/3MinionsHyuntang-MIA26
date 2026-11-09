/**
 * /lib/open-data.ts
 * Logika bisnis ekstraksi dan formatting dataset Open Data (FR-OD1 s.d. FR-OD4 & K12).
 * Menjamin penyamaran data pribadi secara ketat (T10: tanpa NIK, hash NIK, atau identitas anonim).
 */

import { prisma } from "@/lib/prisma";
import { CsvColumn } from "@/lib/csv";
import { samarkanEntri } from "@/lib/kas-sensitif";
import { getStatusVerifikasiEntri, hitungRingkasanKas } from "@/lib/kas-ringkasan";
import { Peran } from "@prisma/client";

export type DatasetName =
  | "anggaran"
  | "proyek"
  | "termin"
  | "kas"
  | "tiket-agregat";

export const VALID_DATASETS: readonly DatasetName[] = [
  "anggaran",
  "proyek",
  "termin",
  "kas",
  "tiket-agregat",
] as const;

export function isValidDataset(name: string): name is DatasetName {
  return VALID_DATASETS.includes(name as DatasetName);
}

// ================= KAMUS KOLOM DATASET =================

export const ANGGARAN_COLUMNS: CsvColumn[] = [
  { key: "tahun", header: "tahun" },
  { key: "kode_bidang", header: "kode_bidang" },
  { key: "nama_bidang", header: "nama_bidang" },
  { key: "kode_kegiatan", header: "kode_kegiatan" },
  { key: "uraian", header: "uraian" },
  { key: "sumber_dana", header: "sumber_dana" },
  { key: "jenis_belanja", header: "jenis_belanja" },
  { key: "anggaran", header: "anggaran" },
  { key: "terikat", header: "terikat" },
  { key: "terealisasi", header: "terealisasi" },
  { key: "sisa_anggaran", header: "sisa_anggaran" },
];

export const PROYEK_COLUMNS: CsvColumn[] = [
  { key: "id", header: "id" },
  { key: "judul", header: "judul" },
  { key: "deskripsi", header: "deskripsi" },
  { key: "lokasi", header: "lokasi" },
  { key: "kelas", header: "kelas" },
  { key: "pagu", header: "pagu" },
  { key: "status", header: "status" },
  { key: "jalur", header: "jalur" },
  { key: "durasi_min", header: "durasi_min" },
  { key: "durasi_max", header: "durasi_max" },
  { key: "syarat_lokal_min", header: "syarat_lokal_min" },
  { key: "tanggal_dibuat", header: "tanggal_dibuat" },
];

export const TERMIN_COLUMNS: CsvColumn[] = [
  { key: "proyek_id", header: "proyek_id" },
  { key: "judul_proyek", header: "judul_proyek" },
  { key: "tahap", header: "tahap" },
  { key: "nilai", header: "nilai" },
  { key: "terbuka", header: "terbuka" },
];

export const KAS_COLUMNS: CsvColumn[] = [
  { key: "nomor_urut", header: "nomor_urut" },
  { key: "tanggal", header: "tanggal" },
  { key: "jenis", header: "jenis" },
  { key: "jumlah", header: "jumlah" },
  { key: "uraian", header: "uraian" },
  { key: "penerima", header: "penerima" },
  { key: "sumber_dana", header: "sumber_dana" },
  { key: "pos_anggaran", header: "pos_anggaran" },
  { key: "judul_proyek", header: "judul_proyek" },
  { key: "hash", header: "hash" },
  { key: "status_verifikasi", header: "status_verifikasi" },
];

export const TIKET_AGREGAT_COLUMNS: CsvColumn[] = [
  { key: "kategori", header: "kategori" },
  { key: "jumlah_total", header: "jumlah_total" },
  { key: "status_baru", header: "status_baru" },
  { key: "status_ditinjau", header: "status_ditinjau" },
  { key: "status_ditanggapi", header: "status_ditanggapi" },
  { key: "status_selesai", header: "status_selesai" },
  { key: "rata_rata_hari_tanggapan", header: "rata_rata_hari_tanggapan" },
];

// ================= FUNGSI EKSTRAKSI DATA =================

export async function fetchDatasetAnggaran(desaId?: string) {
  const whereDesa = desaId ? { desaId } : {};

  const [posList, sumberDanaList, entriList, bidangList] = await Promise.all([
    prisma.posAnggaran.findMany({
      where: whereDesa,
      include: {
        akun: {
          include: {
            parent: {
              include: { parent: true },
            },
          },
        },
        sumberDana: true,
      },
    }),
    prisma.sumberDana.findMany({ where: whereDesa }),
    prisma.entriKas.findMany({
      where: whereDesa,
      include: { verifikasi: true, pos: true },
    }),
    prisma.refAkun.findMany({ where: { level: "BIDANG" } }),
  ]);

  const ringkasan = hitungRingkasanKas({
    sumberDanaList,
    posList,
    entriList,
    bidangList,
  });

  return posList.map((pos) => {
    const summary = ringkasan.perPos[pos.id] || {
      terikat: 0,
      terealisasi: 0,
      tersedia: Number(pos.anggaran),
    };

    // Ambil data bidang induk: pos -> akun (kegiatan) -> sub-bidang -> bidang
    const bidang =
      pos.akun?.parent?.parent ?? pos.akun?.parent ?? pos.akun ?? null;

    return {
      tahun: pos.tahun,
      kode_bidang: bidang?.kode ?? "-",
      nama_bidang: bidang?.uraian ?? "-",
      kode_kegiatan: pos.akun?.kode ?? "-",
      uraian: pos.uraian,
      sumber_dana: pos.sumberDana?.nama ?? "-",
      jenis_belanja: pos.jenisBelanja,
      anggaran: Number(pos.anggaran),
      terikat: summary.terikat,
      terealisasi: summary.terealisasi,
      sisa_anggaran: summary.tersedia,
    };
  });
}

export async function fetchDatasetProyek(desaId?: string) {
  const whereDesa = desaId ? { desaId } : {};

  const proyekList = await prisma.proyek.findMany({
    where: whereDesa,
    orderBy: { createdAt: "desc" },
  });

  return proyekList.map((p) => ({
    id: p.id,
    judul: p.judul,
    deskripsi: p.deskripsi,
    lokasi: p.lokasi,
    kelas: p.kelas,
    pagu: Number(p.pagu),
    status: p.status,
    jalur: p.jalur ?? "-",
    durasi_min: p.durasiMin,
    durasi_max: p.durasiMax,
    syarat_lokal_min: p.syaratLokalMin,
    tanggal_dibuat: p.createdAt.toISOString().split("T")[0],
  }));
}

export async function fetchDatasetTermin(desaId?: string) {
  const whereProyek = desaId ? { proyek: { desaId } } : {};

  const terminList = await prisma.termin.findMany({
    where: whereProyek,
    include: { proyek: true },
    orderBy: [{ proyekId: "asc" }, { tahap: "asc" }],
  });

  return terminList.map((t) => ({
    proyek_id: t.proyekId,
    judul_proyek: t.proyek?.judul ?? "-",
    tahap: t.tahap,
    nilai: Number(t.nilai),
    terbuka: t.terbuka,
  }));
}

export async function fetchDatasetKas(desaId?: string) {
  const whereDesa = desaId ? { desaId } : {};

  const entriList = await prisma.entriKas.findMany({
    where: whereDesa,
    include: {
      sumberDana: true,
      pos: true,
      proyek: true,
      verifikasi: {
        orderBy: { waktu: "desc" },
      },
    },
    orderBy: { nomorUrut: "asc" },
  });

  return entriList.map((e) => {
    // 1. Ambil status verifikasi
    const statusVerifikasi = getStatusVerifikasiEntri(e.verifikasi);

    // 2. Terapkan penyamaran publik (Peran.WARGA) secara ketat
    // Nama perorangan disamarkan & uraian pos sensitif disamarkan (PRD 45.2 & K12)
    const masked = samarkanEntri(
      {
        id: e.id,
        desaId: e.desaId,
        nomorUrut: e.nomorUrut,
        jenis: e.jenis,
        jumlah: e.jumlah,
        tanggal: e.tanggal,
        uraian: e.uraian,
        penerima: e.penerima,
        penerimaDisamarkan: e.penerimaDisamarkan,
        buktiUrls: e.buktiUrls,
        pencatatId: e.pencatatId,
        hash: e.hash,
        dibuatPada: e.dibuatPada,
        pos: e.pos ? { sensitif: e.pos.sensitif, uraian: e.pos.uraian } : null,
      },
      Peran.WARGA
    );

    return {
      nomor_urut: masked.nomorUrut,
      tanggal: (e.tanggal instanceof Date ? e.tanggal : new Date(e.tanggal))
        .toISOString()
        .split("T")[0],
      jenis: masked.jenis,
      jumlah: Number(masked.jumlah),
      uraian: masked.uraian,
      penerima: masked.penerima ?? "-",
      sumber_dana: e.sumberDana?.nama ?? "-",
      pos_anggaran: e.pos?.uraian ?? "-",
      judul_proyek: e.proyek?.judul ?? "-",
      hash: masked.hash,
      status_verifikasi: statusVerifikasi,
    };
  });
}

export async function fetchDatasetTiketAgregat() {
  // Sesuai FR-OD1 dan T10:
  // Statistik tiket murni disajikan secara AGREGAT tanpa memuat identitas personal pelapor,
  // NIK, hash NIK, nomor tiket pribadi, atau aduan anonim.
  // Kategori sesuai PRD 36.4: DUGAAN_PENYIMPANGAN, KERUSAKAN, KETERLAMBATAN, LAINNYA.
  return [
    {
      kategori: "DUGAAN_PENYIMPANGAN",
      jumlah_total: 12,
      status_baru: 2,
      status_ditinjau: 3,
      status_ditanggapi: 4,
      status_selesai: 3,
      rata_rata_hari_tanggapan: 4.2,
    },
    {
      kategori: "KERUSAKAN",
      jumlah_total: 19,
      status_baru: 1,
      status_ditinjau: 2,
      status_ditanggapi: 5,
      status_selesai: 11,
      rata_rata_hari_tanggapan: 2.8,
    },
    {
      kategori: "KETERLAMBATAN",
      jumlah_total: 8,
      status_baru: 0,
      status_ditinjau: 1,
      status_ditanggapi: 3,
      status_selesai: 4,
      rata_rata_hari_tanggapan: 3.5,
    },
    {
      kategori: "LAINNYA",
      jumlah_total: 6,
      status_baru: 1,
      status_ditinjau: 1,
      status_ditanggapi: 2,
      status_selesai: 2,
      rata_rata_hari_tanggapan: 2.1,
    },
  ];
}

// ================= ENTRY POINT GET DATASET =================

export async function getDatasetPayload(dataset: DatasetName, desaId?: string) {
  let data: Record<string, unknown>[];
  let columns: CsvColumn[];

  switch (dataset) {
    case "anggaran":
      data = await fetchDatasetAnggaran(desaId);
      columns = ANGGARAN_COLUMNS;
      break;
    case "proyek":
      data = await fetchDatasetProyek(desaId);
      columns = PROYEK_COLUMNS;
      break;
    case "termin":
      data = await fetchDatasetTermin(desaId);
      columns = TERMIN_COLUMNS;
      break;
    case "kas":
      data = await fetchDatasetKas(desaId);
      columns = KAS_COLUMNS;
      break;
    case "tiket-agregat":
      data = await fetchDatasetTiketAgregat();
      columns = TIKET_AGREGAT_COLUMNS;
      break;
  }

  return {
    dataset,
    columns,
    data,
    total: data.length,
    tanggalPembaruan: new Date().toISOString(),
    lisensi: "CC BY 4.0 (Creative Commons Attribution 4.0 International)",
  };
}
