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
  ArrowDown,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SlideIndicator } from "@/components/slide-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const aspirasiSlides = [
  { id: "aspirasi-frame-1", label: "Kirim Aspirasi" },
  { id: "aspirasi-frame-2", label: "Daftar Aspirasi" },
  { id: "aspirasi-frame-footer", label: "Transparansi" },
];

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
}

export default function AspirasiPortalPage() {
  // Form State
  const [judul, setJudul] = React.useState("");
  const [kategori, setKategori] = React.useState<AspirasiItem["kategori"]>("Infrastruktur Rusak");
  const [lokasi, setLokasi] = React.useState("Dusun Krajan RT 03 / RW 01");
  const [uraian, setUraian] = React.useState("");
  const [isAnonim, setIsAnonim] = React.useState(false);
  const [uploadedFoto, setUploadedFoto] = React.useState<string[]>([
    "Foto_Bukti_Jalan_Rusak.jpg",
  ]);

  // Submission result state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [generatedTicket, setGeneratedTicket] = React.useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = React.useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterKategori, setFilterKategori] = React.useState<string>("SEMUA");
  const [filterStatus, setFilterStatus] = React.useState<string>("SEMUA");

  // Upvoted IDs state
  const [upvotedIds, setUpvotedIds] = React.useState<Record<string, boolean>>({});

  // Aspirations list state
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

  // Handle Form Submission
  const handleSubmitAspirasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim() || !uraian.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newTicketCode = `ADU-2026-0${Math.floor(100 + Math.random() * 900)}`;
      const newAspirasi: AspirasiItem = {
        id: `asp-${Date.now()}`,
        nomorTiket: newTicketCode,
        judul,
        kategori,
        lokasi,
        tanggal: "Hari ini",
        status: "Diterima",
        pengusul: isAnonim ? "Anonim (Warga Terverifikasi)" : "Warga Desa Karang Sari",
        isAnonim,
        dukungan: 1,
        uraian,
        tanggapanTerakhir: "Aspirasi berhasil diterima sistem, menunggu verifikasi BPD.",
      };

      setAspirasiList((prev) => [newAspirasi, ...prev]);
      setGeneratedTicket(newTicketCode);
      setIsSubmitting(false);
      // Reset form
      setJudul("");
      setUraian("");
    }, 700);
  };

  // Toggle upvote
  const handleToggleUpvote = (id: string) => {
    const isUpvoted = !!upvotedIds[id];
    setUpvotedIds((prev) => ({ ...prev, [id]: !isUpvoted }));
    setAspirasiList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, dukungan: isUpvoted ? item.dukungan - 1 : item.dukungan + 1 }
          : item
      )
    );
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
          <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200">
            <Clock className="w-3 h-3 mr-1" />
            <span>Diterima</span>
          </Badge>
        );
      case "Diverifikasi BPD":
        return (
          <Badge variant="earth" className="text-xs">
            <ShieldCheck className="w-3 h-3 mr-1" />
            <span>Diverifikasi BPD</span>
          </Badge>
        );
      case "Masuk Musrenbangdes":
        return (
          <Badge variant="accent" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            <span>Masuk Musrenbangdes</span>
          </Badge>
        );
      case "Selesai":
        return (
          <Badge variant="default" className="text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>Selesai Ditindaklanjuti</span>
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
    <>
      <Navbar />

      <main className="h-[calc(100vh-64px)] mt-16 overflow-y-auto snap-y snap-proximity md:snap-mandatory scroll-smooth bg-[#FAFAF7] text-zinc-900 antialiased selection:bg-[#1F6F43] selection:text-white font-sans relative">
        {/* Desktop Dot Pagination */}
        <SlideIndicator slides={aspirasiSlides} />

        {/* FRAME 1: Header & Form Kirim Aspirasi */}
        <section
          id="aspirasi-frame-1"
          aria-label="Kirim Aspirasi dan Aduan Warga"
          className="min-h-[calc(100vh-64px)] snap-start flex flex-col justify-center py-6 md:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4"
        >
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

          {/* Quick Anchor Navigation */}
          <div className="flex border border-zinc-200/80 bg-white p-1.5 rounded-2xl shadow-sm gap-1.5">
            <a
              href="#aspirasi-frame-1"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] bg-[#1F6F43] text-white shadow-xs"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Formulir Kirim Aspirasi</span>
            </a>
            <a
              href="#aspirasi-frame-2"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <ListFilter className="w-4 h-4" />
              <span>Daftar Aspirasi Publik ({aspirasiList.length})</span>
            </a>
          </div>

          {/* Main 12-col Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
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
                        Kode Tiket Pelacakan
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

                  <div className="pt-2 flex justify-start">
                    <button
                      type="button"
                      onClick={() => setGeneratedTicket(null)}
                      className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:underline min-h-[44px] flex items-center"
                    >
                      &larr; Kirim Usulan / Aduan Lainnya
                    </button>
                  </div>
                </div>
              ) : (
                /* Submission Form */
                <form
                  onSubmit={handleSubmitAspirasi}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6"
                >
                  <div className="border-b border-zinc-100 pb-4">
                    <h2 className="text-lg font-bold text-zinc-900">
                      Formulir Penyampaian Aspirasi &amp; Aduan Lapangan
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                      Sertakan informasi lokasi yang jelas serta foto bukti kondisi riil di
                      lapangan.
                    </p>
                  </div>

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
                        placeholder="Contoh: Saluran drainase amblas dekat jembatan timur RT 02"
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
                        placeholder="Uraikan kronologi, dampak terhadap warga, dan saran penanganan..."
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
                          <span>Mengirim Laporan...</span>
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

            {/* Helper Jump Action Button */}
            <div className="pt-2 flex justify-start">
              <a
                href="#aspirasi-frame-2"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-zinc-200/90 shadow-sm text-sm font-semibold text-[#1F6F43] hover:bg-emerald-50/50 hover:border-[#1F6F43]/30 transition-all min-h-[44px]"
              >
                <span>Lihat Daftar Aspirasi Warga Lainnya</span>
                <ArrowDown className="w-4 h-4 text-[#1F6F43] animate-bounce" />
              </a>
            </div>
          </section>

          {/* FRAME 2: DAFTAR ASPIRASI PUBLIK TERKINI */}
          <section
            id="aspirasi-frame-2"
            aria-label="Daftar Aspirasi Publik Terkini"
            className="min-h-[calc(100vh-64px)] snap-start py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col justify-start space-y-5"
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

            {/* Jump to Top Button */}
            <div className="pt-2 flex justify-start">
              <a
                href="#aspirasi-frame-1"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200/90 shadow-sm text-xs font-semibold text-zinc-700 hover:text-[#1F6F43] transition-colors min-h-[44px]"
              >
                <span>&uarr; Kembali ke Formulir Kirim Aspirasi</span>
              </a>
            </div>
          </section>

          {/* FRAME 3: Footer Snap End */}
          <section
            id="aspirasi-frame-footer"
            aria-label="Informasi Footer"
            className="snap-end w-full"
          >
            <Footer />
          </section>
        </main>
      </>
    );
  }
