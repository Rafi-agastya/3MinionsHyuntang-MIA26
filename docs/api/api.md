# Dokumentasi Spesifikasi API Backend AKAR

Platform Transparansi Dana Desa & Sayembara Swakelola Warga (WIA MIA 2026).
Seluruh respons API menggunakan konvensi standar terpadu:
```json
{
  "data": <payload atau null>,
  "error": null | {
    "code": "STRING_KODE_GALAT",
    "message": "Pesan galat ramah pengguna",
    "fields": { "namaField": ["Rincian validasi"] }
  },
  "meta": { "total": 10, "keterangan": "Opsional" }
}
```

---

## 1. Modul Autentikasi & Akun Pengguna

### `POST /api/registrasi`
- **Akses:** Publik (Anonim)
- **Deskripsi:** Pendaftaran akun baru warga desa. Kata sandi minimal 8 karakter, wajib memuat huruf kapital, angka, dan karakter khusus. NIK langsung di-hash menggunakan SHA-256 bergaram (`NIK_HASH_SALT`) dan tidak pernah disimpan mentah (FR-ID1).
- **Body JSON:**
  ```json
  {
    "nama": "Budi Santoso",
    "email": "budi@karangsari.desa.id",
    "kataSandi": "SandiKuat123#",
    "desaId": "desa_karangsari",
    "rtRw": "02/05",
    "nik": "3201011234560001"
  }
  ```
- **Status Respons:** 201 Created (Akun berstatus `MENUNGGU`).

### `GET /api/me`
- **Akses:** Terautentikasi (`requireAuth`)
- **Deskripsi:** Mengembalikan profil pengguna yang sedang login berdasarkan sesi Supabase token.
- **Status Respons:** 200 OK (atau 401 UNAUTHENTICATED jika token tidak valid/hilang).

### `PATCH /api/pengguna/:id/verifikasi`
- **Akses:** `PERANGKAT` atau `ADMIN` (`requireRole`)
- **Deskripsi:** Verifikasi akun warga dari status `MENUNGGU` menjadi `AKTIF` atau `DITOLAK`. Mencatat riwayat ke `AuditLog`.
- **Body JSON:** `{ "setujui": true, "alasan": "Kesesuaian identitas telah diverifikasi." }`
- **Status Respons:** 200 OK.

---

## 2. Modul Kelompok Masyarakat (Pokmas)

### `POST /api/kelompok`
- **Akses:** `WARGA` terverifikasi (`requireRole(WARGA)` & `requireAktif`)
- **Deskripsi:** Pendaftaran kelompok masyarakat pengaju sayembara swakelola. Minimal 2 anggota, maksimal 30 anggota. NIK anggota di-hash secara aman.
- **Body JSON:**
  ```json
  {
    "nama": "Pokmas Guyub Rukun RT 02",
    "desaId": "desa_karangsari",
    "anggota": [
      { "nama": "Budi Santoso", "rtRw": "02/05", "nik": "3201011234560001" },
      { "nama": "Agus Wibowo", "rtRw": "02/05", "nik": "3201011234560002" }
    ]
  }
  ```
- **Status Respons:** 201 Created.

---

## 3. Modul Sayembara & Pematangan Proyek

### `GET /api/proyek`
- **Akses:** Publik (Terbuka untuk semua)
- **Deskripsi:** Mengambil daftar proyek percontohan, pagu anggaran, status, dan ringkasan micro-RAB.

### `GET /api/proyek/:id`
- **Akses:** Publik (Terbuka untuk semua)
- **Deskripsi:** Mengambil detail lengkap proyek spesifik beserta rincian butir micro-RAB.

### `POST /api/proyek`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Pematangan proyek baru. Wajib memenuhi aturan integritas: `pagu === total RAB` (toleransi rounding). Status awal `PEMATANGAN`. Menulis `AuditLog`.
- **Status Respons:** 201 Created.

