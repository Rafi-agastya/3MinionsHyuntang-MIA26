"use client";

import * as React from "react";

export type UserRole = "PUBLIK" | "WARGA" | "PERANGKAT_DESA" | "PENGAWAS" | "ADMIN";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jabatan: string;
  desaId: string;
  namaDesa: string;
  dusun?: string;
}

export const ROLE_DETAILS: Record<
  UserRole,
  {
    label: string;
    badgeLabel: string;
    description: string;
    badgeColor: string;
    defaultName: string;
    defaultEmail: string;
    defaultJabatan: string;
  }
> = {
  PUBLIK: {
    label: "Publik / Warga Terbuka",
    badgeLabel: "Publik",
    description: "Masyarakat umum yang mengakses keterbukaan informasi desa tanpa login.",
    badgeColor: "bg-stone-100 text-stone-700 border-stone-200",
    defaultName: "Tamu Transparansi",
    defaultEmail: "publik@karangsari.desa.id",
    defaultJabatan: "Masyarakat Terbuka",
  },
  WARGA: {
    label: "Warga / Pokmas",
    badgeLabel: "Pokmas Warga",
    description: "Pengurus Kelompok Masyarakat (Pokmas) pelaksana sayembara swakelola & pelapor aspirasi.",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    defaultName: "Bambang Sutrisno",
    defaultEmail: "pokmas.makmur@karangsari.desa.id",
    defaultJabatan: "Ketua Pokmas Makmur Jaya (Dusun Makmur)",
  },
  PERANGKAT_DESA: {
    label: "Perangkat Desa",
    badgeLabel: "Perangkat Desa",
    description: "Pemerintah Desa Karang Sari (Kades/Kaur Keuangan/TPK) pengelola proyek & kas.",
    badgeColor: "bg-emerald-50 text-[#1F6F43] border-emerald-200",
    defaultName: "Bambang Prasetyo",
    defaultEmail: "kaur.keuangan@karangsari.desa.id",
    defaultJabatan: "Kepala Urusan Keuangan / Tim Pelaksana Kegiatan (TPK)",
  },
  PENGAWAS: {
    label: "Pengawas BPD",
    badgeLabel: "Pengawas BPD",
    description: "Badan Permusyawaratan Desa pengawas tata kelola, opname fisik, dan audit kas.",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    defaultName: "H. Ahmad Fauzi",
    defaultEmail: "pengawas.bpd@karangsari.desa.id",
    defaultJabatan: "Ketua Badan Permusyawaratan Desa (BPD)",
  },
  ADMIN: {
    label: "Administrator Sistem",
    badgeLabel: "Admin Sistem",
    description: "Akses penuh konfigurasi sistem, kelola peran, audit log, dan semua modul.",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    defaultName: "Suryono Hadi",
    defaultEmail: "admin.desa@karangsari.desa.id",
    defaultJabatan: "Administrator Sistem & Keuangan Desa",
  },
};

export function canManageProjects(role: UserRole): boolean {
  return role === "PERANGKAT_DESA" || role === "ADMIN";
}

export function canSubmitProposal(role: UserRole): boolean {
  return role === "WARGA" || role === "ADMIN";
}

export function canRecordKas(role: UserRole): boolean {
  return role === "PERANGKAT_DESA" || role === "ADMIN";
}

export function canAuditKas(role: UserRole): boolean {
  return role === "PENGAWAS" || role === "ADMIN";
}

export function canReviewProposal(role: UserRole): boolean {
  return role === "PERANGKAT_DESA" || role === "ADMIN";
}

export function canOpenTermin(role: UserRole): boolean {
  return role === "PENGAWAS" || role === "ADMIN";
}

export function hasAdminAccess(role: UserRole): boolean {
  return role === "PERANGKAT_DESA" || role === "ADMIN";
}

const STORAGE_KEY = "akar_user_role";
const ROLE_EVENT_KEY = "akar:role-change";

export function useCurrentRole() {
  const [role, setRoleState] = React.useState<UserRole>("PUBLIK");
  const [isLoading, setIsLoading] = React.useState(true);

  // Sync state from localStorage or fallback on mount
  React.useEffect(() => {
    try {
      const storedRole = localStorage.getItem(STORAGE_KEY) as UserRole | null;
      if (
        storedRole &&
        ["PUBLIK", "WARGA", "PERANGKAT_DESA", "PENGAWAS", "ADMIN"].includes(storedRole)
      ) {
        setRoleState(storedRole);
      } else {
        // Default demo: check if current route is /admin, default to PERANGKAT_DESA for instant demo ease
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
          setRoleState("PERANGKAT_DESA");
          localStorage.setItem(STORAGE_KEY, "PERANGKAT_DESA");
        } else {
          setRoleState("PUBLIK");
        }
      }
    } catch {
      setRoleState("PUBLIK");
    } finally {
      setIsLoading(false);
    }

    const handleRoleChange = (e: Event) => {
      const customEvent = e as CustomEvent<UserRole>;
      if (customEvent.detail) {
        setRoleState(customEvent.detail);
      }
    };

    window.addEventListener(ROLE_EVENT_KEY, handleRoleChange);
    return () => {
      window.removeEventListener(ROLE_EVENT_KEY, handleRoleChange);
    };
  }, []);

  const setRole = React.useCallback((newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem(STORAGE_KEY, newRole);
      window.dispatchEvent(
        new CustomEvent(ROLE_EVENT_KEY, {
          detail: newRole,
        })
      );
    } catch {
      // Storage unavailable fallback
    }
  }, []);

  const details = ROLE_DETAILS[role] || ROLE_DETAILS.PUBLIK;

  const user: CurrentUser = {
    id: `usr_${role.toLowerCase()}_01`,
    name: details.defaultName,
    email: details.defaultEmail,
    role,
    jabatan: details.defaultJabatan,
    desaId: "desa_karangsari_3304",
    namaDesa: "Desa Karang Sari",
    dusun: role === "WARGA" ? "Dusun Makmur" : "Semua Dusun",
  };

  return {
    role,
    user,
    isLoading,
    setRole,
    details,
    permissions: {
      canManageProjects: canManageProjects(role),
      canSubmitProposal: canSubmitProposal(role),
      canRecordKas: canRecordKas(role),
      canAuditKas: canAuditKas(role),
      canReviewProposal: canReviewProposal(role),
      canOpenTermin: canOpenTermin(role),
      hasAdminAccess: hasAdminAccess(role),
    },
  };
}

