BE1:
POST /api/registrasi (payload validasi sandi, respons status MENUNGGU)
GET /api/me (profil aktif / 401 unauthenticated)
PATCH /api/pengguna/:id/verifikasi (RBAC PERANGKAT/ADMIN, payload status & alasan penolakan)

BE2: 
POST /api/kelompok
POST /api/proyek/:id/proposal
Penjelasan perubahan hak akses dan format respons pada "GET /api/proyek/:id/proposal"

BE3: 