### `PATCH /api/proyek/:id/status`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Transisi status proyek via pure state machine (`/lib/status-machine.ts`). Menolak transisi 409 bila syarat prasyarat belum terpenuhi (alasan jalur wajib sebelum tender, semua flag ditinjau sebelum kompetensi, bebas sanggahan terbuka sebelum pengerjaan, progres 100% sebelum selesai). Menulis `AuditLog`.
- **Status Respons:** 200 OK (atau 409 CONFLICT).

### `POST /api/proyek/:id/kompetensi`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Evaluasi kompetensi teknis peserta sayembara (versi LITE satu penilai). Menulis `AuditLog`.
- **Status Respons:** 201 Created.

### `POST /api/proyek/:id/pemenang`
- **Akses:** `PERANGKAT` (Kades) atau `ADMIN` (Warga ditolak 403, T09)
- **Deskripsi:** Penetapan pemenang sayembara. Wajib mencantumkan alasan; `alasanTambahan` wajib jika proposal yang dipilih bukan peringkat skor teratas. Otomatis mengubah status proyek ke `MASA_SANGGAH` selama 3 hari (`akhirMasaSanggah = sekarang + 3 hari`). Menulis entri `KOMITMEN` otomatis ke buku kas publik. Menolak 409 bila masih ada flag berstatus `BELUM`.
- **Status Respons:** 200 OK.

---

## 4. Modul Proposal Warga & Sanggahan

### `GET /api/proyek/:id/proposal`
- **Akses:** Publik / Terautentikasi (Aturan Visibilitas PRD 33.2 & Bagian 8)
  - Publik sebelum masa sanggah: hanya melihat jumlah total proposal masuk (rincian kosong).
  - Warga sebelum masa sanggah: hanya melihat rincian proposal miliknya sendiri.
  - Perangkat / Pengawas / Admin atau setelah masuk masa sanggah: dapat melihat seluruh proposal dan skor secara terbuka.
  - Privasi: NIK mentah/hash disanitasi total dari respons publik.

### `POST /api/proyek/:id/proposal`
- **Akses:** `WARGA` (Hanya ketua pokmas terverifikasi)
- **Deskripsi:** Mengajukan proposal pekerjaan sayembara swakelola. Mendukung JSON dan `multipart/form-data` dengan berkas PDF (magic bytes `%PDF`, maks 5 berkas, maks 10 MB per berkas). Validasi: penawaran $\le$ pagu proyek (T02), tenaga lokal $\le$ total tenaga, status proyek wajib `TENDER_DIBUKA`. Menulis `AuditLog`.
- **Status Respons:** 201 Created.

### `POST /api/proposal/:id/sanggah`
- **Akses:** `WARGA` (Hanya anggota pokmas peserta pada proyek tersebut)
- **Deskripsi:** Mengajukan sanggahan resmi pada masa sanggah. Minimal 30 karakter. Menulis `AuditLog`.
- **Status Respons:** 201 Created.

---

## 5. Modul Analisis Integritas & AI Summarizer

### `POST /api/proposal/:id/analisis`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Service terpadu `analisisProposal(proposalId, {ulang})`:
  1. Menghitung skor murni deterministik (`lib/scoring.ts`) berdasarkan formula PRD Bagian 25 (bobot biaya 40%, tenaga lokal 30%, jadwal 20%, kelengkapan 10%). AI TIDAK PERNAH menentukan skor atau pemenang.
  2. Mendeteksi flag tumpang tindih anggota lintas kelompok (`lib/overlap.ts`, jenis `ANGGOTA`).
  3. Mendeteksi kemiripan teks narasi proposal antar peserta (`lib/similarity.ts`, jenis `TEKS`, ambang batas `SIMILARITY_THRESHOLD = 0.80`).
  4. Meringkas proposal via OpenRouter (`lib/ai/summarizer.ts`) dengan pertahanan prompt injection (narasi dibungkus pembatas sebagai data, bukan instruksi), validasi skema Zod, retry 1x, dan fallback ke model cadangan.
  5. Jika AI gagal, skor dan flag TETAP tersimpan aman di basis data dan status analisis menjadi `GAGAL` (T05).
- **Status Respons:** 200 OK (atau 502 bila AI gagal namun skor & flag tersimpan).

