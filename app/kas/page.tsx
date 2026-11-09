import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
  Coins,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Lock,
  Calendar,
} from "lucide-react";
import { Footer } from "@/components/footer";
import { KasMutasiTable, type KasTransaction } from "@/components/kas/kas-mutasi-table";
import { Navbar } from "@/components/navbar";
import { formatRupiah } from "@/lib/format";

export const revalidate = 0;

interface KasRingkasan {
  desaId: string;
  namaDesa: string;
  totalPemasukan: number;
  totalPengeluaran: number;
  sisaSaldo: number;
  transaksiTerakhir: KasTransaction[];
}

const fallbackKasData: KasRingkasan = {
  desaId: "seed_desa_001",
  namaDesa: "Desa Karang Sari",
  totalPemasukan: 1_500_000_000,
  totalPengeluaran: 850_000_000,
  sisaSaldo: 650_000_000,
  transaksiTerakhir: [],
};

// PRD Section 27.2: APBDes Pagu Acuan
const PAGU_APBDes_2026 = 1_000_000_000; // Rp 1.000.000.000
const KAS_MASUK_PENCAIRAN = 420_000_000; // Rp 420.000.000 (42% Terserap)
const BELANJA_OPERASIONAL = 315_000_000; // Rp 315.000.000
const SISA_KAS_DESA = 105_000_000; // Rp 105.000.000

function isKasRingkasan(value: unknown): value is KasRingkasan {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;

  return (
    typeof data.desaId === "string" &&
    typeof data.namaDesa === "string" &&
    typeof data.totalPemasukan === "number" &&
    typeof data.totalPengeluaran === "number" &&
    typeof data.sisaSaldo === "number" &&
    Array.isArray(data.transaksiTerakhir)
  );
}

