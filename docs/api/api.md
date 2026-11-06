POST /api/registrasi (payload validasi sandi, respons status MENUNGGU)
GET /api/me (profil aktif / 401 unauthenticated)
PATCH /api/pengguna/:id/verifikasi (RBAC PERANGKAT/ADMIN, payload status & alasan penolakan)