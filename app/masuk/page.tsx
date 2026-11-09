"use client";

import * as React from "react";
import Link from "next/link";
import {
  LogIn,
  ArrowRight,
  CheckCircle2,
  Home,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function MasukPage() {
  const [peran, setPeran] = React.useState<"WARGA" | "KETUA" | "PERANGKAT" | "PENGAWAS">("WARGA");
  const [email, setEmail] = React.useState("warga@karangsari.desa.id");
  const [password, setPassword] = React.useState("••••••••••••");
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const handleSelectRole = (role: "WARGA" | "KETUA" | "PERANGKAT" | "PENGAWAS") => {
    setPeran(role);
    switch (role) {
      case "WARGA":
        setEmail("warga.rudi@karangsari.desa.id");
        break;
      case "KETUA":
        setEmail("pokmas.makmur@karangsari.desa.id");
        break;
      case "PERANGKAT":
        setEmail("kades.karangsari@desa.id");
        break;
      case "PENGAWAS":
        setEmail("bpd.pengawas@karangsari.desa.id");
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setIsSuccess(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-zinc-900 flex flex-col antialiased selection:bg-[#1F6F43] selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-zinc-500 justify-center"
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-[#1F6F43] transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Beranda</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-900 font-semibold">Masuk Akun</span>
          </nav>

          {/* Login Card */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="text-center space-y-1.5">
              <div className="inline-flex p-3 rounded-full bg-emerald-50 text-[#1F6F43] border border-emerald-200">
                <LogIn className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Masuk ke Platform AKAR
              </h1>
              <p className="text-xs text-zinc-600">
                Pilih peran penguji demo atau masukkan kredensial akun terverifikasi.
              </p>
            </div>

            {/* Quick Demo Role Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 block">
                Pilih Profil Akses Demo:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectRole("WARGA")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    peran === "WARGA"
                      ? "bg-emerald-50 border-[#1F6F43] text-[#1F6F43] font-bold"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="block font-bold">1. Warga Desa</span>
                  <span className="text-[11px] text-zinc-500">Ajukan ide &amp; aduan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole("KETUA")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    peran === "KETUA"
                      ? "bg-emerald-50 border-[#1F6F43] text-[#1F6F43] font-bold"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="block font-bold">2. Ketua Pokmas</span>
                  <span className="text-[11px] text-zinc-500">Ajukan proposal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole("PERANGKAT")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    peran === "PERANGKAT"
                      ? "bg-emerald-50 border-[#1F6F43] text-[#1F6F43] font-bold"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="block font-bold">3. Perangkat Desa</span>
                  <span className="text-[11px] text-zinc-500">Kades &amp; kaur kas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectRole("PENGAWAS")}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    peran === "PENGAWAS"
                      ? "bg-emerald-50 border-[#1F6F43] text-[#1F6F43] font-bold"
                      : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <span className="block font-bold">4. Pengawas BPD</span>
                  <span className="text-[11px] text-zinc-500">Verifikasi termin</span>
                </button>
              </div>
            </div>

            {isSuccess ? (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-5 space-y-3 text-center animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-8 h-8 text-[#1F6F43] mx-auto" />
                <h3 className="text-sm font-bold text-zinc-900">
                  Autentikasi Berhasil!
                </h3>
                <p className="text-xs text-zinc-600">
                  Anda telah masuk sebagai <strong className="text-zinc-900">{peran}</strong>{" "}
                  di Desa Karang Sari.
                </p>
                <div className="pt-2">
                  <Link href="/proyek">
                    <Button className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs font-semibold min-h-[44px]">
                      <span>Lanjut ke Daftar Proyek</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-700 block">
                    Alamat Email Terdaftar
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-zinc-700">Kata Sandi</label>
                    <span className="text-xs text-zinc-400">Mode demo aktif</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#1F6F43] min-h-[44px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-[#1F6F43] hover:bg-[#185935] text-white text-xs sm:text-sm font-semibold min-h-[44px]"
                >
                  {isLoggingIn ? "Memverifikasi Kredensial..." : "Masuk ke Sistem AKAR"}
                </Button>
              </form>
            )}

            <div className="pt-2 border-t border-zinc-100 text-center text-xs text-zinc-500">
              Belum punya akun warga terverifikasi?{" "}
              <Link href="/aspirasi" className="font-semibold text-[#1F6F43] hover:underline">
                Kirim aduan tanpa akun (Anonim)
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
