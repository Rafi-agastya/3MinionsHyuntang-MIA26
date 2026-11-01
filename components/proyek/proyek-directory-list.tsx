"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Users,
  Search,
  ArrowRight,
  Building2,
  Calendar,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { ProyekListItem } from "@/lib/proyek-api";

interface ProyekDirectoryListProps {
  initialProyekList: ProyekListItem[];
}

type FilterStatus = "SEMUA" | "TENDER_DIBUKA" | "PENGERJAAN" | "SELESAI";

interface FilterTab {
  value: FilterStatus;
  label: string;
  hasPulse?: boolean;
}

const FILTER_TABS: FilterTab[] = [
  { value: "SEMUA", label: "Semua Proyek" },
  { value: "TENDER_DIBUKA", label: "Sayembara Terbuka", hasPulse: true },
  { value: "PENGERJAAN", label: "Pengerjaan Berjalan" },
  { value: "SELESAI", label: "Selesai & Diaudit" },
];

// Helper to assign high-res real village photos matching context
function getProjectImage(proyek: ProyekListItem): { src: string; alt: string } {
  const judul = proyek.judul.toLowerCase();
  const deskripsi = proyek.deskripsi.toLowerCase();

  if (judul.includes("drainase") || deskripsi.includes("drainase") || deskripsi.includes("saluran")) {
    return {
      src: "/proyek/drainase.jpg",
      alt: "Pengerjaan konstruksi saluran drainase desa",
    };
  }
  if (judul.includes("balai") || deskripsi.includes("balai") || deskripsi.includes("aula")) {
    return {
      src: "/proyek/balai-warga.jpg",
      alt: "Gotong royong renovasi balai pertemuan warga dusun",
    };
  }
  if (judul.includes("jalan") || judul.includes("paving") || deskripsi.includes("paving") || deskripsi.includes("jalan")) {
    return {
      src: "/proyek/jalan-desa.jpg",
      alt: "Pengecoran dan pavingisasi jalan setapak warga",
    };
  }

  return {
    src: "/hero-desa-aerial.jpg",
    alt: "Pemandangan udara infrastruktur desa nusantara",
  };
}

// Helper for status badge styling
function getStatusBadge(status: string) {
  switch (status) {
    case "TENDER_DIBUKA":
      return {
        label: "Sayembara Terbuka",
        badgeClass: "bg-emerald-600 text-white font-semibold",
        hasPulse: true,
        progresPersen: 0,
        terminLabel: "Termin 0% • Seleksi Proposal",
      };
    case "PENGERJAAN":
      return {
        label: "Pengerjaan Berjalan",
        badgeClass: "bg-[#8A5A2B] text-white font-semibold",
        hasPulse: false,
        progresPersen: 50,
        terminLabel: "Termin 50% • Opname Terverifikasi",
      };
    case "SELESAI":
      return {
        label: "Selesai & Diaudit",
        badgeClass: "bg-[#1F6F43] text-white font-semibold",
        hasPulse: false,
        progresPersen: 100,
        terminLabel: "Termin 100% • LPJ Tuntas BPD",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        badgeClass: "bg-zinc-800 text-white font-semibold",
        hasPulse: false,
        progresPersen: 25,
        terminLabel: "Tahap Pematangan",
      };
  }
}

