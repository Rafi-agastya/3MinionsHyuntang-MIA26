import { StatusProyek } from "@prisma/client";

export interface EvaluasiKelengkapanInput {
  narasiMetode?: string | null;
  narasiJadwal?: string | null;
  narasiRisiko?: string | null;
  jumlahAnggotaLengkap: number;
  adaDokumenPengalaman: boolean;
}

export interface KelengkapanRincian {
  [key: string]: boolean;
  metode: boolean;
  jadwal: boolean;
  risiko: boolean;
  anggota: boolean;
  pengalaman: boolean;
}

export interface HasilEvaluasiKelengkapan {
  rincian: KelengkapanRincian;
  skor: number; // 0 sampai 5 (untuk komponen kelengkapan scoring)
}

/**
 * Kelengkapan dihitung murni di SERVER dari isi proposal (PRD Bagian 34 & 33.3).
 * Aturan kelengkapan:
 * 1. metode >= 100 karakter
 * 2. jadwal >= 50 karakter
 * 3. risiko >= 30 karakter
 * 4. anggota minimal 2 dan lengkap (nama & rtRw)
 * 5. bukti pengalaman (dokumen PDF terlampir atau data pengalaman)
 */
export function evaluasiKelengkapanProposal(
  input: EvaluasiKelengkapanInput
): HasilEvaluasiKelengkapan {
  const metode = (input.narasiMetode?.trim().length ?? 0) >= 100;
  const jadwal = (input.narasiJadwal?.trim().length ?? 0) >= 50;
  const risiko = (input.narasiRisiko?.trim().length ?? 0) >= 30;
  const anggota = input.jumlahAnggotaLengkap >= 2;
  const pengalaman = Boolean(input.adaDokumenPengalaman);

  const rincian: KelengkapanRincian = {
    metode,
    jadwal,
    risiko,
    anggota,
    pengalaman,
  };

  const skor = Object.values(rincian).filter(Boolean).length;

  return { rincian, skor };
}

/**
 * Menentukan apakah status proyek sudah mencapai atau melewati tahap MASA_SANGGAH.
 * Sesuai PRD 33.2 Aturan #15:
 * Publik baru dapat melihat rincian peringkat, skor, dan ringkasan proposal setelah
 * status proyek mencapai MASA_SANGGAH. Sebelum tahap ini, publik hanya dapat melihat
 * jumlah (total) proposal yang masuk.
 */
export function isProyekMasaSanggahOrAfter(status: StatusProyek): boolean {
  return (
    status === StatusProyek.MASA_SANGGAH ||
    status === StatusProyek.PENGERJAAN ||
    status === StatusProyek.SELESAI
  );
}
