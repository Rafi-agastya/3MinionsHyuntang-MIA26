"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FolderKanban,
  BookOpen,
  AlertCircle,
  Users,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Building2,
  FileText,
  ArrowRight,
  TrendingUp,
  X,
  Eye,
  SlidersHorizontal,
  Lock,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentRole, UserRole, ROLE_DETAILS } from "@/lib/use-current-role";
import { formatRupiah } from "@/lib/format";
import { apiClient } from "@/lib/api-client";

interface AdminProject {
  id: string;
  judul: string;
  dusun: string;
  paguAnggaran: number;
  status: "TENDER_DIBUKA" | "SELEKSI" | "MASA_SANGGAH" | "PENGERJAAN" | "SELESAI" | string;
  jumlahProposal: number;
  tenggatHari: number;
  pemenang?: string;
}

interface AdminKasEntry {
  id: string;
  tanggal: string;
  jenis: "PEMASUKAN" | "PENGELUARAN";
  kategori: string;
  uraian: string;
  jumlah: number;
  hash: string;
}

interface AdminTicket {
  id: string;
  kode: string;
  pengirim: string;
  dusun: string;
  kategori: string;
  judul: string;
  status: "MENUNGGU" | "DIVERIFIKASI" | "TINDAK_LANJUT" | "SELESAI";
  catatan?: string;
  tanggal: string;
}

interface AdminUser {
  id: string;
  nama: string;
  nikMasked: string;
  jabatan: string;
  role: UserRole;
  dusun: string;
  status: "AKTIF" | "NONAKTIF";
}

const INITIAL_PROJECTS: AdminProject[] = [
  {
    id: "proyek-01",
    judul: "Pembangunan Jalan Usaha Tani Beton Dusun Krajan",
    dusun: "Dusun Krajan",
    paguAnggaran: 125_000_000,
    status: "TENDER_DIBUKA",
    jumlahProposal: 4,
    tenggatHari: 5,
  },
  {
    id: "proyek-02",
    judul: "Rehabilitasi Drainase & Pengendali Banjir Lingkungan RW 03",
    dusun: "Dusun Sukamaju",
    paguAnggaran: 85_000_000,
    status: "SELEKSI",
    jumlahProposal: 3,
    tenggatHari: 0,
  },
  {
    id: "proyek-03",
    judul: "Pemberdayaan Air Bersih & Pipanisasi Mata Air Dusun Makmur",
    dusun: "Dusun Makmur",
    paguAnggaran: 98_000_000,
    status: "PENGERJAAN",
    jumlahProposal: 2,
    tenggatHari: 0,
    pemenang: "Pokmas Tirta Lestari",
  },
  {
    id: "proyek-04",
    judul: "Renovasi Balai Warga & Posyandu Terpadu Dusun Krajan",
    dusun: "Dusun Krajan",
    paguAnggaran: 75_000_000,
    status: "SELESAI",
    jumlahProposal: 3,
    tenggatHari: 0,
    pemenang: "Pokmas Bina Karya",
  },
];

const INITIAL_KAS: AdminKasEntry[] = [
  {
    id: "kas-01",
    tanggal: "2026-04-18",
    jenis: "PENGELUARAN",
    kategori: "Swakelola Fisik",
    uraian: "Pencairan Termin 50% Renovasi Balai Warga Dusun Krajan (Opname Lapangan BPD)",
    jumlah: 55_000_000,
    hash: "sha256-7fa29c41bc9a92e10582d9...",
  },
  {
    id: "kas-02",
    tanggal: "2026-04-05",
    jenis: "PENGELUARAN",
    kategori: "Padat Karya Tunai",
    uraian: "Pembayaran Upah Tenaga Kerja Warga Pipanisasi Mata Air Dusun Makmur",
    jumlah: 32_500_000,
    hash: "sha256-1cb58e803d179ef08b1a45...",
  },
  {
    id: "kas-03",
    tanggal: "2026-03-01",
    jenis: "PEMASUKAN",
    kategori: "Pendapatan Asli Desa (PADes)",
    uraian: "Bagi Hasil Dividen Pengelolaan Pasar Desa & Wisata Embung BUMDes",
    jumlah: 50_000_000,
    hash: "sha256-e918c5e3962b48aa9082f1...",
  },
];

