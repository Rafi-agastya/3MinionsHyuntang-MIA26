"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  MapPin,
  Calendar,
  Clock,
  FilePlus,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectDetailData } from "./types";

interface ProjectDetailHeaderProps {
  proyek: ProjectDetailData;
  onOpenAjukan?: () => void;
}

export function ProjectDetailHeader({
  proyek,
  onOpenAjukan,
}: ProjectDetailHeaderProps) {
  const [copied, setCopied] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenModal = () => {
    if (onOpenAjukan) {
      onOpenAjukan();
    } else {
      setIsModalOpen(true);
    }
  };

  const getStatusBadge = () => {
    switch (proyek.status) {
      case "TENDER_DIBUKA":
        return (
          <Badge
            variant="default"
            className="gap-1.5 py-1 px-3 text-xs sm:text-sm font-semibold"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-akar-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-akar-primary"></span>
            </span>
            Tender Dibuka
          </Badge>
        );
      case "PENGERJAAN":
        return (
          <Badge
            variant="earth"
            className="py-1 px-3 text-xs sm:text-sm font-semibold"
          >
            Tahap Pengerjaan
          </Badge>
        );
      case "SELEKSI":
        return (
          <Badge
            variant="accent"
            className="py-1 px-3 text-xs sm:text-sm font-semibold"
          >
            Tahap Seleksi
          </Badge>
        );
      case "SELESAI":
        return (
          <Badge
            variant="default"
            className="py-1 px-3 text-xs sm:text-sm font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-akar-primary" />
            Proyek Selesai
          </Badge>
        );
      case "PEMATANGAN":
        return (
          <Badge
            variant="neutral"
            className="py-1 px-3 text-xs sm:text-sm font-semibold"
          >
            Pematangan RAB
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="py-1 px-3 text-xs sm:text-sm">
            {proyek.status}
          </Badge>
        );
    }
  };

  const getJalurBadge = () => {
    if (proyek.jalur === "SAYEMBARA") {
      return (
        <Badge variant="earth" className="font-semibold py-1 px-2.5">
          <Sparkles className="w-3 h-3 text-akar-earth mr-1" />
          Sayembara Swakelola
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="font-semibold py-1 px-2.5">
        Vendor Pihak Ketiga
      </Badge>
    );
  };

  const getKelasLabel = () => {
    switch (proyek.kelas) {
      case "KECIL":
        return "Kelas Kecil (≤ Rp100 Jt)";
      case "MENENGAH":
        return "Kelas Menengah (≤ Rp200 Jt)";
      case "BESAR":
        return "Kelas Besar (> Rp200 Jt)";
      default:
        return "Sayembara Desa";
    }
  };

  const getProjectImage = () => {
    if (proyek.id.includes("002") || proyek.judul.toLowerCase().includes("balai")) {
      return "/proyek/balai-warga.jpg";
    }
    if (
      proyek.id.includes("003") ||
      proyek.judul.toLowerCase().includes("jalan") ||
      proyek.judul.toLowerCase().includes("paving")
    ) {
      return "/proyek/jalan-desa.jpg";
    }
    return "/proyek/drainase.jpg";
  };
  const projectImage = getProjectImage();

  return (
    <>
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-akar-muted flex-wrap"
        >
          <Link
            href="/proyek"
            className="flex items-center gap-1 hover:text-akar-primary transition-colors focus:outline-none focus-visible:underline"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Proyek</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <Link
            href="/proyek"
            className="hover:text-akar-primary transition-colors focus:outline-none focus-visible:underline"
          >
            <span>Sayembara Swakelola</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span
            className="text-akar-ink font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-md"
            title={proyek.judul}
          >
            {proyek.judul}
          </span>
        </nav>

        {/* Main Header Container with Project Thumbnail */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left 8 Cols: Badges, Title, Metadata & Actions */}
            <div className="lg:col-span-8 space-y-4">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge()}
                {getJalurBadge()}
                <Badge variant="outline" className="text-xs">
                  {getKelasLabel()}
                </Badge>
                <Badge variant="neutral" className="text-xs">
                  {proyek.sumberDana}
                </Badge>
              </div>

              {/* Project Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-akar-ink tracking-tight leading-tight">
                {proyek.judul}
              </h1>

              {/* Project Metadata */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-akar-muted pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-akar-earth shrink-0" />
                  <span>{proyek.lokasi}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>Diumumkan: {proyek.tanggalPublikasi}</span>
                </div>
                {proyek.status === "TENDER_DIBUKA" && (
                  <div className="flex items-center gap-1.5 text-akar-primary font-medium">
                    <Clock className="w-4 h-4 text-akar-primary shrink-0" />
                    <span>
                      Batas Proposal: {proyek.tenggatProposal} ({proyek.tenggatHari} hari tersisa)
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {proyek.status === "TENDER_DIBUKA" && (
                  <Button
                    variant="default"
                    size="default"
                    onClick={handleOpenModal}
                    className="gap-2 shadow-sm font-semibold min-h-[44px]"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Ajukan Proposal Warga</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="default"
                  asChild
                  className="gap-2 min-h-[44px]"
                >
                  <a
                    href="#project-tabs-section"
                    onClick={(e) => {
                      const el = document.getElementById("project-tabs-section");
                      if (el) {
                        e.preventDefault();
                        el.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    <Download className="w-4 h-4 text-akar-muted" />
                    <span>Unduh KAK</span>
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  aria-label="Bagikan Tautan Proyek"
                  className="relative min-h-[44px] min-w-[44px]"
                  title="Salin tautan proyek"
                >
                  <Share2 className="w-4 h-4 text-akar-muted" />
                  {copied && (
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-akar-ink text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                      Tersalin!
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Right 4 Cols: Project Photo Thumbnail */}
            <div className="lg:col-span-4 w-full">
              <div className="relative w-full h-52 sm:h-60 lg:h-64 rounded-2xl overflow-hidden border border-zinc-200/80 shadow-xs group">
                <Image
                  src={projectImage}
                  alt={proyek.judul}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 360px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#1F6F43] text-[10px] font-bold uppercase tracking-wider mb-1">
                    Dokumentasi Lapangan
                  </span>
                  <p className="text-xs font-semibold text-white/95 truncate">
                    {proyek.lokasi}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Information Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-akar-border space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-akar-primary uppercase tracking-wider">
                  Sayembara Swakelola Warga
                </span>
                <h3 className="text-lg font-bold text-akar-ink mt-0.5">
                  Petunjuk Pengajuan Proposal
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-stone-400 hover:text-akar-ink hover:bg-stone-100 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-akar-muted leading-relaxed">
              <div className="rounded-xl bg-akar-primary-light/50 border border-akar-primary/20 p-3.5 space-y-2 text-akar-ink">
                <div className="font-semibold text-xs text-akar-primary flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Ketentuan Partisipasi Swakelola:</span>
                </div>
                <ul className="space-y-1.5 pl-1 text-xs">
                  <li className="flex items-start gap-1.5">
                    <span className="text-akar-primary font-bold">•</span>
                    <span>
                      Kelompok warga wajib memiliki struktur pengurus (Ketua & Anggota) yang disahkan TPK atau pengurus RT.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-akar-primary font-bold">•</span>
                    <span>
                      Minimal <strong>70% anggota pekerja</strong> wajib merupakan warga ber-KTP Desa Karang Sari.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-akar-primary font-bold">•</span>
                    <span>
                      Satu orang warga <strong>tidak diperbolehkan</strong> terdaftar di lebih dari satu kelompok penawar pada proyek yang sama.
                    </span>
                  </li>
                </ul>
              </div>

              <p>
                Silakan siapkan dokumen proposal teknis dan rincian penawaran biaya Anda. Anda dapat menyerahkan berkas langsung ke Sekretariat TPK di Balai Desa Karang Sari sebelum <strong>{proyek.tenggatProposal}</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Tutup
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setIsModalOpen(false);
                  const el = document.getElementById("project-tabs-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pelajari Micro-RAB & Ketentuan</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
