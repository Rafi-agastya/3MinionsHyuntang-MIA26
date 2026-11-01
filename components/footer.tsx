import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  MapPin,
  ExternalLink,
  Mail,
  ChevronRight,
} from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200/80 bg-white text-zinc-900 font-sans snap-end">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8 space-y-8">
        {/* Main Grid: Responsive 1 col on mobile, 3 cols on tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Column 1: Brand & Keterangan Transparansi */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-emerald-50 border border-emerald-200/60 p-1 flex items-center justify-center">
                <Image
                  src="/logo-akar.png"
                  alt="Logo AKAR"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-[#1F6F43]">
                AKAR
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              <strong>Aspirasi, Keterbukaan, Aksi, dan Realisasi</strong> — Platform transparansi dana desa dan bursa kerja sayembara swakelola warga.
            </p>

            {/* Keterangan Transparansi (Menyatu Organik, Tanpa Nested Box) */}
            <div className="mt-4 flex items-start gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-[#1F6F43] mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Sistem Transparansi APBDes
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Berbasis Append-Only Ledger &amp; AI Scoring
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Menu Tautan Cepat */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Menu Navigasi Utama
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-zinc-600">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#1F6F43] transition-colors flex items-center gap-2 py-0.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Beranda</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/kas"
                  className="hover:text-[#1F6F43] transition-colors flex items-center gap-2 py-0.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Buku Kas Publik (Log Anti-Ubah)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/proyek"
                  className="hover:text-[#1F6F43] transition-colors flex items-center gap-2 py-0.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sayembara Proyek &amp; Swakelola</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/ide"
                  className="hover:text-[#1F6F43] transition-colors flex items-center gap-2 py-0.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aspirasi &amp; Aduan Warga</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/data"
                  className="hover:text-[#1F6F43] transition-colors flex items-center gap-2 py-0.5"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Data Terbuka (CSV/JSON)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Kontak & Pengawasan Desa */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Pemerintah Desa &amp; Pengawas
            </h4>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Pemerintah Desa Karang Sari &amp; Badan Permusyawaratan Desa (BPD) selaku pengawas independen.
            </p>

            <div className="space-y-2 text-xs text-zinc-600 pt-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#8A5A2B] shrink-0 mt-0.5" />
                <span>Kecamatan Harapan, Kabupaten Contoh</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#8A5A2B] shrink-0" />
                <span>aspirasi@karangsari.desa.id</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/tiket"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6F43] hover:underline"
              >
                <span>Lacak Tiket Aduan Warga</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="border-t border-zinc-200/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p className="text-center sm:text-left">
            © 2026 Tim 3MinionsHyuntang — Platform Aspirasi &amp; Akuntabilitas Dana Desa.
          </p>

          <div className="flex items-center space-x-5 text-xs font-medium">
            <Link href="/data" className="hover:text-[#1F6F43] transition-colors">
              Data Terbuka
            </Link>
            <Link href="/kas" className="hover:text-[#1F6F43] transition-colors">
              Buku Kas
            </Link>
            <Link href="/proyek" className="hover:text-[#1F6F43] transition-colors">
              Sayembara
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