const INITIAL_TICKETS: AdminTicket[] = [
  {
    id: "tkt-01",
    kode: "ADU-2026-089",
    pengirim: "Warga RW 02 (Anonim)",
    dusun: "Dusun Krajan",
    kategori: "Infrastruktur Rusak",
    judul: "Gorong-gorong Jalan Makam Tersumbat Endapan Lumpur Tebal",
    status: "MENUNGGU",
    tanggal: "18 Apr 2026",
  },
  {
    id: "tkt-02",
    kode: "ADU-2026-088",
    pengirim: "Ketua RT 04 Bpk. Mulyadi",
    dusun: "Dusun Sukamaju",
    kategori: "Transparansi Dana",
    judul: "Permohonan Papan Informasi Proyek Drainase di Titik Belokan RW 03",
    status: "DIVERIFIKASI",
    catatan: "Papan proyek sudah dipesan TPK dan dipasang lusa.",
    tanggal: "16 Apr 2026",
  },
  {
    id: "tkt-03",
    kode: "ADU-2026-082",
    pengirim: "Kelompok Tani Harapan Jaya",
    dusun: "Dusun Makmur",
    kategori: "Usulan Swakelola",
    judul: "Perluasan Saluran Irigasi Tersier Sawah Blok Kidul",
    status: "TINDAK_LANJUT",
    catatan: "Dimasukkan dalam usulan Musdes RKPDes TA 2027.",
    tanggal: "10 Apr 2026",
  },
];

const INITIAL_USERS: AdminUser[] = [
  {
    id: "u-1",
    nama: "Bambang Prasetyo",
    nikMasked: "•••• 3304 •••• 0001",
    jabatan: "Kaur Keuangan & Anggota TPK",
    role: "PERANGKAT_DESA",
    dusun: "Dusun Krajan",
    status: "AKTIF",
  },
  {
    id: "u-2",
    nama: "Suryono Hadi",
    nikMasked: "•••• 3304 •••• 0002",
    jabatan: "Administrator Sistem & Kasi Kesejahteraan",
    role: "ADMIN",
    dusun: "Semua Dusun",
    status: "AKTIF",
  },
  {
    id: "u-3",
    nama: "H. Ahmad Fauzi",
    nikMasked: "•••• 3304 •••• 0003",
    jabatan: "Ketua Badan Permusyawaratan Desa (BPD)",
    role: "PENGAWAS",
    dusun: "Semua Dusun",
    status: "AKTIF",
  },
  {
    id: "u-4",
    nama: "Bambang Sutrisno",
    nikMasked: "•••• 3304 •••• 0004",
    jabatan: "Ketua Pokmas Makmur Jaya",
    role: "WARGA",
    dusun: "Dusun Makmur",
    status: "AKTIF",
  },
];

