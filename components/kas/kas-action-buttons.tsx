"use client";

import * as React from "react";
import Link from "next/link";
import { Download, PlusCircle, ShieldCheck } from "lucide-react";
import { useCurrentRole } from "@/lib/use-current-role";

export function KasActionButtons() {
  const { role, permissions } = useCurrentRole();

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <Link
        href="/data"
        className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full bg-[#1F6F43] hover:bg-[#185935] text-xs sm:text-sm font-semibold text-white transition-all shadow-xs"
      >
        <Download className="h-4 w-4" />
        <span>Unduh Rekap Kas (CSV/PDF)</span>
      </Link>

      {/* Perangkat Desa / Admin: Record Kas shortcut */}
      {permissions.canRecordKas && (
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs sm:text-sm font-semibold text-[#1F6F43] transition-all shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Catat Mutasi Kas Baru (+)</span>
        </Link>
      )}

      {/* Pengawas BPD: Audit status badge */}
      {role === "PENGAWAS" && (
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-50 border border-amber-300 text-xs sm:text-sm text-amber-900 font-semibold shadow-xs">
          <ShieldCheck className="h-4 w-4 text-amber-700" />
          <span>Hak Audit BPD Aktif (Opname &amp; Validasi)</span>
        </div>
      )}
    </div>
  );
}

