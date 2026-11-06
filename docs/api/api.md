BE1:
POST /api/registrasi (payload validasi sandi, respons status MENUNGGU)
GET /api/me (profil aktif / 401 unauthenticated)
PATCH /api/pengguna/:id/verifikasi (RBAC PERANGKAT/ADMIN, payload status & alasan penolakan)

BE2: 
POST /api/kelompok
POST /api/proyek/:id/proposal
Penjelasan perubahan hak akses dan format respons pada "GET /api/proyek/:id/proposal"

BE3: 
POST /api/proyek (payload validasi pagu === total RAB, status awal PEMATANGAN).
PATCH /api/proyek/:id/status (transisi status via state machine, penanganan 409 bila syarat belum terpenuhi).
POST /api/proyek/:id/kompetensi (evaluasi kompetensi LITE).
POST /api/proyek/:id/pemenang (penetapan pemenang, syarat alasanTambahan, auto status MASA_SANGGAH 3 hari).
POST /api/proposal/:id/sanggah (pengajuan sanggahan oleh peserta).

BE4: 
POST /api/proyek (payload validasi pagu === total RAB, status awal PEMATANGAN).
PATCH /api/proyek/:id/status (transisi status via state machine, penanganan 409 bila syarat belum terpenuhi).
POST /api/proyek/:id/kompetensi (evaluasi kompetensi LITE).
POST /api/proyek/:id/pemenang (penetapan pemenang, syarat alasanTambahan, auto status MASA_SANGGAH 3 hari).
POST /api/proposal/:id/sanggah (pengajuan sanggahan oleh peserta).

BE5:
GET /api/ref/akun (K1)
GET /api/desa/:id/kas/ringkasan (K2)
GET /api/desa/:id/kas/entri (K3)
GET /api/kas/entri/:id (K4)
GET /api/desa/:id/kas/verifikasi-integritas (K5)
POST /api/desa/:id/sumber-dana (K6)
POST /api/desa/:id/pos-anggaran (K7)

BE6:
POST /api/desa/:id/kas/entri (K8 — entri penerimaan/pembayaran, validasi bukti & termin).
POST /api/kas/entri/:id/koreksi (K9 — pencatatan entri koreksi pembalik).
POST /api/kas/entri/:id/verifikasi (K10 — verifikasi pengawas, aturan pemisahan wewenang).
PATCH /api/proyek/:id/termin/:tahap/buka (K11 — pembukaan termin berdasarkan progres).

BE7:
GET /api/data/:dataset (K12 — dataset publik: anggaran, proyek, termin, kas, tiket-agregat, query ?format=json|csv, rate limit 60/menit/IP, cache-control 60 detik).
GET /api/health (Pemeriksaan status layanan & kesiapan basis data).