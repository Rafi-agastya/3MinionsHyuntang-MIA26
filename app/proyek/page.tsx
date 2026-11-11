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

const STATUS_PRIORITY: Record<string, number> = {
  TENDER_DIBUKA: 1,
  PENGERJAAN: 2,
  SELESAI: 3,
  PEMATANGAN: 4,
};

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

  // Pastikan seed_proyek_001 selalu berstatus TENDER_DIBUKA untuk demo sayembara terbuka
  proyekList = proyekList.map((item) => {
    if (item.id === "seed_proyek_001") {
      return { ...item, status: "TENDER_DIBUKA" };
    }
    return item;
  });

  // Prioritaskan Saluran Drainase (Sayembara Terbuka) di posisi nomor 1
  proyekList = [...proyekList].sort((a, b) => {
    if (a.id === "seed_proyek_001") return -1;
    if (b.id === "seed_proyek_001") return 1;
    const prioA = STATUS_PRIORITY[a.status] ?? 99;
    const prioB = STATUS_PRIORITY[b.status] ?? 99;
    return prioA - prioB;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-zinc-900 font-sans">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ========================================================================= */}
        {/* BAGIAN 1: BANNER SOROTAN SAYEMBARA (12-COL CSS GRID)                      */}
        {/* ========================================================================= */}
        <section
          aria-label="Bursa Sayembara Proyek"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full space-y-6">
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
            {/* Even Dark Gradient Overlay for Maximum Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#123D25]/95 via-[#1F6F43]/88 to-black/50 backdrop-blur-[1px]" />
          </div>

          {/* Banner Content Container */}
          <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white space-y-6">
            {/* Top Grid: Left 7 Cols Text + Right 5 Cols Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
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

              {/* Right Column (5 Cols): Feature Overview Card */}
              <div className="lg:col-span-5 w-full">
                <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200">
                    <Sparkles className="w-4 h-4 text-[#F2B705]" />
                    <span>Peluang Kerja Padat Karya</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    Prioritas Warga Karang Sari
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                    Kelompok masyarakat (Pokmas), rukun warga RT/RW, dan tukang lokal dapat langsung mendaftarkan proposal pengerjaan fisik secara mandiri tanpa perantara calo.
                  </p>
                  <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200 font-medium">
                    <span>Standar Upah Harian</span>
                    <span className="text-[#F2B705] font-bold font-mono">Sesuai SK Kades 2026</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom 3 Highlight Cards arranged neatly */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/15">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#F2B705]" />
                  <span>Tenaga Kerja Lokal</span>
                </span>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                  Wajib ≥ 70% melibatkan warga ber-KTP Karang Sari secara nyata.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-[#F2B705]" />
                  <span>Bebas Nepotisme</span>
                </span>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                  Proposal dinilai transparan dengan formula scoring terbuka tanpa titipan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#F2B705]" />
                  <span>Pencairan Tercatat</span>
                </span>
                <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                  Tiap termin masuk buku kas publik dengan bukti fisik &amp; rantai SHA-256.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

        {/* ========================================================================= */}
        {/* BAGIAN 2: DIRECTORY LIST WITH TABS, CARDS & EMPTY STATE                   */}
        {/* ========================================================================= */}
        <section
          aria-label="Daftar Proyek Desa"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full flex flex-col justify-start">
            <ProyekDirectoryList initialProyekList={proyekList} />
          </div>
        </section>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
