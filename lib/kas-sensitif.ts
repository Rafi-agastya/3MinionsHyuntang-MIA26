/**
 * /lib/kas-sensitif.ts
 * Utilitas penyensoran / penyamaran data sensitif Buku Kas sesuai PRD Bagian 45.2.
 */

import { Peran } from "@prisma/client";

export interface EntriKasView {
  id: string;
  desaId: string;
  nomorUrut: number;
  jenis: string;
  jumlah: number | bigint;
  tanggal: string | Date;
  uraian: string;
  sumberDanaId?: string | null;
  posId?: string | null;
  proyekId?: string | null;
  terminId?: string | null;
  koreksiDariId?: string | null;
  penerima?: string | null;
  penerimaDisamarkan?: boolean;
  buktiUrls: string[];
  pencatatId: string;
  hashSebelumnya?: string | null;
  hash: string;
  hashPendek?: string;
  statusVerifikasi?: string;
  dibuatPada: string | Date;
  pos?: {
    sensitif?: boolean;
    uraian?: string;
  } | null;
  [key: string]: unknown;
}

/**
 * Menyamarkan data penerima perorangan dan pos berlabel sensitif
 * apabila diakses oleh publik atau warga (bukan internal pengawas/admin/perangkat).
 */
export function samarkanEntri<T extends EntriKasView>(
  entri: T,
  peran?: Peran | null
): T {
  const isInternal =
    peran === Peran.PERANGKAT ||
    peran === Peran.PENGAWAS ||
    peran === Peran.ADMIN;

  if (isInternal) {
    return entri;
  }

  // Buat shallow copy agar objek asli tidak termutasi
  const disamarkan: T = { ...entri };

  // 1. Samarkan nama penerima perorangan
  if (disamarkan.penerimaDisamarkan && disamarkan.penerima) {
    disamarkan.penerima = "Penerima Perorangan (Disamarkan)";
  }

  // 2. Samarkan pos belanja berkategori sensitif (mis. Siltap aparatur)
  if (disamarkan.pos?.sensitif) {
    disamarkan.uraian = "Belanja Pos Sensitif (Disamarkan)";
  }

  return disamarkan;
}

/**
 * Helper untuk menyamarkan array entri kas.
 */
export function samarkanDaftarEntri<T extends EntriKasView>(
  daftar: T[],
  peran?: Peran | null
): T[] {
  return daftar.map((e) => samarkanEntri(e, peran));
}

