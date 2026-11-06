/**
 * /lib/status-machine.ts
 * Aturan transisi status proyek sesuai PRD Bagian 9 & 29.6.
 */

import { StatusProyek } from "@prisma/client";

export interface StatusMachineContext {
  alasanJalur?: string | null;
  flagBelumDitinjau?: number;
  sanggahanTerbuka?: number;
  progresTerverifikasi?: number;
  jumlahProposal?: number;
  alasanKeputusan?: string | null;
  alasanBatal?: string | null;
}

export interface TransitionResult {
  ok: boolean;
  reason?: string;
}

export function canTransition(
  from: StatusProyek,
  to: StatusProyek,
  ctx: StatusMachineContext = {}
): TransitionResult {
  // 1. Status tidak berubah
  if (from === to) {
    return { ok: true };
  }

  // 2. Transisi ke DIBATALKAN (bisa dari status apa pun kecuali SELESAI atau DIBATALKAN)
  if (to === StatusProyek.DIBATALKAN) {
    if (from === StatusProyek.SELESAI) {
      return {
        ok: false,
        reason: "Proyek yang sudah selesai tidak dapat dibatalkan",
      };
    }
    if (from === StatusProyek.DIBATALKAN) {
      return {
        ok: false,
        reason: "Proyek sudah dibatalkan",
      };
    }
    if (!ctx.alasanBatal || ctx.alasanBatal.trim().length === 0) {
      return {
        ok: false,
        reason: "Alasan pembatalan proyek wajib diisi secara publik",
      };
    }
    return { ok: true };
  }

  // 3. Status PEMATANGAN
  if (from === StatusProyek.PEMATANGAN) {
    if (to === StatusProyek.TENDER_DIBUKA) {
      if (!ctx.alasanJalur || ctx.alasanJalur.trim().length === 0) {
        return {
          ok: false,
          reason: "Alasan jalur wajib diisi sebelum membuka tender",
        };
      }
      return { ok: true };
    }

    if (to === StatusProyek.PEMILIHAN_VENDOR) {
      if (!ctx.alasanJalur || ctx.alasanJalur.trim().length === 0) {
        return {
          ok: false,
          reason: "Alasan jalur wajib diisi sebelum pemilihan vendor",
        };
      }
      return { ok: true };
    }

    return {
      ok: false,
      reason: `Dari status PEMATANGAN hanya dapat berpindah ke TENDER_DIBUKA atau PEMILIHAN_VENDOR`,
    };
  }

  // 4. Status TENDER_DIBUKA
  if (from === StatusProyek.TENDER_DIBUKA) {
    if (to === StatusProyek.SELEKSI) {
      if (ctx.jumlahProposal !== undefined && ctx.jumlahProposal < 1) {
        return {
          ok: false,
          reason: "Minimal 1 proposal harus masuk sebelum melanjutkan ke tahap seleksi",
        };
      }
      return { ok: true };
    }

    return {
      ok: false,
      reason: `Dari status TENDER_DIBUKA hanya dapat berpindah ke SELEKSI`,
    };
  }

  // 5. Status SELEKSI
  if (from === StatusProyek.SELEKSI) {
    if (to === StatusProyek.VERIFIKASI_KOMPETENSI) {
      if (ctx.flagBelumDitinjau && ctx.flagBelumDitinjau > 0) {
        return {
          ok: false,
          reason: "Semua flag kemiripan harus ditinjau sebelum verifikasi kompetensi",
        };
      }
      return { ok: true };
    }

    if (to === StatusProyek.MASA_SANGGAH) {
      if (ctx.flagBelumDitinjau && ctx.flagBelumDitinjau > 0) {
        return {
          ok: false,
          reason: "Semua flag kemiripan harus ditinjau sebelum penetapan pemenang",
        };
      }
      if (ctx.alasanKeputusan !== undefined && !ctx.alasanKeputusan) {
        return {
          ok: false,
          reason: "Alasan keputusan pemenang wajib dicatat",
        };
      }
      return { ok: true };
    }

    return {
      ok: false,
      reason: `Dari status SELEKSI hanya dapat berpindah ke VERIFIKASI_KOMPETENSI atau MASA_SANGGAH`,
    };
  }

  // 6. Status VERIFIKASI_KOMPETENSI
  if (from === StatusProyek.VERIFIKASI_KOMPETENSI) {
    if (to === StatusProyek.MASA_SANGGAH) {
      if (ctx.alasanKeputusan !== undefined && !ctx.alasanKeputusan) {
        return {
          ok: false,
          reason: "Alasan keputusan pemenang wajib dicatat",
        };
      }
      return { ok: true };
    }

    return {
      ok: false,
      reason: `Dari status VERIFIKASI_KOMPETENSI hanya dapat berpindah ke MASA_SANGGAH`,
    };
  }

  // 7. Status MASA_SANGGAH
  if (from === StatusProyek.MASA_SANGGAH) {
    if (to === StatusProyek.PENGERJAAN) {
      if (ctx.sanggahanTerbuka && ctx.sanggahanTerbuka > 0) {
        return {
          ok: false,
          reason: "Tidak dapat memulai pengerjaan saat masih ada sanggahan terbuka",
        };
      }
      return { ok: true };
    }

    return {
      ok: false,
      reason: `Dari status MASA_SANGGAH hanya dapat berpindah ke PENGERJAAN`,
    };
  }

  // 8. Status PEMILIHAN_VENDOR
  if (from === StatusProyek.PEMILIHAN_VENDOR) {
    if (to === StatusProyek.PENGERJAAN) {
      if (ctx.sanggahanTerbuka && ctx.sanggahanTerbuka > 0) {
        return {
          ok: false,
          reason: "Tidak dapat memulai pengerjaan saat masih ada sanggahan terbuka",
        };
      }
      return { ok: true };
    }

    return {
      ok: false,
      reason: `Dari status PEMILIHAN_VENDOR hanya dapat berpindah ke PENGERJAAN`,
    };
  }

  // 9. Status PENGERJAAN
  if (from === StatusProyek.PENGERJAAN) {
    if (to === StatusProyek.SELESAI) {
      if (ctx.progresTerverifikasi !== 100) {
        return {
          ok: false,
          reason: "Progres pekerjaan harus 100% terverifikasi sebelum proyek selesai",
        };
      }
      return { ok: true };
    }

    return {
      ok: false,
      reason: `Dari status PENGERJAAN hanya dapat berpindah ke SELESAI`,
    };
  }

  // 10. Status SELESAI
  if (from === StatusProyek.SELESAI) {
    return {
      ok: false,
      reason: "Proyek yang sudah SELESAI adalah status akhir dan tidak dapat diubah",
    };
  }

  return {
    ok: false,
    reason: `Transisi tidak sah dari ${from} ke ${to}`,
  };
}
