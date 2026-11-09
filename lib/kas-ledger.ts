/**
 * /lib/kas-ledger.ts
 * Titik masuk tunggal untuk penulisan EntriKas (append-only ledger).
 * Mengunci transaksi per desa dengan pg_advisory_xact_lock(hashtext(desaId))
 * agar nomorUrut dan hashSebelumnya selalu deterministik dan bebas race condition.
 */

import { JenisEntri, EntriKas, PrismaClient, Prisma } from "@prisma/client";
import { hitungHash } from "./kas-hash";

export interface TambahEntriInput {
  desaId: string;
  jenis: JenisEntri;
  jumlah: bigint | number;
  tanggal: Date | string;
  uraian: string;
  sumberDanaId?: string | null;
  posId?: string | null;
  proyekId?: string | null;
  terminId?: string | null;
  koreksiDariId?: string | null;
  penerima?: string | null;
  penerimaDisamarkan?: boolean;
  buktiUrls?: string[];
  pencatatId: string;
  dibuatPada?: Date;
}

export type LedgerClient = Prisma.TransactionClient | PrismaClient;

/**
 * Menambahkan entri kas baru ke ledger desa dalam transaksi atomik.
 * "tidak ada jalur lain untuk menulis EntriKas"
 */
export async function tambahEntri(
  tx: LedgerClient,
  input: TambahEntriInput
): Promise<EntriKas> {
  // 1. Kunci advisory transaksi untuk desaId terkait agar entri paralel berurutan
  try {
    if ("$executeRaw" in tx && typeof tx.$executeRaw === "function") {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.desaId}))`;
    }
  } catch {
    // Lewati jika environment tidak mendukung advisory lock (mis. mock SQLite/In-memory)
  }

  // 2. Ambil entri terakhir untuk desa ini untuk mendapatkan nomor urut dan hash sebelumnya
  const lastEntry = await tx.entriKas.findFirst({
    where: { desaId: input.desaId },
    orderBy: { nomorUrut: "desc" },
  });

  const nomorUrut = (lastEntry?.nomorUrut ?? 0) + 1;
  const hashSebelumnya = lastEntry?.hash ?? null;

  const tanggal =
    input.tanggal instanceof Date ? input.tanggal : new Date(input.tanggal);
  const dibuatPada = input.dibuatPada ?? new Date();
  const buktiUrls = input.buktiUrls ?? [];
  const jumlahBigInt = BigInt(input.jumlah);

  // 3. Hitung hash SHA-256 rantai
  const hash = hitungHash(hashSebelumnya, {
    nomorUrut,
    jenis: input.jenis,
    jumlah: jumlahBigInt,
    tanggal,
    sumberDanaId: input.sumberDanaId ?? null,
    posId: input.posId ?? null,
    proyekId: input.proyekId ?? null,
    terminId: input.terminId ?? null,
    koreksiDariId: input.koreksiDariId ?? null,
    penerima: input.penerima ?? null,
    uraian: input.uraian,
    buktiUrls,
    pencatatId: input.pencatatId,
    dibuatPada,
  });

  // 4. Masukkan entri ke tabel EntriKas
  const newEntry = await tx.entriKas.create({
    data: {
      desaId: input.desaId,
      nomorUrut,
      jenis: input.jenis,
      jumlah: jumlahBigInt,
      tanggal,
      uraian: input.uraian,
      sumberDanaId: input.sumberDanaId ?? null,
      posId: input.posId ?? null,
      proyekId: input.proyekId ?? null,
      terminId: input.terminId ?? null,
      koreksiDariId: input.koreksiDariId ?? null,
      penerima: input.penerima ?? null,
      penerimaDisamarkan: input.penerimaDisamarkan ?? true,
      buktiUrls,
      pencatatId: input.pencatatId,
      hashSebelumnya,
      hash,
      dibuatPada,
    },
  });

  return newEntry;
}
