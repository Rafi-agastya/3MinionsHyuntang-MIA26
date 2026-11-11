export type StatusProyek =
  | "PEMATANGAN"
  | "TENDER_DIBUKA"
  | "PEMILIHAN_VENDOR"
  | "SELEKSI"
  | "VERIFIKASI_KOMPETENSI"
  | "MASA_SANGGAH"
  | "PENGERJAAN"
  | "SELESAI"
  | "DIBATALKAN"
  | "BATAL";

export type JalurProyek = "SAYEMBARA" | "VENDOR";

export type KelasProyek = "KECIL" | "MENENGAH" | "BESAR";

export interface RabItemDetail {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  subtotal: number;
}

export interface RingkasanAiDetail {
  model: string;
  ringkasanEksekutif: string;
  poinKekuatan: string[];
  poinPerhatian: string[];
  rekomendasiCatatan: string;
}

export interface FlagIntegritas {
  tipe: "ANGGOTA_GANDA" | "KEMIRIPAN_TEKS" | "TENAGA_LOKAL_KURANG" | string;
  label: string;
  deskripsi: string;
  tingkat: "warning" | "danger" | "info";
}

export interface ProposalDetail {
  id: string;
  namaKelompok: string;
  ketua: string;
  penawaran: number;
  durasiHari: number;
  tenagaTotal: number;
  tenagaLokal: number;
  persentaseLokal: number;
  narasiMetode: string;
  narasiJadwal: string;
  narasiRisiko: string;
  dokumen: string[];
  skor: {
    total: number;
    rincian: {
      harga: number;
      tenagaLokal: number;
      pengalaman: number;
      durasi: number;
    };
    flags: string[];
    versiBobot: string;
  };
  flagsDetail: FlagIntegritas[];
  ringkasanAi?: RingkasanAiDetail;
}

export interface ProjectDetailData {
  id: string;
  desaId: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  pagu: number;
  kelas: KelasProyek;
  jalur: JalurProyek;
  alasanJalur: string;
  status: StatusProyek;
  tanggalPublikasi: string;
  tenggatProposal: string;
  tenggatHari: number;
  syaratLokalMin: number;
  durasiMin: number;
  durasiMax: number;
  sumberDana: string;
  rabItems: RabItemDetail[];
  proposals: ProposalDetail[];
}

export function formatRupiah(amount: number | bigint): string {
  const num = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

