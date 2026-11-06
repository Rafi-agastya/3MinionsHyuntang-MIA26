import { JenisFlag } from "@prisma/client";
import { prisma } from "./prisma";

export interface AnggotaInput {
  kelompokId: string;
  proposalId?: string;
  kelompokNama?: string;
  nama?: string | null;
  nikHash?: string | null;
}

export interface OverlapResult {
  kelompokAId: string;
  kelompokBId: string;
  proposalAId?: string;
  proposalBId?: string;
  identitas: string;
}

export interface FlagBaru {
  proyekId: string;
  proposalAId: string;
  proposalBId: string;
  jenis: JenisFlag;
  nilai: number;
  catatan: string;
}

/**
 * Mencari tumpang tindih anggota antar kelompok berdasarkan kesamaan nikHash
 * (atau kesamaan nama jika nikHash belum ada).
 */
export function cariTumpangTindihAnggota(
  anggotaList: AnggotaInput[]
): OverlapResult[] {
  const hasil: OverlapResult[] = [];
  const mapIdentitas = new Map<string, AnggotaInput[]>();

  for (const anggota of anggotaList) {
    const key =
      anggota.nikHash?.trim() ||
      (anggota.nama ? anggota.nama.trim().toLowerCase() : null);

    if (!key) continue;

    const existing = mapIdentitas.get(key) || [];
    existing.push(anggota);
    mapIdentitas.set(key, existing);
  }

  for (const [, entries] of mapIdentitas.entries()) {
    if (entries.length > 1) {
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          if (entries[i].kelompokId !== entries[j].kelompokId) {
            hasil.push({
              kelompokAId: entries[i].kelompokId,
              kelompokBId: entries[j].kelompokId,
              proposalAId: entries[i].proposalId,
              proposalBId: entries[j].proposalId,
              identitas: entries[i].nama || "Anggota Terdaftar",
            });
          }
        }
      }
    }
  }

  return hasil;
}

/**
 * Mencari anggota dengan nikHash yang sama di kelompok berbeda pada proyek yang sama (FR-G2 & PRD 29.6).
 * Menghasilkan daftar FlagBaru berjenis ANGGOTA.
 */
export async function cariAnggotaTumpangTindih(
  proyekId: string
): Promise<FlagBaru[]> {
  const proposals = await prisma.proposal.findMany({
    where: { proyekId },
    include: {
      kelompok: {
        include: {
          anggota: true,
        },
      },
    },
  });

  const daftarAnggota: AnggotaInput[] = [];
  for (const p of proposals) {
    for (const a of p.kelompok.anggota) {
      daftarAnggota.push({
        kelompokId: p.kelompokId,
        proposalId: p.id,
        kelompokNama: p.kelompok.nama,
        nama: a.nama,
        nikHash: a.nikHash,
      });
    }
  }

  const hasilOverlap = cariTumpangTindihAnggota(daftarAnggota);
  const flags: FlagBaru[] = [];

  for (const item of hasilOverlap) {
    const propA = proposals.find((p) => p.kelompokId === item.kelompokAId);
    const propB = proposals.find((p) => p.kelompokId === item.kelompokBId);

    if (propA && propB) {
      flags.push({
        proyekId,
        proposalAId: propA.id,
        proposalBId: propB.id,
        jenis: JenisFlag.ANGGOTA,
        nilai: 1.0,
        catatan: `Terdeteksi anggota yang sama (${item.identitas}) terdaftar di kelompok '${propA.kelompok.nama}' dan '${propB.kelompok.nama}'.`,
      });
    }
  }

  return flags;
}
