"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MessageSquarePlus,
  ListFilter,
  Search,
  ThumbsUp,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  UploadCloud,
  FileText,
  Copy,
  ExternalLink,
  Lock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  AlertCircle,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentRole } from "@/lib/use-current-role";
import { apiClient } from "@/lib/api-client";

interface AspirasiItem {
  id: string;
  nomorTiket: string;
  judul: string;
  kategori: "Infrastruktur Rusak" | "Usulan Program Desa" | "Dugaan Penyimpangan Dana" | "Layanan Publik";
  lokasi: string;
  tanggal: string;
  status: "Diterima" | "Diverifikasi BPD" | "Masuk Musrenbangdes" | "Selesai";
  pengusul: string;
  isAnonim: boolean;
  dukungan: number;
  uraian: string;
  tanggapanTerakhir?: string;
  isDbRecord?: boolean;
}

export default function AspirasiPortalPage() {
  const { role } = useCurrentRole();
  const isPublik = role === "PUBLIK";

  // Active Tab State ("form" | "daftar")
  const [activeTab, setActiveTab] = React.useState<"form" | "daftar">("form");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get("tab");
      if (tabParam === "daftar" || hash === "#daftar" || hash === "#aspirasi-frame-2") {
        setActiveTab("daftar");
      } else if (tabParam === "form" || hash === "#form" || hash === "#aspirasi-frame-1") {
        setActiveTab("form");
      }
    }
  }, []);

  // Form State
  const [judul, setJudul] = React.useState("");
  const [kategori, setKategori] = React.useState<AspirasiItem["kategori"]>("Infrastruktur Rusak");
  const [lokasi, setLokasi] = React.useState("Dusun Krajan RT 03 / RW 01");
  const [uraian, setUraian] = React.useState("");
  const [isAnonim, setIsAnonim] = React.useState(false);
  const [uploadedFoto, setUploadedFoto] = React.useState<string[]>([
    "Foto_Bukti_Jalan_Rusak.jpg",
  ]);

  // Auth restriction modal state for PUBLIK role
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // Submission result & error state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [generatedTicket, setGeneratedTicket] = React.useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = React.useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterKategori, setFilterKategori] = React.useState<string>("SEMUA");
  const [filterStatus, setFilterStatus] = React.useState<string>("SEMUA");

  // Upvoted IDs state & feedback
  const [upvotedIds, setUpvotedIds] = React.useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Default seed aspirations list
  const [aspirasiList, setAspirasiList] = React.useState<AspirasiItem[]>([
    {
      id: "asp-1",
      nomorTiket: "ADU-2026-0842",
      judul: "Gorong-gorong Amblas di Jalan Pertanian RT 03 Dusun Krajan",
      kategori: "Infrastruktur Rusak",
      lokasi: "Dusun Krajan RT 03 / RW 01",
      tanggal: "5 November 2026",
      status: "Diverifikasi BPD",
      pengusul: "Warga Dusun Krajan",
      isAnonim: true,
      dukungan: 38,
      uraian:
        "Gorong-gorong saluran pembuang sawah amblas tergerus air hujan, menyebabkan akses jalan traktor warga tertutup lumpur dan genangan setinggi 20 cm.",
      tanggapanTerakhir:
        "BPD telah meninjau lokasi bersama Kaur Pembangunan pada 6 Nov 2026. Direkomendasikan masuk perbaikan darurat swakelola.",
    },
    {
      id: "asp-2",
      nomorTiket: "ADU-2026-0619",
      judul: "Pemasangan Lampu Penerangan Jalan Tenaga Surya Dusun Sumberwening",
      kategori: "Usulan Program Desa",
      lokasi: "Dusun Sumberwening RT 02 / RW 03",
      tanggal: "28 Oktober 2026",
      status: "Masuk Musrenbangdes",
      pengusul: "Warga Dusun Sumberwening",
      isAnonim: false,
      dukungan: 64,
      uraian:
        "Jalan tembus antar-RT sejauh 600 meter masih gelap gulita saat malam hari, rawan kecelakaan bagi anak sekolah dan warga pulang ibadah.",
      tanggapanTerakhir:
        "Disetujui dalam Musrenbangdes TA 2026 bidang infrastruktur energi terbarukan.",
    },
    {
      id: "asp-3",
      nomorTiket: "ADU-2026-0905",
      judul: "Permintaan Klarifikasi Jadwal Pembagian Bantuan Bibit Padi Organik",
      kategori: "Layanan Publik",
      lokasi: "Dusun Balong RT 01 / RW 02",
      tanggal: "7 November 2026",
      status: "Diterima",
      pengusul: "Kelompok Tani Subur Makmur",
      isAnonim: false,
      dukungan: 21,
      uraian:
        "Kelompok tani memohon informasi jadwal pasti distribusi bibit padi dari program ketahanan pangan APBDes agar serempak dengan masa tanam pertama.",
      tanggapanTerakhir:
        "Tiket baru masuk. Menunggu verifikasi tim ketahanan pangan desa.",
    },
    {
      id: "asp-4",
      nomorTiket: "ADU-2026-0412",
      judul: "Perbaikan Dinding Penahan Tebing Curam Dekat Pos Kamling RW 02",
      kategori: "Infrastruktur Rusak",
      lokasi: "Dusun Krajan RT 04 / RW 02",
      tanggal: "18 Oktober 2026",
      status: "Selesai",
      pengusul: "Rukun Warga 02",
      isAnonim: false,
      dukungan: 89,
      uraian:
        "Tebing dekat pos ronda rawan longsor saat musim hujan, telah ditindaklanjuti lewat proyek sayembara swakelola pasangan batu kali selesai 100%.",
      tanggapanTerakhir:
        "Pekerjaan fisik selesai 100% dan berita acara serah terima telah ditandatangani.",
    },
    {
      id: "asp-5",
      nomorTiket: "ADU-2026-0731",
      judul: "Pengawasan Transparansi Alokasi Dana Operasional BUMDes",
      kategori: "Dugaan Penyimpangan Dana",
      lokasi: "Kantor Desa Karang Sari",
      tanggal: "2 November 2026",
      status: "Diverifikasi BPD",
      pengusul: "Warga Terverifikasi",
      isAnonim: true,
      dukungan: 45,
      uraian:
        "Laporan pertanggungjawaban unit usaha pengeringan gabah belum dipublikasikan di papan transparansi desa selama 2 kuartal berturut-turut.",
      tanggapanTerakhir:
        "BPD mengagendakan rapat dengar pendapat dengan pengurus BUMDes pada 10 November 2026.",
    },
  ]);

  // Load existing ideas from database on mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadDbIdeas() {
      try {
        const res = await apiClient.get<Array<{
          id: string;
          nomor: string;
          judul: string;
          deskripsi: string;
          kategori: string;
          lokasi: string | null;
          status: string;
          anonim: boolean;
          sumber: string;
          jumlahDukungan: number;
          createdAt: string;
          pengaju?: { nama: string };
        }>>("/api/ide");

        if (isMounted && res.data && Array.isArray(res.data)) {
          const dbItems: AspirasiItem[] = res.data.map((item) => {
            let mappedStatus: AspirasiItem["status"] = "Diterima";
            if (item.status === "VERIFIKASI") mappedStatus = "Diverifikasi BPD";
            if (item.status === "DITERIMA" || item.status === "JADI_PROYEK") mappedStatus = "Masuk Musrenbangdes";

            return {
              id: item.id,
              nomorTiket: item.nomor,
              judul: item.judul,
              kategori: "Usulan Program Desa",
              lokasi: item.lokasi || "Desa Karang Sari",
              tanggal: new Date(item.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              status: mappedStatus,
              pengusul: item.anonim ? "Anonim (Warga Terverifikasi)" : (item.pengaju?.nama || "Warga Desa"),
              isAnonim: item.anonim,
              dukungan: item.jumlahDukungan || 0,
              uraian: item.deskripsi,
              isDbRecord: true,
            };
          });

          if (dbItems.length > 0) {
            setAspirasiList((prev) => {
              const existingIds = new Set(prev.map((p) => p.nomorTiket));
              const fresh = dbItems.filter((d) => !existingIds.has(d.nomorTiket));
              return [...fresh, ...prev];
            });
          }
        }
      } catch {
        // Fallback gracefully to default items
      }
    }
    loadDbIdeas();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Form Submission with Real Backend Integration & Auth Gatekeeping
  const handleSubmitAspirasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // 1. Gatekeeping RBAC (PRD Bagian 8)
    if (isPublik) {
      setShowAuthModal(true);
      return;
    }

    if (!judul.trim() || !uraian.trim()) {
      setSubmitError("Judul dan uraian aspirasi wajib diisi.");
      return;
    }

    if (judul.trim().length < 10) {
      setSubmitError("Judul aspirasi minimal 10 karakter.");
      return;
    }

    if (uraian.trim().length < 30) {
      setSubmitError("Uraian masalah minimal 30 karakter agar dapat ditinjau BPD.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (kategori === "Usulan Program Desa") {
        // Kirim ke POST /api/ide (PRD 33.2 #7)
        const res = await apiClient.post<{ id: string; nomor: string; status: string }>("/api/ide", {
          judul: judul.trim(),
          deskripsi: uraian.trim(),
          lokasi: lokasi.trim() || undefined,
          kategori: "Infrastruktur",
          anonim: isAnonim,
          sumber: "WARGA",
        });

        if (res.error) {
          setSubmitError(res.error.message || "Gagal mengirimkan ide ke sistem.");
          setIsSubmitting(false);
          return;
        }

        const ticketCode = res.data?.nomor || `IDE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        setGeneratedTicket(ticketCode);

        const newAspirasi: AspirasiItem = {
          id: res.data?.id || `asp-${Date.now()}`,
          nomorTiket: ticketCode,
          judul: judul.trim(),
          kategori,
          lokasi: lokasi.trim(),
          tanggal: "Hari ini",
          status: "Diterima",
          pengusul: isAnonim ? "Anonim (Warga Terverifikasi)" : "Warga Desa Karang Sari",
          isAnonim,
          dukungan: 1,
          uraian: uraian.trim(),
          tanggapanTerakhir: "Ide berhasil tercatat di ledger aspirasi desa, menunggu verifikasi BPD.",
          isDbRecord: true,
        };

        setAspirasiList((prev) => [newAspirasi, ...prev]);
        setJudul("");
        setUraian("");
      } else {
        // Kirim ke POST /api/tiket (PRD 33.2 #25)
        let kategoriTiket = "LAINNYA";
        if (kategori === "Dugaan Penyimpangan Dana") kategoriTiket = "DUGAAN_PENYIMPANGAN";
        if (kategori === "Infrastruktur Rusak") kategoriTiket = "KERUSAKAN";

        const res = await apiClient.post<{ id: string; nomor: string; status: string }>("/api/tiket", {
          kategori: kategoriTiket,
          isi: `[${judul.trim()}] Lokasi: ${lokasi.trim()}. ${uraian.trim()}`,
          anonim: isAnonim,
        });

        if (res.error) {
          setSubmitError(res.error.message || "Gagal mengirimkan tiket aduan ke sistem.");
          setIsSubmitting(false);
          return;
        }

        const ticketCode = res.data?.nomor || `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        setGeneratedTicket(ticketCode);

        const newAspirasi: AspirasiItem = {
          id: res.data?.id || `asp-${Date.now()}`,
          nomorTiket: ticketCode,
          judul: judul.trim(),
          kategori,
          lokasi: lokasi.trim(),
          tanggal: "Hari ini",
          status: "Diterima",
          pengusul: isAnonim ? "Anonim (Warga Terverifikasi)" : "Warga Desa Karang Sari",
          isAnonim,
          dukungan: 1,
          uraian: uraian.trim(),
          tanggapanTerakhir: "Aduan resmi diterima. BPD wajib merespons dalam maksimal 14 hari kalender.",
          isDbRecord: true,
        };

        setAspirasiList((prev) => [newAspirasi, ...prev]);
        setJudul("");
        setUraian("");
      }
    } catch {
      setSubmitError("Terjadi gangguan koneksi saat mengirimkan aspirasi. Silakan coba kembali.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle upvote with real API support
  const handleToggleUpvote = async (id: string) => {
    if (isPublik) {
      setShowAuthModal(true);
      return;
    }

    const isUpvoted = !!upvotedIds[id];
    setUpvotedIds((prev) => ({ ...prev, [id]: !isUpvoted }));

    // Optimistic UI update
    setAspirasiList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, dukungan: isUpvoted ? Math.max(0, item.dukungan - 1) : item.dukungan + 1 }
          : item
      )
    );

    // Call backend API if it's a real database record
    const targetItem = aspirasiList.find((a) => a.id === id);
    if (targetItem?.isDbRecord && !isUpvoted) {
      try {
        const res = await apiClient.post<{ jumlahDukungan: number }>(`/api/ide/${id}/dukung`);
        if (res.error && res.error.code === "CONFLICT") {
          setToastMessage("Anda sudah pernah memberikan dukungan untuk usulan ini.");
          setTimeout(() => setToastMessage(null), 3000);
        } else if (res.data?.jumlahDukungan) {
          setAspirasiList((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, dukungan: res.data!.jumlahDukungan } : item
            )
          );
        }
      } catch {
        // Fallback gracefully
      }
    }
  };

  // Filtered Aspirations
  const filteredAspirasi = aspirasiList.filter((item) => {
    const matchSearch =
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nomorTiket.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKategori =
      filterKategori === "SEMUA" || item.kategori === filterKategori;
    const matchStatus = filterStatus === "SEMUA" || item.status === filterStatus;
    return matchSearch && matchKategori && matchStatus;
  });

  const getStatusBadge = (status: AspirasiItem["status"]) => {
    switch (status) {
      case "Diterima":
        return (
          <Badge variant="outline" className="text-zinc-600 gap-1 py-0.5 px-2.5">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>Menunggu BPD</span>
          </Badge>
        );
      case "Diverifikasi BPD":
        return (
          <Badge variant="accent" className="gap-1 py-0.5 px-2.5">
            <CheckCircle2 className="w-3 h-3" />
            <span>Diverifikasi BPD</span>
          </Badge>
        );
      case "Masuk Musrenbangdes":
        return (
          <Badge variant="default" className="gap-1 py-0.5 px-2.5">
            <Sparkles className="w-3 h-3 text-white" />
            <span>Masuk APBDes</span>
          </Badge>
        );
      case "Selesai":
        return (
          <Badge variant="earth" className="gap-1 py-0.5 px-2.5">
            <CheckCircle2 className="w-3 h-3 text-white" />
            <span>Telah Direalisasi</span>
          </Badge>
        );
    }
  };

  const getKategoriBadge = (kategori: AspirasiItem["kategori"]) => {
    switch (kategori) {
      case "Infrastruktur Rusak":
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
            Infrastruktur
          </span>
        );
      case "Usulan Program Desa":
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Usulan Program
          </span>
        );
      case "Dugaan Penyimpangan Dana":
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            Dugaan Anggaran
          </span>
        );
      case "Layanan Publik":
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200">
            Layanan Publik
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-zinc-900 font-sans">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Portal Aspirasi & Aduan Warga */}
        <section
          id="aspirasi-portal"
          aria-label="Portal Aspirasi Warga"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Header Banner */}
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="text-xs font-semibold">
                  Saluran Aspirasi Warga Berbukti
                </Badge>
                <span className="text-xs text-zinc-500">
                  Tenggat Respons Regulasi: <strong>Maks. 14 Hari Kalender</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Portal Ide, Aspirasi &amp; Aduan Warga
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
                Sampaikan usulan pembangunan desa, laporan infrastruktur rusak, atau
                pengawasan realisasi dana desa secara transparan dengan nomor tiket yang bisa
                dilacak hingga tuntas.
              </p>

              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-100 text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block">Total Aspirasi Masuk</span>
                  <span className="text-base font-bold text-zinc-900 block mt-0.5">
                    142 Usulan
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block">Diverifikasi BPD</span>
                  <span className="text-base font-bold text-[#8A5A2B] block mt-0.5">
                    36 Ditinjau
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block">Masuk APBDes 2026</span>
                  <span className="text-base font-bold text-[#1F6F43] block mt-0.5">
                    18 Proyek
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-zinc-500 block">Tingkat Tindak Lanjut</span>
                  <span className="text-base font-bold text-emerald-700 block mt-0.5">
                    94.2% Tepat Waktu
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Navigation (Eksklusif: Form vs Daftar) */}
            <div
              role="tablist"
              aria-label="Pilihan Tampilan Aspirasi"
              className="flex border border-zinc-200/80 bg-white p-1.5 rounded-2xl shadow-sm gap-1.5"
            >
              <button
                type="button"
                role="tab"
                id="tab-form"
                aria-selected={activeTab === "form"}
                aria-controls="panel-form"
                onClick={() => setActiveTab("form")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
                  activeTab === "form"
                    ? "bg-[#1F6F43] text-white shadow-xs"
                    : "bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Formulir Kirim Aspirasi</span>
              </button>
              <button
                type="button"
                role="tab"
                id="tab-daftar"
                aria-selected={activeTab === "daftar"}
                aria-controls="panel-daftar"
                onClick={() => setActiveTab("daftar")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] cursor-pointer ${
                  activeTab === "daftar"
                    ? "bg-[#1F6F43] text-white shadow-xs"
                    : "bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Daftar Aspirasi Publik ({aspirasiList.length})</span>
              </button>
            </div>

            {/* TAB PANEL 1: FORMULIR & SIDEBAR */}
            {activeTab === "form" && (
              <div
                id="panel-form"
                role="tabpanel"
                aria-labelledby="tab-form"
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start animate-in fade-in duration-200"
              >
                <div className="lg:col-span-8 space-y-6">
              {generatedTicket ? (
                /* Ticket Success Banner */
                <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center sm:text-left">
                  <div className="inline-flex p-3 rounded-full bg-emerald-100 text-[#1F6F43] mb-1">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
                      Aspirasi Anda Berhasil Dicatat!
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-xl">
                      Aduan telah masuk ke dalam antrean verifikasi Badan Permusyawaratan
                      Desa (BPD) Karang Sari. Simpan kode tiket berikut untuk melacak
                      tahapan disposisi.
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                        Kode Tiket Pelacakan Resmi
                      </span>
                      <span className="font-mono text-2xl font-extrabold text-[#1F6F43] block mt-0.5">
                        {generatedTicket}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedTicket);
                          setCopiedTicket(true);
                          setTimeout(() => setCopiedTicket(false), 2000);
                        }}
                        className="text-xs font-semibold gap-1.5 min-h-[44px]"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedTicket ? "Tersalin!" : "Salin Kode"}</span>
                      </Button>

                      <Link href={`/aduan/lacak?kode=${generatedTicket}`}>
                        <Button
                          size="sm"
                          className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs font-semibold gap-1.5 min-h-[44px]"
                        >
                          <span>Lacak Status Tiket</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setGeneratedTicket(null)}
                      className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:underline min-h-[44px] flex items-center justify-center sm:justify-start"
                    >
                      &larr; Kirim Usulan / Aduan Lainnya
                    </button>

                    <Button
                      type="button"
                      onClick={() => {
                        setGeneratedTicket(null);
                        setActiveTab("daftar");
                      }}
                      className="w-full sm:w-auto bg-[#1F6F43] hover:bg-[#185935] text-white text-xs font-semibold gap-2 min-h-[44px]"
                    >
                      <ListFilter className="w-4 h-4" />
                      <span>Lihat Usulan di Daftar Aspirasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Submission Form */
                <form
                  onSubmit={handleSubmitAspirasi}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6 relative"
                >
                  {/* Informative Banner for PUBLIK Role (PRD Bagian 8) */}
                  {isPublik && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 flex items-start gap-3 text-xs text-amber-900">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold block">
                          Hak Kirim Dibatasi untuk Warga Terverifikasi
                        </span>
                        <p className="leading-relaxed">
                          Anda sedang mengakses sistem sebagai <strong>Publik</strong>. Anda dapat membaca seluruh anggaran dan proyek, namun untuk mengirim ide, aduan, atau memberi dukungan, Anda wajib masuk sebagai <strong>Warga Desa Terverifikasi</strong>.
                        </p>
                        <div className="pt-1.5 flex flex-wrap gap-2">
                          <Link href="/masuk">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 text-xs bg-[#1F6F43] hover:bg-[#185935] text-white gap-1.5"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Masuk Sekarang</span>
                            </Button>
                          </Link>
                          <Link href="/masuk">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-amber-300 bg-white hover:bg-amber-100 gap-1.5 text-amber-900"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Ganti Peran Demo</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-b border-zinc-100 pb-4">
                    <h2 className="text-lg font-bold text-zinc-900">
                      Formulir Penyampaian Aspirasi &amp; Aduan Lapangan
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                      Sertakan informasi lokasi yang jelas serta foto bukti kondisi riil di
                      lapangan.
                    </p>
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="space-y-4 text-xs sm:text-sm">
                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Kategori Laporan <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {(
                          [
                            "Infrastruktur Rusak",
                            "Usulan Program Desa",
                            "Dugaan Penyimpangan Dana",
                            "Layanan Publik",
                          ] as const
                        ).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setKategori(cat)}
                            className={`p-3 rounded-xl border text-left font-medium text-xs transition-all min-h-[44px] flex items-center justify-between ${
                              kategori === cat
                                ? "bg-emerald-50 border-[#1F6F43] text-[#1F6F43] font-bold shadow-2xs"
                                : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            <span>{cat}</span>
                            {kategori === cat && (
                              <CheckCircle2 className="w-4 h-4 text-[#1F6F43] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Judul Singkat Aspirasi / Aduan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                        placeholder="Contoh: Saluran drainase amblas dekat jembatan timur RT 02 (Min. 10 karakter)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Lokasi Kejadian / Sasaran Program <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lokasi}
                        onChange={(e) => setLokasi(e.target.value)}
                        placeholder="Contoh: Dusun Krajan RT 03 / RW 01"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Uraian Detail Masalah atau Usulan <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={uraian}
                        onChange={(e) => setUraian(e.target.value)}
                        placeholder="Uraikan kronologi, dampak terhadap warga, dan saran penanganan (Min. 30 karakter)..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[100px]"
                      />
                    </div>

                    {/* Anonymity Switch */}
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="anonim-switch"
                        checked={isAnonim}
                        onChange={(e) => setIsAnonim(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-[#1F6F43] focus:ring-[#1F6F43]"
                      />
                      <label htmlFor="anonim-switch" className="cursor-pointer space-y-0.5">
                        <span className="font-semibold text-zinc-900 block flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-zinc-600" />
                          <span>Kirim Sebagai Laporan Anonim</span>
                        </span>
                        <span className="text-xs text-zinc-500 block leading-relaxed">
                          Nama Anda akan disamarkan dari publik dan hanya dapat diverifikasi
                          oleh Badan Permusyawaratan Desa (BPD) guna mencegah intimidasi.
                        </span>
                      </label>
                    </div>

                    {/* Mandatory Legal Disclaimer */}
                    <div className="rounded-xl bg-blue-50/60 border border-blue-200/70 p-3 text-xs text-blue-900 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong>Ketentuan Privasi:</strong> Jangan menulis data pribadi orang lain. Aduan anonim: identitas Anda tidak tampil di publik.
                      </p>
                    </div>

                    {/* Upload Photo Proof */}
                    <div className="space-y-2 pt-1">
                      <label className="font-semibold text-zinc-700 block">
                        Foto Bukti Kondisi Lapangan (Opsional)
                      </label>
                      <div className="border-2 border-dashed border-zinc-300 rounded-xl p-5 text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-2">
                        <UploadCloud className="w-7 h-7 text-[#1F6F43] mx-auto" />
                        <div className="text-xs text-zinc-600">
                          Unggah foto jalan rusak, bangunan retak, atau nota transaksi
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPhoto = `Foto_Bukti_Tambahan_${Date.now().toString().slice(-4)}.jpg`;
                            setUploadedFoto((prev) => [...prev, newPhoto]);
                          }}
                          className="text-xs min-h-[44px]"
                        >
                          <span>Simulasi Pilih Foto Bukti</span>
                        </Button>
                      </div>

                      {uploadedFoto.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {uploadedFoto.map((foto, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 text-xs bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-700"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#1F6F43]" />
                              <span>{foto}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold px-6 min-h-[44px] shadow-sm"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span>Mengirim ke Sistem Desa...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span>Kirim Aspirasi &amp; Dapatkan Kode Tiket</span>
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar Guide: 4 cols */}
            <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              {/* Card 1: Visual Hero Desa Aerial */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm">
                <div className="relative h-44 w-full">
                  <Image
                    src="/hero-desa-aerial.jpg"
                    alt="Suara Warga Membangun Desa"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 380px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#1F6F43] text-[10px] font-bold tracking-wider uppercase mb-1">
                      Partisipasi Aktif
                    </span>
                    <h4 className="text-sm font-bold leading-tight">Suara Warga Membangun Desa</h4>
                    <p className="text-xs text-zinc-300 mt-0.5">Musrenbangdes berbasis kebutuhan riil</p>
                  </div>
                </div>
                <div className="p-4 space-y-2.5 text-xs text-zinc-600">
                  <p className="leading-relaxed">
                    Setiap aspirasi yang terverifikasi akan direkap secara berkala oleh BPD untuk diagendakan dalam Rencana Kerja Pemerintah Desa (RKPDes).
                  </p>
                </div>
              </div>

              {/* Card 2: Panduan Penyampaian Aspirasi */}
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                  <Clock className="w-4 h-4 text-[#1F6F43]" />
                  <span>Panduan Penyampaian Aspirasi</span>
                </div>
                <ul className="space-y-2.5 text-xs text-zinc-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                    <span><strong>Tenggat 14 Hari:</strong> BPD wajib memberikan tanggapan resmi maksimal 14 hari kalender.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                    <span><strong>Sertakan RT/RW:</strong> Tuliskan nama dusun dan nomor RT/RW secara spesifik agar mudah ditinjau.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                    <span><strong>Lampirkan Bukti:</strong> Foto jalan rusak, gorong-gorong tersumbat, atau bukti fisik mempercepat tindak lanjut.</span>
                  </li>
                </ul>
              </div>

              {/* Card 3: Kerahasiaan Terjamin */}
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
                  <span>Kerahasiaan Terjamin</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Khusus kategori dugaan penyimpangan dana, Anda dapat mengaktifkan opsi <strong>Laporan Anonim</strong>. Identitas pelapor dilindungi sepenuhnya oleh perundang-undangan keterbukaan informasi.
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* TAB PANEL 2: DAFTAR ASPIRASI PUBLIK */}
        {activeTab === "daftar" && (
          <div
            id="panel-daftar"
            role="tabpanel"
            aria-labelledby="tab-daftar"
            className="space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Daftar Aspirasi &amp; Aduan Publik Terkini
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600">
                Transparansi seluruh usulan dan laporan warga Desa Karang Sari yang diawasi BPD.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-[#1F6F43] border border-emerald-200/80 self-start sm:self-auto">
              {filteredAspirasi.length} Aspirasi Ditemukan
            </span>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aspirasi berdasarkan nomor tiket, judul, atau nama dusun..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {["SEMUA", "Infrastruktur Rusak", "Usulan Program Desa", "Dugaan Penyimpangan Dana"].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilterKategori(cat)}
                      className={`px-3.5 py-1.5 rounded-full font-semibold transition-colors shrink-0 min-h-[36px] ${
                        filterKategori === cat
                          ? "bg-[#1F6F43] text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {cat === "SEMUA" ? "Semua Kategori" : cat}
                    </button>
                  )
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative inline-block self-end sm:self-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-white border border-zinc-200 rounded-full pl-4 pr-10 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43] cursor-pointer min-h-[38px]"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Diverifikasi BPD">Diverifikasi BPD</option>
                  <option value="Masuk Musrenbangdes">Masuk Musrenbangdes</option>
                  <option value="Selesai">Selesai</option>
                </select>
                <ChevronDown className="w-4 h-4 text-zinc-500 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Aspirations List */}
          <div className="space-y-4">
            {filteredAspirasi.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center space-y-3">
                <HelpCircle className="w-10 h-10 text-zinc-400 mx-auto" />
                <h3 className="text-base font-bold text-zinc-900">
                  Tidak Ada Aspirasi yang Cocok
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter kategori untuk melihat
                  seluruh usulan.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterKategori("SEMUA");
                    setFilterStatus("SEMUA");
                  }}
                  className="text-xs min-h-[44px]"
                >
                  Reset Filter
                </Button>
              </div>
            ) : (
              filteredAspirasi.map((asp) => {
                const isUpvoted = !!upvotedIds[asp.id];
                return (
                  <div
                    key={asp.id}
                    className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm hover:border-zinc-300 transition-all space-y-4"
                  >
                    {/* Header: Ticket + Category + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/aduan/lacak?kode=${asp.nomorTiket}`}
                          className="font-mono text-xs font-bold text-[#1F6F43] hover:underline bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 inline-flex items-center gap-1"
                        >
                          <span>{asp.nomorTiket}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {getKategoriBadge(asp.kategori)}
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{asp.tanggal}</span>
                        </span>
                      </div>

                      <div>{getStatusBadge(asp.status)}</div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-2">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                        {asp.judul}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                        {asp.uraian}
                      </p>
                    </div>

                    {/* Tanggapan Terakhir BPD if present */}
                    {asp.tanggapanTerakhir && (
                      <div className="rounded-xl bg-zinc-50 border border-zinc-200/60 p-3.5 text-xs space-y-1">
                        <span className="font-bold text-zinc-700 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1F6F43]" />
                          <span>Catatan Tindak Lanjut BPD:</span>
                        </span>
                        <p className="text-zinc-600 leading-relaxed italic">
                          &ldquo;{asp.tanggapanTerakhir}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Footer: Location, Author, Upvote */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-zinc-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#8A5A2B]" />
                          <span>{asp.lokasi}</span>
                        </span>
                        <span>•</span>
                        <span className="font-medium text-zinc-700">
                          Oleh: {asp.pengusul}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleUpvote(asp.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                            isUpvoted
                              ? "bg-[#1F6F43] text-white shadow-xs"
                              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                          }`}
                          title="Beri dukungan terhadap aspirasi ini"
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? "fill-white" : ""}`} />
                          <span>
                            {isUpvoted ? "Didukung" : "Dukung Usulan"} ({asp.dukungan})
                          </span>
                        </button>

                        <Link href={`/aduan/lacak?kode=${asp.nomorTiket}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs min-h-[44px] text-zinc-600 hover:text-zinc-900"
                          >
                            <span>Lacak Alur</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  </section>
</main>

    <Footer className="mt-auto" />

      {/* Auth Restriction Modal for PUBLIK Role (PRD Bagian 8) */}
      {showAuthModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold text-zinc-900">
                  Warga Terverifikasi Saja
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
              <p>
                Sesuai <strong>ketentuan transparansi desa</strong>, seluruh pengunjung publik dapat memantau transparansi anggaran, proyek, dan laporan.
              </p>
              <p>
                Namun untuk <strong>mengirim ide/aduan</strong> atau <strong>memberi dukungan</strong>, Anda wajib memiliki akun sebagai <strong>Warga Desa Terverifikasi</strong> guna mencegah manipulasi dan fitnah.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(false)}
                className="text-xs"
              >
                Nanti Saja
              </Button>
              <Link href="/masuk" className="w-full sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  className="w-full sm:w-auto bg-[#1F6F43] hover:bg-[#185935] text-white text-xs gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk sebagai Warga</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
