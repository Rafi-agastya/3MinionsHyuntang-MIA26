"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  Home,
  UsersRound,
  Calculator,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  Building2,
  FileCheck2,
  Copy,
  ShieldCheck,
  HardHat,
  ArrowDown,
  LogIn,
  AlertCircle,
  Clock,
  UserPlus,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SlideIndicator } from "@/components/slide-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah, StatusProyek } from "@/components/proyek/types";
import { getMockProjectById } from "@/components/proyek/mock-detail-data";
import { useCurrentRole } from "@/lib/use-current-role";
import { apiClient } from "@/lib/api-client";
import { FormBuatPokmasModal } from "@/components/pokmas/form-buat-pokmas-modal";
import { TandaTerimaModal } from "@/components/proyek/tanda-terima-modal";
import { hitungSkor } from "@/lib/scoring";

const ajukanSlides = [
  { id: "ajukan-frame-1", label: "Identitas & PKTD" },
  { id: "ajukan-frame-2", label: "Micro-RAB & Berkas" },
  { id: "ajukan-frame-footer", label: "Transparansi" },
];

interface RabRow {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
}

interface KelompokItem {
  id: string;
  nama: string;
  ketuaId: string;
  ketua?: {
    id: string;
    nama: string;
    email: string;
  };
  anggota?: Array<{
    id: string;
    nama: string;
    rtRw: string;
    ketua: boolean;
  }>;
  _count?: {
    anggota: number;
    proposal: number;
  };
}

interface ProyekApiResponse {
  id: string;
  judul: string;
  pagu: number | string;
  lokasi?: string;
  status?: StatusProyek;
  durasiMin?: number;
  durasiMax?: number;
  syaratLokalMin?: number;
}

