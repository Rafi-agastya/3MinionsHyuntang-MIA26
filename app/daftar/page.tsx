"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User,
  MapPin,
  Phone,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

export default function DaftarPage() {
  // Form State (PRD 35.1)
  const [nama, setNama] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [kataSandi, setKataSandi] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [desaId, setDesaId] = React.useState("seed_desa_001");
  const [rtRw, setRtRw] = React.useState("03/01");
  const [kontak, setKontak] = React.useState("");
  const [setujuSyarat, setSetujuSyarat] = React.useState(false);
  const [setujuPrivasi, setSetujuPrivasi] = React.useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validations
    if (nama.trim().length < 3) {
      setErrorMsg("Nama lengkap minimal 3 karakter.");
      return;
    }

    if (kataSandi.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(kataSandi)) {
      setErrorMsg("Kata sandi minimal 8 karakter dan harus memuat kombinasi huruf dan angka.");
      return;
    }

    if (!/^\d{2,3}\/\d{2,3}$/.test(rtRw.trim())) {
      setErrorMsg("Format nomor RT/RW harus sesuai contoh '03/01' atau '03/05'.");
      return;
    }

    if (!setujuSyarat || !setujuPrivasi) {
      setErrorMsg("Anda wajib menyetujui Syarat Penggunaan dan Kebijakan Privasi platform.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama: nama.trim(),
        email: email.toLowerCase().trim(),
        kataSandi,
        desaId,
        rtRw: rtRw.trim(),
        kontak: kontak.trim() || undefined,
        setujuSyarat: true,
        setujuPrivasi: true,
        setuju: true,
      };

      const res = await apiClient.post<{ id: string; statusAkun: string }>(
        "/api/registrasi",
        payload
      );

      if (res.data) {
        setIsSuccess(true);
      } else if (res.error) {
        setErrorMsg(res.error.message || "Pendaftaran gagal. Pastikan data Anda valid.");
      }
    } catch (err: unknown) {
      let msg = "Pendaftaran gagal. Pastikan data Anda valid dan email belum pernah digunakan.";
      if (err instanceof Error) msg = err.message;
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object"
      ) {
        const resp = (err as { response?: { error?: { message?: string } } }).response;
        if (resp?.error?.message) msg = resp.error.message;
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FAFAF7] text-zinc-900 font-sans antialiased selection:bg-[#1F6F43] selection:text-white">
      {/* ========================================================================= */}
      {/* KOLOM KIRI (DESKTOP): VISUAL & EDUKASI PKTD                               */}
      {/* ========================================================================= */}
      <aside className="lg:col-span-6 hidden lg:flex flex-col justify-between p-10 lg:p-14 relative overflow-hidden text-white">
        <Image
          src="/proyek/drainase.jpg"
          alt="Suasana Gotong Royong Desa Karang Sari"
          fill
          priority
          className="object-cover object-center brightness-[0.40]"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-white hover:text-emerald-200 transition-colors"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
              <Image
                src="/logo-akar.png"
                alt="Logo AKAR"
                width={32}
                height={32}
                className="h-8 w-8 object-contain drop-shadow-sm"
              />
            </div>
            <span className="font-extrabold text-xl tracking-tight">AKAR</span>
          </Link>

          <Link
            href="/masuk"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4 max-w-lg my-auto py-12">
          <Badge
            variant="default"
            className="bg-[#1F6F43] text-white border-none text-xs font-semibold px-3 py-1"
          >
            Partisipasi Pembangunan Swakelola
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Daftarkan Diri Anda Sebagai Warga Pelaksana Swakelola.
          </h1>
          <p className="text-sm text-zinc-200 leading-relaxed">
            Platform AKAR membuka ruang bagi warga Desa Karang Sari untuk membentuk Kelompok Masyarakat (Pokmas), mengajukan proposal sayembara fisik, serta memantau realisasi anggaran kas desa secara transparan.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15">
              <span className="text-emerald-300 font-bold block mb-1">Padat Karya (PKTD)</span>
              <span className="text-zinc-200">Prioritas upah harian bagi minimal 70% tenaga kerja warga ber-KTP desa.</span>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-md p-3.5 border border-white/15">
              <span className="text-emerald-300 font-bold block mb-1">Perlindungan Privasi</span>
              <span className="text-zinc-200">NIK Anda tidak pernah disimpan mentah, dilindungi hash satu arah bergaram server.</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-300 pt-6 border-t border-white/15">
          <span>Pemerintah Desa Karang Sari &bull; TA 2026</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Standar Keterbukaan UU Desa</span>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* KOLOM KANAN: FORM REGISTRASI AKUN WARGA                                   */}
      {/* ========================================================================= */}
      <main className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 overflow-y-auto">
        {/* Mobile Header Back Link */}
        <div className="flex items-center justify-between pb-6 lg:hidden">
          <Link
            href="/masuk"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Masuk</span>
          </Link>
          <span className="text-xs font-bold text-[#1F6F43]">AKAR KARANG SARI</span>
        </div>

        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          {/* Header Title */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Registrasi Akun Warga
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Daftar akun untuk mewakili kelompok masyarakat atau berpartisipasi dalam sayembara pembangunan desa.
            </p>
          </div>

          {/* Success Screen (PRD 35.1) */}
          {isSuccess ? (
            <div className="rounded-2xl border border-emerald-300 bg-white p-6 sm:p-8 space-y-5 text-center shadow-sm animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#1F6F43] flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <Badge variant="default" className="bg-[#1F6F43] text-white text-xs font-bold">
                  Status: MENUNGGU Verifikasi
                </Badge>
                <h3 className="text-xl font-bold text-zinc-900">
                  Pendaftaran Akun Berhasil Dikirim!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  Akun atas nama <strong>{nama}</strong> ({email}) telah tercatat dalam sistem audit desa. Sesuai ketentuan pendaftaran desa, akun baru berstatus <strong>MENUNGGU</strong> hingga perangkat desa mengonfirmasi domisili RT/RW Anda.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/masuk">
                  <Button className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white min-h-[44px]">
                    <span>Kembali ke Halaman Masuk</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Input Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Nama Lengkap Sesuai KTP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Bambang Prasetyo"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Input Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Alamat Email Aktif <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Input Kata Sandi */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">Min. 8 karakter (huruf &amp; angka)</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={kataSandi}
                    onChange={(e) => setKataSandi(e.target.value)}
                    placeholder="Minimal 8 karakter kombinasi"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Wilayah RT/RW & Desa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Wilayah Desa <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={desaId}
                      onChange={(e) => setDesaId(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                    >
                      <option value="seed_desa_001">Desa Karang Sari</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700 block">
                    Nomor RT/RW <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={rtRw}
                      onChange={(e) => setRtRw(e.target.value)}
                      placeholder="Contoh: 03/01"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Kontak WhatsApp Opsional */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 block">
                  Nomor Kontak WhatsApp (Opsional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                  />
                </div>
              </div>

              {/* Checkbox Persetujuan PRD 35.1 & 36.6 */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 text-xs text-zinc-600">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={setujuSyarat}
                    onChange={(e) => setSetujuSyarat(e.target.checked)}
                    className="rounded text-[#1F6F43] focus:ring-[#1F6F43] mt-0.5"
                  />
                  <span>
                    Saya menyatakan data yang diberikan benar dan menyetujui <strong>Syarat Penggunaan</strong> platform AKAR (memahami ringkasan AI sebagai alat bantu dan keputusan pengadaan pada pemerintah desa).
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={setujuPrivasi}
                    onChange={(e) => setSetujuPrivasi(e.target.checked)}
                    className="rounded text-[#1F6F43] focus:ring-[#1F6F43] mt-0.5"
                  />
                  <span>
                    Saya menyetujui <strong>Kebijakan Privasi</strong> (NIK dilindungi enkripsi hash satu arah, tidak pernah disimpan mentah demi keamanan data pribadi).
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-xl bg-[#1F6F43] hover:bg-[#175533] text-white font-semibold text-base transition-colors shadow-sm flex items-center justify-center gap-2 mt-3"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun Warga</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Link ke Masuk */}
          <div className="pt-3 border-t border-zinc-200/80 text-center text-xs sm:text-sm text-zinc-600">
            <span>Sudah memiliki akun terdaftar? </span>
            <Link href="/masuk" className="font-semibold text-[#1F6F43] hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>

        {/* Bottom Information Notice */}
        <div className="pt-6 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 text-center sm:text-left">
          <span>Pemerintah Desa Karang Sari &bull; Sistem Audit Digital</span>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Bantuan Registrasi: (0286) 321-789</span>
          </div>
        </div>
      </main>
    </div>
  );
}
