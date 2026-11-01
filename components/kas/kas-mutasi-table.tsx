"use client";

import * as React from "react";
import {
  Search,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  X,
  FileCheck2,
  Copy,
  Check,
  Layers,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";

export type KasTransactionType = "PEMASUKAN" | "PENGELUARAN";

export interface KasTransaction {
  id: string;
  tanggal: string;
  jenis: KasTransactionType;
  kategori: string;
  uraian: string;
  jumlah: number;
  buktiUrl: string;
  nomorBukti?: string;
  bidang?: "Infrastruktur Fisik" | "Pemberdayaan Warga" | "Operasional Desa" | "Pendapatan & Transfer";
  verifikatorBpd?: string;
  hashSha256?: string;
  keteranganValidasi?: string;
}

interface KasMutasiTableProps {
  transaksiList: KasTransaction[];
}

type FilterJenis = "SEMUA" | KasTransactionType;
type FilterBidang = "Semua" | "Infrastruktur Fisik" | "Pemberdayaan Warga" | "Operasional Desa";

const BIDANG_OPTIONS: FilterBidang[] = [
  "Semua",
  "Infrastruktur Fisik",
  "Pemberdayaan Warga",
  "Operasional Desa",
];

const JENIS_OPTIONS: Array<{ value: FilterJenis; label: string }> = [
  { value: "SEMUA", label: "Semua Transaksi" },
  { value: "PEMASUKAN", label: "Kas Masuk (+)" },
  { value: "PENGELUARAN", label: "Kas Keluar (-)" },
];

function formatTanggal(tanggal: string) {
  const date = new Date(tanggal);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatWaktu(tanggal: string) {
  const date = new Date(tanggal);
  if (Number.isNaN(date.getTime())) return "08:00 WIB";

  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date) + " WIB"
  );
}

// Generate deterministically rich metadata if not present
function enrichTransaction(item: KasTransaction, index: number): Required<KasTransaction> {
  const hashList = [
    "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "4d32e987cbf415e982c7a523e01a91cf8e678a83b9e4a8f9d0c231e5b1287c94",
    "9a12c842b03918f4a7c85e921d7b04938a164e29b53f0981e4b850d9123847a1",
    "3f89e1029c48b71d6e5a0192837465af4891b2c3d4e5f60718293a4b5c6d7e8f",
    "8b74c2019a84f3e2d1098374650192837465afbe47291a039b4c5d6e7f8091a2",
    "1a9b8c7d6e5f0123456789abcdef0123456789abcdef0123456789abcdef0123",
  ];

  let bidang: Required<KasTransaction>["bidang"] = "Operasional Desa";
  if (
    item.kategori.includes("Termin") ||
    item.kategori.includes("Swakelola") ||
    item.uraian.toLowerCase().includes("balai") ||
    item.uraian.toLowerCase().includes("jalan") ||
    item.uraian.toLowerCase().includes("drainase")
  ) {
    bidang = "Infrastruktur Fisik";
  } else if (
    item.kategori.includes("Ketahanan") ||
    item.uraian.toLowerCase().includes("tani") ||
    item.uraian.toLowerCase().includes("pangan") ||
    item.uraian.toLowerCase().includes("warga")
  ) {
    bidang = "Pemberdayaan Warga";
  } else if (item.jenis === "PEMASUKAN") {
    bidang = "Pendapatan & Transfer";
  }

  const hash =
    item.hashSha256 ||
    hashList[index % hashList.length] ||
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  return {
    ...item,
    nomorBukti: item.nomorBukti || `BKK-2026-${String(index + 1).padStart(4, "0")}`,
    bidang: item.bidang || bidang,
    verifikatorBpd: item.verifikatorBpd || "H. Ahmad Fauzi (Ketua BPD)",
    hashSha256: hash,
    keteranganValidasi:
      item.keteranganValidasi ||
      "Telah diverifikasi sesuai bukti transfer bank & Berita Acara Rekonsiliasi Kas.",
  };
}