### `GET /api/proyek/:id/flag`
- **Akses:** `PERANGKAT`, `PENGAWAS`, atau `ADMIN`
- **Deskripsi:** Mengambil daftar seluruh flag peringatan anomali integritas (anggota ganda atau kemiripan narasi) pada proyek.

### `PATCH /api/flag/:id`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Meninjau keputusan flag anomali (`DITERIMA`, `DIABAIKAN`, `DALAM_PENELITIAN`) beserta catatan klarifikasi. Menulis `AuditLog`.

---

## 6. Modul Buku Kas Publik Desa (Immutable Ledger)

### `GET /api/ref/akun`
- **Akses:** Publik
- **Deskripsi:** Kamus referensi kode akun standar Permendagri No. 20 Tahun 2018.

### `GET /api/desa/:id/kas/ringkasan`
- **Akses:** Publik
- **Deskripsi:** Menghitung neraca kas desa secara murni matematis dari buku kas: `dianggarkan`, `terikat`, `terealisasi`, `menungguVerifikasi`, `tersedia`, `diterima`, `belumCair`, dan `sisaSaldo`.

### `GET /api/desa/:id/kas/entri`
- **Akses:** Publik
- **Deskripsi:** Daftar mutasi entri kas publik berurutan berdasarkan nomor urut (`nomorUrut asc`). Mendukung filter `tipe`, `posAnggaranId`, dan penomoran halaman. Data nama penerima perorangan otomatis disamarkan (`penerimaDisamarkan: true`).

### `GET /api/kas/entri/:id`
- **Akses:** Publik
- **Deskripsi:** Rincian satu entri kas beserta riwayat verifikasi pengawas.

### `POST /api/desa/:id/kas/entri`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Pencatatan entri kas tipe `PENERIMAAN` atau `PEMBAYARAN`. Hanya dapat ditulis lewat `/lib/kas-ledger.ts` yang mengunci transaksi menggunakan `pg_advisory_xact_lock(hashtext(desaId))`, nomorUrut berurutan monotoik, tautan SHA-256 rantai hash (`hashSebelumnya` -> `hash`), dan bukti transfer wajib untuk pembayaran. Menulis `AuditLog`.

### `POST /api/kas/entri/:id/koreksi`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Pencatatan entri pembalik koreksi (`KOREKSI`). Entri asal tidak pernah diubah atau dihapus; entri koreksi mencatat saldo pembalik dan alasan koreksi.

### `POST /api/kas/entri/:id/verifikasi`
- **Akses:** `PENGAWAS` atau `ADMIN` (Prinsip pemisahan wewenang: pencatat entri kas dilarang memverifikasi entrinya sendiri, T21).
- **Deskripsi:** Menetapkan status verifikasi `TERVERIFIKASI` atau `DITOLAK`. Menulis `AuditLog`.

### `GET /api/desa/:id/kas/verifikasi-integritas`
- **Akses:** Publik
- **Deskripsi:** Menghitung ulang rantai SHA-256 seluruh entri kas desa dari nomor urut 1 sampai akhir. Mengembalikan `{ valid: true }` atau `{ valid: false, nomorRusakPertama: n }` (T15, T16).

### `POST /api/desa/:id/sumber-dana` & `POST /api/desa/:id/pos-anggaran`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Pendataan pagu sumber dana tahunan dan rincian pos belanja APBDes. Menulis `AuditLog`.

---

## 7. Modul Pelaksanaan & Laporan Mingguan

### `POST /api/proyek/:id/laporan`
- **Akses:** `WARGA` (Hanya ketua pokmas penanggung jawab pemenang) atau `ADMIN`
- **Deskripsi:** Menerima `multipart/form-data`: `minggu` (1-104), `persen` (0-100), `checklist` (3 butir boolean: `pekerjaSesuaiRencana`, `materialTersedia`, `pekerjaanSesuaiGambar`), `catatan`, dan berkas foto (1 sampai 5 berkas).
- **Validasi Ketat:** Tolak 409 bila laporan minggu tersebut sudah ada; tolak 400 bila persen lebih kecil dari laporan terverifikasi sebelumnya; validasi biner magic bytes foto (JPEG, PNG, WebP) maks 5 MB per berkas.
- **Ekstraksi EXIF:** Mengekstrak koordinat GPS dan tanggal pemotretan; jika hilang, diberi flag `flagMetadataHilang: true` tanpa menggagalkan unggahan (T11). Menulis `AuditLog`.

