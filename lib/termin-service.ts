/**
 * /lib/termin-service.ts
 * Layanan pembukaan termin otomatis berdasarkan pencapaian progres fisik terverifikasi.
 */

import { prisma } from "@/lib/prisma";
import { tulisAudit } from "@/lib/audit";
import { Termin } from "@prisma/client";

/**
 * Menghitung ambang batas minimal persentase fisik untuk membuka termin tertentu.
 * Tahap 1: 0% (uang muka)
 * Tahap 2: 30% (tahapan awal/menengah)
 * Tahap 3+: 100% (penyelesaian akhir)
 */
export function getAmbangTermin(tahap: number): number {
  if (tahap <= 1) return 0;
  if (tahap === 2) return 30;
  return 100;
}

/**
 * Membuka termin secara otomatis jika progres fisik terverifikasi memenuhi ambang batas.
 */
export async function bukaTerminOtomatis(
  proyekId: string,
  persenProgres: number,
  pengawasId: string
): Promise<Termin[]> {
  const terminList = await prisma.termin.findMany({
    where: { proyekId },
    orderBy: { tahap: "asc" },
  });

  const openedList: Termin[] = [];

  for (const termin of terminList) {
    if (termin.terbuka) {
      continue;
    }

    const ambang = getAmbangTermin(termin.tahap);
    if (persenProgres >= ambang) {
      const updated = await prisma.termin.update({
        where: { id: termin.id },
        data: { terbuka: true },
      });

      await tulisAudit({
        aktorId: pengawasId,
        aksi: "BUKA_TERMIN_OTOMATIS",
        entitas: "TERMIN",
        entitasId: updated.id,
        sebelum: { terbuka: false },
        sesudah: {
          tahap: updated.tahap,
          terbuka: true,
          persenProgres,
          ambang,
          proyekId,
        },
      });

      openedList.push(updated);
    }
  }

  return openedList;
}

