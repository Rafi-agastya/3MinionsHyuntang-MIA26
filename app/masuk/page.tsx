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
  HardHat,
  Building2,
  Lock,
  Mail,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type UserRole = "WARGA" | "ADMIN" | "PENGAWAS";

interface RolePreset {
  id: UserRole;
  label: string;
  roleName: string;
  email: string;
  description: string;
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: "WARGA",
    label: "Warga / Pokmas",
    roleName: "Ketua Pokmas Makmur Jaya",
    email: "pokmas.bambang@karangsari.desa.id",
    description: "Pengajuan proposal sayembara fisik, estimasi Micro-RAB, dan pantau status seleksi.",
  },
  {
    id: "ADMIN",
    label: "Admin Desa",
    roleName: "Pemerintah Desa (Kaur Keuangan)",
    email: "admin.desa@karangsari.desa.id",
    description: "Pencatatan mutasi kas APBDes, verifikasi berkas sayembara, dan pencairan termin.",
  },
  {
    id: "PENGAWAS",
    label: "Pengawas BPD",
    roleName: "Badan Permusyawaratan Desa (BPD)",
    email: "pengawas.bpd@karangsari.desa.id",
    description: "Pengawasan independen, validasi lapangan fisik, dan audit keterbukaan dana desa.",
  },
];

