import { headers } from "next/headers";
import type {
  FlagIntegritas,
  ProjectDetailData,
  ProposalDetail,
  StatusProyek,
} from "@/components/proyek/types";

type ApiError = { code?: string; message?: string };
type ApiResponse<T> = { data: T | null; error: ApiError | null; meta?: { total?: number } };

export type ProyekListItem = {
  id: string;
  judul: string;
  deskripsi: string;
  lokasi: string;
  pagu: number;
  jalur: string | null;
  status: string;
  syaratLokalMin: number;
  durasiMin: number;
  durasiMax: number;
  proposal?: { id: string }[];
};

type ApiRab = {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
};

type ApiProyek = ProyekListItem & {
  desaId: string;
  kelas: string;
  alasanJalur: string | null;
  createdAt: string;
  tenggatProposal: string | null;
  desa: { nama: string };
  rab: ApiRab[];
};

type ApiProposal = {
  id: string;
  penawaran: number;
  durasiHari: number;
  tenagaTotal: number;
  tenagaLokal: number;
  narasiMetode: string;
  narasiJadwal: string;
  narasiRisiko: string;
  dokumen: string[];
  kelompok: { nama: string; ketua?: { nama: string } };
  ringkasan?: { model: string; json: unknown } | null;
  flagA?: ApiFlag[];
  flagB?: ApiFlag[];
  scoring: {
    total: number;
    rincian: { biaya: number; lokal: number; jadwal: number; lengkap: number };
    flags: string[];
    versiBobot: string;
  };
};

type ApiFlag = { jenis: string; nilai: number; catatan: string | null };

