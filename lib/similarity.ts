import { JenisFlag } from "@prisma/client";
import { prisma } from "./prisma";
import { type FlagBaru } from "./overlap";

/**
 * Menghasilkan set trigram karakter dari string teks.
 * Mengikuti prinsip pg_trgm untuk perbandingan teks.
 */
export function getTrigrams(str: string): Set<string> {
  const normalized =
    "  " +
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim() +
    "  ";

  const trigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Menghitung koefisien kemiripan teks Jaccard Trigram (0.0 - 1.0).
 */
export function hitungKemiripanTeks(textA: string, textB: string): number {
  if (!textA || !textB) return 0;

  const trigramsA = getTrigrams(textA);
  const trigramsB = getTrigrams(textB);

  if (trigramsA.size === 0 && trigramsB.size === 0) return 1.0;
  if (trigramsA.size === 0 || trigramsB.size === 0) return 0.0;

  let intersection = 0;
  for (const tri of trigramsA) {
    if (trigramsB.has(tri)) {
      intersection++;
    }
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Menghitung kemiripan teks antar proposal pada proyek yang sama (FR-G1 & PRD 29.6).
 * Mencoba menggunakan ekstensi pg_trgm PostgreSQL lewat $queryRaw, dengan
 * fallback aman ke algoritma Jaccard Trigram in-memory.
 */
export async function hitungKemiripan(
  proyekId: string,
  ambangBatas?: number
): Promise<FlagBaru[]> {
  const threshold =
    ambangBatas ?? Number(process.env.SIMILARITY_THRESHOLD || "0.80");

  const flags: FlagBaru[] = [];

  // 1. Coba pg_trgm PostgreSQL lewat $queryRaw jika basis data riil mendukungnya
  try {
    const rawResults = await prisma.$queryRaw<
      Array<{
        proposalAId: string;
        proposalBId: string;
        nilai: number;
      }>
    >`
      SELECT 
        p1.id as "proposalAId",
        p2.id as "proposalBId",
        similarity(
          concat_ws(' ', p1."narasiMetode", p1."narasiJadwal", p1."narasiRisiko"),
          concat_ws(' ', p2."narasiMetode", p2."narasiJadwal", p2."narasiRisiko")
        )::float as nilai
      FROM "Proposal" p1
      JOIN "Proposal" p2 ON p1."proyekId" = p2."proyekId" AND p1.id < p2.id
      WHERE p1."proyekId" = ${proyekId}
        AND similarity(
          concat_ws(' ', p1."narasiMetode", p1."narasiJadwal", p1."narasiRisiko"),
          concat_ws(' ', p2."narasiMetode", p2."narasiJadwal", p2."narasiRisiko")
        ) >= ${threshold}
    `;

    if (Array.isArray(rawResults) && rawResults.length > 0) {
      for (const row of rawResults) {
        flags.push({
          proyekId,
          proposalAId: row.proposalAId,
          proposalBId: row.proposalBId,
          jenis: JenisFlag.TEKS,
          nilai: Math.round(row.nilai * 100) / 100,
          catatan: `Kemiripan teks ${(row.nilai * 100).toFixed(0)}% antar narasi proposal.`,
        });
      }
      return flags;
    }
  } catch {
    // Jika $queryRaw tidak didukung (mis. in-memory test atau pg_trgm belum aktif),
    // lanjutkan ke kalkulasi komputasi in-memory di bawah.
  }

  // 2. Fallback komputasi Trigram in-memory
  const proposals = await prisma.proposal.findMany({
    where: { proyekId },
    select: {
      id: true,
      narasiMetode: true,
      narasiJadwal: true,
      narasiRisiko: true,
    },
  });

  for (let i = 0; i < proposals.length; i++) {
    for (let j = i + 1; j < proposals.length; j++) {
      const p1 = proposals[i];
      const p2 = proposals[j];

      const text1 = `${p1.narasiMetode} ${p1.narasiJadwal} ${p1.narasiRisiko}`;
      const text2 = `${p2.narasiMetode} ${p2.narasiJadwal} ${p2.narasiRisiko}`;

      const similarityScore = hitungKemiripanTeks(text1, text2);
      if (similarityScore >= threshold) {
        flags.push({
          proyekId,
          proposalAId: p1.id,
          proposalBId: p2.id,
          jenis: JenisFlag.TEKS,
          nilai: Math.round(similarityScore * 100) / 100,
          catatan: `Kemiripan teks ${(similarityScore * 100).toFixed(0)}% antar narasi proposal.`,
        });
      }
    }
  }

  return flags;
}
