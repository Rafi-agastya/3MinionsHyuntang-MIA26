import { prisma } from "./prisma";

export interface TulisAuditParams {
  aktorId?: string | null;
  aksi: string;
  entitas: string;
  entitasId: string;
  sebelum?: unknown;
  sesudah?: unknown;
}

/**
 * Mencatat riwayat perubahan dan keputusan penting ke tabel AuditLog (append-only).
 * Catatan: AuditLog hanya boleh di-insert, tidak menyediakan update/delete.
 */
export async function tulisAudit({
  aktorId,
  aksi,
  entitas,
  entitasId,
  sebelum,
  sesudah,
}: TulisAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        aktorId: aktorId ?? null,
        aksi,
        entitas,
        entitasId,
        sebelum: sebelum !== undefined ? JSON.parse(JSON.stringify(sebelum)) : undefined,
        sesudah: sesudah !== undefined ? JSON.parse(JSON.stringify(sesudah)) : undefined,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Gagal menulis audit log:", error);
    // Kita tidak melempar error agar kegagalan logging sekunder tidak memutus alur utama,
    // namun tetap tercatat di stderr.
    return null;
  }
}
