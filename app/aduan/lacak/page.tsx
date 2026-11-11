"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileText,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Home,
  UserCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

interface TimelineStep {
  title: string;
  actor: string;
  date: string;
  desc: string;
  isComplete: boolean;
  isCurrent: boolean;
}

interface TicketDetail {
  nomor: string;
  judul: string;
  kategori: string;
  lokasi: string;
  tanggalKirim: string;
  statusLabel: string;
  currentStepIndex: number; // 0 to 4
  pengusul: string;
  isAnonim: boolean;
  uraian: string;
  tanggapan?: string | null;
  tenggat?: string;
  tenggatTerlewat?: boolean;
  dokumenBukti: string[];
  timeline: TimelineStep[];
}

const SAMPLE_TICKETS: Record<string, TicketDetail> = {
  "ADU-2026-0842": {
    nomor: "ADU-2026-0842",
    judul: "Gorong-gorong Amblas di Jalan Pertanian RT 03 Dusun Krajan",
    kategori: "Infrastruktur Rusak",
    lokasi: "Dusun Krajan RT 03 / RW 01",
    tanggalKirim: "5 November 2026",
    statusLabel: "Tindak Lanjut Lapangan",
    currentStepIndex: 3,
    pengusul: "Anonim (Warga Terverifikasi)",
    isAnonim: true,
    uraian:
      "Gorong-gorong saluran pembuang sawah amblas tergerus air hujan deras, menyebabkan akses jalan traktor warga tertutup lumpur dan genangan setinggi 20 cm.",
    dokumenBukti: ["Foto_Gorong_Amblas_1.jpg", "Titik_Koordinat_RT03.pdf"],
    timeline: [
      {
        title: "1. Tiket Masuk",
        actor: "Sistem Transparansi AKAR",
        date: "5 November 2026, 09:14 WIB",
        desc: "Aspirasi warga dicatat secara otomatis ke dalam ledger audit terbuka desa dengan nomor lacak unik.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "2. Verifikasi Admin Desa",
        actor: "Operator Layanan Desa (Kaur Umum)",
        date: "5 November 2026, 14:30 WIB",
        desc: "Pengecekan kelengkapan data lapangan dan konfirmasi keabsahan pelapor sebagai warga berdomisili sah.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "3. Tinjauan Pengawas BPD",
        actor: "Badan Permusyawaratan Desa (BPD)",
        date: "6 November 2026, 11:00 WIB",
        desc: "BPD menyetujui rekomendasi perbaikan darurat melalui skema padat karya sayembara swakelola warga RT 03.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "4. Tindak Lanjut Lapangan",
        actor: "Tim Teknis Swakelola & Pokmas RT 03",
        date: "Sedang Berjalan (Estimasi Selesai: 12 Nov 2026)",
        desc: "Pekerjaan fisik pembongkaran gorong-gorong rusak dan pemasangan gorong-gorong beton baru sepanjang 12 meter.",
        isComplete: false,
        isCurrent: true,
      },
      {
        title: "5. Selesai & Berita Acara",
        actor: "Kepala Desa & Pengawas BPD",
        date: "Menunggu Penyelesaian Fisik",
        desc: "Unggah foto hasil akhir pengerjaan, penerbitan berita acara serah terima, dan penutupan tiket.",
        isComplete: false,
        isCurrent: false,
      },
    ],
  },
  "ADU-2026-0619": {
    nomor: "ADU-2026-0619",
    judul: "Pemasangan Lampu Penerangan Jalan Tenaga Surya Dusun Sumberwening",
    kategori: "Usulan Program Desa",
    lokasi: "Dusun Sumberwening RT 02 / RW 03",
    tanggalKirim: "28 Oktober 2026",
    statusLabel: "Tinjauan Pengawas BPD",
    currentStepIndex: 2,
    pengusul: "Warga Dusun Sumberwening",
    isAnonim: false,
    uraian:
      "Jalan tembus antar-RT sejauh 600 meter masih gelap gulita saat malam hari, rawan kecelakaan bagi anak sekolah dan warga pulang ibadah.",
    dokumenBukti: ["Surat_Dukungan_Warga_Sumberwening.pdf"],
    timeline: [
      {
        title: "1. Tiket Masuk",
        actor: "Sistem Transparansi AKAR",
        date: "28 Oktober 2026, 10:20 WIB",
        desc: "Aduan resmi diterima dan diberi nomor registrasi publik.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "2. Verifikasi Admin Desa",
        actor: "Kaur Perencanaan Desa",
        date: "29 Oktober 2026, 13:00 WIB",
        desc: "Verifikasi peta jalan dusun dan sinkronisasi kebutuhan titik tiang lampu tenaga surya.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "3. Tinjauan Pengawas BPD",
        actor: "Badan Permusyawaratan Desa (BPD)",
        date: "Sedang Berjalan",
        desc: "Pembahasan prioritas pada sidang Musdes untuk penganggaran pos energi baru terbarukan APBDes.",
        isComplete: false,
        isCurrent: true,
      },
      {
        title: "4. Tindak Lanjut Lapangan",
        actor: "Tim Pengadaan Desa",
        date: "Menunggu Ketetapan APBDes",
        desc: "Pengadaan unit tiang PJU solar cell dan pemasangan oleh teknisi warga lokal.",
        isComplete: false,
        isCurrent: false,
      },
      {
        title: "5. Selesai & Berita Acara",
        actor: "Pemerintah Desa Karang Sari",
        date: "Tahap Akhir",
        desc: "Uji alir kelistrikan dan serah terima aset ke pemeliharaan warga rukun tetangga.",
        isComplete: false,
        isCurrent: false,
      },
    ],
  },
  "ADU-2026-0412": {
    nomor: "ADU-2026-0412",
    judul: "Perbaikan Dinding Penahan Tebing Curam Dekat Pos Kamling RW 02",
    kategori: "Infrastruktur Rusak",
    lokasi: "Dusun Krajan RT 04 / RW 02",
    tanggalKirim: "18 Oktober 2026",
    statusLabel: "Selesai 100%",
    currentStepIndex: 4,
    pengusul: "Rukun Warga 02",
    isAnonim: false,
    uraian:
      "Tebing dekat pos ronda rawan longsor saat musim hujan, telah ditindaklanjuti lewat proyek sayembara swakelola pasangan batu kali selesai 100%.",
    dokumenBukti: ["Foto_Tebing_Selesai.jpg", "Berita_Acara_Serah_Terima.pdf"],
    timeline: [
      {
        title: "1. Tiket Masuk",
        actor: "Sistem Transparansi AKAR",
        date: "18 Oktober 2026, 08:30 WIB",
        desc: "Aduan bahaya longsor diterima prioritas tinggi.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "2. Verifikasi Admin Desa",
        actor: "Kaur Pembangunan Desa",
        date: "18 Oktober 2026, 11:15 WIB",
        desc: "Survei cepat lokasi dan penetapan status darurat bencana tanah longsor.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "3. Tinjauan Pengawas BPD",
        actor: "BPD Karang Sari",
        date: "19 Oktober 2026, 09:00 WIB",
        desc: "Persetujuan darurat alokasi pos tak terduga untuk pasangan batu belah.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "4. Tindak Lanjut Lapangan",
        actor: "Kelompok Pertukangan RW 02",
        date: "20 - 30 Oktober 2026",
        desc: "Konstruksi pasangan batu kali mortar sepanjang 45 meter diselesaikan oleh 12 tukang warga lokal.",
        isComplete: true,
        isCurrent: false,
      },
      {
        title: "5. Selesai & Berita Acara",
        actor: "Kepala Desa & Ketua BPD",
        date: "31 Oktober 2026, 15:00 WIB",
        desc: "Pekerjaan dinyatakan selesai 100% dan berita acara penutupan tiket dipublikasikan.",
        isComplete: true,
        isCurrent: true,
      },
    ],
  },
};