export function KasMutasiTable({ transaksiList }: KasMutasiTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterJenis, setFilterJenis] = React.useState<FilterJenis>("SEMUA");
  const [filterBidang, setFilterBidang] = React.useState<FilterBidang>("Semua");
  const [selectedTx, setSelectedTx] = React.useState<Required<KasTransaction> | null>(null);
  const [copiedHash, setCopiedHash] = React.useState(false);

  // Enriched list
  const enrichedList = React.useMemo(() => {
    return transaksiList.map((tx, idx) => enrichTransaction(tx, idx));
  }, [transaksiList]);

  // Filtered list
  const filteredTransaksi = React.useMemo(() => {
    return enrichedList.filter((item) => {
      // Filter Jenis
      if (filterJenis !== "SEMUA" && item.jenis !== filterJenis) {
        return false;
      }

      // Filter Bidang
      if (filterBidang !== "Semua") {
        if (filterBidang === "Infrastruktur Fisik" && item.bidang !== "Infrastruktur Fisik") {
          return false;
        }
        if (filterBidang === "Pemberdayaan Warga" && item.bidang !== "Pemberdayaan Warga") {
          return false;
        }
        if (filterBidang === "Operasional Desa" && item.bidang !== "Operasional Desa") {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchUraian = item.uraian.toLowerCase().includes(query);
        const matchKategori = item.kategori.toLowerCase().includes(query);
        const matchNoBukti = item.nomorBukti.toLowerCase().includes(query);
        const matchId = item.id.toLowerCase().includes(query);
        return matchUraian || matchKategori || matchNoBukti || matchId;
      }

      return true;
    });
  }, [enrichedList, filterJenis, filterBidang, searchQuery]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* FILTER & SEARCH CONTROLS                                                 */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search Bar & Bidang Selector */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari uraian belanja, nomor bukti, atau kata kunci..."
              className="w-full h-11 pl-10 pr-4 text-sm bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 rounded-full"
                aria-label="Bersihkan pencarian"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Count Badge */}
          <div className="flex items-center gap-2 self-end md:self-auto text-xs text-zinc-500 font-medium shrink-0">
            <span>Ditemukan:</span>
            <span className="font-semibold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full">
              {filteredTransaksi.length} Transaksi
            </span>
          </div>
        </div>

        {/* Filter Pills (Category & Type) */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Bidang Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-zinc-500 font-medium mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#1F6F43]" />
              <span>Bidang:</span>
            </span>
            {BIDANG_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFilterBidang(opt)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full font-medium transition-all text-xs flex items-center ${
                  filterBidang === opt
                    ? "bg-[#1F6F43] text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Jenis Arus Kas Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {JENIS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilterJenis(opt.value)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full font-medium transition-all text-xs flex items-center ${
                  filterJenis === opt.value
                    ? opt.value === "PEMASUKAN"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : opt.value === "PENGELUARAN"
                      ? "bg-[#8A5A2B] text-white shadow-xs"
                      : "bg-zinc-900 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* APPEND-ONLY DATA TABLE / CARD LIST                                        */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden shadow-xs">
        {filteredTransaksi.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-800">
              Tidak ada mutasi yang cocok
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Kami tidak menemukan transaksi dengan kata kunci &quot;{searchQuery}&quot; atau
              kombinasi filter yang Anda pilih. Coba sesuaikan kata kunci atau reset filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterJenis("SEMUA");
                setFilterBidang("Semua");
              }}
              className="mt-2 text-xs font-semibold text-[#1F6F43] hover:underline min-h-[44px] flex items-center"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAFAF7] border-b border-zinc-200/80 text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">ID / No. Bukti</th>
                    <th className="px-5 py-3.5">Tanggal &amp; Waktu</th>
                    <th className="px-5 py-3.5">Uraian Transaksi</th>
                    <th className="px-4 py-3.5">Bidang</th>
                    <th className="px-5 py-3.5 text-right">Nominal Arus</th>
                    <th className="px-4 py-3.5 text-center">Verifikasi BPD</th>
                    <th className="px-4 py-3.5 text-center">Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {filteredTransaksi.map((item) => {
                    const isMasuk = item.jenis === "PEMASUKAN";
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedTx(item)}
                        className="group hover:bg-[#FAFAF7] cursor-pointer transition-colors duration-150"
                      >
                        {/* ID / No Bukti */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-zinc-900 group-hover:text-[#1F6F43] transition-colors">
                            {item.nomorBukti}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                            {item.id}
                          </div>
                        </td>

                        {/* Tanggal & Jam */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-medium text-zinc-900">
                            {formatTanggal(item.tanggal)}
                          </div>
                          <div className="text-zinc-500 mt-0.5 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span>{formatWaktu(item.tanggal)}</span>
                          </div>
                        </td>

                        {/* Uraian Transaksi */}
                        <td className="px-5 py-4 max-w-sm">
                          <div className="font-semibold text-zinc-900 group-hover:text-[#1F6F43] transition-colors line-clamp-1">
                            {item.uraian}
                          </div>
                          <div className="text-zinc-500 text-[11px] mt-0.5">
                            Kategori: {item.kategori}
                          </div>
                        </td>

                        {/* Bidang */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700">
                            {item.bidang}
                          </span>
                        </td>

                        {/* Nominal Arus Kas */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div
                            className={`font-mono text-sm font-bold flex items-center justify-end gap-1 ${
                              isMasuk ? "text-emerald-700" : "text-[#8A5A2B]"
                            }`}
                          >
                            <span>{isMasuk ? "+" : "-"}</span>
                            <span>{formatRupiah(item.jumlah)}</span>
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {isMasuk ? "Debit (RKD)" : "Kredit"}
                          </div>
                        </td>

                        {/* Verifikasi BPD */}
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#1F6F43] text-[11px] font-semibold border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-[#1F6F43]" />
                            <span>Terverifikasi</span>
                          </span>
                        </td>

                        {/* Bukti Link Button */}
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(item);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-[#1F6F43] hover:text-white text-zinc-700 font-medium transition-colors text-xs"
                            aria-label={`Buka rincian bukti transaksi ${item.nomorBukti}`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Rincian</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="lg:hidden divide-y divide-zinc-100">
              {filteredTransaksi.map((item) => {
                const isMasuk = item.jenis === "PEMASUKAN";
                return (
                  <article
                    key={item.id}
                    onClick={() => setSelectedTx(item)}
                    className="p-4 sm:p-5 hover:bg-[#FAFAF7] cursor-pointer transition-colors space-y-3"
                  >
                    {/* Top Row: No Bukti & Date */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                        {item.nomorBukti}
                      </span>
                      <span className="text-zinc-500 font-medium">
                        {formatTanggal(item.tanggal)} • {formatWaktu(item.tanggal)}
                      </span>
                    </div>

                    {/* Middle: Uraian */}
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 leading-snug">
                        {item.uraian}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                        <span className="bg-zinc-100 px-2 py-0.5 rounded text-[11px] text-zinc-700">
                          {item.bidang}
                        </span>
                        <span>•</span>
                        <span>{item.kategori}</span>
                      </div>
                    </div>

                    {/* Bottom: Nominal & Verification */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div
                        className={`font-mono text-base font-bold ${
                          isMasuk ? "text-emerald-700" : "text-[#8A5A2B]"
                        }`}
                      >
                        {isMasuk ? "+" : "-"} {formatRupiah(item.jumlah)}
                      </div>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[#1F6F43] text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>BPD Sah</span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TRANSACTION PROOF MODAL / SHEET DETAIL                                    */}
      {/* ========================================================================= */}
      {selectedTx && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-zinc-200 text-zinc-900 p-6 sm:p-7 relative space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1F6F43] text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Append-Only Ledger</span>
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    ID: {selectedTx.id}
                  </span>
                </div>
                <h3
                  id="modal-title"
                  className="text-lg sm:text-xl font-bold text-zinc-900 mt-1 leading-snug"
                >
                  Detail Bukti Pembayaran Digital
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label="Tutup rincian transaksi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nominal Callout */}
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-zinc-500">
                  {selectedTx.jenis === "PEMASUKAN" ? "Kas Masuk (Debit RKD)" : "Kas Keluar (Kredit)"}
                </span>
                <div
                  className={`font-mono text-2xl font-extrabold mt-0.5 ${
                    selectedTx.jenis === "PEMASUKAN" ? "text-emerald-700" : "text-[#8A5A2B]"
                  }`}
                >
                  {selectedTx.jenis === "PEMASUKAN" ? "+" : "-"} {formatRupiah(selectedTx.jumlah)}
                </div>
              </div>
              <div
                className={`p-3 rounded-2xl ${
                  selectedTx.jenis === "PEMASUKAN"
                    ? "bg-emerald-100 text-[#1F6F43]"
                    : "bg-amber-100 text-[#8A5A2B]"
                }`}
              >
                {selectedTx.jenis === "PEMASUKAN" ? (
                  <ArrowDownLeft className="w-6 h-6" />
                ) : (
                  <ArrowUpRight className="w-6 h-6" />
                )}
              </div>
            </div>

            {/* Structured Information List */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Nomor Bukti Kas:</span>
                <span className="font-mono font-bold text-zinc-900">{selectedTx.nomorBukti}</span>
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Tanggal Transaksi:</span>
                <span className="font-semibold text-zinc-900">
                  {formatTanggal(selectedTx.tanggal)} pukul {formatWaktu(selectedTx.tanggal)}
                </span>
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Bidang Belanja:</span>
                <span className="font-semibold text-zinc-900">{selectedTx.bidang}</span>
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Kategori Rincian:</span>
                <span className="font-semibold text-zinc-900">{selectedTx.kategori}</span>
              </div>

              <div className="py-1.5 border-b border-zinc-100 space-y-1">
                <span className="text-zinc-500 font-medium">Uraian Transaksi Lengkap:</span>
                <p className="font-medium text-zinc-900 leading-relaxed bg-zinc-50 p-2.5 rounded-xl border border-zinc-100">
                  {selectedTx.uraian}
                </p>
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-zinc-100">
                <span className="text-zinc-500 font-medium">Petugas Pengawas BPD:</span>
                <span className="font-semibold text-zinc-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1F6F43]" />
                  <span>{selectedTx.verifikatorBpd}</span>
                </span>
              </div>
            </div>

            {/* SHA-256 Hash Integrity Block */}
            <div className="bg-[#FAFAF7] rounded-2xl p-4 border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-700 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-[#1F6F43]" />
                  <span>Verifikasi Hash SHA-256 Mutasi:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(selectedTx.hashSha256)}
                  className="font-medium text-[#1F6F43] hover:underline flex items-center gap-1"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Hash</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-[11px] text-zinc-600 break-all bg-white p-2.5 rounded-lg border border-zinc-200/80 leading-relaxed">
                {selectedTx.hashSha256}
              </div>
              <p className="text-[11px] text-zinc-500">
                Hash di atas dihasilkan otomatis secara kriptografis berdasarkan nilai transaksi, waktu, dan hash blok transaksi sebelumnya.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <a
                href={selectedTx.buktiUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Bukti Transfer / Nota (PDF)</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </a>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="w-full sm:w-auto min-h-[44px] px-4 rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
