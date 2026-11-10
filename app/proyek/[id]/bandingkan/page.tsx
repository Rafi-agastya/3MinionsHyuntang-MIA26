"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Home,
  Scale,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Award,
  UsersRound,
  Calendar,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah, ProjectDetailData, StatusProyek } from "@/components/proyek/types";
import { getMockProjectById } from "@/components/proyek/mock-detail-data";
import { useCurrentRole } from "@/lib/use-current-role";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ProyekDataApi {
  id: string;
  judul: string;
  pagu: number | string;
  lokasi?: string;
  status?: StatusProyek;
}

interface ProposalDataApi {
  id: string;
  penawaran: number | string;
  durasiHari?: number;
  tenagaTotal?: number;
  tenagaLokal?: number;
  kelompok?: {
    nama?: string;
    ketua?: { nama?: string };
  };
  skor?: {
    total?: number;
    rincian?: Record<string, number>;
  };
  ringkasan?: {
    ringkasanEksekutif?: string;
    poinKekuatan?: string[];
    poinPerhatian?: string[];
    rekomendasiCatatan?: string;
    model?: string;
  };
  flags?: string[];
}

interface ProposalComparisonItem {
  id: string;
  namaKelompok: string;
  ketua: string;
  penawaran: number;
  durasiHari: number;
  tenagaTotal: number;
  tenagaLokal: number;
  persentaseLokal: number;
  skorTotal: number;
  skorBiaya: number;
  skorLokal: number;
  skorJadwal: number;
  skorDokumen: number;
  ringkasanEksekutif: string;
  poinKekuatan: string[];
  poinPerhatian: string[];
  rekomendasiCatatan: string;
  modelAi: string;
  flags: Array<{ label: string; deskripsi: string; tingkat: "warning" | "danger" | "info" }>;
}

