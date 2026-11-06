import { z } from "zod";

/**
 * Skema validasi output JSON Ringkasan AI untuk proposal sayembara swakelola
 * sesuai PRD Bagian 7.6 (FR-F1), Bagian 29.6, dan Bagian 33.3.
 */
export const RingkasanAiSchema = z.object({
  ringkasan_singkat: z
    .string({ required_error: "Ringkasan singkat wajib ada." })
    .min(1, "Ringkasan singkat tidak boleh kosong."),
  metode_kerja: z
    .string({ required_error: "Metode kerja wajib ada." })
    .min(1, "Metode kerja tidak boleh kosong."),
  risiko_yang_disebut: z
    .array(z.string())
    .default([]),
  jadwal_garis_besar: z
    .string({ required_error: "Jadwal garis besar wajib ada." })
    .min(1, "Jadwal garis besar tidak boleh kosong."),
  hal_yang_tidak_dijelaskan: z
    .array(z.string())
    .default([]),
});

export type RingkasanAiOutput = z.infer<typeof RingkasanAiSchema>;

