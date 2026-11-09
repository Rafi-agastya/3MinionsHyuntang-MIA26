/**
 * /lib/hooks.ts
 * Hook events untuk integrasi antar domain (Buku Kas di BE-6).
 */

import { prisma } from "@/lib/prisma";
import { JenisEntri, Peran } from "@prisma/client";
import { tambahEntri } from "@/lib/kas-ledger";
import { tulisAudit } from "@/lib/audit";

/**
 * Dipanggil saat pemenang sayembara ditetapkan (atau vendor ditetapkan).
 * Menulis entri KOMITMEN otomatis sebesar nilai kontrak/penawaran pada pos proyek.
 */
export async function onKomitmenDibuat(
  proyekId: string,
  proposalId: string,
  nilai: bigint | number,
  pencatatId?: string
): Promise<void> {
  if (!prisma.entriKas) {
    return;
  }

  const proyek = await prisma.proyek.findUnique({
    where: { id: proyekId },
    include: {
      keputusan: true,
    },
  });

  if (!proyek) {
    return;
  }

  // Tentukan akun pencatat komitmen (dibuatOlehId keputusan atau pengguna perangkat/admin)
  let finalPencatatId = pencatatId || proyek.keputusan?.dibuatOlehId;
  if (!finalPencatatId) {
    const defaultPerangkat = await prisma.pengguna.findFirst({
      where: { peran: { in: [Peran.PERANGKAT, Peran.ADMIN] } },
    });
    finalPencatatId = defaultPerangkat?.id || "system";
  }

  const komitmen = await tambahEntri(prisma, {
    desaId: proyek.desaId,
    jenis: JenisEntri.KOMITMEN,
    jumlah: BigInt(nilai),
    tanggal: new Date(),
    uraian: `Komitmen kontrak pelaksanaan proyek ${proyek.judul}`,
    posId: proyek.posAnggaranId ?? null,
    proyekId: proyek.id,
    pencatatId: finalPencatatId,
    penerima: null,
    penerimaDisamarkan: false,
    buktiUrls: [],
  });

  await tulisAudit({
    aktorId: finalPencatatId,
    aksi: "BUAT_KOMITMEN",
    entitas: "ENTRI_KAS",
    entitasId: komitmen.id,
    sesudah: {
      jenis: "KOMITMEN",
      jumlah: Number(nilai),
      proyekId: proyek.id,
      proposalId,
    },
  });
}

/**
 * Dipanggil saat proyek dibatalkan (status DIBATALKAN).
 * Menulis entri KOREKSI terhadap KOMITMEN agar anggaran yang terikat pulih kembali.
 */
export async function onProyekDibatalkan(
  proyekId: string,
  alasan: string,
  pencatatId?: string
): Promise<void> {
  if (!prisma.entriKas) {
    return;
  }

  // Cari entri KOMITMEN terkait proyek ini
  const komitmenList = await prisma.entriKas.findMany({
    where: {
      proyekId,
      jenis: JenisEntri.KOMITMEN,
    },
    include: {
      koreksi: true, // relasi entri koreksi yang merujuk entri ini
    },
  });

  for (const komitmen of komitmenList) {
    // Jika entri KOMITMEN ini sudah pernah dikoreksi, jangan koreksi ulang
    if (komitmen.koreksi && komitmen.koreksi.length > 0) {
      continue;
    }

    let finalPencatatId = pencatatId || komitmen.pencatatId;
    if (!finalPencatatId) {
      const defaultPerangkat = await prisma.pengguna.findFirst({
        where: { peran: { in: [Peran.PERANGKAT, Peran.ADMIN] } },
      });
      finalPencatatId = defaultPerangkat?.id || "system";
    }

    const koreksi = await tambahEntri(prisma, {
      desaId: komitmen.desaId,
      jenis: JenisEntri.KOREKSI,
      jumlah: komitmen.jumlah,
      tanggal: new Date(),
      uraian: `KOREKSI: Pembatalan proyek - ${alasan || "Proyek dibatalkan"}`,
      posId: komitmen.posId,
      proyekId: komitmen.proyekId,
      koreksiDariId: komitmen.id,
      pencatatId: finalPencatatId,
      penerima: komitmen.penerima,
      penerimaDisamarkan: false,
      buktiUrls: [],
    });

    await tulisAudit({
      aktorId: finalPencatatId,
      aksi: "KOREKSI_KOMITMEN",
      entitas: "ENTRI_KAS",
      entitasId: koreksi.id,
      sebelum: {
        targetId: komitmen.id,
        jenis: "KOMITMEN",
        jumlah: Number(komitmen.jumlah),
      },
      sesudah: {
        id: koreksi.id,
        alasan,
        proyekId,
      },
    });
  }
}
