"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  FileSpreadsheet,
  UsersRound,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Layers,
  ArrowRight,
  Receipt,
  Lock,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectDetailData, formatRupiah } from "./types";
import { ModalSanggahan } from "./modal-sanggahan";

interface ProjectTabsProps {
  proyek: ProjectDetailData;
  initialTab?: "proposal" | "ringkasan" | "rab" | "audit";
}

export function ProjectTabs({
  proyek,
  initialTab = "proposal",
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = React.useState<
    "proposal" | "ringkasan" | "rab" | "audit"
  >(initialTab);

  // Expanded proposal details tracking
  const [expandedProposal, setExpandedProposal] = React.useState<
    Record<string, boolean>
  >({
    [proyek.proposals[0]?.id || ""]: true, // Expand highest ranked by default
  });

  // Modal Sanggahan State
  const [isSanggahanModalOpen, setIsSanggahanModalOpen] = React.useState(false);
  const [selectedProposalForSanggah, setSelectedProposalForSanggah] = React.useState<string | undefined>(undefined);

  const toggleExpandProposal = (id: string) => {
    setExpandedProposal((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalRabSubtotal = proyek.rabItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );

  return (
    <div id="project-tabs-section" className="space-y-6">
      {/* ========================================================================= */}
      {/* TAB NAVIGATION HEADER (4 TABS)                                           */}
      {/* ========================================================================= */}
      <div className="border border-zinc-200/80 bg-white rounded-2xl shadow-2xs p-1.5 sm:p-2">
        <nav
          className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none"
          aria-label="Tabs Navigasi Proyek"
        >
          {/* Tab 1: Papan Skor AI Proposal */}
          <button
            type="button"
            onClick={() => setActiveTab("proposal")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px]",
              activeTab === "proposal"
                ? "bg-[#1F6F43] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <UsersRound className="w-4 h-4 shrink-0" />
            <span>Papan Skor AI Proposal</span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                activeTab === "proposal"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-100 text-zinc-700"
              )}
            >
              {proyek.proposals.length}
            </span>
          </button>

          {/* Tab 2: Rincian Teknis & Spesifikasi */}
          <button
            type="button"
            onClick={() => setActiveTab("ringkasan")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px]",
              activeTab === "ringkasan"
                ? "bg-[#1F6F43] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Rincian Teknis &amp; Spesifikasi</span>
          </button>

          {/* Tab 3: Rincian Anggaran (Micro-RAB) */}
          <button
            type="button"
            onClick={() => setActiveTab("rab")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px]",
              activeTab === "rab"
                ? "bg-[#1F6F43] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Rincian Anggaran (Micro-RAB)</span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                activeTab === "rab"
                  ? "bg-white/20 text-white"
                  : "bg-zinc-100 text-zinc-700"
              )}
            >
              {proyek.rabItems.length}
            </span>
          </button>

          {/* Tab 4: Jejak Audit & Timeline Termin */}
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[44px]",
              activeTab === "audit"
                ? "bg-[#1F6F43] text-white shadow-xs"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Jejak Audit &amp; Timeline Termin</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PAPAN SKOR AI PROPOSAL (FITUR UTAMA MILESTONE T1)                   */}
      {/* ========================================================================= */}
      {activeTab === "proposal" && (
        <div className="space-y-6">
          {/* Masa Sanggah Banner (Jika status proyek adalah MASA_SANGGAH) */}
          {proyek.status === "MASA_SANGGAH" && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-amber-950 text-base">
                      Tahap Masa Sanggah Resmi Terbuka (3 Hari Kalender)
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                      Masa Sanggah Aktif
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-900/80 mt-1 leading-relaxed max-w-2xl">
                    Calon pelaksana sementara telah diumumkan. Pokmas peserta yang berkeberatan terhadap hasil evaluasi berhak menyampaikan sanggahan resmi disertai bukti/argumen sebelum keputusan definitif disahkan oleh Kepala Desa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProposalForSanggah(undefined);
                  setIsSanggahanModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs shrink-0 w-full sm:w-auto"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Ajukan Sanggahan Resmi</span>
              </button>
            </div>
          )}

          {/* Header Banner Penjelasan Skor AI */}
          <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white border border-emerald-200/70 text-[#1F6F43] shadow-2xs">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                    Papan Skor AI Proposal Sayembara Warga
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
                    Evaluasi matematis transparan sesuai formula standar terbuka tanpa bias subyektif.
                  </p>
                </div>
              </div>

              <Link
                href="/proyek/panduan"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6F43] hover:underline self-start sm:self-auto shrink-0 min-h-[44px]"
              >
                <span>Pelajari Bobot Penilaian &rarr;</span>
              </Link>
            </div>

            {/* Bobot Metrik Indicator Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-200/50 text-xs">
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                <span className="text-zinc-500 font-medium block">1. Efisiensi Biaya</span>
                <span className="text-sm font-bold text-[#1F6F43]">Bobot 40%</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                <span className="text-zinc-500 font-medium block">2. Tenaga Kerja Lokal</span>
                <span className="text-sm font-bold text-[#1F6F43]">Bobot 30%</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                <span className="text-zinc-500 font-medium block">3. Rasionalitas Jadwal</span>
                <span className="text-sm font-bold text-[#1F6F43]">Bobot 20%</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/60">
                <span className="text-zinc-500 font-medium block">4. Kelengkapan Berkas</span>
                <span className="text-sm font-bold text-[#1F6F43]">Bobot 10%</span>
              </div>
            </div>
          </div>

          {/* Proposals Ranking Cards List */}
          <div className="space-y-4">
            {proyek.proposals.map((prop, idx) => {
              const isExpanded = !!expandedProposal[prop.id];
              const rank = idx + 1;
              const isRank1 = rank === 1;
              const hasFlags = prop.flagsDetail && prop.flagsDetail.length > 0;

              return (
                <div
                  key={prop.id}
                  className={cn(
                    "rounded-2xl transition-all duration-200 bg-white shadow-2xs overflow-hidden",
                    isRank1
                      ? "border-2 border-emerald-600 bg-emerald-50/15"
                      : "border border-zinc-200/80 hover:border-zinc-300"
                  )}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header: Rank, Group Name, Score */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-zinc-100">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5",
                              isRank1
                                ? "bg-emerald-600 text-white shadow-xs"
                                : rank === 2
                                ? "bg-amber-100 text-[#8A5A2B] font-semibold border border-amber-200"
                                : "bg-zinc-100 text-zinc-600 font-semibold"
                            )}
                          >
                            {isRank1 && <Sparkles className="w-3.5 h-3.5 text-white" />}
                            <span>Peringkat #{rank} {isRank1 && "• Skor Tertinggi AI"}</span>
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            ID: {prop.id}
                          </span>
                        </div>

                        <h4 className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug">
                          {prop.namaKelompok}
                        </h4>

                        <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-[#1F6F43]" />
                          <span>Ketua Kelompok: <strong className="text-zinc-800">{prop.ketua}</strong></span>
                        </p>
                      </div>

                      {/* Score Highlight Box */}
                      <div
                        className={cn(
                          "flex items-center sm:flex-col sm:items-end justify-between sm:justify-center rounded-2xl p-4 sm:px-5 sm:py-3 shrink-0",
                          isRank1
                            ? "bg-emerald-100/70 border border-emerald-300 text-emerald-900"
                            : "bg-zinc-50 border border-zinc-200/80 text-zinc-800"
                        )}
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">
                          Total Skor AI
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl sm:text-3xl font-extrabold text-[#1F6F43] tracking-tight">
                            {prop.skor.total.toFixed(1)}
                          </span>
                          <span className="text-xs font-semibold text-zinc-400">
                            / 100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick 4-Column Metrics of Proposal */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Penawaran vs Pagu */}
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <span className="text-zinc-500 block font-medium">Nilai Penawaran</span>
                        <span className="font-mono text-sm font-bold text-zinc-900 block mt-0.5">
                          {formatRupiah(prop.penawaran)}
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5">
                          ({Math.round((prop.penawaran / proyek.pagu) * 100)}% dari pagu)
                        </span>
                      </div>

                      {/* Serapan Lokal */}
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <span className="text-zinc-500 block font-medium">Tenaga Kerja Lokal</span>
                        <span className="text-sm font-bold text-zinc-900 block mt-0.5">
                          {prop.tenagaLokal} / {prop.tenagaTotal} warga
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-bold block mt-0.5",
                            prop.persentaseLokal >= 70
                              ? "text-emerald-700"
                              : "text-red-600"
                          )}
                        >
                          {prop.persentaseLokal}% (Target ≥ 70%)
                        </span>
                      </div>

                      {/* Durasi */}
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <span className="text-zinc-500 block font-medium">Durasi Pelaksanaan</span>
                        <span className="text-sm font-bold text-zinc-900 block mt-0.5">
                          {prop.durasiHari} Hari Kalender
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5">
                          Batas: {proyek.durasiMin}–{proyek.durasiMax} Hari
                        </span>
                      </div>

                      {/* Integritas */}
                      <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                        <span className="text-zinc-500 block font-medium">Uji Integritas AI</span>
                        {hasFlags ? (
                          <span className="font-bold text-xs text-amber-700 flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{prop.flagsDetail.length} Catatan Review</span>
                          </span>
                        ) : (
                          <span className="font-bold text-xs text-emerald-700 flex items-center gap-1 mt-1">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Lolos Uji Integritas</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Flags Alerts if Present */}
                    {hasFlags && (
                      <div className="space-y-2 pt-1">
                        {prop.flagsDetail.map((fl, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-start gap-2.5 rounded-xl p-3 text-xs leading-relaxed border bg-amber-50/80 border-amber-200 text-amber-900"
                          >
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                            <div>
                              <strong className="font-bold mr-1">
                                {fl.label}:
                              </strong>
                              <span>{fl.deskripsi}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expand/Collapse Toggle Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpandProposal(prop.id)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
                      >
                        <span>
                          {isExpanded
                            ? "Sembunyikan Rincian Sub-Skor & Analisis AI"
                            : "Lihat Rincian Sub-Skor & Ringkasan Analisis AI"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                    </div>

                    {/* Collapsible Details: Score Breakdown + AI Analysis */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-zinc-100 space-y-5 animate-in fade-in duration-200">
                        {/* 1. Score Breakdown Bars */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-[#1F6F43]" />
                            <span>Rincian Nilai 4 Indikator Algoritma:</span>
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Biaya */}
                            <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 space-y-1.5">
                              <div className="flex justify-between font-semibold">
                                <span className="text-zinc-600">1. Efisiensi Biaya (40%)</span>
                                <span className="font-mono font-bold text-zinc-900">
                                  {prop.skor.rincian.harga.toFixed(1)} / 40.0
                                </span>
                              </div>
                              <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#1F6F43] h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${(prop.skor.rincian.harga / 40) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Tenaga Kerja Lokal */}
                            <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 space-y-1.5">
                              <div className="flex justify-between font-semibold">
                                <span className="text-zinc-600">2. Tenaga Kerja Lokal (30%)</span>
                                <span className="font-mono font-bold text-zinc-900">
                                  {prop.skor.rincian.tenagaLokal.toFixed(1)} / 30.0
                                </span>
                              </div>
                              <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-700",
                                    prop.skor.rincian.tenagaLokal >= 25
                                      ? "bg-[#1F6F43]"
                                      : "bg-red-500"
                                  )}
                                  style={{
                                    width: `${(prop.skor.rincian.tenagaLokal / 30) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Rasionalitas Jadwal */}
                            <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 space-y-1.5">
                              <div className="flex justify-between font-semibold">
                                <span className="text-zinc-600">3. Rasionalitas Jadwal (20%)</span>
                                <span className="font-mono font-bold text-zinc-900">
                                  {prop.skor.rincian.durasi.toFixed(1)} / 20.0
                                </span>
                              </div>
                              <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#8A5A2B] h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${(prop.skor.rincian.durasi / 20) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Kelengkapan Berkas */}
                            <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 space-y-1.5">
                              <div className="flex justify-between font-semibold">
                                <span className="text-zinc-600">4. Kelengkapan Berkas (10%)</span>
                                <span className="font-mono font-bold text-zinc-900">
                                  {prop.skor.rincian.pengalaman.toFixed(1)} / 10.0
                                </span>
                              </div>
                              <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${(prop.skor.rincian.pengalaman / 10) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. AI Review Box */}
                        {prop.ringkasanAi && (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                                <Sparkles className="w-4 h-4 text-[#1F6F43] shrink-0" />
                                <span>Analisis Asisten AI AKAR (Evaluator Obyektif)</span>
                              </div>
                              <span className="text-[11px] text-zinc-600 font-mono bg-white px-2 py-0.5 rounded border border-zinc-200">
                                Model: {prop.ringkasanAi.model}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium italic">
                              &ldquo;{prop.ringkasanAi.ringkasanEksekutif}&rdquo;
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                              {/* Strengths */}
                              <div className="bg-white rounded-xl p-3 border border-emerald-200/80 space-y-2">
                                <span className="font-bold text-[#1F6F43] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  <span>Poin Kekuatan Proposal:</span>
                                </span>
                                <ul className="space-y-1 text-zinc-700">
                                  {prop.ringkasanAi.poinKekuatan.map((poin, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-[#1F6F43] font-bold">•</span>
                                      <span>{poin}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Points of Concern */}
                              <div className="bg-white rounded-xl p-3 border border-amber-200/80 space-y-2">
                                <span className="font-bold text-amber-800 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Poin Perhatian &amp; Mitigasi:</span>
                                </span>
                                <ul className="space-y-1 text-zinc-700">
                                  {prop.ringkasanAi.poinPerhatian.map((poin, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-amber-700 font-bold">•</span>
                                      <span>{poin}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="text-xs text-zinc-600 pt-2 border-t border-emerald-200/40">
                              <strong className="text-zinc-800">Catatan Rekomendasi untuk BPD:</strong>{" "}
                              {prop.ringkasanAi.rekomendasiCatatan}
                            </div>

                            {/* Teks Wajib PRD 36.5 */}
                            <p className="text-[11px] text-zinc-500 italic pt-2 border-t border-emerald-200/50 leading-relaxed">
                              Ringkasan otomatis. Rujuk dokumen asli. Skor dihitung dengan aturan yang bisa diperiksa; keputusan akhir ada pada pemerintah desa.
                            </p>
                          </div>
                        )}

                        {/* 3. Narratives & Files */}
                        <div className="space-y-2 text-xs pt-1">
                          <h6 className="font-bold text-zinc-900">Uraian Teknis &amp; Mitigasi Risiko:</h6>
                          <div className="rounded-xl bg-zinc-50 p-3.5 space-y-2 text-zinc-600 border border-zinc-200/70 leading-relaxed">
                            <p>
                              <strong className="text-zinc-900">Metode Pelaksanaan:</strong>{" "}
                              {prop.narasiMetode}
                            </p>
                            <p>
                              <strong className="text-zinc-900">Jadwal Kerja:</strong>{" "}
                              {prop.narasiJadwal}
                            </p>
                            <p>
                              <strong className="text-zinc-900">Mitigasi Risiko Genangan/Hujan:</strong>{" "}
                              {prop.narasiRisiko}
                            </p>
                          </div>
                        </div>

                        {/* Attached Docs */}
                        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                          <span className="text-zinc-500 font-medium">Berkas Dokumen Terlampir:</span>
                          {prop.dokumen.map((doc, dIdx) => (
                            <span
                              key={dIdx}
                              className="inline-flex items-center gap-1 text-[11px] font-mono bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-lg border border-zinc-200"
                            >
                              <FileText className="w-3 h-3 text-[#1F6F43]" />
                              <span>{doc}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Sanggahan CTA if in MASA_SANGGAH */}
                    {proyek.status === "MASA_SANGGAH" && (
                      <div className="pt-2 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProposalForSanggah(prop.id);
                            setIsSanggahanModalOpen(true);
                          }}
                          className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5 min-h-[38px]"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                          <span>Ajukan Sanggahan atas Proposal Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action CTA */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="text-base font-bold text-zinc-900">
                Punya Kelompok Pertukangan Warga di Desa Karang Sari?
              </h4>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-xl">
                Ajukan usulan proposal sebelum batas waktu tender ditutup. Penilaian diumumkan transparan kepada seluruh warga.
              </p>
            </div>

            <Link
              href={`/proyek/${proyek.id}/ajukan`}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 rounded-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold transition-all shadow-xs shrink-0 w-full sm:w-auto"
            >
              <span>Ajukan Usulan Proposal Baru</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RINCIAN TEKNIS & SPESIFIKASI                                       */}
      {/* ========================================================================= */}
      {activeTab === "ringkasan" && (
        <div className="space-y-6">
          {/* Main Description */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-[#1F6F43] font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>Deskripsi &amp; Latar Belakang Proyek</span>
            </div>
            <p className="text-sm sm:text-base text-zinc-800 leading-relaxed">
              {proyek.deskripsi}
            </p>

            {/* Rationale for Sayembara Jalur */}
            <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-[#8A5A2B] font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#8A5A2B] shrink-0" />
                <span>Mengapa Menggunakan Sayembara Swakelola Warga?</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                {proyek.alasanJalur}
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-white text-[#8A5A2B] font-semibold border border-amber-200 text-xs">
                  Padat Karya Tunai Desa (PKTD)
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#8A5A2B] font-semibold border border-amber-200 text-xs">
                  Min. 70% Pekerja Lokal
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#8A5A2B] font-semibold border border-amber-200 text-xs">
                  Pengawasan Terbuka BPD
                </span>
              </div>
            </div>
          </div>

          {/* Scope & Technical Specs */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 text-[#1F6F43] font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Ruang Lingkup &amp; Ketentuan Teknis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs sm:text-sm">
              <div className="rounded-xl border border-zinc-200/80 p-4 bg-zinc-50/60 space-y-1.5">
                <div className="font-semibold text-zinc-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1F6F43] flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Pekerjaan Galian &amp; Pembersihan</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed pl-7">
                  Galian tanah saluran sepanjang 350 meter dengan kedalaman rerata 60-80 cm, lebar 50 cm. Pembuangan dan perapian sisa tanah galian di kiri-kanan badan jalan.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 p-4 bg-zinc-50/60 space-y-1.5">
                <div className="font-semibold text-zinc-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1F6F43] flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Pasangan Batu Kali Campuran Mortar</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed pl-7">
                  Konstruksi pasangan batu belah tipe 1:4 berkualitas baik, kokoh menahan beban lateral tanah, dan bebas dari rongga kosong antar batu kali.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 p-4 bg-zinc-50/60 space-y-1.5">
                <div className="font-semibold text-zinc-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1F6F43] flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Plesteran Kedap Air &amp; Siaran</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed pl-7">
                  Plesteran acian kedap air ketebalan minimum 15mm pada dinding dalam saluran untuk memastikan kelancaran debit air dan mencegah rembesan ke pondasi rumah warga.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200/80 p-4 bg-zinc-50/60 space-y-1.5">
                <div className="font-semibold text-zinc-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#1F6F43] flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Pengujian Alir &amp; Berita Acara</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed pl-7">
                  Uji coba pengaliran air sebelum serah terima pekerjaan dan penandatanganan Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP) bersama BPD.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RINCIAN ANGGARAN (MICRO-RAB)                                       */}
      {/* ========================================================================= */}
      {activeTab === "rab" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#1F6F43] shrink-0" />
                  <span>Rincian Micro-RAB Terbuka (Harga Perkiraan Sendiri)</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  Transparansi volume pekerjaan dan estimasi standar biaya bahan/upah
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-[#1F6F43] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
                Pagu APBDes: {formatRupiah(proyek.pagu)}
              </span>
            </div>

            {/* Clean Micro-RAB Table without nested borders */}
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-2xs mt-3">
              <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-zinc-50/90 border-b border-zinc-200 text-zinc-700 font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Uraian Pekerjaan &amp; Bahan</th>
                    <th className="py-3.5 px-4 text-right">Volume</th>
                    <th className="py-3.5 px-4 text-center">Satuan</th>
                    <th className="py-3.5 px-4 text-right">Harga Satuan (Rp)</th>
                    <th className="py-3.5 px-4 text-right">Subtotal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {proyek.rabItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-zinc-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {item.uraian}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-800">
                        {item.volume.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-500">
                        {item.satuan}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-800">
                        {formatRupiah(item.hargaSatuan)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-200">
                    <td colSpan={5} className="py-4 px-4 text-right text-xs sm:text-sm text-zinc-700 uppercase">
                      Total Pagu Anggaran Rencana (Micro-RAB):
                    </td>
                    <td className="py-4 px-4 text-right text-sm sm:text-base font-mono text-[#1F6F43] font-extrabold">
                      {formatRupiah(totalRabSubtotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Explanatory Notice */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 text-xs text-zinc-600 leading-relaxed space-y-1">
              <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#1F6F43]" />
                <span>Pedoman Penawaran Sayembara Warga:</span>
              </div>
              <p>
                1. Penawaran harga total dari kelompok swakelola <strong>tidak boleh melampaui Pagu Anggaran {formatRupiah(proyek.pagu)}</strong>.
              </p>
              <p>
                2. Efisiensi penawaran harga dinilai dengan formula standar terbuka (bobot 40%), namun penawaran yang terlalu rendah di bawah ambang wajar (&lt; 70% pagu) akan dievaluasi ketat untuk mencegah penurunan mutu material.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: JEJAK AUDIT & TIMELINE TERMIN                                      */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-7 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1F6F43] shrink-0" />
                  <span>Jejak Audit &amp; Timeline Pencairan Termin</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  Verifikasi fisik bertahap dan pencatatan aliran kas digital append-only
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1F6F43] text-xs font-semibold border border-emerald-200/70 self-start sm:self-auto">
                <Lock className="w-3.5 h-3.5" />
                <span>SHA-256 Verified Ledger</span>
              </span>
            </div>

            {/* Klausul Pencairan Dana */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs text-zinc-600 leading-relaxed">
              <strong>Klausul Pencairan Dana:</strong> &ldquo;AKAR mencatat dan menampilkan status termin. AKAR tidak mencairkan dana; pencairan mengikuti prosedur resmi pemerintah desa.&rdquo;
            </div>

            {/* Jika proyek BELUM dalam tahap konstruksi (misal masih TENDER_DIBUKA, SELEKSI, PEMATANGAN): */}
            {/* Isinya dikosongkan dengan empty state bersih, tidak ada transaksi Termin 1 fiktif */}
            {proyek.status !== "PENGERJAAN" && proyek.status !== "SELESAI" ? (
              <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mx-auto">
                  <Clock className="w-6 h-6 text-zinc-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-zinc-800">
                    Belum Ada Catatan Audit Pencairan Dana
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-500 max-w-lg mx-auto leading-relaxed">
                    Proyek saat ini masih berada dalam tahap{" "}
                    <strong className="text-zinc-700">
                      {proyek.status === "PEMATANGAN"
                        ? "Pematangan KAK & Musdes"
                        : "Seleksi Sayembara Swakelola"}
                    </strong>
                    . Pencairan dana Termin I (Uang Muka 50%) baru akan disalurkan dan dicatat ke ledger kas desa setelah penetapan pemenang disahkan dan penandatanganan Surat Perjanjian Kerja (SPK).
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-200/70 text-zinc-700 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Termin Kas Masih Terkunci (Rp 0 Tersalurkan)</span>
                  </span>
                </div>
              </div>
            ) : (
              /* Stepper Pencairan Dana Bertahap untuk PENGERJAAN & SELESAI */
              <div className="space-y-4">
                {/* Termin 1 */}
                <div className="p-4 sm:p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      T1
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">
                          Termin I: Uang Muka Bahan &amp; HOK Awal (50%)
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Tersalurkan
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Pencairan tahap pertama disalurkan langsung ke rekening kelompok setelah penandatanganan SPK dan pakta integritas swakelola.
                      </p>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Ref Mutasi Kas: <code className="text-zinc-700 font-bold">BKK-2026-0006</code> • Disahkan BPD
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="font-mono text-base font-bold text-emerald-700 block">
                      {formatRupiah(proyek.pagu * 0.5)}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">50% dari total pagu</span>
                  </div>
                </div>

                {/* Termin 2 */}
                <div
                  className={cn(
                    "p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    proyek.status === "SELESAI"
                      ? "border-emerald-200/80 bg-emerald-50/30"
                      : "border-zinc-200 bg-zinc-50/60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                        proyek.status === "SELESAI"
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-200 text-zinc-700"
                      )}
                    >
                      T2
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">
                          Termin II: Pelunasan Serah Terima Pekerjaan (50%)
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                            proyek.status === "SELESAI"
                              ? "text-emerald-700 bg-emerald-100/70"
                              : "text-zinc-600 bg-zinc-200/80"
                          )}
                        >
                          {proyek.status === "SELESAI"
                            ? "Tersalurkan (Lunas 100%)"
                            : "Menunggu Opname 100%"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {proyek.status === "SELESAI"
                          ? "Pelunasan pekerjaan fisik telah disalurkan penuh setelah Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP 100%) disahkan."
                          : "Pencairan tahap akhir dicairkan setelah pemeriksaan fisik bersama Tim Teknis BPD dan pengesahan Berita Acara Pemeriksaan Hasil Pekerjaan (BAPHP)."}
                      </p>
                      <div className="text-[11px] text-zinc-500">
                        {proyek.status === "SELESAI" ? (
                          <span className="font-mono">
                            Ref Mutasi Kas: <code className="text-zinc-700 font-bold">BKK-2026-0012</code> • Disahkan BPD
                          </span>
                        ) : (
                          <span>Syarat: Laporan Pertanggungjawaban (LPJ) HOK Warga Lengkap</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span
                      className={cn(
                        "font-mono text-base font-bold block",
                        proyek.status === "SELESAI" ? "text-emerald-700" : "text-zinc-700"
                      )}
                    >
                      {formatRupiah(proyek.pagu * 0.5)}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      {proyek.status === "SELESAI" ? "Sisa 50% pelunasan tuntas" : "Sisa 50% pelunasan"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Link to Buku Kas */}
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-600 border-t border-zinc-100">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#1F6F43]" />
                <span>Lihat riwayat mutasi pembayaran pada buku kas umum desa.</span>
              </span>
              <Link
                href="/kas"
                className="font-semibold text-[#1F6F43] hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Buku Kas &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sanggahan Resmi Sayembara Swakelola */}
      <ModalSanggahan
        isOpen={isSanggahanModalOpen}
        onClose={() => setIsSanggahanModalOpen(false)}
        proyekId={proyek.id}
        proyekJudul={proyek.judul}
        proposals={proyek.proposals.map((p) => ({
          id: p.id,
          namaKelompok: p.namaKelompok,
        }))}
        defaultProposalId={selectedProposalForSanggah}
      />
    </div>
  );
}
