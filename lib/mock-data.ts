import mockData from "@/data/mock.json";

export interface MetricSummary {
  paguDesa: number;
  paguKdmp: number;
  paguReguler: number;
  realisasiKas: number;
  realisasiPersen: number;
  proyekBerjalan: number;
  serapanTenagaLokalPersen: number;
}

export interface ProjectPreview {
  id: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  pagu: number;
  status: "TENDER_DIBUKA" | "PENGERJAAN" | "SELESAI" | "PEMATANGAN" | "MASA_SANGGAH" | "SELEKSI";
  statusLabel: string;
  jalur: "SAYEMBARA" | "VENDOR";
  jalurLabel: string;
  sumberIde: "WARGA" | "MUSDES" | "KADES";
  sumberIdeLabel: string;
  serapanLokal: number;
  tenggatHari?: number;
  progresPersen?: number;
}

export interface CommunityIdeaPreview {
  id: string;
  nomor: string;
  judul: string;
  deskripsi: string;
  kategori: string;
  pengusul: string;
  isAnonim: boolean;
  jumlahDukungan: number;
  status: "DIAJUKAN" | "VERIFIKASI" | "DITERIMA";
  statusLabel: string;
  lokasi: string;
}

export interface DesaInfo {
  nama: string;
  kecamatan: string;
  kabupaten: string;
  tahun: number;
}

export const mockDesaInfo: DesaInfo = mockData.desaInfo;
export const mockMetrics: MetricSummary = mockData.metrics;
export const mockRecentProjects: ProjectPreview[] = mockData.recentProjects as ProjectPreview[];
export const mockPopularIdeas: CommunityIdeaPreview[] = mockData.popularIdeas as CommunityIdeaPreview[];

export default mockData;