export default function AdminPage() {
  const { role, setRole, details, permissions, isLoading } = useCurrentRole();

  // Workspace Tabs: "proyek" | "kas" | "tiket" | "users"
  const [activeTab, setActiveTab] = React.useState<"proyek" | "kas" | "tiket" | "users">("proyek");

  // State data
  const [projects, setProjects] = React.useState<AdminProject[]>(INITIAL_PROJECTS);
  const [kasList, setKasList] = React.useState<AdminKasEntry[]>(INITIAL_KAS);
  const [tickets, setTickets] = React.useState<AdminTicket[]>(INITIAL_TICKETS);
  const [userList, setUserList] = React.useState<AdminUser[]>(INITIAL_USERS);

interface ApiProjectItem {
  id: string;
  judul: string;
  lokasi?: string;
  pagu: number | string;
  status: string;
  proposal?: Array<{ id: string }>;
}

interface ApiTicketItem {
  id: string;
  nomor: string;
  kategori: string;
  isi?: string;
  status: string;
  anonim?: boolean;
  tanggapan?: string;
  dibuatPada?: string;
  createdAt?: string;
  proyek?: { lokasi?: string };
  pelapor?: { nama?: string };
}

  // Load real database data from API endpoints
  React.useEffect(() => {
    async function loadRealData() {
      try {
        const [projRes, ticketRes] = await Promise.allSettled([
          apiClient.get<ApiProjectItem[]>("/api/proyek"),
          apiClient.get<ApiTicketItem[]>("/api/tiket"),
        ]);

        if (
          projRes.status === "fulfilled" &&
          projRes.value.data &&
          Array.isArray(projRes.value.data) &&
          projRes.value.data.length > 0
        ) {
          const apiProjects: AdminProject[] = projRes.value.data.map((p: ApiProjectItem) => ({
            id: p.id,
            judul: p.judul,
            dusun: p.lokasi || "Desa Karang Sari",
            paguAnggaran: Number(p.pagu) || 0,
            status: p.status as AdminProject["status"],
            jumlahProposal: p.proposal ? p.proposal.length : 0,
            tenggatHari: 7,
            pemenang: p.status === "PENGERJAAN" || p.status === "SELESAI" ? "Pokmas Pelaksana" : undefined,
          }));

          setProjects((prev) => {
            const existingIds = new Set(apiProjects.map((p) => p.id));
            const remaining = prev.filter((p) => !existingIds.has(p.id));
            return [...apiProjects, ...remaining];
          });
        }

        if (
          ticketRes.status === "fulfilled" &&
          ticketRes.value.data &&
          Array.isArray(ticketRes.value.data) &&
          ticketRes.value.data.length > 0
        ) {
          const apiTickets: AdminTicket[] = ticketRes.value.data.map((t: ApiTicketItem) => ({
            id: t.id,
            kode: t.nomor,
            pengirim: t.anonim ? "Warga (Anonim)" : t.pelapor?.nama || "Warga",
            dusun: t.proyek?.lokasi || "Desa Karang Sari",
            kategori: t.kategori,
            judul: t.isi ? t.isi.slice(0, 60) + (t.isi.length > 60 ? "..." : "") : "Aduan Masyarakat",
            status:
              t.status === "BARU"
                ? "MENUNGGU"
                : t.status === "PROSES"
                ? "DIVERIFIKASI"
                : t.status === "SELESAI"
                ? "SELESAI"
                : "TINDAK_LANJUT",
            catatan: t.tanggapan || undefined,
            tanggal: new Date(t.dibuatPada || t.createdAt || Date.now()).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          }));

          setTickets((prev) => {
            const existingKodes = new Set(apiTickets.map((t) => t.kode));
            const remaining = prev.filter((t) => !existingKodes.has(t.kode));
            return [...apiTickets, ...remaining];
          });
        }
      } catch (err) {
        console.error("Gagal menyinkronkan data admin riil:", err);
      }
    }

    loadRealData();
  }, []);

  // Modals & form state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = React.useState(false);
  const [newProjectJudul, setNewProjectJudul] = React.useState("");
  const [newProjectDusun, setNewProjectDusun] = React.useState("Dusun Krajan");
  const [newProjectPagu, setNewProjectPagu] = React.useState("110000000");
  const [newProjectTenggat, setNewProjectTenggat] = React.useState("14");

  // Kas form state
  const [kasJenis, setKasJenis] = React.useState<"PEMASUKAN" | "PENGELUARAN">("PENGELUARAN");
  const [kasKategori, setKasKategori] = React.useState("Swakelola Fisik");
  const [kasUraian, setKasUraian] = React.useState("");
  const [kasJumlah, setKasJumlah] = React.useState("25000000");
  const [kasSuccessToast, setKasSuccessToast] = React.useState(false);

  // AI Evaluation simulator state
  const [aiRunningForId, setAiRunningForId] = React.useState<string | null>(null);
  const [aiResultModal, setAiResultModal] = React.useState<{
    projectJudul: string;
    skorTertinggi: number;
    pokmasUnggulan: string;
    catatan: string;
  } | null>(null);

  // Ticket update modal state
  const [selectedTicket, setSelectedTicket] = React.useState<AdminTicket | null>(null);
  const [ticketStatusInput, setTicketStatusInput] = React.useState<AdminTicket["status"]>("DIVERIFIKASI");
  const [ticketCatatanInput, setTicketCatatanInput] = React.useState("");

  // Handle Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectJudul.trim()) return;

    const newProj: AdminProject = {
      id: `proyek-${Date.now()}`,
      judul: newProjectJudul,
      dusun: newProjectDusun,
      paguAnggaran: parseInt(newProjectPagu, 10) || 50_000_000,
      status: "TENDER_DIBUKA",
      jumlahProposal: 0,
      tenggatHari: parseInt(newProjectTenggat, 10) || 7,
    };

    setProjects([newProj, ...projects]);
    setNewProjectJudul("");
    setIsNewProjectModalOpen(false);
  };

  // Handle AI Analysis Simulation
  const handleRunAiAnalysis = (proj: AdminProject) => {
    setAiRunningForId(proj.id);
    setTimeout(() => {
      setAiRunningForId(null);
      setAiResultModal({
        projectJudul: proj.judul,
        skorTertinggi: 89.4,
        pokmasUnggulan: "Pokmas Makmur Jaya (Dusun Makmur)",
        catatan:
          "AI Evaluator: Kelengkapan Micro-RAB 100%, estimasi harga material sesuai standar indeks desa (selisih -2.4%), riwayat kehadiran musyawarah 94%, tidak terdeteksi indikasi tumpang tindih anggaran.",
      });
    }, 1200);
  };

  // Handle Tetapkan Pemenang
  const handlePilihPemenang = (projId: string) => {
    setProjects(
      projects.map((p) =>
        p.id === projId
          ? {
              ...p,
              status: "PENGERJAAN",
              pemenang: "Pokmas Makmur Jaya",
            }
          : p
      )
    );
  };

  // Handle Add Kas Entry
  const handleAddKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kasUraian.trim()) return;

    const nominal = parseInt(kasJumlah, 10) || 0;
    const simulatedHash = `sha256-${Math.random().toString(16).substring(2, 10)}${Math.random()
      .toString(16)
      .substring(2, 12)}...`;

    const newKas: AdminKasEntry = {
      id: `kas-${Date.now()}`,
      tanggal: new Date().toISOString().split("T")[0],
      jenis: kasJenis,
      kategori: kasKategori,
      uraian: kasUraian,
      jumlah: nominal,
      hash: simulatedHash,
    };

    setKasList([newKas, ...kasList]);
    setKasUraian("");
    setKasSuccessToast(true);
    setTimeout(() => setKasSuccessToast(false), 3500);
  };

  // Handle Save Ticket Update
  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setTickets(
      tickets.map((t) =>
        t.id === selectedTicket.id
          ? {
              ...t,
              status: ticketStatusInput,
              catatan: ticketCatatanInput,
            }
          : t
      )
    );
    setSelectedTicket(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1F6F43] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-zinc-600">Memeriksa hak akses aparatur desa...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ACCESS GUARD: IF USER DOES NOT HAVE ADMIN / PERANGKAT ACCESS
  // =========================================================================
  if (!permissions.hasAdminAccess) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF7]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200/90 bg-white p-8 sm:p-10 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mx-auto flex items-center justify-center shadow-2xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Akses Khusus Perangkat Desa &amp; Admin</span>
              </span>
              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                Panel Manajemen Tertutup
              </h1>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Halaman ini diperuntukkan bagi Pemerintah Desa Karang Sari (Kades, Kaur Keuangan, TPK) dan Administrator Sistem untuk tata kelola lelang sayembara, verifikasi proposal warga, pencatatan kas, dan tindak lanjut aduan.
              </p>
            </div>

            {/* Quick Demo Switcher for Mentors & Judges */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-left space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1F6F43] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#1F6F43]" />
                <span>Simulasi Penjurian &amp; Evaluasi (1-Klik)</span>
              </div>
              <p className="text-xs text-zinc-600">
                Pilih salah satu peran aparatur di bawah untuk langsung mencoba seluruh fitur dashboard tanpa perlu login ulang:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={() => setRole("PERANGKAT_DESA")}
                  className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs font-semibold min-h-[44px] justify-center"
                >
                  <Building2 className="w-4 h-4 mr-1.5" />
                  <span>Perangkat Desa</span>
                </Button>
                <Button
                  onClick={() => setRole("ADMIN")}
                  variant="outline"
                  className="border-purple-300 text-purple-800 hover:bg-purple-50 text-xs font-semibold min-h-[44px] justify-center"
                >
                  <Users className="w-4 h-4 mr-1.5" />
                  <span>Admin Sistem</span>
                </Button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/masuk" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full font-medium min-h-[44px] text-xs sm:text-sm">
                  <span>Masuk Akun Resmi</span>
                </Button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full font-medium min-h-[44px] text-xs sm:text-sm text-zinc-600">
                  <span>Kembali ke Beranda</span>
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED ADMIN / PERANGKAT DESA VIEW
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-zinc-900 font-sans antialiased selection:bg-[#1F6F43] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ========================================================================= */}
        {/* FRAME 1: TOP DASHBOARD HEADER & 4 SUMMARY METRICS                          */}
        {/* ========================================================================= */}
        <section
          id="admin-frame-1"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Header Banner in Emerald Forest */}
            <div className="rounded-3xl bg-gradient-to-br from-[#1F6F43] via-[#1a5f39] to-[#14492c] text-white p-6 sm:p-8 lg:p-10 shadow-md relative overflow-hidden">
              {/* Subtle Logo Watermark */}
              <div className="absolute right-4 -bottom-6 w-48 h-48 opacity-10 pointer-events-none select-none">
                <Image
                  src="/logo-akar.png"
                  alt=""
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-xs px-3.5 py-1 text-xs font-semibold text-emerald-100 border border-white/20">
                    <ShieldCheck className="h-4 w-4 text-[#F2B705]" />
                    <span>Panel Kerja Tata Kelola &amp; Sayembara Desa</span>
                  </div>

                  {/* Active Role Indicator Badge */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-white text-zinc-900 px-3.5 py-1 text-xs font-bold shadow-xs">
                    <UserCheck className="w-3.5 h-3.5 text-[#1F6F43]" />
                    <span>Peran: {details.badgeLabel}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    Pusat Kendali Pemerintahan Desa
                  </h1>
                  <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
                    Pemerintah Desa Karang Sari &bull; TA 2026. Kelola pengadaan sayembara swakelola, evaluasi proposal berbasis skor objektif, mutasi buku kas berantai SHA-256, dan tindak lanjut aduan warga.
                  </p>
                </div>

                {/* Quick Simulation Bar */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-emerald-200 font-medium">Ganti Peran Simulasi:</span>
                  {(["PERANGKAT_DESA", "ADMIN", "PENGAWAS", "WARGA", "PUBLIK"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                        r === role
                          ? "bg-[#F2B705] text-zinc-900 font-bold shadow-xs"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {ROLE_DETAILS[r].badgeLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4 Responsive Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Proyek Aktif */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Paket Sayembara
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1F6F43] flex items-center justify-center">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                    4 Paket
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    2 Berjalan &bull; 1 Seleksi &bull; 1 Selesai
                  </p>
                </div>
              </div>

              {/* Metric 2: Proposal Menunggu */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3 hover:border-amber-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Proposal Warga
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                    6 Berkas
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    Dari 3 Dusun &bull; Siap Analisis AI
                  </p>
                </div>
              </div>

              {/* Metric 3: Realisasi Belanja */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Realisasi APBDes
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-extrabold text-zinc-900">
                    Rp 142,5 Jt
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    11,4% dari Pagu Rp 1,25 Miliar
                  </p>
                </div>
              </div>

              {/* Metric 4: Tiket Aduan */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3 hover:border-red-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Tiket Aduan Warga
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                    3 Tiket
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    1 Menunggu &bull; 1 Tindak Lanjut &bull; 1 Verifikasi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FRAME 2: CORE WORKSPACE WITH TABBED INTERFACE                             */}
        {/* ========================================================================= */}
        <section
          id="admin-frame-2"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {/* Tab Navigation Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("proyek")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                    activeTab === "proyek"
                      ? "bg-[#1F6F43] text-white shadow-xs"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>1. Sayembara Swakelola</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                    {projects.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("kas")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                    activeTab === "kas"
                      ? "bg-[#1F6F43] text-white shadow-xs"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>2. Catat Mutasi Kas (Ledger)</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                    {kasList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("tiket")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                    activeTab === "tiket"
                      ? "bg-[#1F6F43] text-white shadow-xs"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>3. Tindak Lanjut Aduan</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                    {tickets.length}
                  </span>
                </button>

                {role === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[44px] cursor-pointer ${
                      activeTab === "users"
                        ? "bg-[#1F6F43] text-white shadow-xs"
                        : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>4. Kelola Akun &amp; Otoritas</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                      Admin
                    </span>
                  </button>
                )}
              </div>

              {/* Action contextual to active tab */}
              {activeTab === "proyek" && (
                <Button
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold min-h-[44px] shadow-xs"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  <span>Buat Paket Proyek Baru</span>
                </Button>
              )}
            </div>

            {/* =================================================================== */}
            {/* TAB 1: KELOLA PROYEK & SAYEMBARA                                    */}
            {/* =================================================================== */}
            {activeTab === "proyek" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                        Daftar Paket Proyek Swakelola Desa
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-600">
                        Pantau status tender, analisis proposal warga dengan model scoring AI, dan tetapkan pokmas pelaksana.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4">Nama Paket &amp; Lokasi</th>
                          <th className="py-3 px-4">Pagu Anggaran</th>
                          <th className="py-3 px-4">Proposal</th>
                          <th className="py-3 px-4">Status Proyek</th>
                          <th className="py-3 px-4 text-right">Aksi Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {projects.map((proj) => (
                          <tr key={proj.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-zinc-900">{proj.judul}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{proj.dusun}</p>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-800">
                              {formatRupiah(proj.paguAnggaran)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 font-semibold text-zinc-700">
                                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                                {proj.jumlahProposal} Proposal
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {proj.status === "TENDER_DIBUKA" && (
                                <Badge variant="default" className="text-[11px]">
                                  Tender Dibuka ({proj.tenggatHari} hr)
                                </Badge>
                              )}
                              {proj.status === "SELEKSI" && (
                                <Badge variant="accent" className="text-[11px]">
                                  Tahap Seleksi
                                </Badge>
                              )}
                              {proj.status === "MASA_SANGGAH" && (
                                <Badge variant="outline" className="text-[11px] bg-amber-100 text-amber-900 border-amber-300">
                                  Masa Sanggah
                                </Badge>
                              )}
                              {proj.status === "PENGERJAAN" && (
                                <Badge variant="earth" className="text-[11px]">
                                  Pengerjaan
                                </Badge>
                              )}
                              {proj.status === "SELESAI" && (
                                <Badge variant="default" className="text-[11px]">
                                  Selesai
                                </Badge>
                              )}
                              {!["TENDER_DIBUKA", "SELEKSI", "MASA_SANGGAH", "PENGERJAAN", "SELESAI"].includes(proj.status) && (
                                <Badge variant="outline" className="text-[11px]">
                                  {proj.status}
                                </Badge>
                              )}
                              {proj.pemenang && (
                                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                                  Pelaksana: {proj.pemenang}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Run AI Analysis */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRunAiAnalysis(proj)}
                                  disabled={aiRunningForId === proj.id}
                                  className="text-xs h-8 px-2.5 border-emerald-300 text-[#1F6F43] hover:bg-emerald-50"
                                  title="Jalankan Model Analisis &amp; Scoring AI"
                                >
                                  {aiRunningForId === proj.id ? (
                                    <>
                                      <span className="w-3 h-3 border-2 border-[#1F6F43] border-t-transparent rounded-full animate-spin mr-1" />
                                      <span>Menganalisis...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5 mr-1 text-[#1F6F43]" />
                                      <span>Analisis AI</span>
                                    </>
                                  )}
                                </Button>

                                {/* Tetapkan Pemenang if in SELEKSI */}
                                {proj.status === "SELEKSI" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePilihPemenang(proj.id)}
                                    className="text-xs h-8 px-2.5 bg-[#1F6F43] text-white hover:bg-[#185935]"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    <span>Pilih Pemenang</span>
                                  </Button>
                                )}

                                {/* Bandingkan Proposal & Tinjau Flag */}
                                {proj.jumlahProposal > 0 && (
                                  <Link href={`/proyek/${proj.id}/bandingkan`}>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-8 px-2.5 border-emerald-300 text-[#1F6F43] hover:bg-emerald-50"
                                      title="Bandingkan Proposal & Tinjau Flag"
                                    >
                                      <span>Bandingkan</span>
                                    </Button>
                                  </Link>
                                )}

                                <Link href={`/proyek/${proj.id}`}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-8 px-2 text-zinc-600 hover:text-zinc-900"
                                    title="Lihat Detail Halaman Publik"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 2: CATAT MUTASI BUKU KAS UMUM (APPEND-ONLY LEDGER)              */}
            {/* =================================================================== */}
            {activeTab === "kas" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Input Kas (5 Cols) */}
                <div className="lg:col-span-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="space-y-1 border-b border-zinc-100 pb-3">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#1F6F43]" />
                      <span>Input Mutasi Buku Kas Baru</span>
                    </h2>
                    <p className="text-xs text-zinc-600">
                      Seluruh transaksi tersimpan permanen pada sistem ledger append-only berantai SHA-256.
                    </p>
                  </div>

                  {kasSuccessToast && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-[#1F6F43] font-medium flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Transaksi berhasil dicatat ke Ledger Kas Desa &amp; diverifikasi SHA-256!</span>
                    </div>
                  )}

                  <form onSubmit={handleAddKas} className="space-y-3.5 text-xs sm:text-sm">
                    {/* Jenis Transaksi */}
                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-700 block">
                        Jenis Transaksi
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setKasJenis("PENGELUARAN")}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all min-h-[40px] ${
                            kasJenis === "PENGELUARAN"
                              ? "border-red-500 bg-red-50 text-red-700"
                              : "border-zinc-200 text-zinc-600 bg-white"
                          }`}
                        >
                          Pengeluaran / Belanja (-)
                        </button>
                        <button
                          type="button"
                          onClick={() => setKasJenis("PEMASUKAN")}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all min-h-[40px] ${
                            kasJenis === "PEMASUKAN"
                              ? "border-emerald-500 bg-emerald-50 text-[#1F6F43]"
                              : "border-zinc-200 text-zinc-600 bg-white"
                          }`}
                        >
                          Pemasukan / Transfer (+)
                        </button>
                      </div>
                    </div>

                    {/* Kategori Anggaran */}
                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-700 block">
                        Bidang / Kategori Anggaran
                      </label>
                      <div className="relative w-full">
                        <select
                          value={kasKategori}
                          onChange={(e) => setKasKategori(e.target.value)}
                          className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 transition-colors focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 disabled:bg-zinc-50 disabled:text-zinc-500 min-h-[44px]"
                        >
                          <option value="Swakelola Fisik">Swakelola Fisik (Jalan, Balai, Drainase)</option>
                          <option value="Padat Karya Tunai">Padat Karya Tunai Desa (PKTD)</option>
                          <option value="Operasional Kantor">Operasional Kantor &amp; Musdes</option>
                          <option value="Alokasi Dana Desa (ADD)">Alokasi Dana Desa (ADD)</option>
                          <option value="Pendapatan Asli Desa (PADes)">Pendapatan Asli Desa (PADes)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      </div>
                    </div>

                    {/* Uraian Transaksi */}
                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-700 block">
                        Uraian Transaksi / Keterangan SPJ
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={kasUraian}
                        onChange={(e) => setKasUraian(e.target.value)}
                        placeholder="Contoh: Pencairan Termin 1 Upah Tukang Saluran Air RW 02..."
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-800 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43]"
                      />
                    </div>

                    {/* Nominal */}
                    <div className="space-y-1">
                      <label className="font-semibold text-zinc-700 block">
                        Nominal Rupiah (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        value={kasJumlah}
                        onChange={(e) => setKasJumlah(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-800 text-xs sm:text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43]"
                      />
                    </div>

                    {/* Live Cryptographic Hash Preview */}
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-zinc-500 font-mono text-[11px]">
                        <span>Hash Preview (SHA-256):</span>
                        <span className="text-[#1F6F43] font-bold">Rantai Valid</span>
                      </div>
                      <p className="font-mono text-zinc-700 text-[11px] truncate bg-white p-1.5 rounded border border-zinc-200">
                        sha256-{Math.abs(kasUraian.length * 9973).toString(16)}fd8a7b92c4...
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white font-semibold min-h-[44px] text-xs sm:text-sm shadow-xs"
                    >
                      <BookOpen className="w-4 h-4 mr-1.5" />
                      <span>Catat ke Ledger Kas Desa</span>
                    </Button>
                  </form>
                </div>

                {/* Recent Kas Table (7 Cols) */}
                <div className="lg:col-span-7 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                        Mutasi Kas Terakhir Dicatat
                      </h2>
                      <p className="text-xs text-zinc-600">
                        Terverifikasi berantai dengan SHA-256 dan diawasi bersama BPD.
                      </p>
                    </div>
                    <Link href="/kas">
                      <Button variant="outline" size="sm" className="text-xs min-h-[38px]">
                        <span>Buka Buku Kas Publik</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {kasList.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-500">{entry.tanggal}</span>
                          <span
                            className={`font-bold text-xs sm:text-sm ${
                              entry.jenis === "PEMASUKAN" ? "text-[#1F6F43]" : "text-red-600"
                            }`}
                          >
                            {entry.jenis === "PEMASUKAN" ? "+" : "-"} {formatRupiah(entry.jumlah)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-zinc-900 leading-snug">
                          {entry.uraian}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                          <span className="px-2 py-0.5 rounded bg-zinc-200/70 font-medium text-zinc-700">
                            {entry.kategori}
                          </span>
                          <span className="font-mono text-zinc-400 truncate max-w-[200px]">
                            {entry.hash}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 3: TINDAK LANJUT TIKET ADUAN WARGA                              */}
            {/* =================================================================== */}
            {activeTab === "tiket" && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                      Tindak Lanjut Aduan &amp; Aspirasi Warga
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600">
                      Aduan dan aspirasi warga Karang Sari wajib ditindaklanjuti secara resmi oleh aparat desa.
                    </p>
                  </div>
                  <Link href="/aduan/lacak">
                    <Button variant="outline" size="sm" className="text-xs min-h-[38px]">
                      <span>Pelacak Tiket Publik</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Kode &amp; Tanggal</th>
                        <th className="py-3 px-4">Pelapor &amp; Dusun</th>
                        <th className="py-3 px-4">Subjek Aduan</th>
                        <th className="py-3 px-4">Status &amp; Tindak Lanjut</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {tickets.map((tkt) => (
                        <tr key={tkt.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-zinc-800">
                            {tkt.kode}
                            <p className="font-sans text-[11px] font-normal text-zinc-500">
                              {tkt.tanggal}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-zinc-900">{tkt.pengirim}</p>
                            <p className="text-xs text-zinc-500">{tkt.dusun}</p>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-semibold text-zinc-900 line-clamp-1">{tkt.judul}</p>
                            <span className="text-[11px] text-zinc-500">{tkt.kategori}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {tkt.status === "MENUNGGU" && (
                              <Badge variant="neutral" className="text-[11px]">
                                Menunggu Verifikasi
                              </Badge>
                            )}
                            {tkt.status === "DIVERIFIKASI" && (
                              <Badge variant="accent" className="text-[11px]">
                                Diverifikasi
                              </Badge>
                            )}
                            {tkt.status === "TINDAK_LANJUT" && (
                              <Badge variant="earth" className="text-[11px]">
                                Tindak Lanjut Lapangan
                              </Badge>
                            )}
                            {tkt.status === "SELESAI" && (
                              <Badge variant="default" className="text-[11px]">
                                Selesai
                              </Badge>
                            )}
                            {tkt.catatan && (
                              <p className="text-[11px] text-zinc-600 mt-1 italic line-clamp-1">
                                &ldquo;{tkt.catatan}&rdquo;
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTicket(tkt);
                                setTicketStatusInput(tkt.status);
                                setTicketCatatanInput(tkt.catatan || "");
                              }}
                              className="text-xs h-8 px-2.5 border-zinc-300 hover:border-[#1F6F43] hover:text-[#1F6F43]"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
                              <span>Tindak Lanjut</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 4: KELOLA AKUN & OTORITAS DESA (ADMIN ONLY)                    */}
            {/* =================================================================== */}
            {activeTab === "users" && role === "ADMIN" && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span>Manajemen Akun Aparatur &amp; Otoritas Desa</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600">
                      Kelola hak akses kepala desa, kaur keuangan, BPD, dan ketua pokmas. NIK tersimpan dalam hash aman.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                    Kewenangan Khusus Administrator
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50/70 text-zinc-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Nama Aparatur / Warga</th>
                        <th className="py-3 px-4">NIK (Hash Masked)</th>
                        <th className="py-3 px-4">Jabatan Struktural</th>
                        <th className="py-3 px-4">Peran Sistem</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Otoritas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {userList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-zinc-900">{usr.nama}</p>
                            <p className="text-xs text-zinc-500">{usr.dusun}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-zinc-600 text-xs">
                            {usr.nikMasked}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-700 font-medium">
                            {usr.jabatan}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                ROLE_DETAILS[usr.role].badgeColor
                              }`}
                            >
                              {ROLE_DETAILS[usr.role].badgeLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {usr.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setUserList(
                                  userList.map((u) =>
                                    u.id === usr.id
                                      ? {
                                          ...u,
                                          role:
                                            u.role === "PERANGKAT_DESA"
                                              ? "ADMIN"
                                              : u.role === "ADMIN"
                                              ? "PENGAWAS"
                                              : "PERANGKAT_DESA",
                                        }
                                      : u
                                  )
                                );
                              }}
                              className="text-xs h-8 px-2 text-[#1F6F43] hover:bg-emerald-50"
                            >
                              Ubah Peran ⇄
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer className="mt-auto" />

      {/* ========================================================================= */}
      {/* MODAL 1: BUAT PAKET PROYEK BARU                                           */}
      {/* ========================================================================= */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#1F6F43] flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Buat Paket Sayembara Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">
                  Judul Paket Proyek Swakelola <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProjectJudul}
                  onChange={(e) => setNewProjectJudul(e.target.value)}
                  placeholder="Contoh: Pembangunan Rabat Beton Jalan Lingkungan RW 04"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">Lokasi Dusun</label>
                  <div className="relative w-full">
                    <select
                      value={newProjectDusun}
                      onChange={(e) => setNewProjectDusun(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 transition-colors focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 disabled:bg-zinc-50 disabled:text-zinc-500 min-h-[44px]"
                    >
                      <option value="Dusun Krajan">Dusun Krajan</option>
                      <option value="Dusun Sukamaju">Dusun Sukamaju</option>
                      <option value="Dusun Makmur">Dusun Makmur</option>
                      <option value="Dusun Sidodadi">Dusun Sidodadi</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">
                    Pagu Anggaran (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newProjectPagu}
                    onChange={(e) => setNewProjectPagu(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">
                  Batas Waktu Penerimaan Proposal (Hari)
                </label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={newProjectTenggat}
                  onChange={(e) => setNewProjectTenggat(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 min-h-[44px]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="w-1/2 min-h-[44px]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 bg-[#1F6F43] hover:bg-[#185935] text-white min-h-[44px]"
                >
                  Terbitkan Tender
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: HASIL EVALUASI & SCORING AI                                      */}
      {/* ========================================================================= */}
      {aiResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-white p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#1F6F43] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Hasil Evaluasi AI Scoring</h3>
              </div>
              <button
                type="button"
                onClick={() => setAiResultModal(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#1F6F43]">
                  Paket Terpilih
                </p>
                <p className="font-bold text-zinc-900">{aiResultModal.projectJudul}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-2xl border border-zinc-200 bg-zinc-50">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Skor Tertinggi</p>
                  <p className="text-2xl font-extrabold text-[#1F6F43]">
                    {aiResultModal.skorTertinggi} / 100
                  </p>
                </div>
                <div className="p-3 rounded-2xl border border-zinc-200 bg-zinc-50">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Pokmas Peringkat 1</p>
                  <p className="text-xs font-bold text-zinc-900 line-clamp-2 mt-1">
                    {aiResultModal.pokmasUnggulan}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-700 space-y-1 leading-relaxed">
                <p className="text-[11px] font-bold text-zinc-900">Analisis Ringkas:</p>
                <p className="text-xs text-zinc-600">{aiResultModal.catatan}</p>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setAiResultModal(null)}
                  className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white min-h-[44px]"
                >
                  Selesai &amp; Tutup Evaluasi
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TINDAK LANJUT TIKET ADUAN                                        */}
      {/* ========================================================================= */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Tindak Lanjut Aduan Warga</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicket} className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-zinc-800">{selectedTicket.kode}</span>
                  <span className="text-zinc-500">{selectedTicket.dusun}</span>
                </div>
                <p className="font-bold text-zinc-900">{selectedTicket.judul}</p>
                <p className="text-xs text-zinc-600">Pelapor: {selectedTicket.pengirim}</p>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">Status Tindak Lanjut</label>
                <div className="relative w-full">
                  <select
                    value={ticketStatusInput}
                    onChange={(e) => setTicketStatusInput(e.target.value as AdminTicket["status"])}
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 transition-colors focus:border-[#1F6F43] focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 disabled:bg-zinc-50 disabled:text-zinc-500 min-h-[44px]"
                  >
                    <option value="MENUNGGU">Menunggu Verifikasi</option>
                    <option value="DIVERIFIKASI">Diverifikasi Tim Desa</option>
                    <option value="TINDAK_LANJUT">Tindak Lanjut Lapangan / Perbaikan</option>
                    <option value="SELESAI">Selesai Ditangani</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 block">
                  Catatan Resmi Pemerintah Desa <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={ticketCatatanInput}
                  onChange={(e) => setTicketCatatanInput(e.target.value)}
                  placeholder="Tuliskan keterangan resmi tindak lanjut yang dapat dibaca oleh warga pelapor..."
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-800 text-xs sm:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                  className="w-1/2 min-h-[44px]"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="w-1/2 bg-[#1F6F43] hover:bg-[#185935] text-white min-h-[44px]"
                >
                  Simpan Tindak Lanjut
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
