"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

export interface ModalSanggahanProps {
  isOpen: boolean;
  onClose: () => void;
  proyekId: string;
  proyekJudul: string;
  proposals?: Array<{ id: string; namaKelompok: string }>;
  defaultProposalId?: string;
  onSuccess?: () => void;
}

export function ModalSanggahan({
  isOpen,
  onClose,
  proyekId,
  proyekJudul,
  proposals = [],
  defaultProposalId,
  onSuccess,
}: ModalSanggahanProps) {
  const [selectedProposalId, setSelectedProposalId] = React.useState<string>(
    defaultProposalId || (proposals[0]?.id ?? "")
  );
  const [isi, setIsi] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (defaultProposalId) {
      setSelectedProposalId(defaultProposalId);
    } else if (proposals.length > 0 && !selectedProposalId) {
      setSelectedProposalId(proposals[0].id);
    }
  }, [defaultProposalId, proposals, selectedProposalId]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setIsi("");
    setErrorMsg(null);
    setIsSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const targetProposalId = selectedProposalId || defaultProposalId;
    if (!targetProposalId) {
      setErrorMsg("Silakan tentukan proposal kelompok yang Anda wakili.");
      return;
    }

    const trimmed = isi.trim();
    if (trimmed.length < 30) {
      setErrorMsg("Isi narasi sanggahan minimal 30 karakter agar dapat diproses secara objektif oleh TPK.");
      return;
    }
    if (trimmed.length > 1000) {
      setErrorMsg("Isi narasi sanggahan maksimal 1000 karakter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/api/proposal/${targetProposalId}/sanggah`, {
        isi: trimmed,
      });

      if (res.data) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
      } else if (res.error) {
        setErrorMsg(res.error.message || "Gagal mengirimkan sanggahan.");
      }
    } catch (err: unknown) {
      let msg = "Terjadi kendala saat mengirim sanggahan. Pastikan akun Anda terdaftar sebagai anggota kelompok terkait.";
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
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-amber-50/60">
          <div className="flex items-center gap-2 text-amber-800">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
            <h3 className="font-bold text-base text-zinc-900">
              Formulir Sanggahan Resmi Sayembara
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {isSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-zinc-900">
                Sanggahan Berhasil Tercatat!
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
                Argumen sanggahan Anda telah resmi masuk ke sistem audit AKAR Desa Karang Sari dan akan ditindaklanjuti secara terbuka oleh Tim Pengelola Kegiatan (TPK) sebelum penetapan definitif.
              </p>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleClose}
                className="bg-[#1F6F43] hover:bg-[#185935] text-white font-semibold text-xs sm:text-sm min-h-[40px] px-6"
              >
                Tutup & Kembali
              </Button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1">
              <span className="text-[11px] uppercase font-bold text-zinc-500 block">
                Proyek Sayembara Terkait (ID: {proyekId})
              </span>
              <p className="font-semibold text-zinc-900 line-clamp-2">
                {proyekJudul}
              </p>
            </div>

            {/* Target Proposal Selection */}
            {proposals.length > 1 ? (
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 block">
                  Proposal yang Disanggah / Diwakili:
                </label>
                <select
                  value={selectedProposalId}
                  onChange={(e) => setSelectedProposalId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
                >
                  {proposals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaKelompok} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Content Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-zinc-700">
                  Uraian Sanggahan & Fakta Lapangan: <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {isi.trim().length} / 1000
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={isi}
                onChange={(e) => setIsi(e.target.value)}
                placeholder="Tuliskan alasan sanggahan secara jelas dan faktual (misalnya ketidaksesuaian hitungan volume tenaga kerja lokal, selisih anggaran, atau bukti pelanggaran lainnya)..."
                className="w-full p-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1F6F43]"
              />
              <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Minimal 30 karakter. Uraian akan dicatat secara transparan pada log audit desa.</span>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isi.trim().length < 30}
                className="bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Mengirimkan Sanggahan..." : "Kirim Sanggahan Resmi"}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

