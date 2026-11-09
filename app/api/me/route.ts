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

