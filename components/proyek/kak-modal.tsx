"use client";

import * as React from "react";
import {
  Printer,
  Download,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";

export interface KakModalProps {
  isOpen: boolean;
  onClose: () => void;
  proyek: {
    id: string;
    judul: string;
    deskripsi?: string;
    lokasi: string;
    pagu: number;
    syaratLokalMin?: number;
    durasiMin?: number;
    durasiMax?: number;
    sumberDana?: string;
    tenggatProposal?: string;
    rabItems?: Array<{
      uraian: string;
      volume: number;
      satuan: string;
      hargaSatuan: number;
      subtotal: number;
    }>;
  };
}

export function KakModal({ isOpen, onClose, proyek }: KakModalProps) {
  const [waktuCetak, setWaktuCetak] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setWaktuCetak(
        now.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const durasiMin = proyek.durasiMin || 30;
  const durasiMax = proyek.durasiMax || 60;
  const syaratLokal = proyek.syaratLokalMin || 70;
  const rabList = proyek.rabItems || [];

  // Cetak dokumen native A4
  const handlePrint = () => {
    window.print();
  };

  // Unduh dokumen salinan offline
  const handleDownloadDoc = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Kerangka Acuan Kerja (KAK) - ${proyek.judul}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; color: #18181b; background: #fff; line-height: 1.5; font-size: 12px; }
    .kop { text-align: center; border-bottom: 3px double #18181b; padding-bottom: 12px; margin-bottom: 24px; }
    .kop h2 { margin: 0; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .kop h1 { margin: 4px 0; font-size: 19px; font-weight: 900; letter-spacing: 1px; }
    .kop p { margin: 2px 0; font-size: 11px; color: #52525b; }
    .title-box { text-align: center; margin: 18px 0; }
    .title-box h3 { margin: 0; font-size: 15px; font-weight: 800; text-decoration: underline; text-transform: uppercase; }
    .title-box p { margin: 4px 0 0; font-size: 11px; font-family: monospace; font-weight: bold; }
    h4 { margin: 16px 0 6px; font-size: 13px; font-weight: 700; border-bottom: 1px solid #e4e4e7; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    th, td { border: 1px solid #e4e4e7; padding: 6px 8px; text-align: left; }
    th { background: #f4f4f5; font-weight: 600; }
    .rab-table th { background: #f0fdf4; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 600; border-radius: 4px; background: #dcfce7; color: #166534; }
    .footer { margin-top: 36px; display: flex; justify-content: space-between; font-size: 11px; }
    .stempel { border: 2px dashed #166534; border-radius: 50%; width: 115px; height: 115px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; font-weight: 700; color: #166534; transform: rotate(-7deg); margin-top: 10px; }
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
    <h3>KERANGKA ACUAN KERJA (KAK) SAYEMBARA SWAKELOLA WARGA</h3>
    <p>NOMOR DOKUMEN: KAK-SBY/2026/${proyek.id}</p>
  </div>

  <h4>1. IDENTITAS &amp; LATAR BELAKANG PAKET KEGIATAN</h4>
  <table>
    <tr><th style="width: 28%;">Nama Kegiatan</th><td><strong>${proyek.judul}</strong></td></tr>
    <tr><th>Lokasi Pekerjaan</th><td>${proyek.lokasi}</td></tr>
    <tr><th>Pagu Anggaran Maksimal</th><td><strong>${formatRupiah(proyek.pagu)}</strong> (Sudah termasuk pajak &amp; HOK Warga)</td></tr>
    <tr><th>Sumber Pendanaan</th><td>${proyek.sumberDana || "Dana Desa (DDS) Tahun Anggaran 2026"}</td></tr>
    <tr><th>Jangka Waktu Kerja</th><td>${durasiMin} s/d ${durasiMax} Hari Kalender</td></tr>
    <tr><th>Kriteria Pelaksana</th><td>Kelompok Masyarakat (Pokmas) / Kelompok Tukang Warga Desa Karang Sari</td></tr>
  </table>

  <h4>2. KEWAJIBAN STANDAR PADAT KARYA TUNAI DESA (PKTD)</h4>
  <p>Sesuai regulasi swakelola desa, pelaksana pekerjaan fisik wajib memenuhi ketentuan berikut:</p>
  <ul>
    <li>Menyerap tenaga kerja lokal desa minimal <strong>${syaratLokal}%</strong> dari total keseluruhan tenaga kerja.</li>
    <li>Memprioritaskan warga prasejahtera, penganggur, dan pekerja harian setempat.</li>
    <li>Dilarang keras mensubkontrakkan atau mengalihkan seluruh maupun sebagian pekerjaan kepada kontraktor / pemborong luar komersial.</li>
  </ul>

  <h4>3. ACUAN KEBUTUHAN MATERIAL &amp; RINCIAN RAB STANDAR DESA</h4>
  ${
    rabList.length > 0
      ? `<table class="rab-table">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th>Uraian Komponen Pekerjaan</th>
              <th style="width: 12%; text-align: right;">Volume</th>
              <th style="width: 10%;">Satuan</th>
              <th style="width: 20%; text-align: right;">Harga Satuan Acuan</th>
              <th style="width: 22%; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rabList
              .map(
                (item, idx) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td><strong>${item.uraian}</strong></td>
                <td style="text-align: right;">${item.volume}</td>
                <td>${item.satuan}</td>
                <td style="text-align: right;">${formatRupiah(item.hargaSatuan)}</td>
                <td style="text-align: right;"><strong>${formatRupiah(item.subtotal)}</strong></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>`
      : `<p style="font-style: italic; color: #71717a;">Rincian butir RAB acuan tertera dalam lampiran teknis TPK.</p>`
  }

  <h4>4. FORMULA BOBOT PENILAIAN TERBUKA SAYEMBARA</h4>
  <table>
    <tr>
      <th style="text-align: center;">Efisiensi Biaya (40%)</th>
      <th style="text-align: center;">Tenaga Kerja Lokal (30%)</th>
      <th style="text-align: center;">Rasionalitas Jadwal (20%)</th>
      <th style="text-align: center;">Kelengkapan Berkas (10%)</th>
    </tr>
    <tr>
      <td style="text-align: center;">Nilai penawaran wajar di bawah pagu anggaran desa</td>
      <td style="text-align: center;">Komitmen serapan warga desa (&ge;${syaratLokal}%)</td>
      <td style="text-align: center;">Metode realistis dalam rentang ${durasiMin}-${durasiMax} hari</td>
      <td style="text-align: center;">KTP anggota, susunan pokmas, &amp; mitigasi risiko</td>
    </tr>
  </table>

  <div class="footer">
    <div>
      <p>Sistem Akuntabilitas Terbuka AKAR:</p>
      <div class="stempel">
        DOKUMEN RESMI<br/>
        TPK SWAKELOLA<br/>
        DESA KARANG SARI<br/>
        TAHUN 2026
      </div>
    </div>
    <div style="text-align: right; width: 230px;">
      <p>Karang Sari, ${waktuCetak || "11 November 2026"}</p>
      <p style="margin-bottom: 50px;">Tim Pengelola Kegiatan (TPK)</p>
      <p style="font-weight: bold; text-decoration: underline;">( Pelaksana Kegiatan Anggaran )</p>
      <p style="font-size: 10px; color: #71717a;">NIP. 19840212 201101 1 004</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KAK_Sayembara_${proyek.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="kak-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span id="kak-modal-title" className="font-bold text-sm tracking-wide">
              Kerangka Acuan Kerja (KAK) Resmi &bull; Desa Karang Sari
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadDoc}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 gap-1.5 h-8 font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Berkas (.html)</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs bg-[#1F6F43] hover:bg-[#185935] text-white gap-1.5 h-8 font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors ml-1"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-zinc-100/60 print:p-0 print:bg-white text-zinc-900 font-sans">
          <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-zinc-200/80 space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Kop Resmi Desa */}
            <div className="text-center border-b-4 border-double border-zinc-900 pb-4 space-y-1">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-700">
                Pemerintah Kabupaten Banyumas &bull; Kecamatan Baturraden
              </h3>
              <h2 className="text-lg sm:text-2xl font-black tracking-wide text-zinc-950 uppercase">
                Pemerintah Desa Karang Sari
              </h2>
              <p className="text-xs text-zinc-600">
                Sekretariat: Jl. Raya Karang Sari No. 12, Kode Pos 53151 &bull; Portal Resmi: akar.desa.id
              </p>
              <p className="text-xs font-bold text-zinc-800 tracking-wide uppercase pt-1">
                Tim Pengelola Kegiatan (TPK) Swakelola Warga Tahun Anggaran 2026
              </p>
            </div>

            {/* Judul Dokumen */}
            <div className="text-center space-y-1 py-2">
              <h1 className="text-base sm:text-lg font-extrabold uppercase underline tracking-tight text-zinc-900">
                KERANGKA ACUAN KERJA (KAK) SAYEMBARA SWAKELOLA WARGA
              </h1>
              <p className="text-xs font-mono font-semibold text-zinc-600">
                Nomor Registrasi: TPK-KAK/2026/{proyek.id}
              </p>
            </div>

            {/* Bagian 1: Identitas Paket */}
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-zinc-800 border-b border-zinc-200 pb-1 flex items-center gap-2">
                <span>1. Identitas &amp; Ketentuan Paket Sayembara</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-50 p-4 rounded-xl border border-zinc-200/80">
                <div>
                  <span className="text-zinc-500 block">Nama Paket Kegiatan:</span>
                  <strong className="text-zinc-900 block mt-0.5">{proyek.judul}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Lokasi Pengerjaan Fisik:</span>
                  <strong className="text-zinc-900 block mt-0.5">{proyek.lokasi}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Pagu Anggaran Desa Maksimal:</span>
                  <strong className="text-emerald-700 font-mono text-sm block mt-0.5">
                    {formatRupiah(proyek.pagu)}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Sumber Pembiayaan:</span>
                  <strong className="text-zinc-900 block mt-0.5">
                    {proyek.sumberDana || "Dana Desa (DDS) TA 2026"}
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Target Waktu Pengerjaan:</span>
                  <strong className="text-zinc-900 block mt-0.5">
                    {durasiMin} s/d {durasiMax} Hari Kalender
                  </strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Syarat Minimal Tenaga Lokal:</span>
                  <strong className="text-[#1F6F43] font-bold block mt-0.5">
                    Minimal {syaratLokal}% Tenaga Kerja Warga Setempat
                  </strong>
                </div>
              </div>
            </div>

            {/* Bagian 2: Deskripsi Teknis */}
            {proyek.deskripsi && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wide text-zinc-800 border-b border-zinc-200 pb-1">
                  2. Latar Belakang &amp; Ruang Lingkup Fisik
                </h4>
                <p className="text-zinc-700 leading-relaxed text-justify">
                  {proyek.deskripsi}
                </p>
              </div>
            )}

            {/* Bagian 3: Acuan Micro-RAB */}
            {rabList.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wide text-zinc-800 border-b border-zinc-200 pb-1">
                  3. Daftar Acuan Kebutuhan Bahan &amp; Upah Kerja (RAB Acuan TPK)
                </h4>
                <div className="overflow-x-auto border border-zinc-200 rounded-xl">
                  <table className="w-full text-left">
                    <thead className="bg-emerald-50/70 text-zinc-800 font-bold border-b border-zinc-200">
                      <tr>
                        <th className="p-2.5 text-center w-10">No</th>
                        <th className="p-2.5">Uraian Komponen Pekerjaan</th>
                        <th className="p-2.5 text-right">Volume</th>
                        <th className="p-2.5">Satuan</th>
                        <th className="p-2.5 text-right">Harga Acuan</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {rabList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                          <td className="p-2.5 text-center text-zinc-500">{idx + 1}</td>
                          <td className="p-2.5 font-medium text-zinc-900">{item.uraian}</td>
                          <td className="p-2.5 text-right font-mono">{item.volume}</td>
                          <td className="p-2.5 text-zinc-600">{item.satuan}</td>
                          <td className="p-2.5 text-right font-mono text-zinc-700">
                            {formatRupiah(item.hargaSatuan)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-zinc-900">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bagian 4: Formula Bobot Penilaian */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wide text-zinc-800 border-b border-zinc-200 pb-1">
                4. Bobot Penilaian Terbuka Formula Deterministik
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <span className="text-zinc-500 block font-medium">Efisiensi Biaya</span>
                  <span className="text-sm font-bold text-[#1F6F43] block mt-0.5">Bobot 40%</span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <span className="text-zinc-500 block font-medium">Tenaga Lokal</span>
                  <span className="text-sm font-bold text-[#1F6F43] block mt-0.5">Bobot 30%</span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <span className="text-zinc-500 block font-medium">Rasionalitas Jadwal</span>
                  <span className="text-sm font-bold text-[#8A5A2B] block mt-0.5">Bobot 20%</span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                  <span className="text-zinc-500 block font-medium">Kelengkapan Dokumen</span>
                  <span className="text-sm font-bold text-[#1F6F43] block mt-0.5">Bobot 10%</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 italic pt-1">
                * Skor dihitung otomatis secara objektif oleh sistem terbuka AKAR. AI tidak pernah menentukan skor atau pemenang; keputusan definitif disahkan oleh Kepala Desa setelah masa sanggah 3 hari kerja berakhir.
              </p>
            </div>

            {/* Tanda Tangan & Stempel TPK */}
            <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1F6F43] flex flex-col items-center justify-center text-center p-1 text-[#1F6F43] font-bold text-[9px] -rotate-6">
                  <span>TERCATAT RESMI</span>
                  <span>TPK SWAKELOLA</span>
                  <span>DESA KARANG SARI</span>
                  <span>TAHUN 2026</span>
                </div>
                <div className="text-zinc-500 text-[11px] space-y-0.5">
                  <p className="font-semibold text-zinc-700">Verifikasi Sistem AKAR</p>
                  <p>Kode Keaslian: SHA-256 Valid</p>
                  <p>Status: Terbuka untuk Umum</p>
                </div>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <p className="text-zinc-600">Karang Sari, {waktuCetak || "11 November 2026"}</p>
                <p className="font-semibold text-zinc-900 pb-12">
                  Tim Pengelola Kegiatan (TPK) Desa
                </p>
                <p className="font-bold underline text-zinc-900">
                  ( Pelaksana Kegiatan Anggaran )
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">NIP. 19840212 201101 1 004</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