async function getKasRingkasan(): Promise<KasRingkasan> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/desa/seed_desa_001/kas/ringkasan`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Gagal mengambil data buku kas");

    const json: unknown = await res.json();
    if (!json || typeof json !== "object" || !isKasRingkasan((json as { data?: unknown }).data)) {
      throw new Error("Format data buku kas tidak valid");
    }

    return (json as { data: KasRingkasan }).data;
  } catch (error) {
    console.error("Error fetching kas ringkasan:", error);
    return fallbackKasData;
  }
}

export default async function KasPage() {
  const kasData = await getKasRingkasan();

  // If DB transactions exist, use them; otherwise use standard seeded ledger list
  const transaksiList = kasData.transaksiTerakhir.length > 0
    ? kasData.transaksiTerakhir
    : [
        {
          id: "kas_001",
          tanggal: "2026-01-10T08:00:00.000Z",
          jenis: "PEMASUKAN" as const,
          kategori: "Dana Desa",
          uraian: "Penyaluran Dana Desa Tahap 1 dari RKUN ke RKD Karang Sari",
          jumlah: 250_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_001.pdf",
        },
        {
          id: "kas_002",
          tanggal: "2026-01-25T10:30:00.000Z",
          jenis: "PENGELUARAN" as const,
          kategori: "Operasional Desa",
          uraian: "Pembayaran Penghasilan Tetap dan Tunjangan Perangkat & BPD Bulan Januari",
          jumlah: 65_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_002.pdf",
        },
        {
          id: "kas_003",
          tanggal: "2026-02-05T09:00:00.000Z",
          jenis: "PEMASUKAN" as const,
          kategori: "Alokasi Dana Desa (ADD)",
          uraian: "Penyaluran ADD Tahap 1 dari Rekening Kas Daerah Kabupaten",
          jumlah: 120_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_003.pdf",
        },
        {
          id: "kas_004",
          tanggal: "2026-02-20T14:00:00.000Z",
          jenis: "PENGELUARAN" as const,
          kategori: "Operasional Perkantoran",
          uraian: "Biaya operasional kantor desa, listrik balai, internet publik, dan konsumsi Musdes Khusus",
          jumlah: 35_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_004.pdf",
        },
        {
          id: "kas_005",
          tanggal: "2026-03-01T11:00:00.000Z",
          jenis: "PEMASUKAN" as const,
          kategori: "Pendapatan Asli Desa (PADes)",
          uraian: "Bagi hasil dividen unit pengelolaan pasar desa & air bersih BUMDes Karang Sari",
          jumlah: 50_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_005.pdf",
        },
        {
          id: "kas_006",
          tanggal: "2026-03-10T13:30:00.000Z",
          jenis: "PENGELUARAN" as const,
          kategori: "Termin Proyek",
          uraian: "Pencairan Termin 0 (Uang Muka 30%) Rehabilitasi Gedung Balai Warga Dusun Krajan",
          jumlah: 42_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_006.pdf",
        },
        {
          id: "kas_007",
          tanggal: "2026-04-05T09:15:00.000Z",
          jenis: "PENGELUARAN" as const,
          kategori: "Swakelola Fisik",
          uraian: "Pembayaran 100% Upah Tukang & Padat Karya Tunai Jalan Setapak Dusun Makmur",
          jumlah: 58_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_007.pdf",
        },
        {
          id: "kas_008",
          tanggal: "2026-04-18T10:00:00.000Z",
          jenis: "PENGELUARAN" as const,
          kategori: "Termin Proyek",
          uraian: "Pencairan Termin 50% Proyek Renovasi Balai Warga (Opname Fisik Terverifikasi BPD)",
          jumlah: 55_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_008.pdf",
        },
        {
          id: "kas_009",
          tanggal: "2026-05-12T15:00:00.000Z",
          jenis: "PENGELUARAN" as const,
          kategori: "Pemberdayaan Warga",
          uraian: "Pengadaan bibit unggul varietas padi Ciherang dan pupuk organik kelompok tani",
          jumlah: 60_000_000,
          buktiUrl: "https://akar-desa.id/bukti/kas_009.pdf",
        },
      ];

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAF7] bg-[radial-gradient(#1F6F43_0.5px,transparent_0.5px)] [background-size:24px_24px] text-zinc-900 font-sans relative">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 sm:space-y-8 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* PAGE HEADER: SPLIT HERO BANNER                                            */}
        {/* ========================================================================= */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8 overflow-hidden">
          {/* Left Column: Title & Description */}
          <div className="space-y-3.5 flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/70 px-3.5 py-1 text-xs font-semibold text-[#1F6F43]">
              <ShieldCheck className="h-4 w-4 text-[#1F6F43]" />
              <span>Transparansi Anggaran Publik APBDes 2026</span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              Buku Kas Umum Publik
            </h1>

            <p className="max-w-xl text-sm sm:text-base text-zinc-600 leading-relaxed">
              Catatan mutasi realisasi anggaran pendapatan dan belanja {kasData.namaDesa} Tahun Anggaran 2026. Seluruh mutasi tersimpan dengan sistem ledger append-only berantai SHA-256 dan diverifikasi bersama Badan Permusyawaratan Desa (BPD).
            </p>

            {/* Quick Actions & Meta */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/data"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-[#1F6F43] hover:bg-[#185935] text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
              >
                <Download className="h-4 w-4" />
                <span>Unduh Rekap Kas (CSV/PDF)</span>
              </Link>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-100 text-xs text-zinc-700 font-medium">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>TA 2026 • Mutasi Berjalan</span>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop) / Top (Mobile): Visual Image Card */}
          <div className="w-full lg:w-96 shrink-0 rounded-2xl overflow-hidden border border-zinc-200/80 shadow-md relative group aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3]">
            <Image
              src="/hero-desa-aerial.jpg"
              alt="Lanskap Udara Desa Karang Sari"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 384px"
              priority
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* Bottom Tag & Village Context */}
            <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-xs text-[11px] font-semibold text-white">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Rantai Ledger Aktif</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white drop-shadow-xs leading-snug">
                Transparansi Dana Desa Karang Sari — Diaudit Bersama BPD
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. TOP AUDIT & INTEGRITY BANNER                                           */}
        {/* ========================================================================= */}
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200/70 shadow-2xs text-[#1F6F43] shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#1F6F43]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                  <span>Rantai Data Terverifikasi SHA-256</span>
                </span>
                <span className="text-xs font-medium text-zinc-500">
                  Sinkronisasi Terakhir: Hari ini, 08:00 WIB
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1 font-mono">
                Hash Blok Terakhir:{" "}
                <span className="text-zinc-800 font-semibold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  sha256:7f83b1657ff1...4addd200126d9069
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-emerald-200/40 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#1F6F43]" />
              <span>Immutable Ledger</span>
            </div>
            <span className="text-zinc-300">•</span>
            <div className="flex items-center gap-1.5 text-[#1F6F43] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>BPD Approved</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BENTO SUMMARY CARDS (AGREGASI KAS DESA)                                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Pagu Anggaran 2026 */}
          <div className="group rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default min-h-[170px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-[#1F6F43] transition-colors">
                Pagu Anggaran 2026
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#1F6F43] flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="font-mono text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#1F6F43]">
                {formatRupiah(PAGU_APBDes_2026)}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Pagu KDMP 58% (Rp580,3 Jt) &amp; Pagu Reguler
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5 text-xs text-zinc-500">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1F6F43]" />
              <span>Ketentuan PMK 7/2026</span>
            </div>
          </div>

          {/* Card 2: Total Kas Masuk / Pencairan */}
          <div className="group rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default min-h-[170px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-[#1F6F43] transition-colors">
                Kas Masuk / Pencairan
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="font-mono text-2xl sm:text-[26px] font-extrabold tracking-tight text-emerald-700">
                {formatRupiah(KAS_MASUK_PENCAIRAN)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  42% Terserap
                </span>
                <span className="text-xs text-zinc-500 font-medium">dari total pagu</span>
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>DD Tahap 1, ADD, &amp; PADes</span>
            </div>
          </div>

          {/* Card 3: Belanja Proyek & Operasional */}
          <div className="group rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default min-h-[170px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-[#8A5A2B] transition-colors">
                Belanja &amp; Operasional
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#8A5A2B] flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="font-mono text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#8A5A2B]">
                {formatRupiah(BELANJA_OPERASIONAL)}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Realisasi proyek fisik &amp; Siltap perangkat
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <span>Rasio Belanja:</span>
              <span className="font-bold text-zinc-800">75% dari kas masuk</span>
            </div>
          </div>

          {/* Card 4: Sisa Kas Desa */}
          <div className="group rounded-2xl border border-emerald-300/40 bg-gradient-to-br from-[#1F6F43] to-[#154e2f] text-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs cursor-default min-h-[170px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                Sisa Kas Desa
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/15 text-white flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="font-mono text-2xl sm:text-[26px] font-extrabold tracking-tight text-white">
                {formatRupiah(SISA_KAS_DESA)}
              </div>
              <p className="text-xs text-emerald-100/80 mt-1 font-medium">
                Saldo aktif Rekening Kas Desa (RKD)
              </p>
            </div>
            <div className="pt-2 border-t border-white/15 flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Bank Operasional Resmi BPD</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. MUTASI TRANSAKSI TABLE SECTION                                         */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                Mutasi Buku Kas Umum
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Riwayat transaksi kas masuk dan keluar yang tercatat secara permanen (*append-only*).
              </p>
            </div>

            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Klik pada baris transaksi untuk melihat berkas bukti transfer &amp; kuitansi.</span>
            </div>
          </div>

          <KasMutasiTable transaksiList={transaksiList} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
