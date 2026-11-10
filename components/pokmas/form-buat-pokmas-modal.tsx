"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  UsersRound,
  UserPlus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentRole } from "@/lib/use-current-role";
import { apiClient } from "@/lib/api-client";

interface MemberFormItem {
  id: string;
  nama: string;
  rtRw: string;
  nik: string;
  isKetua: boolean;
}

interface FormBuatPokmasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPokmas: { id: string; nama: string; anggotaCount: number }) => void;
}

export function FormBuatPokmasModal({
  isOpen,
  onClose,
  onSuccess,
}: FormBuatPokmasModalProps) {
  const { role, user } = useCurrentRole();
  const isPublik = role === "PUBLIK";

  // Form State
  const [namaKelompok, setNamaKelompok] = React.useState("Pokmas Guyub Rukun RT 03");
  const [anggotaList, setAnggotaList] = React.useState<MemberFormItem[]>([
    {
      id: "ketua-1",
      nama: user?.name || "Bambang Sutrisno",
      rtRw: "03/01",
      nik: "",
      isKetua: true,
    },
    {
      id: "anggota-2",
      nama: "Slamet Riyadi",
      rtRw: "03/01",
      nik: "",
      isKetua: false,
    },
    {
      id: "anggota-3",
      nama: "Wahyudi",
      rtRw: "03/01",
      nik: "",
      isKetua: false,
    },
  ]);

  // UI status state
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<{ id: string; nama: string } | null>(null);

  if (!isOpen) return null;

  // Add Member Row
  const handleAddMember = () => {
    if (anggotaList.length >= 30) {
      setErrorMessage("Jumlah anggota maksimal adalah 30 orang.");
      return;
    }

    setErrorMessage(null);
    setAnggotaList((prev) => [
      ...prev,
      {
        id: `ang-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        nama: "",
        rtRw: prev[0]?.rtRw || "03/01",
        nik: "",
        isKetua: false,
      },
    ]);
  };

  // Remove Member Row
  const handleRemoveMember = (id: string) => {
    if (anggotaList.length <= 2) {
      setErrorMessage("Kelompok minimal harus memiliki 2 orang anggota.");
      return;
    }
    setErrorMessage(null);
    setAnggotaList((prev) => prev.filter((a) => a.id !== id));
  };

  // Update Member Field
  const handleUpdateMember = (
    id: string,
    field: keyof Omit<MemberFormItem, "id" | "isKetua">,
    value: string
  ) => {
    setAnggotaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validasi Nama Kelompok (PRD 35.2: 3-80 karakter)
    if (!namaKelompok.trim() || namaKelompok.trim().length < 3 || namaKelompok.trim().length > 80) {
      setErrorMessage("Nama kelompok harus terdiri dari 3 hingga 80 karakter.");
      return;
    }

    // 2. Validasi Jumlah Anggota (PRD 35.2: 2-30 orang)
    if (anggotaList.length < 2 || anggotaList.length > 30) {
      setErrorMessage("Kelompok harus memiliki minimal 2 orang dan maksimal 30 orang anggota.");
      return;
    }

    // 3. Validasi Tiap Anggota
    const rtRwRegex = /^\d{2,3}\/\d{2,3}$/;
    for (let i = 0; i < anggotaList.length; i++) {
      const a = anggotaList[i];
      if (!a.nama.trim() || a.nama.trim().length < 3 || a.nama.trim().length > 80) {
        setErrorMessage(`Nama anggota #${i + 1} (${a.isKetua ? "Ketua" : "Anggota"}) minimal 3 karakter.`);
        return;
      }

      if (!rtRwRegex.test(a.rtRw.trim())) {
        setErrorMessage(
          `Nomor RT/RW anggota #${i + 1} (${a.nama}) harus berformat '03/05' (dua/tiga digit per bagian).`
        );
        return;
      }

      if (a.nik && a.nik.trim() !== "" && !/^\d{16}$/.test(a.nik.trim())) {
        setErrorMessage(`NIK anggota #${i + 1} harus tepat 16 digit angka jika diisi.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        nama: namaKelompok.trim(),
        anggota: anggotaList.map((a) => ({
          nama: a.nama.trim(),
          rtRw: a.rtRw.trim(),
          nik: a.nik.trim() ? a.nik.trim() : null,
        })),
      };

      const res = await apiClient.post<{ id: string; nama?: string }>("/api/kelompok", payload);

      if (res.error) {
        setErrorMessage(res.error.message || "Gagal mendaftarkan kelompok masyarakat.");
        setIsSubmitting(false);
        return;
      }

      const createdId = res.data?.id || `kel-${Date.now()}`;
      const createdNama = namaKelompok.trim();

      setSuccessData({ id: createdId, nama: createdNama });
      setIsSubmitting(false);

      if (onSuccess) {
        onSuccess({
          id: createdId,
          nama: createdNama,
          anggotaCount: anggotaList.length,
        });
      }
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat mendaftarkan Pokmas. Silakan coba kembali.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-zinc-200 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-[#1F6F43]">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-bold text-[#1F6F43] uppercase tracking-wider block">
                Bursa Kerja Swakelola Desa
              </span>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
                Pendaftaran Kelompok Masyarakat (Pokmas)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Condition 1: Restricted for PUBLIK Role (PRD Bagian 8) */}
        {isPublik ? (
          <div className="space-y-4 py-2">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Akses Pembuatan Pokmas Dibatasi untuk Warga Terverifikasi</span>
              </div>
              <p className="leading-relaxed">
                Sesuai <strong>ketentuan sayembara desa</strong>, pendaftaran Kelompok Masyarakat (Pokmas) pelaksana proyek swakelola hanya dapat dilakukan oleh akun warga desa yang terverifikasi demi akuntabilitas padat karya tunai desa (PKTD).
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Tutup
              </Button>
              <Link href="/masuk">
                <Button
                  size="sm"
                  className="bg-[#1F6F43] hover:bg-[#185935] text-white gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk sebagai Warga / Pokmas</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : successData ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="inline-flex p-3 rounded-full bg-emerald-100 text-[#1F6F43]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-zinc-900">
                Pokmas Berhasil Didaftarkan!
              </h4>
              <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                Kelompok <strong>{successData.nama}</strong> telah resmi tercatat di sistem desa dan siap digunakan untuk mengajukan proposal sayembara fisik swakelola.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 inline-block font-mono text-xs text-zinc-700">
              ID Kelompok: <strong className="text-[#1F6F43]">{successData.id}</strong>
            </div>

            <div className="pt-3 flex justify-center gap-2">
              <Button
                type="button"
                onClick={onClose}
                className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm px-6"
              >
                Gunakan Pokmas Ini &amp; Lanjutkan
              </Button>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Field: Nama Kelompok */}
            <div className="space-y-1.5">
              <label className="font-semibold text-xs sm:text-sm text-zinc-800 block">
                Nama Kelompok Masyarakat (Pokmas) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaKelompok}
                onChange={(e) => setNamaKelompok(e.target.value)}
                placeholder="Contoh: Pokmas Guyub Rukun RT 03"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
              />
              <span className="text-[11px] text-zinc-500 block">
                3–80 karakter. Nama perkumpulan tukang, tani, atau regu kerja warga desa.
              </span>
            </div>

            {/* Field: Daftar Anggota */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-zinc-900">
                    Daftar Struktur Anggota ({anggotaList.length} Orang)
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    Minimal 2 orang, maksimal 30 orang. Baris pertama bertindak sebagai Ketua Pokmas.
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddMember}
                  disabled={anggotaList.length >= 30}
                  className="gap-1 text-xs border-emerald-300 text-[#1F6F43] hover:bg-emerald-50 h-8"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Anggota</span>
                </Button>
              </div>

              {/* Members Table / List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {anggotaList.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border text-xs space-y-2 transition-all ${
                      item.isKetua
                        ? "bg-emerald-50/50 border-emerald-200 shadow-2xs"
                        : "bg-white border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-zinc-800">
                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{item.isKetua ? "Ketua Kelompok (Penanggung Jawab)" : `Anggota Pekerja #${idx + 1}`}</span>
                      </div>

                      {!item.isKetua && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(item.id)}
                          disabled={anggotaList.length <= 2}
                          className="text-zinc-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-zinc-400 p-1"
                          title="Hapus anggota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      {/* Nama */}
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={item.nama}
                          onChange={(e) => handleUpdateMember(item.id, "nama", e.target.value)}
                          placeholder="Nama anggota"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs focus:ring-1 focus:ring-[#1F6F43]"
                        />
                      </div>

                      {/* RT/RW */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">
                          RT/RW (Format 03/05) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={item.rtRw}
                          onChange={(e) => handleUpdateMember(item.id, "rtRw", e.target.value)}
                          placeholder="03/01"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono focus:ring-1 focus:ring-[#1F6F43]"
                        />
                      </div>

                      {/* NIK Opsional */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-semibold text-zinc-500 block mb-0.5">
                          NIK (Opsional, 16 Digit)
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          value={item.nik}
                          onChange={(e) => handleUpdateMember(item.id, "nik", e.target.value.replace(/\D/g, ""))}
                          placeholder="3304..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono focus:ring-1 focus:ring-[#1F6F43]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory & Privacy Notice (FR-ID1 & PRD 36.2) */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Jaminan Privasi Data NIK (UU Perlindungan Data Pribadi)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800">
                NIK hanya digunakan untuk <strong>mencegah tumpang tindih anggota</strong> pada proyek yang sama. Sistem mengubah NIK menjadi hash satu arah (SHA-256 + garam server) secara otomatis. Nilai NIK asli <strong>tidak pernah disimpan</strong> dan <strong>tidak pernah ditampilkan</strong> ke publik.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row gap-2 justify-end">
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
                className="bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold gap-1.5 min-h-[40px] px-5"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    <span>Mendaftarkan Pokmas...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Daftarkan Pokmas Resmi</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
