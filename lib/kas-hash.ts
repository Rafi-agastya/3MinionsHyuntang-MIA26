/**
 * /lib/kas-hash.ts
 * Implementasi algoritma hash rantai Buku Kas dan fungsi verifikasi integritas
 * persis sesuai PRD Bagian 42.4.
 */

import { createHash } from "crypto";

export interface EntriKasInput {
  nomorUrut: number;
  jenis: string;
  jumlah: bigint | number;
  tanggal: Date | string;
  sumberDanaId?: string | null;
  posId?: string | null;
  proyekId?: string | null;
  terminId?: string | null;
  koreksiDariId?: string | null;
  penerima?: string | null;
  uraian: string;
  buktiUrls: string[];
  pencatatId: string;
  dibuatPada: Date | string;
}

export interface EntriKasWithHash extends EntriKasInput {
  id?: string;
  hashSebelumnya?: string | null;
  hash: string;
}

export interface HasilVerifikasiRantai {
  valid: boolean;
  jumlahEntri: number;
  hashTerakhir: string | null;
  entriPertamaRusak?: number;
}

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * Menghitung hash SHA-256 sebuah entri kas berantai sesuai spesifikasi PRD Bagian 42.4:
 * const isi = [prev ?? 'GENESIS', e.nomorUrut, e.jenis, e.jumlah, e.tanggal,
 *              e.sumberDanaId ?? '', e.posId ?? '', e.proyekId ?? '', e.terminId ?? '',
 *              e.koreksiDariId ?? '', e.penerima ?? '', e.uraian,
 *              sha256(e.buktiUrls.join(',')), e.pencatatId, e.dibuatPada].join('|')
 * return sha256(isi)
 */
export function hitungHash(prev: string | null, e: EntriKasInput): string {
  const tglStr =
    e.tanggal instanceof Date ? e.tanggal.toISOString() : String(e.tanggal);
  const dibuatStr =
    e.dibuatPada instanceof Date
      ? e.dibuatPada.toISOString()
      : String(e.dibuatPada);

  const isi = [
    prev ?? "GENESIS",
    e.nomorUrut,
    e.jenis,
    e.jumlah.toString(),
    tglStr,
    e.sumberDanaId ?? "",
    e.posId ?? "",
    e.proyekId ?? "",
    e.terminId ?? "",
    e.koreksiDariId ?? "",
    e.penerima ?? "",
    e.uraian,
    sha256(e.buktiUrls.join(",")),
    e.pencatatId,
    dibuatStr,
  ].join("|");

  return sha256(isi);
}

/**
 * Memverifikasi integritas seluruh rantai entri kas (audit rantai hash).
 */
export function verifikasiRantai(
  entriList: EntriKasWithHash[]
): HasilVerifikasiRantai {
  if (!entriList || entriList.length === 0) {
    return {
      valid: true,
      jumlahEntri: 0,
      hashTerakhir: null,
    };
  }

  // Urutkan entri berdasarkan nomorUrut ASC
  const sorted = [...entriList].sort((a, b) => a.nomorUrut - b.nomorUrut);

  let prev: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const expectedUrut = i + 1;

    // Pastikan nomor urut tidak loncat / ada celah
    if (e.nomorUrut !== expectedUrut) {
      return {
        valid: false,
        jumlahEntri: sorted.length,
        hashTerakhir: prev,
        entriPertamaRusak: e.nomorUrut,
      };
    }

    // Pastikan hashSebelumnya sesuai dengan prev
    if (e.hashSebelumnya !== prev) {
      return {
        valid: false,
        jumlahEntri: sorted.length,
        hashTerakhir: prev,
        entriPertamaRusak: e.nomorUrut,
      };
    }

    // Hitung ulang hash
    const expectedHash = hitungHash(prev, e);
    if (e.hash !== expectedHash) {
      return {
        valid: false,
        jumlahEntri: sorted.length,
        hashTerakhir: prev,
        entriPertamaRusak: e.nomorUrut,
      };
    }

    prev = e.hash;
  }

  return {
    valid: true,
    jumlahEntri: sorted.length,
    hashTerakhir: prev,
  };
}

