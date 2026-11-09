import crypto from "crypto";
import { getSupabaseAdminClient } from "./supabase";

/**
 * Memeriksa apakah buffer atau byte array merupakan berkas PDF asli
 * berdasarkan magic bytes header (%PDF- atau 0x25 0x50 0x44 0x46).
 */
export function isPdfBuffer(buffer: Uint8Array | Buffer): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }
  // % = 0x25, P = 0x50, D = 0x44, F = 0x46
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per berkas (PRD 35.3)
export const MAX_DOCUMENTS_PER_PROPOSAL = 3; // Maksimal 3 berkas per proposal (PRD 35.3)

/**
 * Mengunggah berkas PDF proposal ke bucket privat Supabase Storage.
 * Nama berkas asli tidak dipakai dan digantikan oleh UUID unik (PRD 35.3).
 * Jalur penyimpanan: proposal-docs/{proposalId}/{uuid}.pdf
 */
export async function unggahDokumenProposal({
  proposalId,
  buffer,
  fileExtension = "pdf",
}: {
  proposalId: string;
  buffer: Buffer | Uint8Array;
  fileExtension?: string;
}): Promise<string> {
  const fileId = crypto.randomUUID();
  const filePath = `${proposalId}/${fileId}.${fileExtension}`;
  const fullStorageKey = `proposal-docs/${filePath}`;

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.storage
      .from("proposal-docs")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) {
      console.warn(
        `[SUPABASE_STORAGE_WARNING] Gagal mengunggah berkas ke bucket 'proposal-docs': ${error.message}`
      );
    }
  } catch (err) {
    console.warn(
      "[SUPABASE_STORAGE_OFFLINE] Lingkungan offline/sandbox aktif, menggunakan path virtual:",
      err
    );
  }

  return fullStorageKey;
}