function formatTanggalIndo(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function mapApiTicketToDetail(apiData: {
  nomor: string;
  kategori: string;
  isi: string;
  status: string;
  tanggapan: string | null;
  tenggat: string;
  tenggatTerlewat: boolean;
  dibuatPada: string;
  proyek?: { id: string; judul: string } | null;
}): TicketDetail {
  const tanggalFormat = formatTanggalIndo(apiData.dibuatPada);
  const tenggatFormat = formatTanggalIndo(apiData.tenggat);

  let kategoriLabel = "Aduan Masyarakat";
  if (apiData.kategori === "DUGAAN_PENYIMPANGAN") kategoriLabel = "Dugaan Penyimpangan Dana";
  else if (apiData.kategori === "KERUSAKAN") kategoriLabel = "Infrastruktur Rusak";
  else if (apiData.kategori === "KETERLAMBATAN") kategoriLabel = "Keterlambatan Pengerjaan";

  let statusLabel = "Tiket Masuk";
  let stepIndex = 0;
  if (apiData.status === "DITINJAU") {
    statusLabel = "Diverifikasi & Ditinjau BPD";
    stepIndex = 1;
  } else if (apiData.status === "DITANGGAPI") {
    statusLabel = "Tindak Lanjut & Ditanggapi";
    stepIndex = 2;
  } else if (apiData.status === "SELESAI") {
    statusLabel = "Selesai 100%";
    stepIndex = 4;
  }

  const timeline: TimelineStep[] = [
    {
      title: "1. Tiket Masuk",
      actor: "Sistem Transparansi AKAR",
      date: tanggalFormat,
      desc: "Aduan resmi dicatat ke ledger audit desa dengan nomor tiket unik.",
      isComplete: true,
      isCurrent: stepIndex === 0,
    },
    {
      title: "2. Verifikasi Admin & BPD",
      actor: "Badan Permusyawaratan Desa (BPD)",
      date: stepIndex >= 1 ? "Telah Ditinjau" : "Dalam Antrean BPD",
      desc: "Verifikasi kelayakan dan pengecekan keabsahan aduan oleh perwakilan pengawas desa.",
      isComplete: stepIndex >= 1,
      isCurrent: stepIndex === 1,
    },
    {
      title: "3. Tanggapan & Tindak Lanjut",
      actor: "Pemerintah Desa Karang Sari",
      date: apiData.tanggapan
        ? "Tanggapan Diterbitkan"
        : apiData.tenggatTerlewat
        ? "Tenggat 14 Hari Terlewat"
        : `Batas Maksimal: ${tenggatFormat}`,
      desc: apiData.tanggapan
        ? `Tanggapan resmi pemerintah desa: "${apiData.tanggapan}"`
        : "Menunggu respon resmi dari tim pengelola desa dan TPK terkait.",
      isComplete: stepIndex >= 2,
      isCurrent: stepIndex === 2,
    },
    {
      title: "4. Pelaksanaan Lapangan",
      actor: "Tim Teknis / Swakelola Desa",
      date: stepIndex >= 4 ? "Selesai" : "Menunggu Rekomendasi",
      desc: "Langkah penanganan fisik, perbaikan lapangan, atau musyawarah penuntasan aduan.",
      isComplete: stepIndex >= 4,
      isCurrent: false,
    },
    {
      title: "5. Selesai & Berita Acara",
      actor: "Kepala Desa & Ketua BPD",
      date: stepIndex >= 4 ? "Selesai Ditutup" : "Tahap Akhir",
      desc: "Serah terima hasil penyelesaian dan penutupan tiket aduan secara transparan.",
      isComplete: stepIndex >= 4,
      isCurrent: stepIndex === 4,
    },
  ];

  return {
    nomor: apiData.nomor,
    judul: apiData.proyek?.judul
      ? `Aduan Proyek: ${apiData.proyek.judul}`
      : `Laporan Aduan: ${kategoriLabel}`,
    kategori: kategoriLabel,
    lokasi: apiData.proyek?.judul ? `Terkait Proyek: ${apiData.proyek.judul}` : "Wilayah Desa Karang Sari",
    tanggalKirim: tanggalFormat,
    statusLabel,
    currentStepIndex: stepIndex,
    pengusul: "Warga Terverifikasi",
    isAnonim: true,
    uraian: apiData.isi,
    tanggapan: apiData.tanggapan,
    tenggat: tenggatFormat,
    tenggatTerlewat: apiData.tenggatTerlewat,
    dokumenBukti: [],
    timeline,
  };
}

function LacakTiketContent() {
  const searchParams = useSearchParams();
  const initialKode = searchParams.get("kode") || "ADU-2026-0842";

  const [inputKode, setInputKode] = React.useState(initialKode);
  const [activeKode, setActiveKode] = React.useState(initialKode);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTicket, setActiveTicket] = React.useState<TicketDetail | null>(
    SAMPLE_TICKETS[initialKode] || SAMPLE_TICKETS["ADU-2026-0842"]
  );
  const [searchError, setSearchError] = React.useState<string | null>(null);

  // Search Ticket from Backend API or Fallback to Sample
  React.useEffect(() => {
    let isMounted = true;
    async function fetchTicket() {
      const cleanKode = activeKode.trim().toUpperCase();
      if (!cleanKode) return;

      setIsLoading(true);
      setSearchError(null);

      try {
        const res = await apiClient.get<{
          nomor: string;
          kategori: string;
          isi: string;
          status: string;
          tanggapan: string | null;
          tenggat: string;
          tenggatTerlewat: boolean;
          dibuatPada: string;
          proyek?: { id: string; judul: string } | null;
        }>(`/api/tiket/${encodeURIComponent(cleanKode)}`);

        if (isMounted) {
          if (res.data) {
            setActiveTicket(mapApiTicketToDetail(res.data));
            setIsLoading(false);
            return;
          }

          // Fallback to sample tickets dictionary
          if (SAMPLE_TICKETS[cleanKode]) {
            setActiveTicket(SAMPLE_TICKETS[cleanKode]);
            setIsLoading(false);
            return;
          }

          setActiveTicket(null);
          setSearchError(`Tiket dengan nomor '${cleanKode}' tidak ditemukan di sistem desa.`);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          if (SAMPLE_TICKETS[cleanKode]) {
            setActiveTicket(SAMPLE_TICKETS[cleanKode]);
          } else {
            setActiveTicket(null);
            setSearchError(`Gagal memuat tiket '${cleanKode}'. Silakan coba lagi.`);
          }
          setIsLoading(false);
        }
      }
    }

    fetchTicket();

    return () => {
      isMounted = false;
    };
  }, [activeKode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputKode.trim().toUpperCase();
    if (clean) {
      setActiveKode(clean);
    }
  };

  const handleSelectSample = (sample: string) => {
    setInputKode(sample);
    setActiveKode(sample);
  };

  return (
    <>
      {/* FRAME 1: Pencarian Tiket */}
      <section
        id="lacak-frame-1"
        aria-label="Pencarian Tiket Aduan"
        className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto w-full space-y-5">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 flex-wrap"
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#1F6F43] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <Link href="/aspirasi" className="hover:text-[#1F6F43] transition-colors">
            <span>Aspirasi &amp; Aduan</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-900 font-semibold">Lacak Tiket</span>
        </nav>

        {/* Search Header Container with Watermark */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-white rounded-2xl border border-emerald-200/80 p-6 sm:p-8 shadow-sm space-y-4">
          {/* Subtle Watermark Logo */}
          <div className="absolute -right-6 -bottom-6 w-44 h-44 opacity-10 pointer-events-none select-none">
            <Image
              src="/logo-akar.png"
              alt=""
              width={176}
              height={176}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="relative z-10 space-y-1">
            <Badge variant="default" className="text-xs font-semibold">
              Pelacakan Status Transparan
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Lacak Status Tiket Aduan &amp; Usulan Warga
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl">
              Masukkan kode tiket yang Anda peroleh saat mengirim aduan untuk melihat posisi
              penanganan riil oleh perangkat desa dan BPD sesuai batas waktu regulasi.
            </p>
          </div>

          {/* Search input form */}
          <form onSubmit={handleSearch} className="relative z-10 flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputKode}
                onChange={(e) => setInputKode(e.target.value)}
                placeholder="Contoh: ADU-2026-0842 atau TKT-..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold px-6 min-h-[44px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  <span>Mencari...</span>
                </span>
              ) : (
                <span>Cari Tiket</span>
              )}
            </Button>
          </form>

          {/* Quick Sample Clickable Chips */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Contoh Tiket Demo:</span>
            {Object.keys(SAMPLE_TICKETS).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleSelectSample(code)}
                className={`px-3 py-1.5 rounded-lg border font-mono font-semibold transition-all min-h-[36px] ${
                  activeKode === code
                    ? "bg-emerald-50 text-[#1F6F43] border-[#1F6F43]"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>

      {/* FRAME 2: Status & Timeline Tiket */}
      <section
        id="lacak-frame-2"
        aria-label="Status dan Timeline Penanganan Tiket"
        className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-200/80"
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col justify-start space-y-6">
        {searchError ? (
          /* Empty / Not Found State */
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <HelpCircle className="w-12 h-12 text-zinc-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">
                Tiket Tidak Ditemukan
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto">
                {searchError}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputKode("ADU-2026-0842");
                  setActiveKode("ADU-2026-0842");
                }}
                className="text-xs min-h-[44px]"
              >
                Muat Contoh Tiket Demo
              </Button>
              <Link href="/aspirasi">
                <Button
                  size="sm"
                  className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs min-h-[44px]"
                >
                  Kirim Aduan Baru
                </Button>
              </Link>
            </div>
          </div>
        ) : activeTicket ? (
          /* TICKET DETAILS CARD */
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Deadline Overdue Warning Banner (PRD FR-M3 & FR-C4) */}
            {activeTicket.tenggatTerlewat && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3 text-xs text-red-900">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Penanda Publik: Tanggapan Terlewat Tenggat 14 Hari
                  </span>
                  <p className="mt-0.5 leading-relaxed">
                    Tiket ini telah melewati batas waktu 14 hari kalender regulasi tanpa penyelesaian penuh. Ditandai merah secara otomatis di laporan audit publik.
                  </p>
                </div>
              </div>
            )}

            {/* Ticket Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-100">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-[#1F6F43] border border-emerald-200">
                    {activeTicket.nomor}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    {activeTicket.kategori}
                  </span>
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{activeTicket.tanggalKirim}</span>
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 leading-snug">
                  {activeTicket.judul}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8A5A2B]" />
                    <span>{activeTicket.lokasi}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-zinc-700">
                    <UserCheck className="w-3.5 h-3.5 text-[#1F6F43]" />
                    <span>Pelapor: {activeTicket.pengusul}</span>
                  </span>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                  Status Terkini:
                </span>
                <Badge variant="default" className="text-xs font-bold mt-1">
                  {activeTicket.statusLabel}
                </Badge>
              </div>
            </div>

            {/* Narrative Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Uraian Kondisi &amp; Kebutuhan:
              </h3>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                {activeTicket.uraian}
              </p>
            </div>

            {/* Tanggapan Resmi if present */}
            {activeTicket.tanggapan && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs space-y-1.5">
                <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1F6F43]" />
                  <span>Tanggapan Resmi Pemerintah Desa / BPD:</span>
                </span>
                <p className="text-zinc-700 leading-relaxed italic bg-white/70 p-3 rounded-lg border border-emerald-100">
                  &ldquo;{activeTicket.tanggapan}&rdquo;
                </p>
              </div>
            )}

            {/* Attached Proof Files */}
            {activeTicket.dokumenBukti.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-zinc-700 block">
                  Bukti Lampiran Lapangan Terverifikasi:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeTicket.dokumenBukti.map((dok, dIdx) => (
                    <span
                      key={dIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#1F6F43]" />
                      <span>{dok}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* VERTICAL TIMELINE OF PROGRESS (5 STAGES) */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1F6F43]" />
                <span>Jejak Timeline Penanganan Aduan (Audit Terbuka)</span>
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                {activeTicket.timeline.map((step, sIdx) => {
                  return (
                    <div key={sIdx} className="relative space-y-1 text-xs sm:text-sm">
                      {/* Step bullet indicator */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white transition-all ${
                          step.isComplete
                            ? "border-[#1F6F43] text-[#1F6F43] bg-emerald-50"
                            : step.isCurrent
                            ? "border-[#8A5A2B] text-[#8A5A2B] ring-4 ring-amber-100"
                            : "border-zinc-300 text-zinc-300"
                        }`}
                      >
                        {step.isComplete ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>

                      {/* Title and date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span
                          className={`font-bold text-sm ${
                            step.isCurrent
                              ? "text-[#8A5A2B]"
                              : step.isComplete
                              ? "text-zinc-900"
                              : "text-zinc-400"
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">
                          {step.date}
                        </span>
                      </div>

                      {/* Actor Badge */}
                      <div className="text-xs font-semibold text-zinc-500">
                        Pelaksana: <strong className="text-zinc-800">{step.actor}</strong>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-600 leading-relaxed pt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <Link
                href="/aspirasi"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-zinc-600 hover:text-zinc-900 font-semibold px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kirim Aspirasi Baru</span>
              </Link>

              <Link href="/kas" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full text-xs font-semibold gap-1.5 min-h-[44px] text-[#1F6F43] border-emerald-200 hover:bg-emerald-50"
                >
                  <span>Periksa Mutasi Kas Desa</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        </div>
      </section>
    </>
  );
}

export default function LacakTiketPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-zinc-900 font-sans">
      <Navbar />
      <main className="flex-1 pt-16">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center p-12 text-center text-xs text-zinc-500">
              Memuat data pelacakan tiket...
            </div>
          }
        >
          <LacakTiketContent />
        </React.Suspense>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
}
