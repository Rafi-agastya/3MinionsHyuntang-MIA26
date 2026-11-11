import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import {
  ChevronRight,
  Download,
  ArrowRight,
  HardHat,
  Users,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Wallet,
  FileSpreadsheet,
  BrainCircuit,
  Scale,
  ClipboardList,
  Phone,
  Building2,
  MapPin,
  Clock,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Panduan Pengajuan Proposal Sayembara Swakelola | AKAR Desa Karang Sari",
  description:
    "Pedoman resmi bagi kelompok masyarakat (Pokmas), rukun warga, dan tukang lokal Desa Karang Sari untuk mengajukan usulan pengerjaan fisik berbasis Padat Karya Tunai Desa (PKTD).",
};

export default function PanduanProposalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-zinc-900 font-sans">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ========================================================================= */}
        {/* BAGIAN 1: HEADER & 4 SYARAT POKOK KELOMPOK + SIDEBAR BANTUAN BALAI WARGA  */}
        {/* ========================================================================= */}
        <section
          aria-label="Syarat Pokok Kelompok Pengusul"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full space-y-8">
          {/* Breadcrumb & Header */}
          <div className="space-y-4 border-b border-zinc-200/80 pb-6">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
              <Link href="/" className="hover:text-[#1F6F43] transition-colors">
                Beranda
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <Link href="/proyek" className="hover:text-[#1F6F43] transition-colors">
                Sayembara Proyek
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-[#1F6F43] font-semibold">Panduan Proposal</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[#1F6F43] text-xs font-semibold">
                  <HardHat className="w-4 h-4 text-[#1F6F43]" />
                  <span>Pedoman Resmi Swakelola Tipe IV (Pokmas)</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-[1.2]">
                  Panduan Pengajuan Proposal Sayembara Swakelola
                </h1>

                <p className="max-w-3xl text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Pedoman resmi bagi kelompok masyarakat (Pokmas), rukun warga, dan tukang lokal Desa Karang Sari untuk mengajukan usulan pengerjaan fisik berbasis Padat Karya Tunai Desa (PKTD) dengan transparansi penuh.
                </p>
              </div>

              {/* Tombol Aksi Cepat */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <a
                  href="/template-proposal-rab-akar.zip"
                  download
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/90 text-xs sm:text-sm font-semibold shadow-2xs transition-all"
                >
                  <Download className="w-4 h-4 text-[#1F6F43]" />
                  <span>Unduh Format Proposal &amp; RAB (DOCX/XLSX)</span>
                </a>

                <Link
                  href="/proyek"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
                >
                  <span>Lihat Sayembara Terbuka</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* 2-COLUMN LAYOUT: 4 SYARAT POKOK (8 COLS) + SIDEBAR BALAI WARGA (4 COLS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            {/* MAIN COLUMN (8 COLS): 4 SYARAT POKOK */}
            <div className="lg:col-span-8 flex flex-col h-full space-y-6">

        {/* ========================================================================= */}
        {/* SECTION 1: 4 SYARAT POKOK KELOMPOK PENGUSUL                               */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-syarat" className="flex flex-col h-full space-y-6 flex-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F6F43]">
              <ShieldCheck className="w-4 h-4" />
              <span>Kriteria Kelayakan Pokmas</span>
            </div>
            <h2 id="section-syarat" className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              4 Syarat Pokok Kelompok Pengusul
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Memastikan pekerjaan dikerjakan oleh warga lokal yang kompeten dan bertanggung jawab penuh secara gotong royong.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 grid-rows-2 h-full">
            {/* Syarat 1: Legalitas Kelompok */}
            <div className="group rounded-2xl border border-zinc-200/80 bg-white p-6 md:p-8 shadow-2xs hover:shadow-xs hover:border-[#1F6F43]/40 transition-all duration-200 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1F6F43] flex items-center justify-center font-bold shrink-0 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-zinc-900 leading-snug">
                  1. Legalitas &amp; Keanggotaan Warga
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-600">
                  Kelompok pengusul wajib beranggotakan <strong>minimal 5 orang</strong> warga yang memiliki KTP aktif beralamat di Desa Karang Sari. Susunan kepengurusan (Ketua, Sekretaris, Bendahara, Tukang Utama) disahkan melalui Surat Pengantar dari Ketua RT/RW setempat.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs font-semibold text-[#1F6F43]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Surat Pengantar RT/RW Wajib Disertakan</span>
              </div>
            </div>

            {/* Syarat 2: Komitmen Tenaga Kerja Lokal */}
            <div className="group rounded-2xl border border-zinc-200/80 bg-white p-6 md:p-8 shadow-2xs hover:shadow-xs hover:border-[#1F6F43]/40 transition-all duration-200 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#8A5A2B] flex items-center justify-center font-bold shrink-0 mb-4">
                  <HardHat className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-zinc-900 leading-snug">
                  2. Komitmen Tenaga Kerja Lokal (Min. 70%)
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-600">
                  Wajib menyerap <strong>minimal 70% tenaga kerja warga desa setempat</strong> sesuai amanat Padat Karya Tunai Desa (PKTD Permendes 16/2025). Prioritas alokasi upah harian diberikan kepada keluarga prasejahtera dan buruh tani musiman.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs font-semibold text-[#8A5A2B]">
                <HardHat className="w-4 h-4 shrink-0 text-[#8A5A2B]" />
                <span>Prioritas Padat Karya Tunai Desa (PKTD)</span>
              </div>
            </div>

            {/* Syarat 3: Larangan Subkontrak Pihak Ketiga */}
            <div className="group rounded-2xl border border-zinc-200/80 bg-white p-6 md:p-8 shadow-2xs hover:shadow-xs hover:border-red-400/50 transition-all duration-200 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0 mb-4">
                  <Ban className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-zinc-900 leading-snug">
                  3. Larangan Subkontrak Pihak Ketiga
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-600">
                  Seluruh tahapan pekerjaan <strong>wajib dikerjakan langsung secara swakelola</strong> oleh kelompok pengusul. Dilarang keras mengalihkan, mensubkontrakkan, atau memperjualbelikan paket pekerjaan kepada kontraktor atau badan usaha luar desa.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs font-semibold text-red-600">
                <Ban className="w-4 h-4 shrink-0 text-red-600" />
                <span>100% Pengerjaan Mandiri Bebas Calo</span>
              </div>
            </div>

            {/* Syarat 4: Transparansi Rekening Bank */}
            <div className="group rounded-2xl border border-zinc-200/80 bg-white p-6 md:p-8 shadow-2xs hover:shadow-xs hover:border-[#1F6F43]/40 transition-all duration-200 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1F6F43] flex items-center justify-center font-bold shrink-0 mb-4">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-zinc-900 leading-snug">
                  4. Rekening Operasional Kelompok Resmi
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-zinc-600">
                  Memiliki rekening bank resmi atas nama kelompok (bukan rekening pribadi) yang dibuka di bank mitra operasional kas desa untuk mempermudah audit aliran pencairan bertahap dan pencatatan kas publik.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs font-semibold text-[#1F6F43]">
                <Wallet className="w-4 h-4 shrink-0 text-[#1F6F43]" />
                <span>Rekening Bank Operasional Khusus Pokmas</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* SIDEBAR: PUSAT BANTUAN & FOTO BALAI WARGA (4 COLS) */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Card 1: Visual Balai Warga */}
          <div className="rounded-3xl overflow-hidden border border-zinc-200/80 bg-white shadow-sm space-y-0 group">
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src="/proyek/balai-warga.jpg"
                alt="Balai Pertemuan Warga Desa Karang Sari"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 384px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-[11px] font-semibold">
                  <Building2 className="w-3 h-3" />
                  <span>Balai Pertemuan Desa</span>
                </span>
                <p className="text-xs sm:text-sm font-bold text-white drop-shadow-xs mt-1">
                  Pusat Konsultasi &amp; Pengesahan Pokmas
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-2 text-xs text-zinc-600">
              <p className="leading-relaxed">
                Balai Warga Karang Sari terbuka bagi kelompok pertukangan yang ingin berkonsultasi mengenai penyusunan Micro-RAB dan pembentukan struktur tim gotong royong.
              </p>
            </div>
          </div>

          {/* Card 2: Kontak Bantuan Perangkat Desa */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#1F6F43]">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Butuh Bantuan Pengisian?
                </h3>
                <span className="text-[11px] text-zinc-500 block">
                  Pendampingan teknis gratis tanpa biaya
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Users className="w-4 h-4 text-[#8A5A2B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-800 block">Kaur Pembangunan Desa:</strong>
                  <span className="text-zinc-600">Bpk. Sugeng Hariyanto (Pamong Desa)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-800 block">Jam Pelayanan Tatap Muka:</strong>
                  <span className="text-zinc-600">Senin – Jumat (08:00 – 15:00 WIB)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#8A5A2B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-800 block">Lokasi Meja Konsultasi:</strong>
                  <span className="text-zinc-600">Kantor Pelayanan Terpadu Desa Karang Sari</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <a
                href="/template-proposal-rab-akar.zip"
                download
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs border border-zinc-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#1F6F43]" />
                <span>Unduh Blanko Formulir (Word &amp; Excel)</span>
              </a>
            </div>
          </div>

          {/* Card 3: Jaminan Integritas & Anti-Pungli */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2.5 text-xs text-zinc-700">
            <div className="flex items-center gap-2 font-bold text-[#1F6F43]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Jaminan Bebas Pungutan Liar</span>
            </div>
            <p className="leading-relaxed text-zinc-600">
              Seluruh tahapan pendaftaran sayembara swakelola 100% bebas biaya. Skor dihitung secara otomatis oleh algoritma terbuka tanpa intervensi pihak luar.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </section>

    {/* ========================================================================= */}
    {/* SECTION 2: FORMAT MICRO-RAB & BOBOT AI SCORING (40/30/20/10)              */}
    {/* ========================================================================= */}
    <section
      id="panduan-frame-2"
      aria-label="Format Micro-RAB dan Bobot AI"
      className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col justify-start space-y-10">
      {/* SECTION 2: FORMAT & RINCIAN MICRO-RAB */}
      <section aria-labelledby="section-rab" className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8A5A2B]">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Struktur Proposal &amp; Rencana Anggaran Biaya</span>
            </div>
            <h2 id="section-rab" className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Format Dokumen &amp; Komponen Micro-RAB
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Setiap kelompok wajib menyusun 4 komponen anggaran terperinci agar lolos uji kelayakan administrasi dan verifikasi teknis.
            </p>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="bg-zinc-50/90 border-b border-zinc-200/80 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3.5">Komponen Micro-RAB</th>
                    <th className="px-5 py-3.5">Ketentuan &amp; Standar Acuan</th>
                    <th className="px-5 py-3.5">Bukti Pertanggungjawaban (LPJ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  <tr className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-zinc-900 whitespace-nowrap">
                      1. Upah Harian Tenaga Kerja (HOK)
                    </td>
                    <td className="px-5 py-4 leading-relaxed">
                      Wajib mengikuti standar upah tukang (Rp110.000/hari) dan pekerja lokal (Rp85.000/hari) sesuai SK Desa Karang Sari TA 2026.
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-zinc-600">
                      Daftar hadir harian bertanda tangan pekerja &amp; foto dokumentasi presensi.
                    </td>
                  </tr>

                  <tr className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-zinc-900 whitespace-nowrap">
                      2. Pengadaan Material / Bahan Lokal
                    </td>
                    <td className="px-5 py-4 leading-relaxed">
                      Pembelian pasir pasang, batu kali, semen, dan kayu diutamakan dari toko material atau tambang rakyat berizin di wilayah desa.
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-zinc-600">
                      Nota/kuitansi bermeterai toko berstempel resmi dan foto barang tiba di lokasi.
                    </td>
                  </tr>

                  <tr className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-zinc-900 whitespace-nowrap">
                      3. Sewa Peralatan Sederhana
                    </td>
                    <td className="px-5 py-4 leading-relaxed">
                      Alat bantu kerja gotong royong seperti mesin molen pengaduk beton, gerobak dorong, stamper timbris, dan terpal penutup.
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-zinc-600">
                      Bukti sewa harian alat dan Berita Acara pemakaian peralatan warga.
                    </td>
                  </tr>

                  <tr className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-zinc-900 whitespace-nowrap">
                      4. Jadwal Pelaksanaan (Timeline Mingguan)
                    </td>
                    <td className="px-5 py-4 leading-relaxed">
                      Rencana kerja bertahap per minggu (Kurva S sederhana) disesuaikan dengan rentang durasi minimum dan maksimum pada paket sayembara.
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-zinc-600">
                      Laporan mingguan mandiri dan dokumentasi foto progres pengerjaan (0%, 50%, 100%).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: BOBOT TRANSPARANSI AI SCORING BOARD                            */}
        {/* ========================================================================= */}
        <section aria-labelledby="section-scoring" className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F6F43]">
              <BrainCircuit className="w-4 h-4" />
              <span>Algoritma Penilaian Transparan</span>
            </div>
            <h2 id="section-scoring" className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Bobot Penilaian AI Scoring Board (Fungsi Murni)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Sesuai sistem tata kelola AKAR, kalkulasi skor dihitung secara matematis dan terbuka oleh formula independen tanpa intervensi subyektif.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white p-6 sm:p-8 shadow-2xs space-y-6">
            {/* 4 Bobot Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bobot 1 */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200/70 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F6F43]">40%</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    Bobot Tertinggi
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Efisiensi &amp; Kewajaran Biaya
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Rasio penawaran terhadap pagu anggaran (ideal 80%–95%). Mencegah pembengkakan anggaran atau harga tidak realistis yang memicu penurunan kualitas.
                </p>
              </div>

              {/* Bobot 2 */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200/70 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F6F43]">30%</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    Mandat PKTD
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Serapan Tenaga Kerja Lokal
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Persentase warga ber-KTP setempat yang dipekerjakan dalam kelompok. Minimal 70% untuk memenuhi kriteria Padat Karya Tunai Desa.
                </p>
              </div>

              {/* Bobot 3 */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200/70 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F6F43]">20%</span>
                  <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                    Ketepatan Waktu
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Rasionalitas Jadwal Pelaksanaan
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Kesesuaian estimasi durasi hari kerja terhadap batas wajar spesifikasi teknis (tidak terlampau cepat atau molor melebihi batas).
                </p>
              </div>

              {/* Bobot 4 */}
              <div className="bg-white rounded-2xl p-5 border border-emerald-200/70 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1F6F43]">10%</span>
                  <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                    Administrasi
                  </span>
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  Kelengkapan Dokumen Usulan
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Ketuntasan dokumen: Surat pengantar RT/RW, fotokopi KTP anggota, Micro-RAB, jadwal pengerjaan, dan surat pernyataan bebas subkontrak.
                </p>
              </div>
            </div>

            {/* Catatan Edukatif Penting */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-start gap-3 text-xs sm:text-sm text-zinc-700 leading-relaxed">
              <Scale className="w-5 h-5 text-[#1F6F43] shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900 font-semibold">Prinsip Akuntabilitas:</strong> AI bertindak sebagai kalkulator penilai obyektif awal untuk memeringkat proposal berdasarkan metrik transparan. Keputusan akhir penetapan pemenang tetap diverifikasi secara faktual di lapangan dan disahkan melalui Berita Acara Musyawarah BPD bersama Pemerintah Desa.
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>

      {/* ========================================================================= */}
      {/* SECTION 3: ALUR 5 TAHAP & CALL TO ACTION BANNER                           */}
      {/* ========================================================================= */}
      <section
        id="panduan-frame-3"
        aria-label="Alur Prosedur dan Pengajuan"
        className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto w-full flex flex-col space-y-8">
        {/* SECTION 4: ALUR 5 TAHAP PENGAJUAN HINGGA PENCAIRAN */}
        <div aria-labelledby="section-alur" className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8A5A2B]">
              <ClipboardList className="w-4 h-4" />
              <span>Tahapan Prosedural Resmi</span>
            </div>
            <h2 id="section-alur" className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Alur 5 Tahap Pengajuan hingga Pencairan Dana
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
              Prosedur terpadu yang menjamin akuntabilitas setiap rupiah dana desa dari pendaftaran hingga serah terima pekerjaan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3 relative flex flex-col justify-between">
              <div className="space-y-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-[#1F6F43] font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Registrasi Kelompok
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Pengesahan anggota di RT/RW dan pengunduhan Kerangka Acuan Kerja (KAK) paket sayembara.
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium pt-2 border-t border-zinc-100 block">
                Hari ke 1–3
              </span>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3 relative flex flex-col justify-between">
              <div className="space-y-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-[#1F6F43] font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Penyusunan Proposal
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Penyusunan Micro-RAB, Kurva S jadwal, dan unggah berkas proposal via formulir sayembara di portal AKAR.
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium pt-2 border-t border-zinc-100 block">
                Masa Pengajuan (7–14 hari)
              </span>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3 relative flex flex-col justify-between">
              <div className="space-y-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-[#1F6F43] font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  AI Scoring Otomatis
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Algoritma sistem menghitung skor 4 indikator dan menampilkan peringkat proposal secara transparan.
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium pt-2 border-t border-zinc-100 block">
                Publikasi Real-Time
              </span>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3 relative flex flex-col justify-between">
              <div className="space-y-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-[#1F6F43] font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  Verifikasi Faktual BPD
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Uji kelayakan tukang, pengecekan daftar warga pekerja, dan penerbitan Berita Acara Penetapan Pemenang.
                </p>
              </div>
              <span className="text-[11px] text-zinc-500 font-medium pt-2 border-t border-zinc-100 block">
                Masa Sanggah 3 Hari
              </span>
            </div>

            {/* Step 5 */}
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-5 shadow-2xs space-y-3 relative flex flex-col justify-between">
              <div className="space-y-2">
                <span className="w-8 h-8 rounded-full bg-[#1F6F43] text-white font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h3 className="text-sm font-bold text-zinc-900">
                  SPK &amp; Pencairan Termin
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Pencairan Termin 0 (50% uang muka bahan &amp; upah) dan Termin pelunasan 50% setelah opname fisik 100% tuntas.
                </p>
              </div>
              <span className="text-[11px] text-[#1F6F43] font-semibold pt-2 border-t border-emerald-200 block">
                Tercatat di Kas Publik
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CALL TO ACTION BANNER                                                     */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-gradient-to-r from-[#1F6F43] to-[#154e2f] p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Siap Mengajukan Proposal Kelompok Warga?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              Pelajari daftar paket sayembara swakelola yang sedang membuka penerimaan proposal di Desa Karang Sari.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/proyek"
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-full bg-white text-[#1F6F43] hover:bg-emerald-50 font-semibold text-xs sm:text-sm transition-all shadow-sm inline-flex items-center justify-center gap-2"
            >
              <span>Pilih Sayembara Aktif</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/ide"
              className="w-full sm:w-auto min-h-[44px] px-6 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium text-xs sm:text-sm transition-all inline-flex items-center justify-center gap-2"
            >
              <span>Usulkan Ide Baru</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  </main>
  <Footer className="mt-auto" />
</div>
);
}
