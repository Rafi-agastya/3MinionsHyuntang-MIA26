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
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/components/proyek/types";
import { getMockProjectById } from "@/components/proyek/mock-detail-data";

interface RabRow {
  id: string;
  uraian: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
}

export default function FormAjukanProposalPage() {
  const params = useParams();
  const projectId = (params?.id as string) || "seed_proyek_001";
  const project = getMockProjectById(projectId);

  // Form State
  const [namaKelompok, setNamaKelompok] = React.useState("Pokmas Guyub Rukun RT 03");
  const [namaKetua, setNamaKetua] = React.useState("Bambang Prasetyo");
  const [kontakWa, setKontakWa] = React.useState("081234567890");
  const [jumlahAnggota, setJumlahAnggota] = React.useState(18);
  const [domisili, setDomisili] = React.useState("Dusun Krajan RT 03 / RW 01");

  // PKTD Workforce State
  const [tenagaTotal, setTenagaTotal] = React.useState(20);
  const [tenagaLokal, setTenagaLokal] = React.useState(16);

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

  // Schedule & Narratives
  const [durasiHari, setDurasiHari] = React.useState(30);
  const [narasiMetode, setNarasiMetode] = React.useState(
    "Metode pengerjaan padat karya bergilir regu warga dusun dengan pembagian segmen 25 meter per minggu, menggunakan adukan mortar standar kedap air dan perapian tanggul manual."
  );
  const [narasiRisiko, setNarasiRisiko] = React.useState(
    "Mitigasi genangan air hujan menggunakan 2 unit pompa sedot lumpur portabel dan penyiapan terpal pelindung galian parit."
  );

  // Uploaded documents state (simulated)
  const [files, setFiles] = React.useState<string[]>([
    "Proposal_Pokmas_Guyub_Rukun.pdf",
    "Daftar_KTP_20_Warga_Lokal.pdf",
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [registrationCode, setRegistrationCode] = React.useState("");
  const [copiedCode, setCopiedCode] = React.useState(false);

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

  // Add dummy file
  const handleAddDummyFile = () => {
    const newFileName = `Berkas_Pendukung_${Date.now().toString().slice(-4)}.pdf`;
    setFiles((prev) => [...prev, newFileName]);
  };

  const handleRemoveFile = (fileName: string) => {
    setFiles((prev) => prev.filter((f) => f !== fileName));
  };

  // Submission Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMelebihiPagu) {
      alert("Total penawaran tidak boleh melebihi pagu proyek!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const generatedCode = `PROP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setRegistrationCode(generatedCode);
      setIsSubmitting(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  };

  // Estimated AI Score Breakdown (formula murni PRD)
  const scoreBiaya = Math.min(
    40,
    Math.max(20, Math.round((1 - totalPenawaran / (project.pagu * 1.05)) * 40 + 20))
  );
  const scoreLokal = Math.min(30, Math.round((persentaseLokal / 100) * 30));
  const scoreJadwal = durasiHari <= 35 ? 20 : 15;
  const scoreDokumen = files.length >= 2 ? 10 : 6;
  const totalEstimasiSkor = scoreBiaya + scoreLokal + scoreJadwal + scoreDokumen;

  return (
    <div className="min-h-screen bg-[#FAFAF7] bg-[radial-gradient(#1F6F43_0.6px,transparent_0.6px)] [background-size:24px_24px] text-zinc-900 flex flex-col antialiased selection:bg-[#1F6F43] selection:text-white font-sans relative">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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

          {/* SUCCESS CONFIRMATION MODAL / VIEW */}
          {isSuccess ? (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-emerald-200/90 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-emerald-100 text-[#1F6F43] border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                  Proposal Sayembara Berhasil Dikirim!
                </h1>
                <p className="text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
                  Usulan pengerjaan fisik swakelola dari{" "}
                  <strong className="text-zinc-900">{namaKelompok}</strong> telah
                  tercatat dalam sistem audit AKAR Desa Karang Sari.
                </p>
              </div>

              {/* Registration Number Box */}
              <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-zinc-500 block">
                    Nomor Registrasi Proposal
                  </span>
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#1F6F43] tracking-wide block mt-0.5">
                    {registrationCode}
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
                  <span>{copiedCode ? "Tersalin!" : "Salin Nomor Registrasi"}</span>
                </Button>
              </div>

              {/* Instant AI Estimation Score Card */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                    <Sparkles className="w-4 h-4 text-[#1F6F43]" />
                    <span>Hasil Penilaian Otomatis Awal (AI Scoring Board)</span>
                  </div>
                  <Badge variant="default" className="text-xs font-bold">
                    Estimasi Skor: {totalEstimasiSkor.toFixed(1)} / 100
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                    <span className="text-zinc-500 block">Efisiensi Biaya (40%)</span>
                    <span className="font-mono font-bold text-sm text-[#1F6F43] block mt-0.5">
                      {scoreBiaya.toFixed(1)} / 40.0
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                    <span className="text-zinc-500 block">Tenaga Kerja Lokal (30%)</span>
                    <span className="font-mono font-bold text-sm text-[#1F6F43] block mt-0.5">
                      {scoreLokal.toFixed(1)} / 30.0
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                    <span className="text-zinc-500 block">Rasionalitas Jadwal (20%)</span>
                    <span className="font-mono font-bold text-sm text-[#8A5A2B] block mt-0.5">
                      {scoreJadwal.toFixed(1)} / 20.0
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200/60">
                    <span className="text-zinc-500 block">Kelengkapan Dokumen (10%)</span>
                    <span className="font-mono font-bold text-sm text-[#1F6F43] block mt-0.5">
                      {scoreDokumen.toFixed(1)} / 10.0
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed">
                  * Catatan: Skor di atas dihitung dengan formula murni matematis (
                  <code>lib/scoring.ts</code>). Keputusan akhir penetapan pelaksana
                  swakelola dilakukan oleh Kepala Desa dan BPD setelah masa sanggah 3 hari
                  selesai.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-xs sm:text-sm font-semibold min-h-[44px]"
                  onClick={() => alert("Mengunduh Tanda Terima Registrasi Resmi (PDF)...")}
                >
                  <FileCheck2 className="w-4 h-4 mr-1.5" />
                  <span>Unduh Tanda Terima (PDF)</span>
                </Button>
                <Link href={`/proyek/${projectId}`} className="w-full sm:w-auto">
                  <Button className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold min-h-[44px]">
                    <span>Kembali ke Halaman Proyek</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* FORM SUBMISSION VIEW */
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Form Fields: 8 cols */}
                <div className="lg:col-span-8 space-y-6">
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
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-[#1F6F43]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-zinc-900">
                    1. Identitas Kelompok Pengusul (Pokmas / RT)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700 block">
                      Nama Kelompok Masyarakat / Rukun Warga <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={namaKelompok}
                      onChange={(e) => setNamaKelompok(e.target.value)}
                      placeholder="Contoh: Pokmas Makmur Jaya RT 03"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700 block">
                      Nama Ketua / Penanggung Jawab <span className="text-red-500">*</span>
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

                  <div className="space-y-1.5">
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

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-zinc-700 block">
                      Jumlah Anggota Aktif Terdaftar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={100}
                      required
                      value={jumlahAnggota}
                      onChange={(e) => setJumlahAnggota(Number(e.target.value) || 2)}
                      className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono font-bold"
                    />
                    <span className="text-xs text-zinc-500 block">
                      Sesuai AD/ART atau surat keterangan pembentukan kelompok dari RT/RW.
                    </span>
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
                      min={1}
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
                      value={tenagaTotal}
                      onChange={(e) => setTenagaTotal(Number(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono text-base font-bold"
                    />
                    <span className="text-xs text-zinc-500">
                      Total pekerja termasuk tukang spesialis dan pembantu tukang.
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
                      min={10}
                      max={90}
                      required
                      value={durasiHari}
                      onChange={(e) => setDurasiHari(Number(e.target.value) || 30)}
                      className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono font-bold text-base"
                    />
                    <span className="text-xs text-zinc-500 block">
                      Rekomendasi KAK proyek: 30 - 45 hari kalender.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700 block">
                      Narasi Metode Kerja Singkat <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={narasiMetode}
                      onChange={(e) => setNarasiMetode(e.target.value)}
                      placeholder="Jelaskan pembagian kerja regu gotong royong dan spesifikasi teknis..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-zinc-700 block">
                      Rencana Mitigasi Risiko &amp; Cuaca <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={narasiRisiko}
                      onChange={(e) => setNarasiRisiko(e.target.value)}
                      placeholder="Jelaskan langkah jika terjadi hujan deras atau keterlambatan suplai bahan..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[60px]"
                    />
                  </div>

                  {/* Upload Area */}
                  <div className="space-y-2 pt-2">
                    <label className="font-semibold text-zinc-700 block">
                      Lampiran Dokumen Kelompok &amp; KTP Anggota (PDF) <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-zinc-300 rounded-xl p-5 text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors space-y-2">
                      <UploadCloud className="w-8 h-8 text-[#1F6F43] mx-auto" />
                      <div className="text-xs text-zinc-600">
                        <span className="font-semibold text-zinc-800">
                          Klik untuk memilih berkas dokumen
                        </span>{" "}
                        atau seret file ke area ini
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Format PDF, Maksimal 5 MB per berkas (Surat pembentukan Pokmas, daftar KTP warga)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddDummyFile}
                        className="text-xs min-h-[44px]"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        <span>Simulasi Unggah Berkas Baru</span>
                      </Button>
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
                                (Terverifikasi)
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
                  disabled={isSubmitting || isMelebihiPagu}
                  className="w-full sm:w-auto bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold px-6 min-h-[44px] shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Memproses Pengajuan...</span>
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

                {/* Sidebar Sticky Guide: 4 cols */}
                <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
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
                      <span className="text-[#1F6F43] font-semibold">AKAR v1.0 SHA-256</span>
                    </div>
                  </div>
                </aside>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