### `GET /api/proyek/:id/laporan`
- **Akses:** Publik
- **Deskripsi:** Mengembalikan daftar laporan berurutan secara kronologis dan mendeteksi serta menandai array `mingguTerlewat` pada linimasa (FR-K5).

### `PATCH /api/laporan/:id`
- **Akses:** `PENGAWAS` atau `ADMIN`
- **Deskripsi:** Memverifikasi laporan progres (`DISETUJUI` / `DITOLAK`). Jika disetujui dan mencapai ambang batas progres termin berikutnya, memicu pembukaan termin otomatis via `bukaTerminOtomatis` (T12). Menulis `AuditLog`.

### `PATCH /api/proyek/:id/termin/:tahap/buka`
- **Akses:** `PENGAWAS` atau `ADMIN`
- **Deskripsi:** Pembukaan manual termin pembayaran jika progres fisik telah terverifikasi memenuhi syarat. Menulis `AuditLog`.

---

## 8. Modul Aspirasi Ide & Tiket Aduan

### `POST /api/ide`
- **Akses:** `WARGA`, `PERANGKAT`, `PENGAWAS`, `ADMIN` (Terotentikasi & Akun Aktif)
- **Deskripsi:** Mengirim usulan ide pembangunan/aduan warga. Rate limit 5 usulan per hari per akun. Tanggal tenggat tanggapan otomatis ditetapkan 14 hari kalender. Menulis `AuditLog`.

### `GET /api/ide`
- **Akses:** Publik
- **Deskripsi:** Daftar ide terbuka publik. Identitas pengaju yang memilih opsi anonim disamarkan total.

### `POST /api/ide/:id/dukung`
- **Akses:** `WARGA`, `PERANGKAT`, `PENGAWAS`, `ADMIN`
- **Deskripsi:** Memberi dukungan suara warga pada usulan ide. Satu akun satu dukungan (anti-duplikasi 409).

### `PATCH /api/ide/:id/status`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Mengubah status ide (`MASUK`, `DIBAHAS`, `DISETUJUI`, `DITOLAK`). Alasan penolakan wajib jika status diubah ke `DITOLAK`. Menulis `AuditLog`.

### `POST /api/tiket`
- **Akses:** `WARGA`, `PERANGKAT`, `PENGAWAS`, `ADMIN`
- **Deskripsi:** Pembuatan tiket audit/aduan warga dengan nomor lacak unik otomatis (format `TKT-YYYYMMDD-XXXX`). Rate limit 5 tiket per hari per akun. Opsi pelapor anonim. Menulis `AuditLog`.

### `GET /api/tiket/:nomor`
- **Akses:** Publik
- **Deskripsi:** Pelacakan publik via nomor tiket lacak tanpa mengekspos identitas pelapor asli (T10).

### `GET /api/tiket/:id` & `PATCH /api/tiket/:id`
- **Akses:** `PERANGKAT` atau `ADMIN`
- **Deskripsi:** Tinjauan internal dan pemberian tanggapan/tindak lanjut terhadap aduan tiket warga. Menulis `AuditLog`.

---

## 9. Modul Open Data & Health Check

### `GET /api/data/:dataset`
- **Akses:** Publik
- **Deskripsi:** Ekspor dataset terbuka (`anggaran`, `proyek`, `termin`, `kas`, `tiket-agregat`). Parameter format `?format=json` atau `?format=csv`. Seluruh NIK/data pribadi disamarkan (T10). Header `Cache-Control: public, s-maxage=60, stale-while-revalidate=30`. Rate limit 60 permintaan/menit/IP (T14).

### `GET /api/health`
- **Akses:** Publik
- **Deskripsi:** Memeriksa kesiapan layanan dan status konektivitas basis data relasional. Mengembalikan 200 OK jika basis data siap melayani kueri.