export default function MasukPage() {
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("WARGA");
  const [email, setEmail] = React.useState(ROLE_PRESETS[0].email);
  const [password, setPassword] = React.useState("KarangSari2026!");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const activePreset = ROLE_PRESETS.find((r) => r.id === selectedRole) || ROLE_PRESETS[0];

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const preset = ROLE_PRESETS.find((r) => r.id === role);
    if (preset) {
      setEmail(preset.email);
      setPassword("KarangSari2026!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsSuccess(true);
    }, 700);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#FAFAF7] text-zinc-900 font-sans antialiased selection:bg-[#1F6F43] selection:text-white">
      {/* ========================================================================= */}
      {/* KOLOM KIRI (DESKTOP): VISUAL AERIAL & KONTEKS DESA                         */}
      {/* ========================================================================= */}
      <aside className="lg:col-span-6 hidden lg:flex flex-col justify-between p-10 lg:p-14 relative overflow-hidden text-white">
        {/* Background Foto Asli Desa */}
        <Image
          src="/hero-desa-aerial.jpg"
          alt="Panorama Hamparan Desa Karang Sari"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />

        {/* Gradient Overlay Emerald Gelap (Anti-Slop & High Contrast) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#123D25]/98 via-[#1F6F43]/85 to-black/45 backdrop-blur-[1px]" />

        {/* Top Header: Logo AKAR & Identitas Desa */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-2 border border-white/20 shadow-md flex items-center justify-center group-hover:bg-white/20 transition-all">
              <Image
                src="/logo-akar.png"
                alt="Logo AKAR"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-white block">
                AKAR
              </span>
              <span className="text-xs text-emerald-100 font-medium tracking-wide block">
                Desa Karang Sari &bull; Kab. Wonosobo
              </span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F2B705]" />
            <span>Portal Resmi Desa</span>
          </span>
        </div>

        {/* Middle: 3 Nilai Utama Partisipasi Warga */}
        <div className="relative z-10 space-y-6 my-auto py-8">
          <div className="space-y-2">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              Membangun Desa yang Terbuka, Bersih, dan Berdaya Bersama Warga
            </h2>
            <p className="text-sm lg:text-base text-emerald-100/90 leading-relaxed font-normal max-w-xl">
              Platform transparansi keuangan kas APBDes dan bursa sayembara swakelola Padat Karya Tunai Desa (PKTD).
            </p>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-8 h-8 rounded-xl bg-white/15 text-[#F2B705] flex items-center justify-center shrink-0 mt-0.5">
                <HardHat className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Padat Karya Tunai Desa (PKTD)</strong>
                <span className="text-xs text-emerald-100/85 leading-relaxed">
                  Pemberdayaan tukang dan buruh tani lokal dengan syarat serapan minimal 70% tenaga kerja warga.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-8 h-8 rounded-xl bg-white/15 text-[#F2B705] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Buku Kas Publik SHA-256</strong>
                <span className="text-xs text-emerald-100/85 leading-relaxed">
                  Setiap penerimaan dan pengeluaran kas diikat oleh rantai integritas digital yang tidak dapat dimanipulasi.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="w-8 h-8 rounded-xl bg-white/15 text-[#F2B705] flex items-center justify-center shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Pengawasan Kolaboratif BPD</strong>
                <span className="text-xs text-emerald-100/85 leading-relaxed">
                  Badan Permusyawaratan Desa melakukan verifikasi lapangan sebelum termin pembayaran dicairkan.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quote & Integrity Note */}
        <div className="relative z-10 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100/80">
          <p className="leading-relaxed italic max-w-md">
            &ldquo;Transparansi Dana Desa &amp; Swakelola Warga &mdash; Dikelola terbuka bersama Pemerintah Desa Karang Sari dan BPD.&rdquo;
          </p>
          <span className="font-mono text-[11px] font-semibold text-emerald-200 shrink-0">
            AKAR v1.0
          </span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* KOLOM KANAN: FORM MASUK RAMAH SEMUA UMUR                                  */}
      {/* ========================================================================= */}
      <main className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen">
        {/* Top Header: Back Link & Mobile Branding */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-[#1F6F43] transition-colors py-2 px-3 -ml-3 rounded-xl hover:bg-zinc-100 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          {/* Mobile Only Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <Image
              src="/logo-akar.png"
              alt="Logo AKAR"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-extrabold text-base tracking-tight text-zinc-900">
              AKAR
            </span>
          </div>
        </div>

        {/* Center: Clean Non-Nested Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8 space-y-6">
          {/* Header Form */}
          <div className="space-y-2">
            <Badge variant="default" className="text-xs font-semibold">
              Autentikasi Aman &bull; Desa Karang Sari
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Masuk ke Portal AKAR
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Silakan masuk menggunakan akun Perangkat Desa, Pengawas BPD, atau Kelompok Warga (Pokmas).
            </p>
          </div>

          {/* Demo Role Selector Pills */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 block">
              Pilihan Profil Akses Cepat (Mode Demo):
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {ROLE_PRESETS.map((preset) => {
                const isSelected = selectedRole === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectRole(preset.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                      isSelected
                        ? "bg-[#1F6F43] text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    <span>{preset.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 italic">
              Profil aktif: <strong>{activePreset.roleName}</strong> &mdash; {activePreset.description}
            </p>
          </div>

          {/* SUCCESS VIEW */}
          {isSuccess ? (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-6 sm:p-7 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#1F6F43] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900">
                  Selamat Datang, {activePreset.roleName}!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600">
                  Autentikasi berhasil. Anda memiliki wewenang akses sebagai{" "}
                  <strong className="text-zinc-900">{activePreset.label}</strong> Desa Karang Sari.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link href="/proyek">
                  <Button className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white font-semibold text-sm min-h-[48px] shadow-sm">
                    <span>Lanjut ke Sayembara &amp; Papan Proyek</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/kas">
                  <Button variant="outline" className="w-full text-xs sm:text-sm font-semibold min-h-[44px]">
                    <span>Buka Buku Kas Umum Desa</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleSubmit} className="space-y-4.5">
              {/* Field 1: Email / Username */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-zinc-800 block">
                  Alamat Email / Nomor HP Terdaftar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@karangsari.desa.id"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-300 text-zinc-900 bg-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43] min-h-[48px] transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Password with Show/Hide Toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-zinc-800">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Untuk reset kata sandi akun perangkat/pokmas, silakan hubungi Sekretaris Desa di Kantor Balai Desa Karang Sari pada jam kerja (08.00 - 15.00 WIB)."
                      )
                    }
                    className="text-xs font-semibold text-[#1F6F43] hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-11 pr-12 py-3 rounded-xl border border-zinc-300 text-zinc-900 bg-white text-base font-medium focus:outline-none focus:ring-2 focus:ring-[#1F6F43]/20 focus:border-[#1F6F43] min-h-[48px] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full min-h-[48px] rounded-xl bg-[#1F6F43] hover:bg-[#175533] text-white font-semibold text-base transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
              >
                {isLoggingIn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Alternative Citizen Action */}
          <div className="pt-3 border-t border-zinc-200/80 text-center text-xs sm:text-sm text-zinc-600 space-y-1.5">
            <p>
              Warga umum yang ingin mengirim aspirasi atau aduan tidak wajib memiliki akun.
            </p>
            <Link
              href="/aspirasi"
              className="inline-flex items-center gap-1 font-semibold text-[#1F6F43] hover:underline"
            >
              <span>Kirim Aspirasi / Aduan Anonim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Information Notice */}
        <div className="pt-6 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 text-center sm:text-left">
          <span>
            Pemerintah Desa Karang Sari &bull; Badan Permusyawaratan Desa (BPD)
          </span>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Bantuan Teknis: (0286) 321-789</span>
          </div>
        </div>
      </main>
    </div>
  );
}