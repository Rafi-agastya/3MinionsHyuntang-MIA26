"use client";

import * as React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  X,
  AlertTriangle,
  FileText,
  UsersRound,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

export type KeputusanFlagType = "BELUM" | "WAJAR" | "KLARIFIKASI" | "TIDAK_SAH";

export interface FlagKemiripanData {
  id: string;
  proyekId: string;
  proposalAId?: string;
  proposalBId?: string;
  jenis: "TEKS" | "ANGGOTA" | "RAB" | "WAKTU" | string;
  nilai: number;
  keputusan: KeputusanFlagType;
  catatan?: string | null;
  proposalA?: { id?: string; kelompok?: { nama?: string } };
  proposalB?: { id?: string; kelompok?: { nama?: string } };
}

interface TinjauFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  flag: FlagKemiripanData | null;
  onSuccess: (updatedFlag: FlagKemiripanData) => void;
}

export function TinjauFlagModal({
  isOpen,
  onClose,
  flag,
  onSuccess,
}: TinjauFlagModalProps) {
  const [keputusan, setKeputusan] = React.useState<"WAJAR" | "KLARIFIKASI" | "TIDAK_SAH">("WAJAR");
  const [catatan, setCatatan] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (flag) {
      if (flag.keputusan !== "BELUM") {
        setKeputusan(flag.keputusan);
      } else {
        setKeputusan("WAJAR");
      }
      setCatatan(flag.catatan || "");
      setErrorMessage(null);
    }
  }, [flag]);

  if (!isOpen || !flag) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await apiClient.patch<{ id: string; keputusan: KeputusanFlagType; catatan: string | null }>(
        `/api/flag/${flag.id}`,
        {
          keputusan,
          catatan: catatan.trim() || undefined,
        }
      );

      if (res.data) {
        onSuccess({
          ...flag,
          keputusan: res.data.keputusan,
          catatan: res.data.catatan,
        });
        onClose();
      } else if (res.error) {
        setErrorMessage(res.error.message || "Gagal memperbarui status flag.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan keputusan flag.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJenisLabel = (jenis: string) => {
    switch (jenis) {
      case "ANGGOTA":
        return "Tumpang Tindih Anggota Pokmas";
      case "TEKS":
        return "Kemiripan Narasi Metode / Dokumen";
      case "RAB":
        return "Kemiripan Angka Micro-RAB";
      default:
        return "Catatan Integritas Seleksi";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tinjau-flag-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 id="tinjau-flag-title" className="font-bold text-base text-zinc-900">
                Tinjauan Catatan Integritas
              </h3>
              <p className="text-xs text-zinc-500 font-mono">
                ID Flag: {flag.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Flag Info Summary */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-600 flex items-center gap-1.5">
              {flag.jenis === "ANGGOTA" ? (
                <UsersRound className="w-3.5 h-3.5 text-[#1F6F43]" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[#1F6F43]" />
              )}
              {getJenisLabel(flag.jenis)}
            </span>
            <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
              Tingkat: {(flag.nilai * 100).toFixed(0)}%
            </span>
          </div>

          {flag.catatan && (
            <p className="text-zinc-700 leading-relaxed bg-white p-2.5 rounded-lg border border-zinc-200/80">
              {flag.catatan}
            </p>
          )}

          <div className="text-[11px] text-zinc-500 flex flex-wrap gap-2 pt-0.5">
            {flag.proposalA?.kelompok?.nama && (
              <span>Kelompok A: <strong>{flag.proposalA.kelompok.nama}</strong></span>
            )}
            {flag.proposalB?.kelompok?.nama && (
              <span>&bull; Kelompok B: <strong>{flag.proposalB.kelompok.nama}</strong></span>
            )}
          </div>
        </div>

        {/* Form Keputusan Perangkat Desa / Kades */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-800 block">
              Keputusan Hasil Klarifikasi / Peninjauan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: WAJAR */}
              <button
                type="button"
                onClick={() => setKeputusan("WAJAR")}
                className={`p-3 rounded-xl border text-center font-semibold transition-all flex flex-col items-center justify-center gap-1 min-h-[58px] ${
                  keputusan === "WAJAR"
                    ? "border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs">Wajar / Sah</span>
              </button>

              {/* Option 2: KLARIFIKASI */}
              <button
                type="button"
                onClick={() => setKeputusan("KLARIFIKASI")}
                className={`p-3 rounded-xl border text-center font-semibold transition-all flex flex-col items-center justify-center gap-1 min-h-[58px] ${
                  keputusan === "KLARIFIKASI"
                    ? "border-blue-500 bg-blue-50/80 text-blue-950 ring-2 ring-blue-500/20"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-xs">Diklarifikasi</span>
              </button>

              {/* Option 3: TIDAK_SAH */}
              <button
                type="button"
                onClick={() => setKeputusan("TIDAK_SAH")}
                className={`p-3 rounded-xl border text-center font-semibold transition-all flex flex-col items-center justify-center gap-1 min-h-[58px] ${
                  keputusan === "TIDAK_SAH"
                    ? "border-red-500 bg-red-50/80 text-red-950 ring-2 ring-red-500/20"
                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-xs">Tidak Sah</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 pt-0.5">
              {keputusan === "WAJAR" && "Catatan dinilai wajar dan tidak mengindikasikan rekayasa persaingan."}
              {keputusan === "KLARIFIKASI" && "Telah dilakukan penelusuran bersama warga/pengurus Pokmas dan dinyatakan dapat diterima."}
              {keputusan === "TIDAK_SAH" && "Proposal terbukti melanggar syarat integritas dan didiskualifikasi dari seleksi."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-zinc-800 block">
              Catatan Peninjauan / Berita Acara <span className="text-zinc-400 font-normal">(Opsional)</span>
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tuliskan dasar pertimbangan peninjauan flag ini (misal: telah diklarifikasi dalam rapat RT bahwa anggota hanya bersedia di satu kelompok)..."
              className="w-full p-2.5 rounded-xl border border-zinc-200 text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6F43] text-xs leading-relaxed"
            />
            <span className="text-[11px] text-zinc-400 font-mono block text-right">
              {catatan.length} / 1000 karakter
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs font-semibold px-4 min-h-[38px] gap-1.5"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Simpan Keputusan Flag</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