export default function BandingkanProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || "seed_proyek_001";
  const { role, permissions } = useCurrentRole();
  const isInternal = permissions.canManageProjects || role === "PERANGKAT_DESA" || role === "ADMIN";

  // Data Proyek
  const [project, setProject] = React.useState<ProjectDetailData>(() =>
    getMockProjectById(projectId)
  );
  const [proposals, setProposals] = React.useState<ProposalComparisonItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Winner selection modal state
  const [selectedWinnerId, setSelectedWinnerId] = React.useState<string | null>(null);
  const [alasanMenang, setAlasanMenang] = React.useState(
    "Proposal memiliki efisiensi anggaran terbaik, komitmen serapan tenaga kerja lokal warga RT 03 yang tinggi, serta jadwal pelaksanaan yang rasional."
  );
  const [alasanTambahan, setAlasanTambahan] = React.useState("");
  const [isSubmittingWinner, setIsSubmittingWinner] = React.useState(false);
  const [winnerMessage, setWinnerMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null);

  // Fetch proposals from API with mock fallback
  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [projRes, propRes] = await Promise.allSettled([
          apiClient.get<ProyekDataApi>(`/api/proyek/${projectId}`),
          apiClient.get<ProposalDataApi[]>(`/api/proyek/${projectId}/proposal`),
        ]);

        if (isMounted && projRes.status === "fulfilled" && projRes.value.data) {
          const apiProj = projRes.value.data;
          setProject((prev) => ({
            ...prev,
            id: apiProj.id || prev.id,
            judul: apiProj.judul || prev.judul,
            pagu: Number(apiProj.pagu) || prev.pagu,
            lokasi: apiProj.lokasi || prev.lokasi,
            status: apiProj.status || prev.status,
          }));
        }

        let loadedProps: ProposalComparisonItem[] = [];

        if (isMounted && propRes.status === "fulfilled" && Array.isArray(propRes.value.data) && propRes.value.data.length > 0) {
          loadedProps = propRes.value.data.map((p: ProposalDataApi) => {
            const penawaranNum = Number(p.penawaran) || 0;
            const tTotal = p.tenagaTotal || 1;
            const tLokal = p.tenagaLokal || 0;
            const pLokal = tTotal > 0 ? Math.round((tLokal / tTotal) * 100) : 0;
            const rincian = p.skor?.rincian || {};

            return {
              id: p.id,
              namaKelompok: p.kelompok?.nama || "Pokmas Warga",
              ketua: p.kelompok?.ketua?.nama || "Ketua Pokmas",
              penawaran: penawaranNum,
              durasiHari: p.durasiHari || 30,
              tenagaTotal: tTotal,
              tenagaLokal: tLokal,
              persentaseLokal: pLokal,
              skorTotal: p.skor?.total ?? 85,
              skorBiaya: rincian.harga ?? rincian.biaya ?? 35,
              skorLokal: rincian.tenagaLokal ?? rincian.lokal ?? 26,
              skorJadwal: rincian.durasi ?? rincian.jadwal ?? 18,
              skorDokumen: rincian.pengalaman ?? rincian.lengkap ?? 8,
              ringkasanEksekutif:
                p.ringkasan?.ringkasanEksekutif ||
                "Metode kerja padat karya warga dengan pasangan batu mortar standar KAK dan komitmen tenaga kerja lokal tinggi.",
              poinKekuatan: p.ringkasan?.poinKekuatan || [
                "Serapan tenaga kerja warga setempat di atas 70%",
                "Rincian Micro-RAB material lengkap dan wajar",
              ],
              poinPerhatian: p.ringkasan?.poinPerhatian || [
                "Perlu mitigasi genangan air pada musim hujan",
              ],
              rekomendasiCatatan:
                p.ringkasan?.rekomendasiCatatan ||
                "Dapat direkomendasikan sebagai pelaksana swakelola prioritas.",
              modelAi: p.ringkasan?.model || "google/gemini-2.0-flash-exp",
              flags: (p.flags || []).map((f: string) => ({
                label: "Catatan Integritas",
                deskripsi: f,
                tingkat: "warning" as const,
              })),
            };
          });
        }

        // Jika API kosong, gunakan fallback data mock sayembara
        if (loadedProps.length === 0) {
          const fallbackProj = getMockProjectById(projectId);
          loadedProps = fallbackProj.proposals.map((p) => ({
            id: p.id,
            namaKelompok: p.namaKelompok,
            ketua: p.ketua,
            penawaran: p.penawaran,
            durasiHari: p.durasiHari,
            tenagaTotal: p.tenagaTotal,
            tenagaLokal: p.tenagaLokal,
            persentaseLokal: p.persentaseLokal,
            skorTotal: p.skor.total,
            skorBiaya: p.skor.rincian.harga,
            skorLokal: p.skor.rincian.tenagaLokal,
            skorJadwal: p.skor.rincian.durasi,
            skorDokumen: p.skor.rincian.pengalaman,
            ringkasanEksekutif:
              p.ringkasanAi?.ringkasanEksekutif || "Metode padat karya warga desa.",
            poinKekuatan: p.ringkasanAi?.poinKekuatan || ["Tenaga kerja lokal dominan"],
            poinPerhatian: p.ringkasanAi?.poinPerhatian || ["Pengawasan mutu adukan mortar"],
            rekomendasiCatatan:
              p.ringkasanAi?.rekomendasiCatatan || "Lolos batas administratif.",
            modelAi: p.ringkasanAi?.model || "google/gemini-2.0-flash-exp",
            flags: p.flagsDetail || [],
          }));
        }

        // Urutkan berdasarkan skor total tertinggi
        loadedProps.sort((a, b) => b.skorTotal - a.skorTotal);

        if (isMounted) {
          setProposals(loadedProps);
          // Default pilih hingga 4 proposal teratas
          setSelectedIds(loadedProps.slice(0, 4).map((p) => p.id));
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Proposal yang sedang aktif dibandingkan (maks. 4)
  const activeProposals = React.useMemo(() => {
    return proposals.filter((p) => selectedIds.includes(p.id)).slice(0, 4);
  }, [proposals, selectedIds]);

  const toggleSelectProposal = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        alert("Minimal bandingkan 2 proposal untuk evaluasi yang adil.");
        return;
      }
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        setWinnerMessage({
          type: "error",
          text: "Perbandingan maksimal menampilkan 4 proposal berdampingan.",
        });
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  // Handler penetapan pemenang sayembara
  const handlePilihPemenang = async (proposalId: string) => {
    setSelectedWinnerId(proposalId);
    setWinnerMessage(null);
  };

  const handleConfirmWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWinnerId) return;

    if (alasanMenang.trim().length < 30) {
      setWinnerMessage({
        type: "error",
        text: "Alasan penetapan wajib diisi minimal 30 karakter.",
      });
      return;
    }

    const isTopRank = activeProposals[0]?.id === selectedWinnerId;
    if (!isTopRank && alasanTambahan.trim().length < 30) {
      setWinnerMessage({
        type: "error",
        text: "Proposal yang dipilih bukan peringkat skor teratas. Wajib mengisi Alasan Tambahan minimal 30 karakter.",
      });
      return;
    }

    setIsSubmittingWinner(true);
    try {
      const payload: { proposalId: string; alasan: string; alasanTambahan?: string } = {
        proposalId: selectedWinnerId,
        alasan: alasanMenang.trim(),
      };
      if (!isTopRank) {
        payload.alasanTambahan = alasanTambahan.trim();
      }

      const res = await apiClient.post(`/api/proyek/${projectId}/pemenang`, payload);
      if (res.data) {
        setWinnerMessage({
          text: "Pemenang pelaksana sayembara swakelola berhasil ditetapkan secara sah dalam sistem audit desa!",
          type: "success",
        });
        setTimeout(() => {
          router.push(`/proyek/${projectId}`);
        }, 1500);
      } else if (res.error) {
        setWinnerMessage({ text: res.error.message || "Gagal menetapkan pemenang.", type: "error" });
      }
    } catch (err: unknown) {
      let msg = "Gagal menetapkan pemenang. Pastikan seluruh flag telah ditinjau.";
      if (err instanceof Error) msg = err.message;
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object"
      ) {
        const resp = (err as { response?: { error?: { message?: string } } }).response;
        if (resp?.error?.message) msg = resp.error.message;
      }
      setWinnerMessage({ text: msg, type: "error" });
    } finally {
      setIsSubmittingWinner(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#FAFAF7] text-zinc-900 antialiased selection:bg-[#1F6F43] selection:text-white font-sans mt-16 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 flex-wrap"
          >
            <Link
              href="/proyek"
              className="flex items-center gap-1 hover:text-[#1F6F43] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Proyek</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <Link
              href={`/proyek/${projectId}`}
              className="hover:text-[#1F6F43] transition-colors truncate max-w-[200px] sm:max-w-xs"
            >
              <span>{project.judul}</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-900 font-semibold">Bandingkan Proposal (P1)</span>
          </nav>

          {/* Header Banner */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="text-xs font-semibold gap-1.5 py-1 px-3">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Fitur P1: Evaluasi Berdampingan</span>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Pagu: {formatRupiah(project.pagu)}
                </Badge>
                <span className="text-xs text-zinc-500">
                  Status: <strong>{project.status}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Perbandingan Proposal Sayembara
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
                Evaluasi objektif tawaran kelompok masyarakat (Pokmas) secara berdampingan hingga 4 proposal. Analisis matematis terbuka dengan dukungan ringkasan kecerdasan buatan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link href={`/proyek/${projectId}`}>
                <Button variant="outline" size="sm" className="gap-1.5 min-h-[44px]">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Detail Proyek</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Role Access Notice (Jika bukan Perangkat / Admin) */}
          {!isInternal && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-950 space-y-1">
                <span className="font-bold block">
                  Akses Terbatas: Mode Peninjauan Publik / Warga
                </span>
                <p className="text-amber-900 leading-relaxed">
                  Sesuai ketentuan tata kelola sayembara desa, penetapan pemenang hanya berhak dilakukan oleh akun <strong>Perangkat Desa (Kades / TPK)</strong> atau <strong>Admin</strong>. Anda saat ini dapat meninjau data perbandingan secara transparan.
                </p>
              </div>
            </div>
          )}

          {/* Proposal Selector Chips (Jika ada lebih dari 2 proposal) */}
          {proposals.length > 2 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Pilih Proposal untuk Dibandingkan ({selectedIds.length}/4 Aktif):
                </span>
                <span className="text-xs text-zinc-400">
                  Klik kelompok untuk menyembunyikan atau menampilkan
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {proposals.map((p, idx) => {
                  const isChecked = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleSelectProposal(p.id)}
                      className={cn(
                        "text-xs px-3.5 py-2 rounded-xl font-semibold border transition-all flex items-center gap-2 min-h-[40px]",
                        isChecked
                          ? "bg-emerald-50 border-emerald-300 text-[#1F6F43] shadow-2xs"
                          : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                      )}
                    >
                      <span>#{idx + 1} {p.namaKelompok}</span>
                      <span className="font-mono text-[11px] text-zinc-500">
                        ({p.skorTotal.toFixed(0)} poin)
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SIDE-BY-SIDE COMPARISON TABLE */}
          {isLoading ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200">
              <div className="w-8 h-8 border-3 border-[#1F6F43] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Memuat data perbandingan proposal...</p>
            </div>
          ) : activeProposals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 text-zinc-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-zinc-400" />
              <p className="font-semibold text-zinc-800">Belum Ada Proposal Masuk</p>
              <p className="text-xs">Proyek ini belum menerima proposal penawaran dari kelompok warga.</p>
            </div>
          ) : (
            <div className="rounded-3xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/70">
                      <th className="p-4 sm:p-5 text-xs font-bold uppercase tracking-wider text-zinc-500 w-48 sm:w-60 sticky left-0 bg-zinc-50/95 backdrop-blur-xs z-10 border-r border-zinc-200/80">
                        Parameter Evaluasi
                      </th>
                      {activeProposals.map((prop, idx) => {
                        const isRank1 = idx === 0;
                        return (
                          <th
                            key={prop.id}
                            className={cn(
                              "p-4 sm:p-5 align-top min-w-[260px] max-w-[320px] transition-colors border-r border-zinc-200/80 last:border-r-0",
                              isRank1 ? "bg-emerald-50/60" : "bg-white"
                            )}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={cn(
                                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1",
                                    isRank1
                                      ? "bg-[#1F6F43] text-white"
                                      : "bg-zinc-200 text-zinc-700"
                                  )}
                                >
                                  {isRank1 && <Sparkles className="w-3 h-3" />}
                                  <span>Peringkat #{idx + 1}</span>
                                </span>
                                <span className="font-mono text-[10px] text-zinc-400">
                                  ID: {prop.id.slice(0, 10)}
                                </span>
                              </div>
                              <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 leading-tight">
                                {prop.namaKelompok}
                              </h3>
                              <p className="text-xs text-zinc-500 flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-[#1F6F43]" />
                                <span>Ketua: <strong>{prop.ketua}</strong></span>
                              </p>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-200/80 text-xs sm:text-sm">
                    {/* BARIS 1: SKOR TOTAL & BADGE */}
                    <tr className="bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors">
                      <td className="p-4 sm:p-5 font-bold text-zinc-800 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <div className="space-y-0.5">
                          <span>Total Skor Terbuka</span>
                          <span className="block text-[11px] text-zinc-400 font-normal">
                            Formula matematis objektif
                          </span>
                        </div>
                      </td>
                      {activeProposals.map((prop, idx) => (
                        <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-extrabold text-[#1F6F43] font-mono">
                              {prop.skorTotal.toFixed(1)}
                            </span>
                            <span className="text-xs text-zinc-400">/ 100</span>
                          </div>
                          {idx === 0 && (
                            <span className="inline-block mt-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Nilai Tertinggi
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* BARIS 2: NILAI PENAWARAN */}
                    <tr className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-zinc-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <div className="space-y-0.5">
                          <span>Nilai Penawaran (RAB)</span>
                          <span className="block text-[11px] text-zinc-400 font-normal">
                            Efisiensi terhadap pagu
                          </span>
                        </div>
                      </td>
                      {activeProposals.map((prop) => {
                        const percentOfPagu = Math.round((prop.penawaran / project.pagu) * 100);
                        const hemat = project.pagu - prop.penawaran;
                        return (
                          <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0">
                            <div className="font-mono text-base font-bold text-zinc-900">
                              {formatRupiah(prop.penawaran)}
                            </div>
                            <div className="text-xs text-zinc-500 mt-0.5">
                              {percentOfPagu}% dari pagu{" "}
                              {hemat > 0 && (
                                <span className="text-emerald-700 font-semibold">
                                  (Hemat {formatRupiah(hemat)})
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* BARIS 3: TENAGA KERJA LOKAL (PKTD) */}
                    <tr className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-zinc-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <div className="space-y-0.5">
                          <span>Serapan Tenaga Kerja (PKTD)</span>
                          <span className="block text-[11px] text-zinc-400 font-normal">
                            Syarat minimum: 70% warga KTP desa
                          </span>
                        </div>
                      </td>
                      {activeProposals.map((prop) => {
                        const isLolos = prop.persentaseLokal >= 70;
                        return (
                          <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0">
                            <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                              <UsersRound className="w-4 h-4 text-[#1F6F43]" />
                              <span>{prop.persentaseLokal}% ({prop.tenagaLokal}/{prop.tenagaTotal} orang)</span>
                            </div>
                            <div className="mt-1">
                              {isLolos ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-[#1F6F43]" />
                                  <span>Memenuhi Syarat PKTD</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3 text-amber-700" />
                                  <span>Di Bawah Syarat 70%</span>
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* BARIS 4: DURASI KERJA */}
                    <tr className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-zinc-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <span>Target Durasi Pengerjaan</span>
                      </td>
                      {activeProposals.map((prop) => (
                        <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0 font-medium">
                          <div className="flex items-center gap-1.5 text-zinc-900 font-bold">
                            <Calendar className="w-4 h-4 text-[#8A5A2B]" />
                            <span>{prop.durasiHari} Hari Kalender</span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* BARIS 5: RINCIAN 4 KOMPONEN SKOR */}
                    <tr className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-zinc-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <div className="space-y-0.5">
                          <span>Rincian 4 Komponen Nilai</span>
                          <span className="block text-[11px] text-zinc-400 font-normal">
                            Biaya 40%, Lokal 30%, Jadwal 20%, Dokumen 10%
                          </span>
                        </div>
                      </td>
                      {activeProposals.map((prop) => (
                        <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0 text-xs">
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Biaya:</span>
                              <span className="font-mono font-bold text-zinc-900">{prop.skorBiaya.toFixed(1)} / 40</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Lokal:</span>
                              <span className="font-mono font-bold text-zinc-900">{prop.skorLokal.toFixed(1)} / 30</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Jadwal:</span>
                              <span className="font-mono font-bold text-zinc-900">{prop.skorJadwal.toFixed(1)} / 20</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-zinc-500">Dokumen:</span>
                              <span className="font-mono font-bold text-zinc-900">{prop.skorDokumen.toFixed(1)} / 10</span>
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* BARIS 6: RINGKASAN ASISTEN AI */}
                    <tr className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-zinc-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-zinc-900 font-bold">
                            <Sparkles className="w-4 h-4 text-[#1F6F43]" />
                            <span>Analisis Ringkasan AI</span>
                          </div>
                          <span className="block text-[11px] text-zinc-400 font-normal">
                            Ekstraksi otomatis narasi &amp; berkas
                          </span>
                        </div>
                      </td>
                      {activeProposals.map((prop) => (
                        <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0 text-xs space-y-3">
                          <p className="italic text-zinc-700 leading-relaxed font-medium">
                            &ldquo;{prop.ringkasanEksekutif}&rdquo;
                          </p>

                          <div className="space-y-1">
                            <span className="font-bold text-[#1F6F43] block">Kekuatan Utama:</span>
                            <ul className="space-y-1 pl-1 text-zinc-600">
                              {prop.poinKekuatan.map((k, kIdx) => (
                                <li key={kIdx} className="flex items-start gap-1">
                                  <span className="text-emerald-600 font-bold">•</span>
                                  <span>{k}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1">
                            <span className="font-bold text-amber-800 block">Poin Perhatian:</span>
                            <ul className="space-y-1 pl-1 text-zinc-600">
                              {prop.poinPerhatian.map((p, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-1">
                                  <span className="text-amber-600 font-bold">•</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* BARIS 7: STATUS FLAG INTEGRITAS */}
                    <tr className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 sm:p-5 font-semibold text-zinc-700 sticky left-0 bg-white/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <div className="space-y-0.5">
                          <span>Flag Integritas Seleksi</span>
                          <span className="block text-[11px] text-zinc-400 font-normal">
                            Deteksi tumpang tindih &amp; teks
                          </span>
                        </div>
                      </td>
                      {activeProposals.map((prop) => (
                        <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0 text-xs">
                          {prop.flags.length > 0 ? (
                            <div className="space-y-1.5">
                              {prop.flags.map((fl, fIdx) => (
                                <div
                                  key={fIdx}
                                  className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-1.5"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                                  <span>{fl.deskripsi}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-1.5 font-semibold">
                              <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
                              <span>Bersih (Tanpa Flag)</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* BARIS 8: TINDAKAN KEPALA DESA / TPK */}
                    <tr className="bg-zinc-50/50">
                      <td className="p-4 sm:p-5 font-bold text-zinc-800 sticky left-0 bg-zinc-50/95 backdrop-blur-xs border-r border-zinc-200/80">
                        <span>Aksi Keputusan</span>
                      </td>
                      {activeProposals.map((prop) => (
                        <td key={prop.id} className="p-4 sm:p-5 border-r border-zinc-200/80 last:border-r-0">
                          {isInternal ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handlePilihPemenang(prop.id)}
                              className="w-full gap-1.5 font-semibold bg-[#1F6F43] hover:bg-[#185935] text-white min-h-[40px]"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Tetapkan Pelaksana</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-zinc-400 italic block text-center">
                              Hak akses Perangkat Desa
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Teks Wajib PRD 36.5 */}
              <div className="p-4 sm:p-5 bg-zinc-50/80 border-t border-zinc-200 text-xs text-zinc-600 leading-relaxed space-y-1">
                <p>
                  <strong>Klausul Kepatuhan Resmi:</strong> &ldquo;Ringkasan otomatis. Rujuk dokumen asli. Skor dihitung dengan aturan yang bisa diperiksa; keputusan akhir ada pada pemerintah desa.&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Winner Confirmation Dialog Modal */}
          {selectedWinnerId && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
            >
              <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-zinc-200 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F6F43]">
                      Penetapan Pemenang Sayembara
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900">
                      Konfirmasi Keputusan Pemerintah Desa
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedWinnerId(null)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700"
                  >
                    ✕
                  </button>
                </div>

                {winnerMessage && (
                  <div
                    className={cn(
                      "p-3 rounded-xl text-xs font-medium",
                      winnerMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                        : "bg-red-50 text-red-900 border border-red-200"
                    )}
                  >
                    {winnerMessage.text}
                  </div>
                )}

                <form onSubmit={handleConfirmWinner} className="space-y-4 text-xs sm:text-sm">
                  <p className="text-zinc-600 leading-relaxed">
                    Anda akan menetapkan proposal dari{" "}
                    <strong>
                      {activeProposals.find((p) => p.id === selectedWinnerId)?.namaKelompok}
                    </strong>{" "}
                    sebagai pelaksana swakelola proyek. Tindakan ini dicatat ke dalam *audit log* sistem (append-only).
                  </p>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700 block">
                      Alasan Pertimbangan Penetapan (min. 30 karakter) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={alasanMenang}
                      onChange={(e) => setAlasanMenang(e.target.value)}
                      placeholder="Jelaskan alasan penetapan pelaksana (min. 30 karakter)..."
                      className="w-full p-3 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
                    />
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {alasanMenang.trim().length} / 1000 karakter (min. 30)
                    </span>
                  </div>

                  {/* Jika bukan rank 1, wajib alasan tambahan (PRD Bagian 25 & 33.2 #16) */}
                  {activeProposals[0]?.id !== selectedWinnerId && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                      <label className="font-bold block text-xs">
                        Alasan Tambahan (Wajib untuk Pilihan Bukan Peringkat #1) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={alasanTambahan}
                        onChange={(e) => setAlasanTambahan(e.target.value)}
                        placeholder="Jelaskan dasar pertimbangan objektif mengapa memilih proposal ini di luar peringkat pertama..."
                        className="w-full p-2.5 rounded-lg border border-amber-300 text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
                      />
                      <span className="text-[11px] text-amber-800 font-mono">
                        {alasanTambahan.trim().length} / 1000 karakter (min. 30)
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedWinnerId(null)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingWinner}
                      className="bg-[#1F6F43] hover:bg-[#185935] text-white font-semibold"
                    >
                      {isSubmittingWinner ? "Menyimpan Keputusan..." : "Sahkan Pemenang"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
