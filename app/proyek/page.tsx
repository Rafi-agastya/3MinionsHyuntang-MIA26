import Link from "next/link";
import {
  Users,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  HardHat,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ProyekDirectoryList } from "@/components/proyek/proyek-directory-list";
import { getProyekList, type ProyekListItem } from "@/lib/proyek-api";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Fallback seed projects matching PRD Section 28.3 & seed.ts
const fallbackProyekList: ProyekListItem[] = [
  {
    id: "seed_proyek_001",
    judul: "Pembangunan Saluran Drainase RT 3 Dusun Krajan",
    deskripsi:
      "Pembangunan saluran drainase lingkungan permanen sepanjang 350 meter menggunakan batu kali mortar untuk mencegah genangan air saat musim hujan di area pemukiman warga.",
    lokasi: "RT 03 Dusun Krajan, Desa Karang Sari",
    pagu: 100_000_000,
    jalur: "SAYEMBARA",
    status: "TENDER_DIBUKA",
    syaratLokalMin: 70,
    durasiMin: 30,
    durasiMax: 60,
    proposal: [{ id: "prop_001" }, { id: "prop_002" }],
  },
  {
    id: "seed_proyek_002",
    judul: "Rehabilitasi Gedung Pertemuan Balai Warga Dusun",
    deskripsi:
      "Peningkatan fasilitas aula desa dan ruang serbaguna dusun untuk kegiatan posyandu, pelatihan tani mandiri, dan kegiatan kepemudaan karang taruna setempat.",
    lokasi: "Dusun Karang Anyar, Desa Karang Sari",
    pagu: 140_000_000,
    jalur: "SAYEMBARA",
    status: "PENGERJAAN",
    syaratLokalMin: 75,
    durasiMin: 45,
    durasiMax: 90,
    proposal: [{ id: "prop_003" }],
  },
  {
    id: "seed_proyek_003",
    judul: "Pavingisasi Jalan Setapak Permukiman Dusun Makmur",
    deskripsi:
      "Pemasangan paving block jalan setapak pemukiman sepanjang 400 meter dengan sistem Padat Karya Tunai Desa (PKTD) guna mempermudah akses anak sekolah dan mobilitas panen.",
    lokasi: "Dusun Tani Makmur, Desa Karang Sari",
    pagu: 60_000_000,
    jalur: "SAYEMBARA",
    status: "SELESAI",
    syaratLokalMin: 85,
    durasiMin: 20,
    durasiMax: 40,
    proposal: [{ id: "prop_004" }],
  },
];

export default async function ProyekIndexPage() {
  let proyekList: ProyekListItem[];

  try {
    proyekList = await getProyekList();
    if (!proyekList || proyekList.length === 0) {
      proyekList = fallbackProyekList;
    }
  } catch (error) {
    console.warn("Using fallback seeded proyek list:", error);
    proyekList = fallbackProyekList;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-zinc-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* 1. HEADER & PANDUAN SAYEMBARA PKTD                                        */}
        {/* ========================================================================= */}
        <div className="flex flex-col justify-between gap-6 border-b border-zinc-200/80 pb-6 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[#1F6F43] text-xs font-semibold">
              <HardHat className="w-4 h-4 text-[#1F6F43]" />
              <span>Bursa Kerja Sayembara Swakelola Desa</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900">
              Sayembara Swakelola &amp; Proyek Desa
            </h1>

            <p className="max-w-2xl text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Pekerjaan fisik dan pemeliharaan infrastruktur desa yang terbuka bagi kelompok pertukangan warga, buruh tani, dan karang taruna lokal melalui mekanisme Padat Karya Tunai Desa (PKTD).
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <Link
              href="/proyek/panduan"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white border border-zinc-200 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-2xs"
            >
              <span>Panduan Pengajuan Proposal Kelompok Warga</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#1F6F43]" />
            </Link>
          </div>
        </div>

        {/* Highlight Ringkas di Bawah Header */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Badge Hijau Prioritas Tenaga Kerja Lokal */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-[#1F6F43] font-semibold border border-emerald-200">
            <Users className="w-4 h-4 text-[#1F6F43]" />
            <span>Prioritas Serapan Tenaga Kerja Lokal ≥ 70%</span>
          </div>

          {/* Badge Netral Seleksi Terbuka AI */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-zinc-700 font-medium border border-zinc-200/80 shadow-2xs">
            <BrainCircuit className="w-4 h-4 text-[#8A5A2B]" />
            <span>Penilaian Seleksi Terbuka via AI Scoring Board</span>
          </div>

          {/* Badge Mutasi Kas Transparan */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-zinc-600 font-medium border border-zinc-200/80 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
            <span>Termin Pencairan Tercatat di Kas Publik</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DIRECTORY LIST WITH TABS, CARDS & EMPTY STATE                          */}
        {/* ========================================================================= */}
        <ProyekDirectoryList initialProyekList={proyekList} />
      </main>

      <Footer />
    </div>
  );
}
