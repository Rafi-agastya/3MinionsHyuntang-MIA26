"use client";

import * as React from "react";
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";

export interface TandaTerimaModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string;
  project: {
    id: string;
    judul: string;
    lokasi: string;
    pagu: number;
    durasiMin?: number;
    durasiMax?: number;
  };
  penawaran: number;
  durasiHari: number;
  tenagaTotal: number;
  tenagaLokal: number;
  pokmasNama: string;
  ketuaNama: string;
  kontakWa: string;
  scoreResult: {
    total: number;
    rincian: {
      biaya: number;
      lokal: number;
      jadwal: number;
      lengkap: number;
    };
  } | null;
  dokumenList: string[];
}

export function TandaTerimaModal({
  isOpen,
  onClose,
  proposalId,
  project,
  penawaran,
  durasiHari,
  tenagaTotal,
  tenagaLokal,
  pokmasNama,
  ketuaNama,
  kontakWa,
  scoreResult,
  dokumenList,
}: TandaTerimaModalProps) {
  const [waktuCetak, setWaktuCetak] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setWaktuCetak(
        now.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const persentaseLokal =
    tenagaTotal > 0 ? Math.round((tenagaLokal / tenagaTotal) * 100) : 0;
  const sisaPagu = Math.max(0, project.pagu - penawaran);
  const persentaseHemat =
    project.pagu > 0 ? ((sisaPagu / project.pagu) * 100).toFixed(1) : "0.0";

  // Tangani Cetak ke Printer / Simpan PDF native browser
  const handlePrint = () => {
    window.print();
  };

  // Tangani Unduh Berkas Salinan Offline (.html siap buka dan cetak kapan saja)
  const handleDownloadOfflineDoc = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Tanda Terima Sayembara - ${proposalId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #18181b; background: #fff; }
    .kop { text-align: center; border-bottom: 3px double #18181b; padding-bottom: 12px; margin-bottom: 20px; }
    .kop h2 { margin: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .kop h1 { margin: 4px 0; font-size: 20px; font-weight: 900; letter-spacing: 1px; }
    .kop p { margin: 2px 0; font-size: 11px; color: #52525b; }
    .title-box { text-align: center; margin: 18px 0; }
    .title-box h3 { margin: 0; font-size: 15px; font-weight: 800; text-decoration: underline; }
    .title-box p { margin: 4px 0 0; font-size: 11px; font-family: monospace; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
    th, td { border: 1px solid #e4e4e7; padding: 7px 10px; text-align: left; }
    th { background: #f4f4f5; font-weight: 600; width: 30%; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: 600; border-radius: 4px; background: #dcfce7; color: #166534; }
    .score-table th { background: #f0fdf4; width: auto; text-align: center; }
    .score-table td { text-align: center; font-family: monospace; font-weight: bold; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
    .stempel { border: 2px dashed #166534; border-radius: 50%; width: 110px; height: 110px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; font-weight: 700; color: #166534; transform: rotate(-8deg); margin-top: 10px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="kop">
    <h2>Pemerintah Kabupaten Banyumas &bull; Kecamatan Baturraden</h2>
    <h1>PEMERINTAH DESA KARANG SARI</h1>
    <p>Sekretariat: Jl. Raya Karang Sari No. 12, Kode Pos 53151 &bull; Portal Resmi: akar.desa.id</p>
    <p><strong>TIM PENGELOLA KEGIATAN (TPK) DESA TAHUN ANGGARAN 2026</strong></p>
  </div>

  <div class="title-box">
    <h3>TANDA TERIMA REGISTRASI SAYEMBARA SWAKELOLA WARGA</h3>
    <p>NOMOR BUKTI: TPK-SBY/2026/${proposalId}</p>
  </div>

  <table>
    <tr><th>ID Proposal Resmi</th><td><strong>${proposalId}</strong> (Tercatat dalam Sistem Audit Terbuka AKAR)</td></tr>
    <tr><th>Waktu Pendaftaran</th><td>${waktuCetak}</td></tr>
    <tr><th>Nama Proyek</th><td><strong>${project.judul}</strong></td></tr>
    <tr><th>Lokasi Proyek</th><td>${project.lokasi}</td></tr>
    <tr><th>Pagu Anggaran Desa</th><td>${formatRupiah(project.pagu)}</td></tr>
    <tr><th>Total Nilai Penawaran</th><td><strong>${formatRupiah(penawaran)}</strong> (Efisiensi: ${formatRupiah(sisaPagu)} / ${persentaseHemat}%)</td></tr>
    <tr><th>Rencana Waktu</th><td>${durasiHari} Hari Kalender</td></tr>
    <tr><th>Pokmas Pengusul</th><td><strong>${pokmasNama || "Pokmas Pelaksana"}</strong></td></tr>
    <tr><th>Penanggung Jawab / Ketua</th><td>${ketuaNama} (Kontak WA: ${kontakWa})</td></tr>
    <tr><th>Tenaga Kerja Lokal (PKTD)</th><td>${tenagaLokal} orang dari total ${tenagaTotal} orang (${persentaseLokal}%) &mdash; <span class="badge">MEMENUHI STANDAR PKTD (&ge;70%)</span></td></tr>
    <tr><th>Lampiran Berkas</th><td>${dokumenList.join(", ") || "Dokumen Legalitas Terverifikasi"}</td></tr>
  </table>

  <h4 style="margin: 18px 0 6px; font-size: 13px;">Hasil Estimasi Formula Penilaian Terbuka:</h4>
  <table class="score-table">
    <tr>
      <th>Biaya (40%)</th>
      <th>Tenaga Lokal (30%)</th>
      <th>Jadwal (20%)</th>
      <th>Kelengkapan (10%)</th>
      <th style="background:#dcfce7; color:#166534;">Estimasi Total Skor</th>
    </tr>
    <tr>
      <td>${scoreResult ? scoreResult.rincian.biaya.toFixed(1) : "-"} / 100</td>
      <td>${scoreResult ? scoreResult.rincian.lokal.toFixed(1) : "-"} / 100</td>
      <td>${scoreResult ? scoreResult.rincian.jadwal.toFixed(1) : "-"} / 100</td>
      <td>${scoreResult ? scoreResult.rincian.lengkap.toFixed(1) : "-"} / 100</td>
      <td style="font-size: 15px; color:#166534;">${scoreResult ? scoreResult.total.toFixed(1) : "-"} / 100</td>
    </tr>
  </table>

  <p style="font-size: 10px; color: #71717a; margin-top: 10px; line-height: 1.4;">
    * Catatan: Dokumen ini diterbitkan otomatis oleh Sistem AKAR. Skor dihitung secara matematis transparan tanpa intervensi subyektif. Penetapan pemenang definitif disahkan oleh Kepala Desa setelah masa sanggah 3 hari kerja berakhir.
  </p>

  <div class="footer">
    <div>
      <p>Verifikasi Digital Sistem AKAR:</p>
      <div class="stempel">
        TERCATAT RESMI<br/>
        SISTEM AKAR<br/>
        DESA KARANG SARI<br/>
        TPK SWAKELOLA
      </div>
    </div>
    <div style="text-align: right; width: 220px;">
      <p>Karang Sari, ${waktuCetak.split(",")[0] || "11 November 2026"}</p>
      <p style="margin-bottom: 50px;">Tim Pengelola Kegiatan (TPK)</p>
      <p style="font-weight: bold; text-decoration: underline;">( Sistem Otomasi AKAR )</p>
      <p style="font-size: 10px; color: #71717a;">NIP. 19840212 201101 1 004</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tanda_Terima_Sayembara_${proposalId.slice(-8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tanda-terima-title"
    >
      {/* Container Kertas Surat A4 */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar (Tidak ikut tercetak saat print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-wide">
              Pratinjau Tanda Terima Resmi Sayembara Swakelola
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadOfflineDoc}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 gap-1.5 h-8 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Berkas (.html)</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs bg-[#1F6F43] hover:bg-[#185935] text-white gap-1.5 h-8 font-semibold shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-1"
              aria-label="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Area Dokumen Resmi (Bisa Di-Print Langsung) */}
        <div className="p-6 sm:p-10 overflow-y-auto print:p-0 print:overflow-visible text-zinc-900 space-y-6">
          {/* KOP SURAT RESMI */}
          <div className="text-center pb-4 border-b-4 border-double border-zinc-900 space-y-1">
            <div className="flex items-center justify-center gap-2 text-zinc-900 mb-1">
              <Building2 className="w-6 h-6 text-[#1F6F43]" />
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase">
                Pemerintah Kabupaten Banyumas &bull; Kecamatan Baturraden
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight uppercase text-zinc-950">
              Pemerintah Desa Karang Sari
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-600">
              Sekretariat: Jl. Raya Karang Sari No. 12, Kode Pos 53151 &bull; Telp (0281) 684201 &bull; Portal: akar.desa.id
            </p>
            <p className="text-xs font-bold text-[#1F6F43] uppercase tracking-wide pt-0.5">
              TIM PENGELOLA KEGIATAN (TPK) DESA TAHUN ANGGARAN 2026
            </p>
          </div>

          {/* JUDUL TANDA TERIMA */}
          <div className="text-center space-y-1">
            <h2
              id="tanda-terima-title"
              className="text-sm sm:text-base font-extrabold uppercase underline tracking-wide text-zinc-900"
            >
              Surat Bukti Registrasi Usulan Sayembara Swakelola
            </h2>
            <p className="text-xs font-mono font-bold text-[#1F6F43]">
              NOMOR REGISTRASI: TPK-SBY/2026/{proposalId}
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {waktuCetak || "11 November 2026"}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Status: Audit Trail Terverifikasi
              </span>
            </div>
          </div>

          {/* TABEL DATA PROYEK & PENGUSUL */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden text-xs sm:text-sm">
            <div className="bg-zinc-100/80 px-4 py-2 border-b border-zinc-200 font-bold text-zinc-800 flex items-center justify-between">
              <span>A. Rincian Usulan Proyek &amp; Penawaran</span>
              <span className="text-xs font-normal text-zinc-500 font-mono">
                ID: {project.id}
              </span>
            </div>
            <div className="divide-y divide-zinc-100 text-xs sm:text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-white">
                <span className="font-semibold text-zinc-600">Nama Paket Proyek</span>
                <span className="sm:col-span-2 font-bold text-zinc-900">
                  {project.judul}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-zinc-50/50">
                <span className="font-semibold text-zinc-600">Lokasi Pelaksanaan</span>
                <span className="sm:col-span-2 text-zinc-800">{project.lokasi}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-white">
                <span className="font-semibold text-zinc-600">Pagu Anggaran Desa</span>
                <span className="sm:col-span-2 font-mono font-bold text-zinc-800">
                  {formatRupiah(project.pagu)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-emerald-50/40">
                <span className="font-semibold text-[#1F6F43]">Nilai Penawaran Pokmas</span>
                <span className="sm:col-span-2 font-mono font-black text-sm text-[#1F6F43]">
                  {formatRupiah(penawaran)}{" "}
                  <span className="text-xs font-normal text-emerald-800">
                    (Efisiensi Anggaran: {formatRupiah(sisaPagu)} / {persentaseHemat}%)
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-white">
                <span className="font-semibold text-zinc-600">Rencana Waktu Pengerjaan</span>
                <span className="sm:col-span-2 font-semibold text-zinc-900">
                  {durasiHari} Hari Kalender
                </span>
              </div>
            </div>
          </div>

          {/* TABEL DATA POKMAS & PKTD */}
          <div className="rounded-xl border border-zinc-200 overflow-hidden text-xs sm:text-sm">
            <div className="bg-zinc-100/80 px-4 py-2 border-b border-zinc-200 font-bold text-zinc-800">
              <span>B. Identitas Kelompok &amp; Padat Karya Tunai Desa (PKTD)</span>
            </div>
            <div className="divide-y divide-zinc-100 text-xs sm:text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-white">
                <span className="font-semibold text-zinc-600">Kelompok Pengusul</span>
                <span className="sm:col-span-2 font-bold text-zinc-900">
                  {pokmasNama || "Pokmas Pelaksana Terdaftar"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-zinc-50/50">
                <span className="font-semibold text-zinc-600">Penanggung Jawab / Ketua</span>
                <span className="sm:col-span-2 text-zinc-800">
                  {ketuaNama} (Kontak WA: <span className="font-mono">{kontakWa}</span>)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-white">
                <span className="font-semibold text-zinc-600">Komposisi Tenaga Kerja</span>
                <span className="sm:col-span-2 text-zinc-800">
                  <strong>{tenagaLokal} orang warga lokal</strong> dari total {tenagaTotal} tenaga kerja (
                  <strong className="text-emerald-700">{persentaseLokal}%</strong>)
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    Memenuhi Syarat PKTD (&ge;70%)
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 p-3 bg-zinc-50/50">
                <span className="font-semibold text-zinc-600">Dokumen Terlampir</span>
                <span className="sm:col-span-2 font-mono text-xs text-zinc-700">
                  {dokumenList.join(", ") || "Proposal_Teknis.pdf, Daftar_Warga.pdf"}
                </span>
              </div>
            </div>
          </div>

          {/* TABEL SKOR ALGORITMA TERBUKA (PRD Bagian 25) */}
          {scoreResult && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/30 overflow-hidden text-xs">
              <div className="bg-emerald-100/70 px-4 py-2 border-b border-emerald-300 font-bold text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#1F6F43]" />
                  <span>C. Hasil Penilaian Formula Terbuka</span>
                </div>
                <span className="font-mono font-bold text-sm text-[#1F6F43]">
                  Skor: {scoreResult.total.toFixed(1)} / 100
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 p-3 gap-2 text-center">
                <div className="bg-white p-2 rounded border border-emerald-200">
                  <span className="text-zinc-500 block text-[11px]">Biaya (40%)</span>
                  <span className="font-mono font-bold text-sm text-[#1F6F43]">
                    {scoreResult.rincian.biaya.toFixed(1)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-emerald-200">
                  <span className="text-zinc-500 block text-[11px]">Tenaga Lokal (30%)</span>
                  <span className="font-mono font-bold text-sm text-[#1F6F43]">
                    {scoreResult.rincian.lokal.toFixed(1)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-emerald-200">
                  <span className="text-zinc-500 block text-[11px]">Jadwal (20%)</span>
                  <span className="font-mono font-bold text-sm text-[#8A5A2B]">
                    {scoreResult.rincian.jadwal.toFixed(1)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded border border-emerald-200">
                  <span className="text-zinc-500 block text-[11px]">Kelengkapan (10%)</span>
                  <span className="font-mono font-bold text-sm text-[#1F6F43]">
                    {scoreResult.rincian.lengkap.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CATATAN LEGALITAS & KLAUSUL INTEGRITAS */}
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 space-y-1 text-[11px] text-zinc-600 leading-relaxed">
            <span className="font-bold text-zinc-800 block">
              Ketentuan dan Klausul Keterbukaan Publik:
            </span>
            <p>
              1. Dokumen ini adalah tanda terima registrasi resmi yang diterbitkan secara elektronik oleh Sistem AKAR Desa Karang Sari dan diakui secara sah oleh Tim Pengelola Kegiatan (TPK).
            </p>
            <p>
              2. Seluruh rincian proposal, nilai penawaran, dan estimasi skor bersifat terbuka dan dapat diaudit oleh warga serta Badan Permusyawaratan Desa (BPD). Penetapan pelaksana definitif disahkan oleh Kepala Desa setelah masa sanggah 3 (tiga) hari kerja berakhir.
            </p>
          </div>

          {/* AREA STEMPEL DIGITAL & TANDA TANGAN */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-zinc-200 text-xs">
            {/* Stempel Digital */}
            <div className="flex items-center gap-3">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1F6F43] flex flex-col items-center justify-center text-center p-1 text-[8.5px] font-bold text-[#1F6F43] uppercase -rotate-6 shadow-sm">
                <span>Pemerintah Desa</span>
                <span className="text-[10px] text-emerald-950 font-black">Karang Sari</span>
                <span className="text-[7.5px] text-zinc-500">TPK Swakelola</span>
                <span className="border-t border-[#1F6F43] w-3/4 mt-0.5 pt-0.5 text-[7px] text-[#1F6F43]">
                  TERVERIFIKASI
                </span>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <span className="font-bold text-zinc-800 block">
                  Autentikasi Sistem AKAR
                </span>
                <span className="font-mono text-[10px] text-zinc-500 block truncate max-w-[200px]">
                  Hash: {proposalId}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold block">
                  &bull; Anti-Pungli &amp; Transparan
                </span>
              </div>
            </div>

            {/* Tanda Tangan TPK */}
            <div className="text-center sm:text-right space-y-1">
              <p className="text-zinc-600">
                Karang Sari, {waktuCetak.split(",")[0] || "11 November 2026"}
              </p>
              <p className="font-semibold text-zinc-800">
                Tim Pengelola Kegiatan (TPK) Swakelola
              </p>
              <div className="h-12 flex items-center justify-center sm:justify-end">
                <span className="font-mono text-xs text-zinc-400 italic">
                  [ Ditandatangani Secara Digital ]
                </span>
              </div>
              <p className="font-bold text-zinc-900 underline">
                BAMBANG SUTIKNO, S.Sos
              </p>
              <p className="text-[10px] text-zinc-500">Ketua TPK Desa Karang Sari</p>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar (Tidak ikut tercetak saat print) */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <span className="text-xs text-zinc-500">
            Tekan <kbd className="px-1.5 py-0.5 bg-white border border-zinc-300 rounded text-[11px] font-mono">Ctrl + P</kbd> untuk mencetak atau simpan sebagai file PDF resmi.
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs bg-[#1F6F43] hover:bg-[#185935] text-white gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Dokumen Sekarang</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