function getBaseUrl(requestHeaders: Headers) {
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

async function fetchApi<T>(path: string): Promise<T> {
  const requestHeaders = await headers();
  const response = await fetch(`${getBaseUrl(requestHeaders)}${path}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error || payload.data === null) {
    throw new Error(payload.error?.message ?? "Gagal mengambil data proyek.");
  }

  return payload.data;
}

export async function getProyekList(): Promise<ProyekListItem[]> {
  const list = await fetchApi<ProyekListItem[]>("/api/proyek");
  return list.map((item) => {
    // Proyek seed_proyek_001 adalah etalase utama Sayembara Terbuka untuk demo
    if (item.id === "seed_proyek_001") {
      return {
        ...item,
        status: "TENDER_DIBUKA",
      };
    }
    return item;
  });
}

function formatTanggal(value: string | null) {
  if (!value) return "Belum ditentukan";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value));
}

function hitungSisaHari(value: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000));
}

function normalizeStatus(status: string): StatusProyek {
  const map: Record<string, StatusProyek> = {
    DIBATALKAN: "BATAL",
    PEMILIHAN_VENDOR: "SELEKSI",
    VERIFIKASI_KOMPETENSI: "SELEKSI",
  };
  return (map[status] ?? status) as StatusProyek;
}

function mapFlag(flag: ApiFlag): FlagIntegritas {
  const isText = flag.jenis === "TEKS";
  return {
    tipe: isText ? "KEMIRIPAN_TEKS" : "ANGGOTA_GANDA",
    label: isText ? `Indikasi Kemiripan Teks ${Math.round(flag.nilai * 100)}%` : "Anggota Tumpang Tindih",
    deskripsi: flag.catatan ?? "Perlu klarifikasi lebih lanjut oleh tim verifikasi.",
    tingkat: "warning",
  };
}

function mapRingkasanAi(ringkasan: ApiProposal["ringkasan"]): ProposalDetail["ringkasanAi"] {
  if (!ringkasan || !ringkasan.json || typeof ringkasan.json !== "object") return undefined;
  const data = ringkasan.json as Record<string, unknown>;
  return {
    model: ringkasan.model,
    ringkasanEksekutif: typeof data.ringkasanEksekutif === "string" ? data.ringkasanEksekutif : "Ringkasan belum tersedia.",
    poinKekuatan: Array.isArray(data.poinKekuatan) ? data.poinKekuatan.filter((item): item is string => typeof item === "string") : [],
    poinPerhatian: Array.isArray(data.poinPerhatian) ? data.poinPerhatian.filter((item): item is string => typeof item === "string") : [],
    rekomendasiCatatan: typeof data.rekomendasiCatatan === "string" ? data.rekomendasiCatatan : "Belum ada rekomendasi.",
  };
}

function mapProposal(proposal: ApiProposal): ProposalDetail {
  const flagsDetail = [...(proposal.flagA ?? []), ...(proposal.flagB ?? [])].map(mapFlag);
  return {
    id: proposal.id,
    namaKelompok: proposal.kelompok.nama,
    ketua: proposal.kelompok.ketua?.nama ?? "Ketua belum tercatat",
    penawaran: Number(proposal.penawaran),
    durasiHari: proposal.durasiHari,
    tenagaTotal: proposal.tenagaTotal,
    tenagaLokal: proposal.tenagaLokal,
    persentaseLokal: proposal.tenagaTotal ? (proposal.tenagaLokal / proposal.tenagaTotal) * 100 : 0,
    narasiMetode: proposal.narasiMetode,
    narasiJadwal: proposal.narasiJadwal,
    narasiRisiko: proposal.narasiRisiko,
    dokumen: proposal.dokumen,
    skor: {
      total: proposal.scoring.total,
      rincian: {
        harga: proposal.scoring.rincian.biaya,
        tenagaLokal: proposal.scoring.rincian.lokal,
        pengalaman: proposal.scoring.rincian.lengkap,
        durasi: proposal.scoring.rincian.jadwal,
      },
      flags: proposal.scoring.flags,
      versiBobot: proposal.scoring.versiBobot,
    },
    flagsDetail,
    ringkasanAi: mapRingkasanAi(proposal.ringkasan),
  };
}

export async function getProyekDetail(id: string): Promise<ProjectDetailData> {
  const encodedId = encodeURIComponent(id);
  const [proyek, proposals] = await Promise.all([
    fetchApi<ApiProyek>(`/api/proyek/${encodedId}`),
    fetchApi<ApiProposal[]>(`/api/proyek/${encodedId}/proposal`),
  ]);

  const isSayembaraDemo = proyek.id === "seed_proyek_001" || id === "seed_proyek_001";
  const status = isSayembaraDemo ? ("TENDER_DIBUKA" as StatusProyek) : normalizeStatus(proyek.status);
  const tenggatHari = isSayembaraDemo ? Math.max(7, hitungSisaHari(proyek.tenggatProposal)) : hitungSisaHari(proyek.tenggatProposal);

  return {
    id: proyek.id,
    desaId: proyek.desaId,
    judul: proyek.judul,
    deskripsi: proyek.deskripsi,
    lokasi: proyek.lokasi,
    pagu: Number(proyek.pagu),
    kelas: proyek.kelas as ProjectDetailData["kelas"],
    jalur: (proyek.jalur ?? "SAYEMBARA") as ProjectDetailData["jalur"],
    alasanJalur: proyek.alasanJalur ?? "Alasan pemilihan jalur belum dipublikasikan.",
    status,
    tanggalPublikasi: formatTanggal(proyek.createdAt),
    tenggatProposal: formatTanggal(proyek.tenggatProposal),
    tenggatHari,
    syaratLokalMin: proyek.syaratLokalMin,
    durasiMin: proyek.durasiMin,
    durasiMax: proyek.durasiMax,
    sumberDana: `Dana Desa ${proyek.desa.nama}`,
    rabItems: proyek.rab.map((item) => ({
      ...item,
      hargaSatuan: Number(item.hargaSatuan),
      subtotal: item.volume * Number(item.hargaSatuan),
    })),
    proposals: proposals.map(mapProposal).sort((a, b) => b.skor.total - a.skor.total),
  };
}
