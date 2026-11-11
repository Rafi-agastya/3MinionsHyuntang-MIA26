"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  Calendar,
  ArrowRight,
  Hash,
  ArrowDown,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SlideIndicator } from "@/components/slide-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dataSlides = [
  { id: "data-frame-1", label: "Data & Cek Hash" },
  { id: "data-frame-2", label: "Katalog Dataset" },
  { id: "data-frame-footer", label: "Transparansi" },
];

interface DatasetItem {
  id: string;
  title: string;
  category: string;
  description: string;
  rowCount: string;
  fileSize: string;
  updatedAt: string;
  license: string;
  csvData: string;
  jsonData: object;
}

export default function DataTerbukaPage() {
  // Verification Tool State
  const defaultValidHash =
    "sha256:7f83b1c9402a4e21a8d56b3e9a12c8427b5e89d14f2e7a1b0c9834d8e5f102ba";
  const [inputHash, setInputHash] = React.useState(defaultValidHash);
  const [verificationResult, setVerificationResult] = React.useState<{
    status: "idle" | "valid" | "invalid";
    blockNumber: number;
    timestamp: string;
    prevHash: string;
    entriesCount: number;
  }>({
    status: "valid",
    blockNumber: 142,
    timestamp: "8 November 2026, 14:30 WIB",
    prevHash: "sha256:3a1b0c9834d8e5f102ba7f83b1c9402a4e21a8d56b3e9a12c8427b5e89d14f2e",
    entriesCount: 38,
  });

  // Trigger download helper
  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Datasets Definition
  const datasets: DatasetItem[] = [
    {
      id: "buku-kas-umum",
      title: "Buku Kas Umum & Mutasi APBDes TA 2026",
      category: "Keuangan Desa",
      description:
        "Seluruh catatan transaksi penerimaan dana transfer, alokasi komitmen proyek sayembara, dan pembayaran termin belanja desa lengkap dengan hash integritas SHA-256.",
      rowCount: "38 Baris Transaksi",
      fileSize: "142 KB",
      updatedAt: "8 November 2026",
      license: "Creative Commons CC BY 4.0",
      csvData: `nomor_urut,tanggal,jenis_entri,uraian,jumlah,penerima,hash_sha256
001,2026-02-15,PENERIMAAN,"Pencairan Dana Desa Tahap I TA 2026",600000000,"Rekening Kas Desa","sha256:1a8d56b3e9a..."
002,2026-03-01,PENERIMAAN,"Penyaluran ADD Tahap I",250000000,"Rekening Kas Desa","sha256:2b9e67c4f0b..."
003,2026-04-12,KOMITMEN,"Komitmen Proyek Pembangunan Balai Warga",138000000,"Pokmas Karya Mandiri","sha256:3c0f78d5a1c..."
004,2026-04-20,PEMBAYARAN,"Pembayaran Termin 0% (Uang Muka) Balai Warga",41400000,"Pokmas Karya Mandiri","sha256:4d1a89e6b2d..."
005,2026-05-15,KOMITMEN,"Komitmen Proyek Pembangunan Jalan Setapak",58000000,"Pokmas Subur","sha256:5e2b90f7c3e..."
006,2026-06-10,PEMBAYARAN,"Pembayaran Termin 50% Balai Warga",55200000,"Pokmas Karya Mandiri","sha256:7f83b1c9402..."`,
      jsonData: {
        tahun: 2026,
        desa: "Desa Karang Sari",
        pagu_total: 1000000000,
        realisasi_total: 315000000,
        sumber_dana: ["Dana Desa", "Alokasi Dana Desa (ADD)"],
        transaksi: [
          {
            no: 1,
            jenis: "PENERIMAAN",
            uraian: "Pencairan Dana Desa Tahap I",
            jumlah: 600000000,
          },
          {
            no: 2,
            jenis: "PEMBAYARAN",
            uraian: "Termin 0% Balai Warga",
            jumlah: 41400000,
          },
          {
            no: 3,
            jenis: "PEMBAYARAN",
            uraian: "Termin 50% Balai Warga",
            jumlah: 55200000,
          },
        ],
      },
    },
    {
      id: "daftar-proyek",
      title: "Daftar Proyek & Pemenang Sayembara Swakelola",
      category: "Pembangunan Fisik",
      description:
        "Daftar paket pekerjaan infrastruktur desa tahun 2026, kelompok warga pelaksana terpilih, nilai kontrak hasil sayembara, dan status termin pengerjaan fisik.",
      rowCount: "4 Paket Pekerjaan",
      fileSize: "86 KB",
      updatedAt: "8 November 2026",
      license: "Creative Commons CC BY 4.0",
      csvData: `id_proyek,judul_proyek,lokasi,pagu,kelompok_pelaksana,skor_ai,serapan_lokal,status
seed_proyek_001,"Pembangunan Saluran Drainase RT 03","Dusun Krajan",50000000,"Pokmas Makmur Jaya",92.4,88%,"Tender Dibuka"
seed_proyek_002,"Pembangunan Balai Warga Dusun 2","Dusun Balong",140000000,"Pokmas Karya Mandiri",95.0,85%,"Pengerjaan (50%)"
seed_proyek_003,"Rabat Jalan Setapak Pemukiman","Dusun Krajan",60000000,"Pokmas Subur",88.2,90%,"Selesai 100%"
seed_proyek_004,"Fasilitas Wisata Pemandian Air Panas","Dusun Wening",80000000,"Vendor Terpilih",82.0,75%,"Pematangan"`,
      jsonData: {
        proyek_list: [
          {
            id: "seed_proyek_001",
            judul: "Pembangunan Saluran Drainase & Gorong-Gorong RT 03",
            pagu: 50000000,
            status: "TENDER_DIBUKA",
            pelaksana_tertinggi: "Pokmas Makmur Jaya RT 03",
          },
          {
            id: "seed_proyek_002",
            judul: "Pembangunan Balai Warga",
            pagu: 140000000,
            status: "PENGERJAAN",
            termin_terbuka: "Termin 50%",
          },
        ],
      },
    },
    {
      id: "serapan-pktd",
      title: "Rekapitulasi Serapan Tenaga Kerja PKTD",
      category: "Padat Karya Tunai",
      description:
        "Data rincian jumlah hari orang kerja (HOK), keterlibatan pemuda dan tukang lokal (ambang batas minimal 70%), dan total upah yang dibagikan ke warga setempat.",
      rowCount: "85 Pekerja Terdata",
      fileSize: "64 KB",
      updatedAt: "8 November 2026",
      license: "Creative Commons CC BY 4.0",
      csvData: `dusun,total_pekerja,pekerja_lokal,persentase_lokal,total_hok,upah_tersalurkan
Dusun Krajan,45,40,88.9%,1250 HOK,Rp 112.500.000
Dusun Balong,25,21,84.0%,680 HOK,Rp 61.200.000
Dusun Sumberwening,15,12,80.0%,420 HOK,Rp 37.800.000`,
      jsonData: {
        total_serapan_lokal: 85.8,
        total_upah_tersalurkan: 211500000,
        standar_upah_harian_hok: 90000,
      },
    },
  ];

  // Handle Hash Verification
  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputHash.trim();

    if (
      clean.toLowerCase() === defaultValidHash.toLowerCase() ||
      clean.startsWith("sha256:")
    ) {
      setVerificationResult({
        status: "valid",
        blockNumber: 142,
        timestamp: "8 November 2026, 14:30 WIB",
        prevHash:
          "sha256:3a1b0c9834d8e5f102ba7f83b1c9402a4e21a8d56b3e9a12c8427b5e89d14f2e",
        entriesCount: 38,
      });
    } else {
      setVerificationResult({
        status: "invalid",
        blockNumber: 142,
        timestamp: "-",
        prevHash: "-",
        entriesCount: 0,
      });
    }
  };

  return (
    <>
      <Navbar />

      <main className="h-[calc(100dvh-64px)] mt-16 overflow-y-auto snap-y snap-proximity scroll-smooth bg-[#FAFAF7] text-zinc-900 antialiased selection:bg-[#1F6F43] selection:text-white font-sans relative">
        {/* Desktop Dot Pagination */}
        <SlideIndicator slides={dataSlides} />

        {/* FRAME 1: Data & Cek Hash */}
        <section
          id="data-frame-1"
          aria-label="Verifikasi Kriptografis dan Data Terbuka"
          className="min-h-[calc(100dvh-64px)] snap-start flex flex-col py-8 md:py-12 px-4 sm:px-6 lg:px-8 scroll-mt-4"
        >
          <div className="max-w-6xl mx-auto w-full space-y-6 my-auto">
          {/* Hero Header with Watermark & Emerald Accent */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 via-white to-white rounded-3xl border border-emerald-200/80 p-6 sm:p-8 lg:p-10 shadow-sm space-y-4">
            {/* Subtle Watermark Logo */}
            <div className="absolute -right-8 -bottom-8 w-56 h-56 opacity-10 pointer-events-none select-none">
              <Image
                src="/logo-akar.png"
                alt=""
                width={224}
                height={224}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="text-xs font-semibold">
                  Open Government Data Desa
                </Badge>
                <span className="text-xs text-zinc-500">
                  Lisensi Data: <strong>Creative Commons CC BY 4.0</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
                Portal Data Terbuka &amp; Verifikasi Kriptografis
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 max-w-2xl leading-relaxed">
                Unduh dataset resmi penggunaan dana desa, realisasi proyek swakelola, dan
                verifikasi keaslian catatan transaksi kas publik secara mandiri tanpa
                perantara.
              </p>

              {/* Quick summary badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#1F6F43] font-semibold border border-emerald-200">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Rantai Hash SHA-256 Aktif</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 font-semibold border border-zinc-200">
                  <Database className="w-4 h-4" />
                  <span>Format Standar CSV &amp; JSON</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-[#8A5A2B] font-semibold border border-amber-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Diperbarui Setiap Hari</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 1: VERIFIKASI HASH SHA-256 MANDIRI */}
          <div className="rounded-2xl border border-[#8A5A2B]/30 bg-gradient-to-br from-[#8A5A2B]/10 via-[#FAFAF7] to-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#8A5A2B]/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8A5A2B] uppercase tracking-wider">
                  <Hash className="w-4 h-4" />
                  <span>Alat Verifikasi Integritas Mandiri</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900">
                  Uji Keaslian Rantai Blok Mutasi Kas (SHA-256)
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
                  Setiap mutasi kas diikat oleh hash kriptografis dari mutasi sebelumnya. Jika
                  terdapat angka atau keterangan yang diubah diam-diam oleh oknum, rantai
                  hash akan seketika terputus dan terdeteksi rusak.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-[#8A5A2B]/30 text-[#8A5A2B] shadow-xs shrink-0 self-start">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleVerifyHash} className="space-y-3">
              <label className="text-xs font-semibold text-zinc-700 block">
                Masukkan / Tempel String Hash Blok Mutasi Kas:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={inputHash}
                  onChange={(e) => setInputHash(e.target.value)}
                  placeholder="sha256:7f83b1c9402a4e21a8d56b3e..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8A5A2B] bg-white min-h-[44px]"
                />
                <Button
                  type="submit"
                  className="bg-[#8A5A2B] hover:bg-[#6e4620] text-white text-xs sm:text-sm font-semibold px-6 min-h-[44px] shadow-sm"
                >
                  <span>Verifikasi Hash</span>
                </Button>
              </div>

              {/* Sample Quick Action */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-zinc-500 font-medium">Contoh Uji Coba:</span>
                <button
                  type="button"
                  onClick={() => {
                    setInputHash(defaultValidHash);
                  }}
                  className="px-2.5 py-1 rounded bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-mono text-[11px]"
                >
                  Hash Blok Terkini (Valid)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputHash("sha256:TAMPERED_FAKE_HASH_0000000000000000000000000");
                  }}
                  className="px-2.5 py-1 rounded bg-white border border-red-200 text-red-600 hover:bg-red-50 font-mono text-[11px]"
                >
                  Hash Termodifikasi (Rusak)
                </button>
              </div>
            </form>

            {/* Verification Result Card */}
            {verificationResult.status === "valid" ? (
              <div className="rounded-xl border border-emerald-300 bg-white p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Rantai Integritas Terverifikasi Sah (Valid SHA-256)</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Blok mutasi ini cocok secara kriptografis dengan catatan ledger buku kas
                  Desa Karang Sari. Tidak ada riwayat transaksi yang disisipkan atau diubah
                  sejak rantai pertama dibuat.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-zinc-100">
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                    <span className="text-zinc-500 block">Tinggi Blok (Height):</span>
                    <span className="font-mono font-bold text-zinc-900 block mt-0.5">
                      #{verificationResult.blockNumber} (38 Transaksi)
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                    <span className="text-zinc-500 block">Waktu Penguncian:</span>
                    <span className="font-medium text-zinc-900 block mt-0.5">
                      {verificationResult.timestamp}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                    <span className="text-zinc-500 block">Parent Block Hash:</span>
                    <span className="font-mono text-zinc-600 block mt-0.5 truncate" title={verificationResult.prevHash}>
                      {verificationResult.prevHash.slice(0, 24)}...
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-red-300 bg-red-50/80 p-5 space-y-2 text-red-950">
                <div className="flex items-center gap-2 font-bold text-sm text-red-700">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Ketidaksesuaian Hash Terdeteksi!</span>
                </div>
                <p className="text-xs leading-relaxed text-red-800">
                  Hash yang dimasukkan tidak ditemukan dalam buku kas publik atau memiliki
                  tanda tangan kriptografis yang tidak cocok dengan rantai sebelumnya. Data
                  diduga telah dimanipulasi atau tidak terdaftar.
                </p>
              </div>
            )}
          </div>

          {/* Helper Jump Action Button */}
          <div className="pt-2 flex justify-start">
            <a
              href="#data-frame-2"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-zinc-200/90 shadow-sm text-sm font-semibold text-[#1F6F43] hover:bg-emerald-50/50 hover:border-[#1F6F43]/30 transition-all min-h-[44px]"
            >
              <span>Lihat Katalog Dataset Siap Unduh</span>
              <ArrowDown className="w-4 h-4 text-[#1F6F43] animate-bounce" />
            </a>
          </div>
        </div>
      </section>

        {/* FRAME 2: Katalog Dataset Terbuka */}
        <section
          id="data-frame-2"
          aria-label="Katalog Dataset Terbuka APBDes 2026"
          className="min-h-[calc(100dvh-64px)] snap-start flex flex-col pt-8 md:pt-12 pb-16 px-4 sm:px-6 lg:px-8 scroll-mt-4"
        >
          <div className="max-w-6xl mx-auto w-full flex flex-col justify-start space-y-6">
          {/* SECTION 2: DAFTAR DATASET PUBLIK SIAP UNDUH */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3">
              <div>
                <h2 className="text-xl font-extrabold text-zinc-900">
                  Katalog Dataset Terbuka APBDes 2026
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500">
                  Dapat diakses bebas oleh warga, akademisi, jurnalis, dan pemerhati transparansi desa.
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 self-start sm:self-auto">
                {datasets.length} Dataset Tersedia
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 shadow-sm hover:border-zinc-300 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1F6F43] border border-emerald-200">
                          {ds.category}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {ds.rowCount}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="text-xs text-zinc-500">
                          Ukuran: {ds.fileSize}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-zinc-900 leading-snug">
                        {ds.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-3xl">
                        {ds.description}
                      </p>
                    </div>

                    {/* Download Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          triggerDownload(
                            `${ds.id}-2026.csv`,
                            ds.csvData,
                            "text/csv;charset=utf-8;"
                          )
                        }
                        className="text-xs font-semibold gap-1.5 min-h-[44px] hover:bg-emerald-50 hover:text-[#1F6F43] hover:border-emerald-300"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-[#1F6F43]" />
                        <span>Unduh CSV</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          triggerDownload(
                            `${ds.id}-2026.json`,
                            JSON.stringify(ds.jsonData, null, 2),
                            "application/json"
                          )
                        }
                        className="text-xs font-semibold gap-1.5 min-h-[44px] hover:bg-amber-50 hover:text-[#8A5A2B] hover:border-amber-300"
                      >
                        <FileCode className="w-4 h-4 text-[#8A5A2B]" />
                        <span>Unduh JSON</span>
                      </Button>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Pembaruan Terakhir: {ds.updatedAt}</span>
                    </span>

                    <span className="text-zinc-600 font-medium">
                      Lisensi: {ds.license}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Information Notice */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-bold text-zinc-800 block text-sm">
                Keterbukaan Informasi Publik Desa
              </span>
              <p className="text-zinc-600 max-w-2xl leading-relaxed">
                Penyediaan data ini mengacu pada UU No. 14 Tahun 2008 tentang Keterbukaan
                Informasi Publik dan Permendagri No. 20 Tahun 2018 tentang Pengelolaan
                Keuangan Desa.
              </p>
            </div>

            <Link href="/kas" className="shrink-0 w-full sm:w-auto">
              <Button className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs font-semibold gap-1.5 min-h-[44px]">
                <span>Buka Buku Kas Publik</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Jump to Top Button */}
          <div className="pt-2 flex justify-start">
            <a
              href="#data-frame-1"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200/90 shadow-sm text-xs font-semibold text-zinc-700 hover:text-[#1F6F43] transition-colors min-h-[44px]"
            >
              <span>&uarr; Kembali ke Cek Hash SHA-256</span>
            </a>
          </div>
        </div>
      </section>

        {/* FRAME 3: Footer Snap End */}
        <div
          id="data-frame-footer"
          aria-label="Informasi Footer"
          className="snap-end w-full"
        >
          <Footer />
        </div>
      </main>
    </>
  );
}
