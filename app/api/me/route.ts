<<<<<<< HEAD
import { NextResponse } from "next/server";

export type UserRole = "PUBLIK" | "WARGA" | "PERANGKAT_DESA" | "PENGAWAS" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jabatan: string;
  desaId: string;
  namaDesa: string;
  dusun?: string;
  avatarUrl?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Allow query param ?role=... or header for testability
    const roleParam = searchParams.get("role") as UserRole | null;

    // Default mock user profile based on role
    const role: UserRole = roleParam || "PERANGKAT_DESA";

    let user: UserProfile;

    switch (role) {
      case "ADMIN":
        user = {
          id: "usr_adm_01",
          name: "Suryono Hadi",
          email: "admin.desa@karangsari.desa.id",
          role: "ADMIN",
          jabatan: "Administrator Sistem & Keuangan Desa",
          desaId: "desa_karangsari_3304",
          namaDesa: "Desa Karang Sari",
          dusun: "Semua Dusun",
        };
        break;
      case "PERANGKAT_DESA":
        user = {
          id: "usr_pkd_01",
          name: "Bambang Prasetyo",
          email: "kaur.keuangan@karangsari.desa.id",
          role: "PERANGKAT_DESA",
          jabatan: "Kepala Urusan Keuangan / Tim Pelaksana Kegiatan (TPK)",
          desaId: "desa_karangsari_3304",
          namaDesa: "Desa Karang Sari",
          dusun: "Dusun Krajan",
        };
        break;
      case "PENGAWAS":
        user = {
          id: "usr_bpd_01",
          name: "H. Ahmad Fauzi",
          email: "pengawas.bpd@karangsari.desa.id",
          role: "PENGAWAS",
          jabatan: "Ketua Badan Permusyawaratan Desa (BPD)",
          desaId: "desa_karangsari_3304",
          namaDesa: "Desa Karang Sari",
          dusun: "Semua Dusun",
        };
        break;
      case "WARGA":
        user = {
          id: "usr_wrg_01",
          name: "Bambang Sutrisno",
          email: "pokmas.makmur@karangsari.desa.id",
          role: "WARGA",
          jabatan: "Ketua Pokmas Makmur Jaya (Dusun Makmur)",
          desaId: "desa_karangsari_3304",
          namaDesa: "Desa Karang Sari",
          dusun: "Dusun Makmur",
        };
        break;
      case "PUBLIK":
      default:
        user = {
          id: "usr_pub_01",
          name: "Warga Karang Sari",
          email: "tamu@karangsari.desa.id",
          role: "PUBLIK",
          jabatan: "Masyarakat / Tamu Terbuka",
          desaId: "desa_karangsari_3304",
          namaDesa: "Desa Karang Sari",
        };
        break;
    }

    return NextResponse.json({
      data: {
        user,
        role: user.role,
        permissions: {
          canManageProjects: user.role === "PERANGKAT_DESA" || user.role === "ADMIN",
          canSubmitProposal: user.role === "WARGA" || user.role === "ADMIN",
          canRecordKas: user.role === "PERANGKAT_DESA" || user.role === "ADMIN",
          canAuditKas: user.role === "PENGAWAS" || user.role === "ADMIN",
          canReviewProposal: user.role === "PERANGKAT_DESA" || user.role === "ADMIN",
          canOpenTermin: user.role === "PENGAWAS" || user.role === "ADMIN",
          hasAdminAccess: user.role === "PERANGKAT_DESA" || user.role === "ADMIN",
        },
      },
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Gagal memproses data sesi pengguna";

    return NextResponse.json(
      {
        data: null,
        error: {
          code: "ME_FETCH_FAILED",
          message: errorMessage,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
=======
import { apiHandler, ok } from "@/lib/api";
import { requireAuth } from "@/lib/auth";

export const GET = apiHandler(async (req: Request) => {
  // 1. Wajib autentikasi (401 UNAUTHENTICATED jika belum masuk)
  const pengguna = await requireAuth(req);

  // 2. Kembalikan data profil akun saat ini sesuai PRD 33.2 #2
  return ok({
    id: pengguna.id,
    nama: pengguna.nama,
    email: pengguna.email,
    peran: pengguna.peran,
    statusAkun: pengguna.statusAkun,
    desaId: pengguna.desaId,
    rtRw: pengguna.rtRw,
    kontak: pengguna.kontak,
  });
});
>>>>>>> 55580c1be27af6076697b682f0d582b40c7093c2

