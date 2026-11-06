/**
 * /lib/ide-tiket.ts
 * Logika bisnis murni untuk Modul C (Ide & Aduan Warga) dan Modul M (Tiket Audit).
 */

import { Peran, StatusIde, StatusTiket } from "@prisma/client";
import { randomBytes } from "crypto";

/**
 * Menghasilkan nomor lacak acak terstruktur dan unik (mis. IDE-202611-A8F2K atau TKT-202611-X7B9Q).
 */
export function generateNomorLacak(prefix: "IDE" | "TKT", tanggal = new Date()): string {
  const yyyymm =
    tanggal.getFullYear().toString() +
    String(tanggal.getMonth() + 1).padStart(2, "0");
  const randomSuffix = randomBytes(3).toString("hex").toUpperCase().slice(0, 5);
  return `${prefix}-${yyyymm}-${randomSuffix}`;
}

/**
 * Menghitung batas akhir tenggat tanggapan (14 hari kalender sesuai PRD FR-C4 & FR-M3).
 */
export function hitungTenggat(hari = 14, dari = new Date()): Date {
  return new Date(dari.getTime() + hari * 24 * 60 * 60 * 1000);
}

/**
 * Memeriksa apakah tenggat waktu tanggapan telah terlewat.
 */
export function isIdeTenggatTerlewat(
  tenggatTanggapan: Date | string,
  status: StatusIde
): boolean {
  if (status !== StatusIde.DIAJUKAN) {
    return false;
  }
  const tenggatMs =
    tenggatTanggapan instanceof Date
      ? tenggatTanggapan.getTime()
      : new Date(tenggatTanggapan).getTime();
  return Date.now() > tenggatMs;
}

export function isTiketTenggatTerlewat(
  tenggat: Date | string,
  status: StatusTiket
): boolean {
  if (status === StatusTiket.SELESAI) {
    return false;
  }
  const tenggatMs =
    tenggat instanceof Date ? tenggat.getTime() : new Date(tenggat).getTime();
  return Date.now() > tenggatMs;
}

export interface PengajuInfo {
  id?: string;
  nama?: string;
  email?: string;
  peran?: Peran;
}

export interface IdeRecordView {
  id: string;
  nomor: string;
  judul: string;
  deskripsi: string;
  lokasi: string | null;
  kategori: string;
  sumber: string;
  status: StatusIde;
  alasan: string | null;
  dasarKebutuhan: string | null;
  anonim: boolean;
  tenggatTanggapan: Date;
  desaId: string;
  pengajuId: string;
  createdAt: Date;
  pengaju?: PengajuInfo | null;
  dukungan?: unknown[];
  _count?: { dukungan: number };
}

/**
 * Menyamarkan identitas pengaju ide jika anonim = true untuk publik / selain ADMIN (PRD 36.4).
 */
export function samarkanPengajuIde<T extends IdeRecordView>(
  ide: T,
  peranPengguna?: Peran | null
): T {
  // Hanya ADMIN yang berhak melihat identitas asli pelapor anonim
  if (ide.anonim && peranPengguna !== Peran.ADMIN) {
    return {
      ...ide,
      pengajuId: "anonim",
      pengaju: {
        nama: "Warga Desa (Anonim)",
      },
    };
  }

  return ide;
}

export interface TiketRecordView {
  id: string;
  nomor: string;
  proyekId: string | null;
  pelaporId?: string;
  kategori: string;
  isi: string;
  anonim: boolean;
  status: StatusTiket;
  tanggapan: string | null;
  tenggat: Date;
  dibuatPada: Date;
  pelapor?: PengajuInfo | null;
  proyek?: { id: string; judul: string } | null;
}

/**
 * Menyamarkan identitas pelapor tiket secara mutlak dari akses publik (PRD FR-M4 & 33.2 #26).
 */
export function samarkanTiketPublik(tiket: TiketRecordView) {
  const tenggatTerlewat = isTiketTenggatTerlewat(tiket.tenggat, tiket.status);

  return {
    nomor: tiket.nomor,
    kategori: tiket.kategori,
    isi: tiket.isi,
    status: tiket.status,
    tanggapan: tiket.tanggapan,
    tenggat: tiket.tenggat.toISOString(),
    tenggatTerlewat,
    dibuatPada: tiket.dibuatPada.toISOString(),
    proyek: tiket.proyek
      ? {
          id: tiket.proyek.id,
          judul: tiket.proyek.judul,
        }
      : null,
  };
}

