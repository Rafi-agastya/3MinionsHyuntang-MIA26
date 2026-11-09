import Image from "next/image";
import Link from "next/link";
import {
  Users,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  HardHat,
  Sparkles,
  FileText,
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
    <div className="min-h-screen bg-[#FAFAF7] bg-[radial-gradient(#1F6F43_0.5px,transparent_0.5px)] [background-size:24px_24px] text-zinc-900 flex flex-col justify-between font-sans relative">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* 1. BANNER SOROTAN SAYEMBARA (VILLAGE AESTHETIC WITH REAL PHOTO)           */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl overflow-hidden border border-emerald-800/20 shadow-md">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/proyek/jalan-desa.jpg"
              alt="Suasana Pembangunan Jalan Desa"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
            {/* Emerald Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1F6F43]/95 via-[#1F6F43]/88 to-[#154e2f]/92 backdrop-blur-[1px]" />
          </div>

          {/* Banner Content */}
          <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-emerald-100 text-xs font-semibold">
                <HardHat className="w-3.5 h-3.5 text-[#F2B705]" />
                <span>Bursa Kerja Sayembara Swakelola Desa TA 2026</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Bangun Desa Bersama Warga, Dari Warga, Untuk Warga
              </h1>

              <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 leading-relaxed font-normal">
                Pekerjaan fisik dan pemeliharaan infrastruktur desa dibuka terbuka bagi kelompok pertukangan warga, buruh tani, dan karang taruna lokal melalui skema Padat Karya Tunai Desa (PKTD) dengan serapan tenaga lokal minimal 70%.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/proyek/panduan"
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-white text-[#1F6F43] hover:bg-emerald-50 text-xs sm:text-sm font-semibold transition-all shadow-xs"
                >
                  <FileText className="w-4 h-4 text-[#1F6F43]" />
                  <span>Panduan Pengajuan Proposal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-xs text-xs text-emerald-100 border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Penilaian Obyektif AI Scoring Board</span>
                </div>
              </div>
            </div>

            {/* Quick Feature Badges on Right */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 shrink-0 lg:w-72">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Tenaga Kerja Lokal</span>
                </span>
                <p className="text-xs text-white font-medium">
                  Wajib $\ge 70\%$ melibatkan warga ber-KTP setempat.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Bebas Nepotisme</span>
                </span>
                <p className="text-xs text-white font-medium">
                  Proposal dinilai transparan dengan formula terbuka.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F2B705]" />
                  <span>Pencairan Tercatat</span>
                </span>
                <p className="text-xs text-white font-medium">
                  Tiap termin masuk buku kas berantai SHA-256.
                </p>
              </div>
            </div>
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
