"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  FolderKanban,
  Lightbulb,
  BookOpen,
  Database,
  LogIn,
  ShieldCheck,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrentRole, UserRole, ROLE_DETAILS } from "@/lib/use-current-role";

const navItems = [
  { label: "Proyek", href: "/proyek", icon: FolderKanban },
  { label: "Ide & Aspirasi", href: "/ide", icon: Lightbulb },
  { label: "Buku Kas", href: "/kas", icon: BookOpen },
  { label: "Data Terbuka", href: "/data", icon: Database },
];

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);
  const pathname = usePathname();
  const { role, setRole, details, permissions } = useCurrentRole();

  // Combine standard nav with Admin Dashboard if user has access
  const allNavItems = React.useMemo(() => {
    const items = [...navItems];
    if (permissions.hasAdminAccess) {
      items.push({
        label: "Panel Admin",
        href: "/admin",
        icon: ShieldCheck,
      });
    }
    return items;
  }, [permissions.hasAdminAccess]);

  const availableRoles: UserRole[] = [
    "PUBLIK",
    "WARGA",
    "PERANGKAT_DESA",
    "PENGAWAS",
    "ADMIN",
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full border-b border-akar-border/60 bg-white/90 backdrop-blur-md shadow-2xs transition-all",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-akar-primary/40 rounded-lg p-1 transition-opacity hover:opacity-90"
        >
          <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center">
            <Image
              src="/logo-akar.png"
              alt="Logo AKAR"
              width={36}
              height={36}
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain"
              priority
            />
          </div>
          <span className="font-bold tracking-tight text-xl md:text-2xl font-sans text-akar-primary">
            AKAR
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-1 lg:space-x-2"
          aria-label="Navigasi Utama"
        >
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAdminItem = item.href === "/admin";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-akar-primary-light text-akar-primary font-semibold"
                    : isAdminItem
                    ? "text-[#1F6F43] bg-emerald-50/80 hover:bg-emerald-100 font-semibold border border-emerald-200"
                    : "text-akar-ink hover:text-akar-primary hover:bg-akar-primary-light/50"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Role Switcher Desktop */}
        <div className="hidden md:flex items-center space-x-2.5 relative">
          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border min-h-[38px] transition-all cursor-pointer shadow-2xs",
                details.badgeColor
              )}
              title="Klik untuk simulasi peran pengguna"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{details.badgeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isRoleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setIsRoleDropdownOpen(false)}
              >
                <div className="px-2.5 py-1.5 border-b border-zinc-100 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Simulasi Peran Akses (Demo)
                  </p>
                  <p className="text-xs text-zinc-600 font-medium truncate">
                    {details.label}
                  </p>
                </div>
                <div className="py-1 space-y-0.5">
                  {availableRoles.map((r) => {
                    const rDetail = ROLE_DETAILS[r];
                    const isSelected = r === role;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setRole(r);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors",
                          isSelected
                            ? "bg-emerald-50 text-[#1F6F43] font-semibold"
                            : "text-zinc-700 hover:bg-zinc-50"
                        )}
                      >
                        <div className="truncate">
                          <p className="truncate font-semibold">{rDetail.badgeLabel}</p>
                          <p className="text-[10px] text-zinc-500 font-normal truncate">
                            {r === "PUBLIK" ? "Tanpa Login" : rDetail.defaultName}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#1F6F43] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {role === "PUBLIK" ? (
            <Link href="/masuk">
              <Button
                variant="outline"
                className="border-akar-primary/30 text-akar-primary hover:bg-akar-primary-light font-medium min-h-[40px]"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Masuk
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRole("PUBLIK")}
              className="text-xs text-zinc-500 hover:text-red-600 min-h-[38px] px-2.5"
              title="Keluar dari akun demo"
            >
              Keluar
            </Button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center space-x-2">
          {/* Mobile Role Badge */}
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border min-h-[36px]",
              details.badgeColor
            )}
          >
            <span>{details.badgeLabel}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-akar-border bg-white text-akar-ink hover:bg-akar-primary-light/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-akar-primary"
            aria-expanded={isOpen}
            aria-label="Buka menu navigasi"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-akar-ink" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6 text-akar-ink" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Role Switcher Popup */}
      {isRoleDropdownOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white px-4 py-3 shadow-md animate-in slide-in-from-top-2 duration-150">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Simulasi Peran Akses (Demo &amp; Penjurian)
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {availableRoles.map((r) => {
              const rDetail = ROLE_DETAILS[r];
              const isSelected = r === role;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={cn(
                    "text-left p-2 rounded-xl border text-xs font-medium transition-colors",
                    isSelected
                      ? "border-[#1F6F43] bg-emerald-50 text-[#1F6F43] font-semibold"
                      : "border-zinc-200 text-zinc-700 bg-white"
                  )}
                >
                  <p className="font-semibold text-xs truncate">{rDetail.badgeLabel}</p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {r === "PUBLIK" ? "Tamu" : rDetail.defaultName}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-akar-border bg-white px-4 pt-2 pb-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="py-2 mb-2 border-b border-akar-border/60">
            <div className="text-xs text-akar-muted font-medium">
              Wilayah Terpilih:
            </div>
            <div className="text-sm font-semibold text-akar-ink">
              Desa Karang Sari, Kec. Harapan
            </div>
          </div>
          <div className="space-y-1">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isAdminItem = item.href === "/admin";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? "bg-akar-primary-light text-akar-primary font-semibold"
                      : isAdminItem
                      ? "bg-emerald-50 text-[#1F6F43] font-semibold border border-emerald-200"
                      : "text-akar-ink hover:bg-akar-primary-light/40"
                  }`}
                >
                  <Icon className="h-5 w-5 text-akar-primary" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-akar-border">
            {role === "PUBLIK" ? (
              <Link
                href="/masuk"
                onClick={() => setIsOpen(false)}
                className="block w-full"
              >
                <Button className="w-full justify-center min-h-[44px]">
                  <LogIn className="mr-2 h-4 w-4" />
                  Masuk ke Akun Desa
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setRole("PUBLIK");
                  setIsOpen(false);
                }}
                className="w-full justify-center min-h-[44px] text-red-600 border-red-200 hover:bg-red-50"
              >
                Keluar (Kembali ke Tamu Publik)
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
