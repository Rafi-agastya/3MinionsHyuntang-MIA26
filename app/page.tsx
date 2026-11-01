import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  ChevronDown,
  Database,
  Mail,
  ChevronRight,
  FileText,
  MapPin,
  ArrowRight,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SlideIndicator } from "@/components/slide-indicator";
import { AnimatedMetricCards } from "@/components/animated-metric-cards";
import { LandingProjectsIdeas } from "@/components/landing-projects-ideas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import mockData from "@/data/mock.json";
import type {
  ProjectPreview,
  CommunityIdeaPreview,
} from "@/lib/mock-data";

const {
  desaInfo: mockDesaInfo,
  metrics: mockMetrics,
  recentProjects,
  popularIdeas,
} = mockData;

const mockRecentProjects = recentProjects as ProjectPreview[];
const mockPopularIdeas = popularIdeas as CommunityIdeaPreview[];

export default function HomePage() {
  return (
    <div className="w-full min-h-screen lg:h-screen lg:overflow-y-scroll lg:snap-y lg:snap-mandatory scroll-smooth bg-akar-bg text-akar-ink overflow-x-hidden">
      {/* Fixed Translucent Navbar */}
      <Navbar />

      {/* Floating Dot Pagination for Desktop */}
      <SlideIndicator />

      {/* ========================================================================= */}
      {/* SLIDE 1: HERO SECTION WITH VILLAGE BACKGROUND                             */}
      {/* ========================================================================= */}
      <section
        id="slide-hero"
        aria-label="Beranda Utama"
        className="min-h-screen lg:h-screen w-full lg:snap-start flex flex-col justify-center items-center relative p-4 sm:p-6 lg:p-8 pt-24 pb-12 lg:py-16 overflow-hidden bg-akar-ink"
      >
        {/* Authentic Indonesian Rural Village Drone Aerial Background Image */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('/hero-desa-aerial.jpg')`,
          }}
        />

        {/* High-Contrast Brand Overlay (WCAG AAA/AA compliance) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-akar-ink via-akar-ink/85 to-stone-950/75 backdrop-blur-[1.5px]"
        />

        {/* Ambient Brand Glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-akar-primary/25 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-akar-accent/20 blur-3xl pointer-events-none"
        />

        {/* Centered Constrained Container */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col justify-center items-center text-center space-y-5 sm:space-y-8 my-auto">
          {/* Main Headline (PRD 27.2) */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.2] drop-shadow-sm max-w-4xl px-2">
            Dana desa yang terbuka,{" "}
            <span className="text-akar-accent">
              dikerjakan oleh warganya
            </span>
          </h1>

          {/* Explanatory Subheadline */}
          <p className="text-sm sm:text-base lg:text-lg text-stone-200 leading-relaxed font-normal max-w-2xl mx-auto drop-shadow-xs px-2">
            Buku kas publik yang berlog dan tak bisa diubah diam-diam, dipadukan
            dengan bursa kerja sayembara swakelola agar pemuda dan tukang lokal
            menjadi pelaksana utama pembangunan desa.
          </p>

          {/* Two Primary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto px-4">
            <Link href="/proyek" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto min-h-[48px] px-8 text-sm sm:text-base font-bold bg-akar-primary hover:bg-akar-primary-hover text-white shadow-lg shadow-black/30 transition-all duration-200 hover:scale-[1.02]"
              >
                Lihat sayembara
              </Button>
            </Link>

            <Link href="/ide" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto min-h-[48px] px-8 text-sm sm:text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/40 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]"
              >
                Kirim ide
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Hint Indicator */}
        <div className="hidden sm:flex absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex-col items-center text-stone-300 pointer-events-none">
          <span className="text-[11px] font-medium tracking-wider uppercase opacity-85 mb-1">
            Gulir ke Bawah
          </span>
          <ChevronDown className="h-4 w-4 text-stone-300 transition-all duration-200 ease-out" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 2: IMPACT METRICS (4 ANGKA RINGKAS - DESA KARANG SARI)               */}
      {/* ========================================================================= */}
      <section
        id="slide-metrik"
        aria-label="Metrik Transparansi Dana Desa"
        className="min-h-screen lg:h-screen w-full lg:snap-start flex flex-col justify-center items-center relative p-4 sm:p-6 lg:p-8 py-16 lg:py-0 bg-white border-b border-akar-border/80"
      >
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col justify-center items-center my-auto">
          {/* Section Header */}
          <div className="w-full flex flex-col sm:flex-row sm:items-end sm:justify-between mb-5 sm:mb-8 gap-3">
            <div>
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-akar-ink">
                Angka Realisasi &amp; Serapan Warga
              </h2>
              <p className="text-xs sm:text-sm text-akar-muted mt-1">
                Laporan terbuka {mockDesaInfo.nama}, {mockDesaInfo.kecamatan}, {mockDesaInfo.kabupaten}.
              </p>
            </div>

            <Link
              href="/kas"
              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-akar-ink text-xs sm:text-sm font-medium px-4 py-2 rounded-full transition-all shrink-0 self-start sm:self-auto min-h-[40px]"
            >
              <span>Periksa Buku Kas Lengkap</span>
              <ChevronRight className="h-4 w-4 text-akar-muted" />
            </Link>
          </div>

          {/* Interactive Animated Metric Bento Grid */}
          <AnimatedMetricCards metrics={mockMetrics} />

          {/* Bottom Transparency Notice Strip */}
          <div className="w-full mt-4 rounded-2xl border border-akar-border/80 bg-akar-bg px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-akar-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-akar-primary shrink-0" />
              <span>
                Angka buku kas diperbarui langsung dari entri pembayaran bertanda bukti digital dan tidak dapat diubah sepihak.
              </span>
            </div>
            <Link
              href="/kas"
              className="font-semibold text-akar-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Lihat Rantai Verifikasi SHA-256</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 3: CARA KERJA AKAR (4 PHILOSOPHY CARDS)                              */}
      {/* ========================================================================= */}
      <section
        id="slide-filosofi"
        aria-label="Filosofi dan Cara Kerja AKAR"
        className="min-h-screen lg:h-screen w-full lg:snap-start flex flex-col justify-center items-center relative overflow-hidden p-4 sm:p-6 lg:p-8 py-16 lg:py-0 border-b border-akar-border/80 bg-akar-bg"
      >
        {/* Full-Frame Background Logo (60% Opacity) */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none overflow-hidden">
          <Image
            src="/logo-akar.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-40 transition-opacity duration-300"
            priority={false}
          />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-2 sm:px-4 my-auto flex flex-col justify-center items-center">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8 space-y-1.5 bg-akar-bg/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-akar-border/60 shadow-xs">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              <span className="text-akar-ink">Empat Pilar Transparansi </span>
              <span className="text-akar-primary font-extrabold">AKAR</span>
            </h2>
            <p className="max-w-xl mx-auto text-center text-xs sm:text-sm text-akar-muted leading-relaxed">
              Siklus utuh dari aspirasi warga hingga pencairan dana berbukti untuk mencegah penyelewengan.
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 w-full">
            {/* A - Aspirasi */}
            <Card className="group flex flex-col justify-between border-akar-border/80 shadow-xs bg-white/95 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default rounded-2xl h-full p-5 sm:p-6">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-akar-primary text-white font-black text-xl shadow-xs transition-transform duration-300 group-hover:scale-105">
                  A
                </div>
                <div>
                  <span className="text-akar-muted font-semibold tracking-wider text-[11px] uppercase">
                    Pilar 1
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-akar-ink group-hover:text-akar-primary transition-colors">
                    Aspirasi Warga
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-akar-muted leading-relaxed">
                  Kirim &amp; kawal ide atau aduan pembangunan desa secara terbuka. Warga di desa maupun perantauan dapat mengusulkan proyek tanpa titipan pejabat.
                </p>
              </div>

              <div className="border-t border-akar-border/60 pt-3.5 mt-5 space-y-2">
                <div className="text-xs font-semibold text-akar-ink">
                  Mekanisme:
                </div>
                <ul className="space-y-1.5 text-xs text-akar-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Batas respon kades 14 hari</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Deteksi ide kembar otomatis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Dukungan publik satu akun</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* K - Keterbukaan */}
            <Card className="group flex flex-col justify-between border-akar-border/80 shadow-xs bg-white/95 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default rounded-2xl h-full p-5 sm:p-6">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-akar-earth text-white font-black text-xl shadow-xs transition-transform duration-300 group-hover:scale-105">
                  K
                </div>
                <div>
                  <span className="text-akar-muted font-semibold tracking-wider text-[11px] uppercase">
                    Pilar 2
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-akar-ink group-hover:text-akar-earth transition-colors">
                    Keterbukaan Kas
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-akar-muted leading-relaxed">
                  Buku kas publik berlog append-only dan rincian micro-RAB per proyek hingga satuan upah tukang dan bahan material.
                </p>
              </div>

              <div className="border-t border-akar-border/60 pt-3.5 mt-5 space-y-2">
                <div className="text-xs font-semibold text-akar-ink">
                  Mekanisme:
                </div>
                <ul className="space-y-1.5 text-xs text-akar-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-earth shrink-0" />
                    <span>Rincian micro-RAB terbuka</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-earth shrink-0" />
                    <span>Rantai hash SHA-256 anti-ubah</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-earth shrink-0" />
                    <span>Pemisahan tugas pencatat/pengawas</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* A - Aksi */}
            <Card className="group flex flex-col justify-between border-akar-border/80 shadow-xs bg-white/95 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default rounded-2xl h-full p-5 sm:p-6">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-akar-accent text-akar-ink font-black text-xl shadow-xs transition-transform duration-300 group-hover:scale-105">
                  A
                </div>
                <div>
                  <span className="text-akar-muted font-semibold tracking-wider text-[11px] uppercase">
                    Pilar 3
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-akar-ink group-hover:text-akar-primary transition-colors">
                    Aksi Swakelola
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-akar-muted leading-relaxed">
                  Bursa kerja sayembara pengerjaan desa diprioritaskan bagi kelompok warga &amp; tukang setempat, dinilai dengan rumus aturan objektif.
                </p>
              </div>

              <div className="border-t border-akar-border/60 pt-3.5 mt-5 space-y-2">
                <div className="text-xs font-semibold text-akar-ink">
                  Mekanisme:
                </div>
                <ul className="space-y-1.5 text-xs text-akar-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Syarat serapan lokal min. 70%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Deteksi tumpang tindih tim/NIK</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>AI merangkum, kades memilih</span>
                  </li>
                </ul>
              </div>
            </Card>

            {/* R - Realisasi */}
            <Card className="group flex flex-col justify-between border-akar-border/80 shadow-xs bg-white/95 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default rounded-2xl h-full p-5 sm:p-6">
              <div className="space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-akar-primary-hover text-white font-black text-xl shadow-xs transition-transform duration-300 group-hover:scale-105">
                  R
                </div>
                <div>
                  <span className="text-akar-muted font-semibold tracking-wider text-[11px] uppercase">
                    Pilar 4
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-akar-ink group-hover:text-akar-primary transition-colors">
                    Realisasi Berbukti
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-akar-muted leading-relaxed">
                  Laporan progres mingguan berfoto metadata EXIF. Termin (0%, 50%, 100%) hanya dicairkan bila progres diverifikasi pengawas independen.
                </p>
              </div>

              <div className="border-t border-akar-border/60 pt-3.5 mt-5 space-y-2">
                <div className="text-xs font-semibold text-akar-ink">
                  Mekanisme:
                </div>
                <ul className="space-y-1.5 text-xs text-akar-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Foto laporan bertimestamp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Termin terkunci sebelum progres cukup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Tiket audit terbuka pasca-proyek</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 4: PROYEK TERBARU & IDE POPULER                                     */}
      {/* ========================================================================= */}
      <section
        id="slide-proyek-ide"
        aria-label="Sayembara dan Aspirasi Warga"
        className="min-h-screen lg:h-screen w-full lg:snap-start flex flex-col justify-center items-center relative p-4 sm:p-6 lg:p-8 py-16 lg:py-0 bg-white border-b border-akar-border/80"
      >
        <LandingProjectsIdeas
          projects={mockRecentProjects}
          ideas={mockPopularIdeas}
        />
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 5: OPEN DATA / BUKU KAS CTA & FOOTER                                */}
      {/* ========================================================================= */}
      <section
        id="slide-footer"
        aria-label="Data Terbuka dan Informasi Platform"
        className="min-h-screen w-full lg:snap-start flex flex-col justify-between items-center relative pt-16 sm:pt-20 bg-stone-50"
      >
        <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center my-auto px-4 sm:px-6 lg:px-8 mb-12">
          {/* Top Banner Callout */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-akar-primary to-akar-primary-hover p-6 sm:p-8 text-white shadow-lg mb-6 sm:mb-8">
            {/* Subtle Grid / Dot SVG Background Overlay */}
            <svg
              className="absolute inset-0 h-full w-full opacity-10 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="cta-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="currentColor" className="text-white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cta-dots)" />
            </svg>

            {/* Ambient Inner Glow */}
            <div
              aria-hidden="true"
              className="absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-400/15 blur-2xl pointer-events-none"
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Akses Data Anggaran &amp; Buku Kas Kapan Saja
                </h3>
                <p className="text-emerald-100/90 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed">
                  Semua transaksi APBDes dan dokumentasi proyek dapat diunduh dalam format terbuka (CSV/JSON)
                  tanpa registrasi untuk riset, audit, maupun pengawasan warga.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                <Link href="/kas" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-h-[44px] bg-akar-accent hover:bg-akar-accent-hover text-akar-ink font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4 text-akar-ink" />
                    <span>Buku Kas Publik</span>
                  </Button>
                </Link>
                <Link href="/data" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto min-h-[44px] bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center gap-2"
                  >
                    <Database className="h-4 w-4 text-white" />
                    <span>Unduh Data CSV</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Three Information Cards Refactor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Tentang Platform AKAR */}
            <div className="bg-white border border-akar-border/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-akar-ink mb-2">
                  Tentang Platform AKAR
                </h4>
                <p className="text-xs sm:text-sm text-akar-muted leading-relaxed">
                  Platform transparansi dana desa dan bursa kerja sayembara swakelola warga yang memastikan setiap rupiah terdistribusi secara adil, akuntabel, dan bebas manipulasi.
                </p>
              </div>
              <div className="pt-4 border-t border-akar-border/60 mt-3">
                <Link
                  href="#slide-filosofi"
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-akar-primary"
                >
                  <span className="relative">
                    Pelajari Filosofi AKAR
                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-akar-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Card 2: Dasar Hukum & Regulasi */}
            <div className="bg-white border border-akar-border/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-akar-ink mb-3">
                  Dasar Hukum &amp; Regulasi
                </h4>
                <div className="space-y-2">
                  <div className="bg-stone-100 text-akar-ink text-xs px-2.5 py-1.5 rounded-md flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Permendes PDT 16/2025 (Pola PKTD)</span>
                  </div>
                  <div className="bg-stone-100 text-akar-ink text-xs px-2.5 py-1.5 rounded-md flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>Perpres &amp; LKPP 12/2019 (Pengadaan Desa)</span>
                  </div>
                  <div className="bg-stone-100 text-akar-ink text-xs px-2.5 py-1.5 rounded-md flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>PMK 7/2026 (Penyaluran &amp; KDMP)</span>
                  </div>
                  <div className="bg-stone-100 text-akar-ink text-xs px-2.5 py-1.5 rounded-md flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-akar-primary shrink-0" />
                    <span>UU No. 27/2022 (Privasi NIK &amp; Pelapor)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pemerintah Desa & Pengawas */}
            <div className="bg-white border border-akar-border/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-akar-ink mb-2">
                  Pemerintah Desa &amp; Pengawas
                </h4>
                <p className="text-xs sm:text-sm text-akar-muted leading-relaxed mb-3">
                  Pemerintah Desa Karang Sari bersama Badan Permusyawaratan Desa (BPD) selaku pengawas independen.
                </p>
                <div className="space-y-1.5 text-xs text-akar-muted">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-akar-earth shrink-0" />
                    <span>Kecamatan Harapan, Kabupaten Contoh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-akar-earth shrink-0" />
                    <span className="font-medium text-akar-ink">aspirasi@karangsari.desa.id</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-akar-border/60 mt-3">
                <Link
                  href="/tiket"
                  className="group inline-flex items-center gap-1.5 text-xs font-semibold text-akar-primary"
                >
                  <span className="relative">
                    Lacak Tiket Aduan
                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-akar-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Global Standardized Footer Component */}
        <Footer />
      </section>
    </div>
  );
}