export function ProyekDirectoryList({ initialProyekList }: ProyekDirectoryListProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterStatus>("SEMUA");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredProyek = React.useMemo(() => {
    return initialProyekList.filter((item) => {
      // Filter status
      if (activeFilter !== "SEMUA") {
        if (item.status !== activeFilter) return false;
      }

      // Filter search
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchJudul = item.judul.toLowerCase().includes(query);
        const matchLokasi = item.lokasi.toLowerCase().includes(query);
        const matchDeskripsi = item.deskripsi.toLowerCase().includes(query);
        return matchJudul || matchLokasi || matchDeskripsi;
      }

      return true;
    });
  }, [initialProyekList, activeFilter, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ========================================================================= */}
      {/* 1. FILTER TABS & SEARCH INPUT                                             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills with Touch Target Min 44px */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={`min-h-[44px] px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "bg-[#1F6F43] text-white shadow-sm"
                    : "bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200/80"
                }`}
                aria-pressed={isActive}
              >
                {tab.hasPulse && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? "bg-white animate-pulse" : "bg-emerald-500 animate-pulse"
                    }`}
                  />
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama proyek atau lokasi..."
            className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-white border border-zinc-200/90 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODERN EDITORIAL PROJECT CARDS GRID                                    */}
      {/* ========================================================================= */}
      {filteredProyek.length === 0 ? (
        /* Clean Empty State */
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            Tidak ada proyek yang sesuai filter
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Tidak ditemukan proyek dengan status &quot;
            {FILTER_TABS.find((t) => t.value === activeFilter)?.label}&quot; atau kata kunci pencarian &quot;{searchQuery}&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveFilter("SEMUA");
              setSearchQuery("");
            }}
            className="text-xs font-semibold text-[#1F6F43] hover:underline min-h-[44px] inline-flex items-center"
          >
            Tampilkan Semua Proyek Desa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProyek.map((proyek) => {
            const statusInfo = getStatusBadge(proyek.status);
            const imageInfo = getProjectImage(proyek);
            const jumlahProposal = proyek.proposal?.length ?? 0;

            return (
              <article
                key={proyek.id}
                className="group rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-2xs hover:shadow-md hover:border-[#1F6F43]/50 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Card Top: Photo Thumbnail with Floating Badge */}
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-100">
                    <Image
                      src={imageInfo.src}
                      alt={imageInfo.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Dark Scrim Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Floating Status Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs shadow-xs ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.hasPulse && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Jalur Tag (Sayembara Swakelola) */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-[11px] font-medium border border-white/20">
                        {proyek.jalur ? `Jalur ${proyek.jalur}` : "Sayembara Swakelola"}
                      </span>
                    </div>

                    {/* Location Tag on bottom of image */}
                    <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-1 text-white text-xs font-medium drop-shadow-xs">
                      <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="truncate">{proyek.lokasi}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 group-hover:text-[#1F6F43] transition-colors leading-snug line-clamp-1">
                        {proyek.judul}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                        {proyek.deskripsi}
                      </p>
                    </div>

                    {/* Clean Progress Bar & Termin Label */}
                    <div className="space-y-1.5 pt-1 border-t border-zinc-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-medium">Progres Fisik</span>
                        <span className="font-bold text-zinc-800">{statusInfo.progresPersen}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            statusInfo.progresPersen === 100
                              ? "bg-[#1F6F43]"
                              : statusInfo.progresPersen === 50
                              ? "bg-[#8A5A2B]"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(statusInfo.progresPersen, 4)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-zinc-500 font-medium pt-0.5">
                        {statusInfo.terminLabel}
                      </div>
                    </div>

                    {/* 2-Column Metrics Grid (No Nested Box) */}
                    <div className="pt-3 border-t border-zinc-100 grid grid-cols-2 gap-3 text-xs">
                      {/* Pagu Dana Desa */}
                      <div>
                        <span className="text-zinc-500 font-medium block">Pagu Dana Desa</span>
                        <span className="font-mono text-base font-bold text-[#1F6F43] block mt-0.5">
                          {formatRupiah(proyek.pagu)}
                        </span>
                      </div>

                      {/* Serapan Lokal Target */}
                      <div>
                        <span className="text-zinc-500 font-medium block">Tenaga Kerja Lokal</span>
                        <span className="font-semibold text-zinc-800 flex items-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-[#1F6F43]" />
                          <span>Min. {proyek.syaratLokalMin}% Warga</span>
                        </span>
                      </div>
                    </div>

                    {/* Proposal Status Tag */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Estimasi {proyek.durasiMin}–{proyek.durasiMax} hari</span>
                      </span>
                      <span className="font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                        {jumlahProposal} Proposal Warga
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Action Link Button */}
                <div className="p-5 pt-0">
                  <Link
                    href={`/proyek/${proyek.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-[#1F6F43] text-white font-medium text-xs sm:text-sm transition-colors text-center inline-flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>Lihat Rincian &amp; Papan Skor AI</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