export default function FormAjukanProposalPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "seed_proyek_001";
  const { role, user } = useCurrentRole();
  const isPublik = role === "PUBLIK";

  // Data Proyek: default to mock, enriched from API
  const [project, setProject] = React.useState(() => getMockProjectById(projectId));

  // Pokmas (Kelompok) State
  const [kelompokList, setKelompokList] = React.useState<KelompokItem[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = React.useState<string>("");
  const [submittedKelompokIds, setSubmittedKelompokIds] = React.useState<string[]>([]);
  const [isLoadingKelompok, setIsLoadingKelompok] = React.useState(false);
  const [isModalPokmasOpen, setIsModalPokmasOpen] = React.useState(false);

  // Form State
  const [namaKetua, setNamaKetua] = React.useState(user?.name || "Budi Santoso");
  const [kontakWa, setKontakWa] = React.useState("081234567890");
  const [domisili, setDomisili] = React.useState("Dusun Krajan RT 03 / RW 01");

  // PKTD Workforce State
  const [tenagaTotal, setTenagaTotal] = React.useState(15);
  const [tenagaLokal, setTenagaLokal] = React.useState(12);

  // Dynamic Micro-RAB State
  const [rabItems, setRabItems] = React.useState<RabRow[]>([
    {
      id: "rab-1",
      uraian: "Pekerjaan Galian Parit Drainase & Gorong-gorong",
      volume: 120,
      satuan: "m³",
      hargaSatuan: 75000,
    },
    {
      id: "rab-2",
      uraian: "Pasangan Batu Kali Campuran Mortar Tipe 1:4",
      volume: 55,
      satuan: "m³",
      hargaSatuan: 440000,
    },
    {
      id: "rab-3",
      uraian: "Pemasangan Buis Beton U-Ditch 40cm & Plesteran Siar",
      volume: 240,
      satuan: "m²",
      hargaSatuan: 55000,
    },
  ]);

  // Schedule & Narratives (dengan batas PRD 35.2)
  const [durasiHari, setDurasiHari] = React.useState(35);
  const [narasiMetode, setNarasiMetode] = React.useState(
    "Metode pengerjaan padat karya bergilir regu warga dusun dengan pembagian segmen 25 meter per minggu, menggunakan adukan mortar standar kedap air dan perapian tanggul manual bergotong royong bersama tukang lokal desa."
  );
  const [narasiJadwal, setNarasiJadwal] = React.useState(
    "Jadwal pelaksanaan dibagi dalam 5 minggu kerja: minggu 1 pembersihan galian, minggu 2-4 pasangan batu kali, dan minggu 5 perapian serta uji alir air."
  );
  const [narasiRisiko, setNarasiRisiko] = React.useState(
    "Mitigasi genangan air hujan menggunakan 2 unit pompa sedot lumpur portabel dan penyiapan terpal pelindung galian parit."
  );

  // Uploaded documents state (simulated PDF strings for schema compliance)
  const [files, setFiles] = React.useState<string[]>([
    "Proposal_Teknis_Swakelola_Pokmas.pdf",
    "Daftar_KTP_Warga_Lokal.pdf",
  ]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isTandaTerimaOpen, setIsTandaTerimaOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [registrationCode, setRegistrationCode] = React.useState("");
  const [copiedCode, setCopiedCode] = React.useState(false);

  // 1. Ambil data proyek dari API (fallback ke mock)
  React.useEffect(() => {
    let isMounted = true;
    async function fetchProject() {
      try {
        const res = await apiClient.get<ProyekApiResponse>(`/api/proyek/${projectId}`);
        if (isMounted && res.data) {
          const apiData = res.data;
          setProject((prev) => ({
            ...prev,
            id: apiData.id || prev.id,
            judul: apiData.judul || prev.judul,
            pagu: Number(apiData.pagu) || prev.pagu,
            lokasi: apiData.lokasi || prev.lokasi,
            status: apiData.status || prev.status,
            durasiMin: apiData.durasiMin || prev.durasiMin || 30,
            durasiMax: apiData.durasiMax || prev.durasiMax || 45,
            syaratLokalMin: apiData.syaratLokalMin || prev.syaratLokalMin || 70,
          }));
        }
      } catch {
        // Fallback ke mock data
      }
    }
    fetchProject();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // 2. Ambil daftar Pokmas pengguna saat ini dari GET /api/kelompok
  const fetchKelompok = React.useCallback(async () => {
    if (isPublik) return;
    setIsLoadingKelompok(true);
    try {
      const res = await apiClient.get<KelompokItem[]>("/api/kelompok");
      if (res.data && Array.isArray(res.data)) {
        setKelompokList(res.data);
        if (res.data.length > 0 && !selectedKelompokId) {
          setSelectedKelompokId(res.data[0].id);
        }
      }
    } catch {
      // Ignore / empty list
    } finally {
      setIsLoadingKelompok(false);
    }
  }, [isPublik, selectedKelompokId]);

  React.useEffect(() => {
    fetchKelompok();
  }, [fetchKelompok]);

  // Cek proposal yang sudah pernah terkirim pada proyek ini (PRD 33.3: 1 proposal per kelompok)
  React.useEffect(() => {
    let isMounted = true;
    async function loadSubmittedProposals() {
      try {
        const res = await apiClient.get<Array<{ kelompokId?: string; kelompok?: { id?: string } }>>(
          `/api/proyek/${projectId}/proposal`
        );
        if (isMounted && res.data && Array.isArray(res.data)) {
          const ids = res.data
            .map((p) => p.kelompokId || p.kelompok?.id)
            .filter((id): id is string => Boolean(id));
          setSubmittedKelompokIds(ids);
        }
      } catch {
        // Abaikan galat fetch publik
      }
    }
    loadSubmittedProposals();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Selected Pokmas details
  const activePokmas = React.useMemo(() => {
    return kelompokList.find((k) => k.id === selectedKelompokId) || null;
  }, [kelompokList, selectedKelompokId]);

  const isKelompokAlreadySubmitted = React.useMemo(() => {
    return Boolean(selectedKelompokId && submittedKelompokIds.includes(selectedKelompokId));
  }, [selectedKelompokId, submittedKelompokIds]);

  // Computed values
  const persentaseLokal =
    tenagaTotal > 0 ? Math.round((tenagaLokal / tenagaTotal) * 100) : 0;
  const isLokalMemenuhi = persentaseLokal >= (project.syaratLokalMin || 70);

  const totalPenawaran = rabItems.reduce(
    (sum, item) => sum + item.volume * item.hargaSatuan,
    0
  );
  const sisaPagu = project.pagu - totalPenawaran;
  const isMelebihiPagu = totalPenawaran > project.pagu;

  // Real Pure Mathematical Scoring Preview (sesuai PRD Bagian 25 / lib/scoring.ts)
  const liveScoreResult = React.useMemo(() => {
    if (totalPenawaran <= 0 || project.pagu <= 0 || isMelebihiPagu) {
      return null;
    }
    try {
      // Evaluasi kelengkapan berkas: 0-5
      const kelengkapan = Math.min(
        5,
        (files.length > 0 ? 1 : 0) +
          (narasiMetode.trim().length >= 100 ? 1 : 0) +
          (narasiJadwal.trim().length >= 50 ? 1 : 0) +
          (narasiRisiko.trim().length >= 30 ? 1 : 0) +
          (selectedKelompokId ? 1 : 0)
      );

      return hitungSkor({
        pagu: project.pagu,
        penawaran: totalPenawaran,
        tenagaTotal,
        tenagaLokal,
        durasi: durasiHari,
        durasiMin: project.durasiMin || 30,
        durasiMax: project.durasiMax || 45,
        kelengkapan,
        syaratLokalMin: project.syaratLokalMin || 70,
      });
    } catch {
      return null;
    }
  }, [
    project.pagu,
    project.durasiMin,
    project.durasiMax,
    project.syaratLokalMin,
    totalPenawaran,
    isMelebihiPagu,
    tenagaTotal,
    tenagaLokal,
    durasiHari,
    files.length,
    narasiMetode,
    narasiJadwal,
    narasiRisiko,
    selectedKelompokId,
  ]);

  // Add / Remove RAB row
  const handleAddRabRow = () => {
    setRabItems((prev) => [
      ...prev,
      {
        id: `rab-${Date.now()}`,
        uraian: "",
        volume: 1,
        satuan: "unit",
        hargaSatuan: 0,
      },
    ]);
  };

  const handleRemoveRabRow = (id: string) => {
    if (rabItems.length <= 1) return;
    setRabItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateRabRow = (
    id: string,
    field: keyof RabRow,
    value: string | number
  ) => {
    setRabItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Penanganan Unggah Berkas PDF Riil dari Komputer Warga
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFileList: string[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setUploadError(`Berkas "${file.name}" ditolak. Hanya format dokumen PDF yang diperbolehkan.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Berkas "${file.name}" melebihi batas ukuran maksimal 10 MB.`);
        return;
      }
      newFileList.push(file.name);
    }

    if (files.length + newFileList.length > 3) {
      setUploadError("Batas dokumen tercapai: Maksimal 3 berkas lampiran yang diperbolehkan.");
      return;
    }

    setFiles((prev) => [...prev, ...newFileList]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Tambah Berkas Sampel Cepat (Untuk pengujian alur sayembara)
  const handleAddSampleFile = () => {
    setUploadError(null);
    if (files.length >= 3) {
      setUploadError("Batas dokumen tercapai: Maksimal 3 berkas lampiran yang diperbolehkan.");
      return;
    }
    const sampleNames = [
      "Proposal_Teknis_Swakelola_Desa.pdf",
      "Daftar_KTP_Warga_Lokal.pdf",
      "Surat_Keterangan_Pokmas_RT03.pdf",
    ];
    const unusedSample = sampleNames.find((s) => !files.includes(s)) || `Lampiran_Legalitas_${Date.now().toString().slice(-4)}.pdf`;
    setFiles((prev) => [...prev, unusedSample]);
  };

  const handleRemoveFile = (fileName: string) => {
    setUploadError(null);
    setFiles((prev) => prev.filter((f) => f !== fileName));
  };

  // Callback saat Pokmas baru berhasil didaftarkan
  const handlePokmasCreated = (newPokmas: { id: string; nama: string }) => {
    fetchKelompok();
    setSelectedKelompokId(newPokmas.id);
  };

  // Submission Handler ke POST /api/proyek/:id/proposal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (isPublik) {
      setSubmitError(
        "Akses Ditolak: Anda sedang berada di mode Publik. Silakan masuk terlebih dahulu sebagai akun Warga untuk mengajukan proposal."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedKelompokId) {
      setSubmitError(
        "Silakan pilih Kelompok Masyarakat (Pokmas) pengusul atau daftarkan Pokmas baru terlebih dahulu."
      );
      return;
    }

    if (isKelompokAlreadySubmitted) {
      setSubmitError(
        "Kelompok ini sudah pernah mengajukan proposal pada proyek ini. Sesuai ketentuan sayembara desa, satu kelompok hanya berhak mengajukan 1 proposal. Silakan daftarkan Pokmas baru menggunakan tombol '+ Daftarkan Pokmas Baru'."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (isMelebihiPagu) {
      setSubmitError(
        `Total penawaran (${formatRupiah(totalPenawaran)}) melebihi pagu anggaran proyek (${formatRupiah(project.pagu)}).`
      );
      return;
    }

    if (tenagaLokal > tenagaTotal) {
      setSubmitError("Jumlah tenaga kerja lokal tidak boleh melebihi total tenaga kerja.");
      return;
    }

    if (narasiMetode.trim().length < 100) {
      setSubmitError("Narasi metode kerja minimal 100 karakter.");
      return;
    }

    if (narasiJadwal.trim().length < 50) {
      setSubmitError("Narasi jadwal pelaksanaan minimal 50 karakter.");
      return;
    }

    if (narasiRisiko.trim().length < 30) {
      setSubmitError("Narasi manajemen risiko minimal 30 karakter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        kelompokId: selectedKelompokId,
        penawaran: totalPenawaran,
        durasiHari,
        tenagaTotal,
        tenagaLokal,
        narasiMetode: narasiMetode.trim(),
        narasiJadwal: narasiJadwal.trim(),
        narasiRisiko: narasiRisiko.trim(),
        dokumen: files,
      };

      const res = await apiClient.post<{ id: string; statusAnalisis: string }>(
        `/api/proyek/${projectId}/proposal`,
        payload
      );

      if (res.data) {
        setRegistrationCode(res.data.id);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (res.error) {
        setSubmitError(res.error.message || "Gagal mengirim proposal sayembara.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      let msg = "Gagal mengirim proposal sayembara. Pastikan data memenuhi ketentuan.";
      if (err instanceof Error) {
        msg = err.message;
      }
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object"
      ) {
        const resp = (err as { response?: { error?: { message?: string } } }).response;
        if (resp?.error?.message) {
          msg = resp.error.message;
        }
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Navbar />

        <main className="h-[calc(100vh-64px)] mt-16 overflow-y-auto snap-y snap-proximity md:snap-mandatory scroll-smooth bg-[#FAFAF7] text-zinc-900 antialiased selection:bg-[#1F6F43] selection:text-white font-sans relative">
          <SlideIndicator
            slides={[
              { id: "ajukan-frame-1", label: "Proposal Terkirim" },
              { id: "ajukan-frame-footer", label: "Transparansi" },
            ]}
          />

          <section
            id="ajukan-frame-1"
            aria-label="Konfirmasi Pengajuan Proposal"
            className="min-h-[calc(100vh-64px)] snap-start flex flex-col justify-center py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full"
          >
            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500 flex-wrap mb-6"
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
                className="hover:text-[#1F6F43] transition-colors truncate max-w-[180px] sm:max-w-xs"
              >
                <span>{project.judul}</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-900 font-semibold">Tanda Terima</span>
            </nav>

            <div className="bg-white rounded-3xl border border-emerald-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-emerald-100 text-[#1F6F43] border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                  Proposal Sayembara Berhasil Dikirim!
                </h1>
                <p className="text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
                  Usulan pengerjaan fisik swakelola dari{" "}
                  <strong className="text-zinc-900">
                    {activePokmas?.nama || "Pokmas Terdaftar"}
                  </strong>{" "}
                  telah tercatat dalam sistem audit AKAR Desa Karang Sari.
                </p>
              </div>

              {/* Registration Number Box */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 block">
                    ID Proposal Resmi Sistem (Audit Trail)
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#1F6F43] tracking-wide block mt-0.5">
                    {registrationCode}
                  </span>
                  <span className="text-xs text-zinc-500 mt-1 block">
                    Status: <span className="font-semibold text-amber-700">MENUNGGU</span> (Antrean evaluasi kelayakan oleh TPK &amp; ringkasan)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(registrationCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="gap-2 text-xs font-semibold min-h-[44px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? "Tersalin!" : "Salin ID Proposal"}</span>
                </Button>
              </div>

              {/* Instant Mathematical Score Card */}
              {liveScoreResult && (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-3 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                      <Sparkles className="w-4 h-4 text-[#1F6F43]" />
                      <span>Hasil Penilaian Formula Terbuka</span>
                    </div>
                    <Badge variant="default" className="text-xs font-bold">
                      Estimasi Skor: {liveScoreResult.total.toFixed(0)} / 100
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                      <span className="text-zinc-500 block">Efisiensi Biaya (40%)</span>
                      <span className="font-mono font-bold text-sm text-[#1F6F43] block mt-0.5">
                        {liveScoreResult.rincian.biaya.toFixed(1)} / 100
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                      <span className="text-zinc-500 block">Tenaga Kerja Lokal (30%)</span>
                      <span className="font-mono font-bold text-sm text-[#1F6F43] block mt-0.5">
                        {liveScoreResult.rincian.lokal.toFixed(1)} / 100
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                      <span className="text-zinc-500 block">Rasionalitas Jadwal (20%)</span>
                      <span className="font-mono font-bold text-sm text-[#8A5A2B] block mt-0.5">
                        {liveScoreResult.rincian.jadwal.toFixed(1)} / 100
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                      <span className="text-zinc-500 block">Kelengkapan Berkas (10%)</span>
                      <span className="font-mono font-bold text-sm text-[#1F6F43] block mt-0.5">
                        {liveScoreResult.rincian.lengkap.toFixed(1)} / 100
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    * Catatan: Skor dihitung secara objektif menggunakan formula matematis terbuka. AI tidak pernah menentukan skor atau pemenang. Penetapan pelaksana definitif disahkan oleh Kepala Desa setelah masa sanggah berakhir.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-xs sm:text-sm font-semibold min-h-[44px] gap-2 border-emerald-300 text-[#1F6F43] hover:bg-emerald-50"
                  onClick={() => setIsTandaTerimaOpen(true)}
                >
                  <FileCheck2 className="w-4 h-4 mr-1 text-[#1F6F43]" />
                  <span>Buka &amp; Cetak Tanda Terima (PDF)</span>
                </Button>
                <Link href={`/proyek/${projectId}`} className="w-full sm:w-auto">
                  <Button className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold min-h-[44px]">
                    <span>Kembali ke Halaman Proyek</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>

              {/* Modal Tanda Terima Resmi Sayembara */}
              <TandaTerimaModal
                isOpen={isTandaTerimaOpen}
                onClose={() => setIsTandaTerimaOpen(false)}
                proposalId={registrationCode}
                project={project}
                penawaran={totalPenawaran}
                durasiHari={durasiHari}
                tenagaTotal={tenagaTotal}
                tenagaLokal={tenagaLokal}
                pokmasNama={activePokmas?.nama || "Kelompok Masyarakat Pengusul"}
                ketuaNama={namaKetua}
                kontakWa={kontakWa}
                scoreResult={liveScoreResult}
                dokumenList={files}
              />
            </div>
          </section>

          <section
            id="ajukan-frame-footer"
            aria-label="Informasi Footer"
            className="snap-end w-full"
          >
            <Footer />
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="h-[calc(100vh-64px)] mt-16 overflow-y-auto snap-y snap-proximity md:snap-mandatory scroll-smooth bg-[#FAFAF7] text-zinc-900 antialiased selection:bg-[#1F6F43] selection:text-white font-sans relative">
        <SlideIndicator slides={ajukanSlides} />

        {/* Modal Buat Pokmas Baru */}
        <FormBuatPokmasModal
          isOpen={isModalPokmasOpen}
          onClose={() => setIsModalPokmasOpen(false)}
          onSuccess={handlePokmasCreated}
        />

        <form onSubmit={handleSubmit} className="w-full">
          {/* FRAME 1: Identitas & Syarat PKTD */}
          <section
            id="ajukan-frame-1"
            aria-label="Identitas Kelompok dan Serapan Tenaga Kerja PKTD"
            className="min-h-[calc(100vh-64px)] snap-start flex flex-col justify-center py-6 md:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4"
          >
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
                className="hover:text-[#1F6F43] transition-colors truncate max-w-[180px] sm:max-w-xs"
              >
                <span>{project.judul}</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-900 font-semibold">Ajukan Proposal</span>
            </nav>

            {/* Error Notification Bar */}
            {submitError && (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-xs sm:text-sm text-red-800 flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Gagal Mengirimkan Proposal</span>
                  <p>{submitError}</p>
                </div>
              </div>
            )}

            {/* Gatekeeper Banner jika Peran PUBLIK */}
            {isPublik && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 text-xs sm:text-sm text-amber-950">
                    <span className="font-bold block">
                      Akses Terbatas: Anda Sedang Berada di Mode Publik
                    </span>
                    <p className="text-amber-900 leading-relaxed">
                      Sesuai ketentuan sayembara desa, formulir pengajuan proposal sayembara swakelola hanya dapat dikirimkan oleh akun <strong>Warga Terverifikasi</strong> yang mewakili Kelompok Masyarakat (Pokmas) terdaftar.
                    </p>
                  </div>
                </div>

                <Link href="/masuk" className="shrink-0 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto gap-2 bg-[#1F6F43] hover:bg-[#185935] text-white font-semibold min-h-[44px]"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Masuk sebagai Warga</span>
                  </Button>
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Kolom Kiri: 8 cols */}
              <div className="lg:col-span-8 space-y-5">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default" className="text-xs font-semibold">
                      Sayembara Swakelola Terbuka
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      Batas Pagu:{" "}
                      <strong className="text-zinc-900 font-mono">
                        {formatRupiah(project.pagu)}
                      </strong>
                    </span>
                    {project.status === "TENDER_DIBUKA" && (
                      <span className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Pendaftaran Masih Dibuka
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                    Form Pengajuan Proposal Sayembara
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl">
                    Silakan lengkapi formulir pendaftaran di bawah ini untuk proyek:{" "}
                    <strong className="text-zinc-900">{project.judul}</strong>. Seluruh
                    data yang dimasukkan bersifat publik dan dapat diaudit oleh seluruh
                    warga desa.
                  </p>
                </div>

                {/* SECTION 1: IDENTITAS KELOMPOK */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-[#1F6F43]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-zinc-900">
                        1. Identitas Kelompok Pengusul (Pokmas / RT)
                      </h2>
                    </div>

                    {!isPublik && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsModalPokmasOpen(true)}
                        className="text-xs font-semibold gap-1.5 text-[#1F6F43] border-emerald-300 hover:bg-emerald-50 min-h-[44px]"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>+ Daftarkan Pokmas Baru</span>
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    {/* Pilih Pokmas Terdaftar */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-zinc-700 block">
                        Pilih Kelompok Masyarakat (Pokmas) Terdaftar <span className="text-red-500">*</span>
                      </label>

                      {isPublik ? (
                        <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 text-xs">
                          Masuk sebagai akun Warga untuk memilih atau mendaftarkan kelompok masyarakat.
                        </div>
                      ) : isLoadingKelompok ? (
                        <div className="h-11 rounded-xl bg-zinc-100 animate-pulse" />
                      ) : kelompokList.length > 0 ? (
                        <select
                          value={selectedKelompokId}
                          onChange={(e) => setSelectedKelompokId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                        >
                          {kelompokList.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.nama} (Ketua: {k.ketua?.nama || "Ketua Terdaftar"}) — {k.anggota?.length || k._count?.anggota || 0} Anggota
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <span>
                            Akun Anda belum memiliki Pokmas terdaftar di Desa Karang Sari.
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsModalPokmasOpen(true)}
                            className="bg-[#1F6F43] text-white hover:bg-[#185935] text-xs font-semibold"
                          >
                            Buat Pokmas Sekarang
                          </Button>
                        </div>
                      )}

                      {activePokmas && (
                        <div className="mt-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold block">
                              {activePokmas.nama}
                            </span>
                            <span className="text-zinc-600 block">
                              Ketua: {activePokmas.ketua?.nama || "Ketua Terdaftar"} | Anggota:{" "}
                              {activePokmas.anggota?.length || activePokmas._count?.anggota || 0} Orang
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#1F6F43] bg-white px-2 py-1 rounded-md border border-emerald-200">
                            ID: {activePokmas.id}
                          </span>
                        </div>
                      )}

                      {isKelompokAlreadySubmitted && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5 animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-bold block text-amber-900">
                              Kelompok ini sudah memiliki proposal terdaftar pada proyek ini
                            </span>
                            <p className="leading-relaxed text-amber-800">
                              Sesuai ketentuan sayembara desa, satu kelompok masyarakat hanya berhak mengajukan 1 usulan per sayembara. Untuk mengajukan penawaran baru, silakan klik tombol <strong>+ Daftarkan Pokmas Baru</strong> di atas untuk membuat kelompok penawar baru.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Nama Penanggung Jawab / Pengirim <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={namaKetua}
                        onChange={(e) => setNamaKetua(e.target.value)}
                        placeholder="Nama lengkap sesuai KTP"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Nomor Kontak WhatsApp Aktif <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={kontakWa}
                        onChange={(e) => setKontakWa(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-zinc-700 block">
                        Wilayah Domisili Kelompok <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={domisili}
                        onChange={(e) => setDomisili(e.target.value)}
                        placeholder="Contoh: Dusun Krajan RT 03 / RW 01"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: KOMITMEN PKTD (LIVE CALCULATOR) */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-[#1F6F43]">
                        <UsersRound className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-zinc-900">
                          2. Komitmen Serapan Tenaga Kerja Lokal (PKTD)
                        </h2>
                        <p className="text-xs text-zinc-500">
                          Kalkulator otomatis persentase pekerja warga ber-KTP Desa Karang Sari.
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700">
                      Syarat Minimum: {project.syaratLokalMin || 70}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Jumlah Tenaga Kerja Lokal (Warga Desa) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={tenagaTotal}
                        value={tenagaLokal}
                        onChange={(e) => setTenagaLokal(Number(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono text-base font-bold"
                      />
                      <span className="text-xs text-zinc-500">
                        Warga RT/RW setempat yang dilibatkan dalam pekerjaan fisik.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Total Seluruh Tenaga Kerja <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={tenagaTotal}
                        onChange={(e) => setTenagaTotal(Number(e.target.value) || 1)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono text-base font-bold"
                      />
                      <span className="text-xs text-zinc-500">
                        Total pekerja termasuk tukang spesialis dan pembantu tukang (1-500 orang).
                      </span>
                    </div>
                  </div>

                  {/* Live Indicator Bar */}
                  <div
                    className={`rounded-xl p-4 border transition-all ${
                      isLokalMemenuhi
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-amber-50/70 border-amber-200 text-amber-950"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isLokalMemenuhi ? (
                          <CheckCircle2 className="w-5 h-5 text-[#1F6F43] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-sm block">
                            {isLokalMemenuhi
                              ? `Memenuhi Syarat PKTD (${persentaseLokal}%)`
                              : `Di Bawah Batas Syarat PKTD (${persentaseLokal}%)`}
                          </span>
                          <span className="text-xs text-zinc-600">
                            {tenagaLokal} dari {tenagaTotal} pekerja adalah warga desa setempat.
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#1F6F43]">
                          {persentaseLokal}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden mt-3">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isLokalMemenuhi ? "bg-[#1F6F43]" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, persentaseLokal)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Helper Jump Action Button */}
                <div className="pt-2 flex justify-start">
                  <a
                    href="#ajukan-frame-2"
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-zinc-200/90 shadow-sm text-sm font-semibold text-[#1F6F43] hover:bg-emerald-50/50 hover:border-[#1F6F43]/30 transition-all min-h-[44px]"
                  >
                    <span>Lanjut ke Pengisian Micro-RAB &amp; Berkas</span>
                    <ArrowDown className="w-4 h-4 text-[#1F6F43] animate-bounce" />
                  </a>
                </div>
              </div>

              {/* Kolom Kanan: 4 cols */}
              <aside className="lg:col-span-4 space-y-5">
                {/* Card 1: Visual Gotong Royong /drainase.jpg */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-sm">
                  <div className="relative h-44 w-full">
                    <Image
                      src="/proyek/drainase.jpg"
                      alt="Suasana Kerja Bakti Swakelola"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 380px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#1F6F43] text-[10px] font-bold tracking-wider uppercase mb-1">
                        PKTD Karang Sari
                      </span>
                      <h4 className="text-sm font-bold leading-tight">Gotong Royong Swakelola</h4>
                      <p className="text-xs text-zinc-300 mt-0.5">Prioritas upah harian bagi warga sekitar</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5 text-xs text-zinc-600">
                    <p className="leading-relaxed">
                      Sayembara swakelola memberi kesempatan warga mengelola anggaran pembangunan desa sendiri secara transparan dan akuntabel.
                    </p>
                  </div>
                </div>

                {/* Card 2: 3 Syarat Wajib Lolos Verifikasi */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <HardHat className="w-4 h-4 text-[#1F6F43]" />
                    <span>3 Syarat Wajib Verifikasi</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-zinc-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                      <span><strong>Serapan Lokal ≥ 70%:</strong> Minimal 7 dari 10 pekerja ber-KTP Desa Karang Sari.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                      <span><strong>Penawaran ≤ Pagu:</strong> Total RAB tidak melebihi alokasi anggaran proyek.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1F6F43] shrink-0 mt-0.5" />
                      <span><strong>Legalitas Pokmas:</strong> Dilengkapi susunan pengurus RT/RW atau kelompok tukang.</span>
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </section>

          {/* FRAME 2: Micro-RAB, Berkas & Submit */}
          <section
            id="ajukan-frame-2"
            aria-label="Rincian Anggaran Micro-RAB dan Berkas Pendukung"
            className="min-h-[calc(100vh-64px)] snap-start py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col justify-start"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Kolom Kiri: 8 cols */}
              <div className="lg:col-span-8 space-y-6">
                {/* SECTION 3: INPUT MICRO-RAB DINAMIS */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-[#1F6F43]">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-zinc-900">
                          3. Rincian Anggaran Biaya (Micro-RAB)
                        </h2>
                        <p className="text-xs text-zinc-500">
                          Rincikan item pengeluaran material dan upah tukang (HOK).
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRabRow}
                      className="text-xs font-semibold gap-1.5 text-[#1F6F43] border-emerald-200 hover:bg-emerald-50 min-h-[44px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris Belanja</span>
                    </Button>
                  </div>

                  {/* Table of RAB items */}
                  <div className="space-y-3">
                    {rabItems.map((item, index) => {
                      const rowSubtotal = item.volume * item.hargaSatuan;
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-zinc-200/80 p-3.5 bg-zinc-50/50 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-zinc-600">
                              Item Belanja #{index + 1}
                            </span>
                            {rabItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRabRow(item.id)}
                                className="text-zinc-400 hover:text-red-600 p-1 rounded transition-colors"
                                title="Hapus baris"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs sm:text-sm">
                            <div className="sm:col-span-5 space-y-1">
                              <label className="text-zinc-600 font-medium">Uraian Pekerjaan / Material</label>
                              <input
                                type="text"
                                required
                                value={item.uraian}
                                onChange={(e) =>
                                  handleUpdateRabRow(item.id, "uraian", e.target.value)
                                }
                                placeholder="Misal: Pasangan Batu Kali Mortar"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-zinc-600 font-medium">Volume</label>
                              <input
                                type="number"
                                min={1}
                                required
                                value={item.volume}
                                onChange={(e) =>
                                  handleUpdateRabRow(
                                    item.id,
                                    "volume",
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono font-semibold"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                              <label className="text-zinc-600 font-medium">Satuan</label>
                              <input
                                type="text"
                                required
                                value={item.satuan}
                                onChange={(e) =>
                                  handleUpdateRabRow(item.id, "satuan", e.target.value)
                                }
                                placeholder="m³ / HOK"
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                              />
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                              <label className="text-zinc-600 font-medium">Harga Satuan (Rp)</label>
                              <input
                                type="number"
                                min={0}
                                step={1000}
                                required
                                value={item.hargaSatuan}
                                onChange={(e) =>
                                  handleUpdateRabRow(
                                    item.id,
                                    "hargaSatuan",
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono font-semibold"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end items-center gap-2 pt-1 border-t border-zinc-200/50 text-xs">
                            <span className="text-zinc-500">Subtotal Item:</span>
                            <span className="font-mono font-bold text-zinc-900 text-sm">
                              {formatRupiah(rowSubtotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calculation Summary Bar */}
                  <div
                    className={`rounded-xl p-4 border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                      isMelebihiPagu
                        ? "bg-red-50 border-red-200 text-red-900"
                        : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                    }`}
                  >
                    <div className="space-y-0.5 text-center sm:text-left">
                      <span className="text-xs uppercase font-bold tracking-wider block">
                        Total Nilai Penawaran Proposal:
                      </span>
                      <span className="font-mono text-2xl font-extrabold text-[#1F6F43] block">
                        {formatRupiah(totalPenawaran)}
                      </span>
                      <span className="text-xs text-zinc-600 block">
                        Pagu Proyek: <strong>{formatRupiah(project.pagu)}</strong>
                      </span>
                    </div>

                    <div className="text-center sm:text-right">
                      {isMelebihiPagu ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Melebihi Pagu Anggaran!</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Efisiensi: {formatRupiah(sisaPagu)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 4: JADWAL & UPLOAD BERKAS */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-[#1F6F43]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold text-zinc-900">
                      4. Jadwal Pelaksanaan &amp; Upload Berkas Pendukung
                    </h2>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-zinc-700 block">
                        Target Durasi Kerja (Hari Kalender) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={730}
                        required
                        value={durasiHari}
                        onChange={(e) => setDurasiHari(Number(e.target.value) || 30)}
                        className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono font-bold text-base"
                      />
                      <span className="text-xs text-zinc-500 block">
                        Rekomendasi KAK proyek: {project.durasiMin || 30} - {project.durasiMax || 45} hari kalender.
                      </span>
                    </div>

                    {/* Narasi Metode dengan Batas PRD 35.2 */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-zinc-700 block">
                          Narasi Metode Kerja Teknis <span className="text-red-500">*</span>
                        </label>
                        <span
                          className={`text-xs font-mono ${
                            narasiMetode.trim().length < 100
                              ? "text-amber-600 font-bold"
                              : "text-zinc-500"
                          }`}
                        >
                          {narasiMetode.trim().length} / 3000 karakter (min. 100)
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={narasiMetode}
                        onChange={(e) => setNarasiMetode(e.target.value)}
                        placeholder="Jelaskan pembagian kerja regu gotong royong dan spesifikasi teknis (minimal 100 karakter)..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[80px] ${
                          narasiMetode.trim().length < 100
                            ? "border-amber-300 bg-amber-50/20"
                            : "border-zinc-200"
                        }`}
                      />
                      {narasiMetode.trim().length < 100 && (
                        <p className="text-xs text-amber-600">
                          Wajib minimal 100 karakter (kurang {100 - narasiMetode.trim().length} karakter lagi).
                        </p>
                      )}
                    </div>

                    {/* Narasi Jadwal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-zinc-700 block">
                          Narasi Jadwal Pelaksanaan <span className="text-red-500">*</span>
                        </label>
                        <span
                          className={`text-xs font-mono ${
                            narasiJadwal.trim().length < 50
                              ? "text-amber-600 font-bold"
                              : "text-zinc-500"
                          }`}
                        >
                          {narasiJadwal.trim().length} / 2000 karakter (min. 50)
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={narasiJadwal}
                        onChange={(e) => setNarasiJadwal(e.target.value)}
                        placeholder="Jelaskan tahapan pengerjaan per minggu (minimal 50 karakter)..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[60px] ${
                          narasiJadwal.trim().length < 50
                            ? "border-amber-300 bg-amber-50/20"
                            : "border-zinc-200"
                        }`}
                      />
                      {narasiJadwal.trim().length < 50 && (
                        <p className="text-xs text-amber-600">
                          Wajib minimal 50 karakter (kurang {50 - narasiJadwal.trim().length} karakter lagi).
                        </p>
                      )}
                    </div>

                    {/* Narasi Risiko */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-zinc-700 block">
                          Rencana Mitigasi Risiko &amp; Cuaca <span className="text-red-500">*</span>
                        </label>
                        <span
                          className={`text-xs font-mono ${
                            narasiRisiko.trim().length < 30
                              ? "text-amber-600 font-bold"
                              : "text-zinc-500"
                          }`}
                        >
                          {narasiRisiko.trim().length} / 2000 karakter (min. 30)
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        required
                        value={narasiRisiko}
                        onChange={(e) => setNarasiRisiko(e.target.value)}
                        placeholder="Jelaskan langkah jika terjadi hujan deras atau kendala suplai bahan (minimal 30 karakter)..."
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[60px] ${
                          narasiRisiko.trim().length < 30
                            ? "border-amber-300 bg-amber-50/20"
                            : "border-zinc-200"
                        }`}
                      />
                      {narasiRisiko.trim().length < 30 && (
                        <p className="text-xs text-amber-600">
                          Wajib minimal 30 karakter (kurang {30 - narasiRisiko.trim().length} karakter lagi).
                        </p>
                      )}
                    </div>

                    {/* Upload Area */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-zinc-700 block">
                          Lampiran Dokumen Kelompok &amp; KTP Anggota (PDF) <span className="text-red-500">*</span>
                        </label>
                        <span className="text-xs text-zinc-500 font-mono">
                          {files.length} / 3 Berkas
                        </span>
                      </div>
                      <div className="border-2 border-dashed border-zinc-300 rounded-xl p-5 text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-2">
                        <UploadCloud className="w-8 h-8 text-[#1F6F43] mx-auto" />
                        <div className="text-xs text-zinc-600">
                          <span className="font-semibold text-zinc-800">
                            Klik tombol di bawah untuk melampirkan berkas
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Format dokumen PDF resmi (maks. 3 berkas, 10 MB per berkas). Sistem memeriksa header magic bytes PDF server-side.
                        </p>

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="application/pdf"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />

                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            disabled={files.length >= 3}
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs bg-[#1F6F43] hover:bg-[#185935] text-white min-h-[40px] gap-1.5"
                          >
                            <UploadCloud className="w-4 h-4" />
                            <span>Pilih Berkas PDF dari Komputer</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={files.length >= 3}
                            onClick={handleAddSampleFile}
                            className="text-xs min-h-[40px] text-zinc-700 gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Gunakan Sampel Dokumen</span>
                          </Button>
                        </div>

                        {uploadError && (
                          <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-center gap-1.5 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{uploadError}</span>
                          </div>
                        )}
                      </div>

                      {/* File list preview */}
                      {files.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {files.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-center justify-between bg-white px-3.5 py-2 rounded-lg border border-zinc-200 text-xs"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-[#1F6F43] shrink-0" />
                                <span className="font-medium text-zinc-800 truncate">{file}</span>
                                <span className="text-zinc-400 text-[11px] shrink-0">
                                  (Terverifikasi PDF)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(file)}
                                className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                                title="Hapus berkas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTION BAR */}
                <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Link
                    href={`/proyek/${projectId}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 hover:text-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 min-h-[44px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Batal &amp; Kembali</span>
                  </Link>

                  <Button
                    type="submit"
                    disabled={isSubmitting || isMelebihiPagu || isPublik || isKelompokAlreadySubmitted}
                    className="w-full sm:w-auto bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold px-6 min-h-[44px] shadow-sm disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Mengirim ke Server...</span>
                      </span>
                    ) : isKelompokAlreadySubmitted ? (
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-300" />
                        <span>Kelompok Sudah Mengajukan Proposal</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span>Kirim Usulan Proposal Sayembara</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              {/* Kolom Kanan: 4 cols */}
              <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-4">
                {/* Card 3: Jaminan Integritas & Anti Pungli */}
                <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#1F6F43]" />
                    <span>Jaminan Integritas Seleksi</span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Penilaian seleksi menggunakan algoritma matematis terbuka. Tidak ada biaya pendaftaran, titipan, atau pungli dalam penetapan pelaksana.
                  </p>
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Protokol Audit</span>
                    <span className="text-[#1F6F43] font-semibold">AKAR SHA-256</span>
                  </div>
                </div>

                {/* Card 4: Estimasi Bobot Penilaian Matematis (PRD Bagian 25) */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-[#1F6F43]" />
                      <span>Prediksi Skor Proposal</span>
                    </div>
                    {liveScoreResult && (
                      <Badge variant="default" className="text-xs font-bold">
                        {liveScoreResult.total.toFixed(0)} / 100
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                      <span className="text-zinc-600">Efisiensi Biaya (Micro-RAB)</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {liveScoreResult
                          ? `${liveScoreResult.rincian.biaya.toFixed(1)} (Bobot 40%)`
                          : "40%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                      <span className="text-zinc-600">Tenaga Kerja Lokal (PKTD)</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {liveScoreResult
                          ? `${liveScoreResult.rincian.lokal.toFixed(1)} (Bobot 30%)`
                          : "30%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-emerald-100">
                      <span className="text-zinc-600">Rasionalitas Jadwal Kerja</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {liveScoreResult
                          ? `${liveScoreResult.rincian.jadwal.toFixed(1)} (Bobot 20%)`
                          : "20%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-zinc-600">Kelengkapan Berkas Pokmas</span>
                      <span className="font-mono font-bold text-zinc-900">
                        {liveScoreResult
                          ? `${liveScoreResult.rincian.lengkap.toFixed(1)} (Bobot 10%)`
                          : "10%"}
                      </span>
                    </div>
                  </div>

                  {liveScoreResult?.flags && liveScoreResult.flags.length > 0 && (
                    <div className="pt-2 border-t border-emerald-100 space-y-1">
                      {liveScoreResult.flags.map((flag, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="capitalize">{flag}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-500 pt-1 leading-relaxed">
                    Formula matematis terbuka dan transparan. AI hanya meringkas narasi metode dan mendeteksi anomali teks.
                  </p>
                </div>
              </aside>
            </div>
          </section>

          {/* FRAME 3: Footer Snap End */}
          <section
            id="ajukan-frame-footer"
            aria-label="Informasi Footer"
            className="snap-end w-full"
          >
            <Footer />
          </section>
        </form>
      </main>
    </>
  );
}
