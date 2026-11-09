# AKAR: Platform Transparansi Dana Desa & Sayembara Swakelola Warga

Platform transparansi tata kelola anggaran kas desa dan sistem lelang sayembara proyek swakelola warga berbasis web yang dirancang untuk mencegah korupsi, kolusi, dan manipulasi penawaran. Proyek ini dikembangkan oleh Hyungtang Company untuk kompetisi **Web In Action (WIA) MIA 2026**.

---

## ⚡ Panduan Cepat Penilaian Juri (Judges Quick Start)

Bagi tim juri yang ingin langsung mengevaluasi fungsionalitas utama aplikasi di lingkungan lokal:

1. **Jalankan Aplikasi:**
   ```bash
   pnpm install
   pnpm db:generate
   pnpm db:seed
   pnpm dev
   ```
2. **Akses Rute Evaluasi Utama:**
   - 🌐 **Beranda & Landing Page:** [`http://localhost:3000`](http://localhost:3000)
   - 🏗️ **Direktori Sayembara Proyek:** [`http://localhost:3000/proyek`](http://localhost:3000/proyek) (Menampilkan filter status, pagu dana desa, dan syarat serapan tenaga kerja lokal PKTD $\ge 70\%$).
   - 🤖 **Papan Skor AI & Detail Proyek:** [`http://localhost:3000/proyek/seed_proyek_001`](http://localhost:3000/proyek/seed_proyek_001) (Simulasi evaluasi multi-kriteria proposal warga, deteksi anomali/flag integritas, dan tinjauan narasi AI).
   - 📖 **Buku Kas Publik Desa:** [`http://localhost:3000/kas`](http://localhost:3000/kas) (Transparansi neraca mutasi kas real-time, pencairan termin proyek, dan integritas ledger SHA-256).
   - 📊 **Portal Open Data Publik:** [`http://localhost:3000/api/data/proyek?format=csv`](http://localhost:3000/api/data/proyek?format=csv) (Unduh dataset terbuka CSV/JSON berlisensi CC BY 4.0).

---

## 🛠️ Tech Stack & Arsitektur

- **Framework:** Next.js (App Router) + TypeScript (Strict Mode)
- **Styling & UI:** Tailwind CSS + shadcn/ui + Lucide React
- **Database & ORM:** PostgreSQL (Supabase Session Pooler via Port 5432) + Prisma ORM
- **Validasi Skema:** Zod di seluruh batas sistem API
- **AI Engine:** OpenRouter API (Gemini 2.0 Flash / Llama 3.3 70B $\rightarrow$ Fallback: DeepSeek Chat) via OpenAI SDK
- **Integritas Teks:** Algoritma N-gram Trigram Jaccard Similarity (Prinsip `pg_trgm`) + Ekstensi Indeks GIN Trigram
- **Integritas Kas:** Buku Kas Publik Immutable Ledger dengan Rantai Hash Kriptografis SHA-256 dan Kunci Transaksi Penasihat (`pg_advisory_xact_lock`)
- **Metadata Gambar:** Ekstraksi biner magic bytes (JPEG/PNG/WebP) dan EXIF GPS lokasi via `exifr`
- **Testing:** Vitest (12 suite pengujian, 146 kasus uji lulus 100%, mencakup T01–T26)

---

## 📂 Struktur Proyek

```text
├── /app
│   ├── /api                                  # Seluruh Endpoint Route Handler Next.js
│   │   ├── /data/[dataset]                   # Open Data CSV/JSON export (FR-OD)
│   │   ├── /desa/[id]/kas/                   # Ringkasan, entri, & verifikasi integritas kas
│   │   ├── /flag/[id]                        # Tinjauan flag anomali integritas
│   │   ├── /health                           # Pemeriksaan status kesiapan basis data
│   │   ├── /ide                              # Aspirasi & usulan pembangunan warga
│   │   ├── /kas                              # Mutasi, koreksi, & verifikasi kas
│   │   ├── /kelompok                         # Pendaftaran pokmas warga
│   │   ├── /laporan/[id]                     # Verifikasi laporan pengawas & auto termin
│   │   ├── /me                               # Sesi profil aktif
│   │   ├── /pengguna/[id]/verifikasi         # Verifikasi akun warga
│   │   ├── /proposal/[id]/analisis           # Pipeline skor, overlap, similarity, & AI
│   │   ├── /proposal/[id]/sanggah            # Pengajuan sanggahan peserta sayembara
│   │   ├── /proyek                           # Pematangan proyek & daftar proyek
│   │   ├── /proyek/[id]/laporan              # Unggah & linimasa laporan mingguan
│   │   ├── /proyek/[id]/pemenang             # Penetapan pemenang & auto komitmen kas
│   │   ├── /proyek/[id]/proposal             # Pengiriman proposal & aturan visibilitas
│   │   ├── /proyek/[id]/status               # State machine transisi status proyek
│   │   ├── /registrasi                       # Pendaftaran akun warga & hashing NIK
│   │   └── /tiket                            # Aduan warga ber-nomor lacak unik & anonim
│   ├── /proyek                               # Halaman sayembara & detail papan skor
│   └── /kas                                  # Halaman transparansi buku kas publik
├── /components                               # Komponen presentasi UI modular
├── /docs
│   ├── /api/api.md                           # Dokumentasi komprehensif spesifikasi API
│   ├── /bruno/                               # Koleksi API Bruno resmi per modul
│   └── data-dictionary.md                    # Kamus data open data CC BY 4.0
├── /lib
│   ├── ai/summarizer.ts                      # AI summarizer via OpenRouter + injection defense
│   ├── audit.ts                              # Append-only immutable audit logging
│   ├── auth.ts                               # Middleware RBAC & proteksi hak akses
│   ├── foto-progres.ts                       # Validasi magic bytes biner & ekstraksi EXIF GPS
│   ├── kas-hash.ts                           # Algoritma rantai hash SHA-256 ledger kas
│   ├── kas-ledger.ts                         # Mutasi kas ber-advisory lock & nomor urut
│   ├── kas-ringkasan.ts                      # Perhitungan neraca matematis kas
│   ├── overlap.ts                            # Deteksi tumpang tindih identitas anggota
│   ├── prisma.ts                             # Singleton Prisma Client & BigInt handler
│   ├── rate-limit.ts                         # In-memory sliding window rate limiter
│   ├── scoring.ts                            # Perhitungan skor deterministik PRD Bagian 25
│   ├── similarity.ts                         # N-gram Trigram Jaccard similarity teks
│   └── status-machine.ts                     # Mesin status proyek PRD Bagian 9
├── /prisma
│   ├── migrations/                           # Riwayat migrasi DDL database
│   │   ├── trigger_immutable_ledger.sql      # Trigger penolak UPDATE/DELETE kas & audit
│   │   └── trigram_index.sql                 # Extension pg_trgm & GIN trigram indexes
│   ├── schema.prisma                         # Skema database relasional
│   └── seed.ts                               # Seeder data realistis Desa Karang Sari
└── __tests__                                 # Unit & integration testing Vitest (T01–T26)
```

---

## 🎯 Fitur Inti & Logika Bisnis

### 1. Perhitungan Skor Murni Deterministik (`lib/scoring.ts`)
Sesuai aturan ketat PRD Bagian 25 dan AGENTS.md Aturan 4: **AI TIDAK PERNAH menentukan skor atau pemenang**.
- **Efisiensi Biaya (Bobot 40%):** Skor tertinggi jika penawaran berada di rentang wajar (80%–95% pagu). Penawaran di bawah 70% memicu flag *"perlu klarifikasi harga"*, sedangkan penawaran $> 100\%$ otomatis ditolak (T02).
- **Serapan Tenaga Kerja Lokal (Bobot 30%):** Proporsional persentase tenaga lokal (minimal default 70%). Di bawah ambang memicu flag integritas.
- **Rasionalitas Jadwal (Bobot 20%):** Penilaian durasi hari kerja terhadap rentang standar (`durasiMin`–`durasiMax`).
- **Kelengkapan Dokumen (Bobot 10%):** Validasi kelengkapan dokumen teknis, susunan anggota, dan rekam jejak.

### 2. Deteksi Integritas Anti-Kolusi (`lib/overlap.ts` & `lib/similarity.ts`)
- **Deteksi Anggota Ganda:** Melacak keterlibatan satu warga pada lebih dari satu kelompok penawar pada proyek yang sama (`JenisFlag.ANGGOTA`).
- **Kemiripan Teks Trigram:** Menggunakan N-gram Trigram Jaccard Similarity (prinsip `pg_trgm`) untuk mendeteksi indikasi salin-tempel proposal antar-kelompok (`JenisFlag.TEKS`) dengan ambang batas `SIMILARITY_THRESHOLD = 0.80`.
- Dipercepat dengan indeks basis data **GIN Trigram** (`prisma/migrations/trigram_index.sql`).

### 3. Pipeline Generator Ringkasan AI Nyata (`lib/ai/summarizer.ts`)
- Menganalisis narasi proposal via OpenRouter API.
- **Pertahanan Injeksi Prompt:** Narasi proposal dibungkus pembatas ketat dan diperlakukan murni sebagai DATA mentah, bukan instruksi.
- **Validasi Skema Zod:** Ringkasan wajib lolos validasi skema: ringkasan eksekutif, poin kekuatan, poin perhatian, rekomendasi verifikasi faktual.
- **Resilience:** Mekanisme penanganan galat otomatis: percobaan 1 $\rightarrow$ retry 1x $\rightarrow$ fallback model cadangan $\rightarrow$ status `GAGAL` jika seluruh model gagal, dengan skor dan flag **TETAP tersimpan utuh** di database (T05).

### 4. Buku Kas Publik & Immutable Ledger (`lib/kas-ledger.ts` & `lib/kas-hash.ts`)
- Setiap entri kas (`PENERIMAAN`, `KOMITMEN`, `PEMBAYARAN`, `KOREKSI`) mencatat `nomorUrut` berurutan monotonik dan `hashSebelumnya` $\rightarrow$ `hash` menggunakan SHA-256.
- Penulisan entri kas diproteksi dengan kunci penasihat setingkat basis data `pg_advisory_xact_lock(hashtext(desaId))` guna menjamin integritas penulisan konkuren (T26).
- Database trigger SQL (`trigger_immutable_ledger.sql`) memblokir operasi `UPDATE` dan `DELETE` pada tabel `EntriKas`, `VerifikasiEntri`, dan `AuditLog` (T25).
- Verifikasi integritas kriptografis audit (`/api/desa/:id/kas/verifikasi-integritas`) memvalidasi keaslian mutasi dari entri pertama hingga terakhir (T15, T16).

### 5. Pelaksanaan, Laporan Mingguan & EXIF (`app/api/proyek/:id/laporan`)
- Penanggung jawab proyek mengunggah laporan mingguan dengan checklist 3 butir (pekerja, material, gambar), persen kemajuan fisik, dan foto dokumentasi.
- Validasi biner magic bytes foto (JPEG, PNG, WebP) dan ekstraksi metadata koordinat GPS serta waktu pemotretan via `exifr` (T11).
- Saat pengawas memverifikasi dan menyetujui laporan (`PATCH /api/laporan/:id`), sistem otomatis memicu pembukaan termin pembayaran proyek jika persentase progres mencapai ambang batas (T12).

---

## 🔒 Matriks Hak Akses (RBAC) - PRD Bagian 8

Sistem menerapkan pembatasan hak akses berbasis peran pada seluruh endpoint:

| Aksi / Modul | Publik | Warga Terverifikasi | Perangkat Desa | Pengawas (BPD) | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Lihat anggaran, proyek, timeline, laporan | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kirim ide/aduan & beri dukungan | ❌ | ✅ | ✅ | ✅ | ✅ |
| Buat kelompok & ajukan proposal | ❌ | ✅ | ❌ | ❌ | ❌ |
| Verifikasi ide, matangkan proyek, buka tender | ❌ | ❌ | ✅ | ❌ | ✅ |
| Lihat skor & ringkasan proposal | ❌* | Hanya miliknya* | ✅ | ✅ | ✅ |
| Pilih pemenang sayembara | ❌ | ❌ | ✅ (Kades) | ❌ | ❌ |
| Unggah laporan progres mingguan | ❌ | Penanggung Jawab | ❌ | ❌ | ✅ |
| Verifikasi laporan progres & buka termin | ❌ | ❌ | ❌ | ✅ | ✅ |
| Verifikasi entri kas (pemisahan wewenang) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Kelola pengguna & verifikasi akun warga | ❌ | ❌ | ✅ | ❌ | ✅ |

*\*Catatan: Sebelum proyek mencapai status `MASA_SANGGAH`, publik hanya melihat agregat jumlah proposal dan warga hanya melihat proposal miliknya. Setelah `MASA_SANGGAH`, skor dan ringkasan dibuka transparan untuk publik.*

---

## 📋 Ringkasan Endpoint API

Seluruh kontrak rute API selengkapnya tersedia pada berkas [docs/api/api.md](docs/api/api.md) dan koleksi [docs/bruno/](docs/bruno/):

| Modul | Method | Endpoint | Akses |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/registrasi` | Publik |
| | `GET` | `/api/me` | Terautentikasi |
| | `PATCH` | `/api/pengguna/:id/verifikasi` | Perangkat, Admin |
| **Kelompok** | `POST` | `/api/kelompok` | Warga |
| **Proyek** | `GET` | `/api/proyek` | Publik |
| | `GET` | `/api/proyek/:id` | Publik |
| | `POST` | `/api/proyek` | Perangkat, Admin |
| | `PATCH` | `/api/proyek/:id/status` | Perangkat, Admin |
| | `POST` | `/api/proyek/:id/kompetensi` | Perangkat, Admin |
| | `POST` | `/api/proyek/:id/pemenang` | Perangkat, Admin |
| **Proposal** | `GET` | `/api/proyek/:id/proposal` | Publik (aturan visibilitas) |
| | `POST` | `/api/proyek/:id/proposal` | Warga (Ketua Pokmas) |
| | `POST` | `/api/proposal/:id/sanggah` | Warga Peserta |
| **Analisis** | `POST` | `/api/proposal/:id/analisis` | Perangkat, Admin |
| | `GET` | `/api/proyek/:id/flag` | Perangkat, Pengawas, Admin |
| | `PATCH` | `/api/flag/:id` | Perangkat, Admin |
| **Buku Kas** | `GET` | `/api/ref/akun` | Publik |
| | `GET` | `/api/desa/:id/kas/ringkasan` | Publik |
| | `GET` | `/api/desa/:id/kas/entri` | Publik |
| | `GET` | `/api/kas/entri/:id` | Publik |
| | `POST` | `/api/desa/:id/kas/entri` | Perangkat, Admin |
| | `POST` | `/api/kas/entri/:id/koreksi` | Perangkat, Admin |
| | `POST` | `/api/kas/entri/:id/verifikasi` | Pengawas, Admin |
| | `GET` | `/api/desa/:id/kas/verifikasi-integritas` | Publik |
| | `POST` | `/api/desa/:id/sumber-dana` | Perangkat, Admin |
| | `POST` | `/api/desa/:id/pos-anggaran` | Perangkat, Admin |
| **Laporan** | `GET` | `/api/proyek/:id/laporan` | Publik |
| | `POST` | `/api/proyek/:id/laporan` | Penanggung Jawab, Admin |
| | `PATCH` | `/api/laporan/:id` | Pengawas, Admin |
| | `PATCH` | `/api/proyek/:id/termin/:tahap/buka` | Pengawas, Admin |
| **Ide & Tiket** | `GET` | `/api/ide` | Publik |
| | `POST` | `/api/ide` | Warga, Perangkat, Pengawas, Admin |
| | `POST` | `/api/ide/:id/dukung` | Warga, Perangkat, Pengawas, Admin |
| | `PATCH` | `/api/ide/:id/status` | Perangkat, Admin |
| | `POST` | `/api/tiket` | Warga, Perangkat, Pengawas, Admin |
| | `GET` | `/api/tiket/:nomor` | Publik (nomor lacak) |
| | `GET` | `/api/tiket/:id` | Perangkat, Admin |
| | `PATCH` | `/api/tiket/:id` | Perangkat, Admin |
| **Open Data** | `GET` | `/api/data/:dataset` | Publik |
| | `GET` | `/api/health` | Publik |

---

## 🚀 Panduan Eksekusi, Konfigurasi & Seeding

### 1. Salin dan Konfigurasikan `.env`
Salin template berkas lingkungan:
```bash
cp .env.example .env
```
Daftar variabel lingkungan yang digunakan:
- `NEXT_PUBLIC_APP_URL`: URL lokal aplikasi (misal `http://localhost:3000`).
- `DATABASE_URL`: URL koneksi PostgreSQL Supabase (Pooler Port 5432/6543).
- `DIRECT_URL`: URL koneksi langsung PostgreSQL untuk migrasi Prisma.
- `NEXT_PUBLIC_SUPABASE_URL`: Endpoint proyek Supabase Auth & Storage.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci anonim publik Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Kunci service role admin (HANYA di lingkungan server).
- `OPENROUTER_API_KEY`: Kunci API OpenRouter untuk inferensi model AI ringkasan.
- `OPENROUTER_MODEL`: Model utama OpenRouter (default: `google/gemini-2.0-flash-exp:free`).
- `OPENROUTER_FALLBACK_MODEL`: Model cadangan fallback (default: `deepseek/deepseek-chat`).
- `SIMILARITY_THRESHOLD`: Ambang batas kemiripan teks proposal (default: `0.80`).
- `NIK_HASH_SALT`: Kunci garam hashing SHA-256 untuk privasi NIK warga.

### 2. Instalasi Dependensi & Inisialisasi Database
```bash
pnpm install
pnpm db:generate
pnpm db:seed
```
*Catatan:* Seeder mengisi data percontohan lengkap Desa Karang Sari: 1 akun admin, 1 perangkat desa, 1 pengawas BPD, 3 akun warga terverifikasi, 3 proyek sayembara, 3 proposal penawaran, entri buku kas lengkap, dan 5 entri laporan linimasa.

### 3. Menjalankan Pengujian Mutu Kode (Vitest & Linter)
```bash
# Menjalankan seluruh pengujian unit & integrasi (12 suite, 146 tes lulus)
pnpm test

# Menjalankan pemeriksaan linter ESLint
pnpm lint

# Menjalankan build produksi Next.js
pnpm build
```

---

## 🧪 Verifikasi Kasus Uji PRD (T01 – T26)

Seluruh 26 kasus uji inti PRD telah diimplementasikan dan diverifikasi lulus 100% pada rangkaian pengujian otomatis:

- **T01 (Formula Skor):** Proposal A, B, C bernilai tepat 95, 66, dan 82 (`scoring.test.ts`, `proposal-be2.test.ts`).
- **T02 (Validasi Pagu):** Penawaran melebihi pagu anggaran proyek ditolak 400 (`proposal-be2.test.ts`).
- **T03 (Overlap Anggota):** Anggota ganda lintas kelompok terdeteksi flag `ANGGOTA` (`analisis-be3.test.ts`).
- **T04 (Kemiripan Teks):** Narasi kembar di atas ambang memicu flag `TEKS` (`analisis-be3.test.ts`).
- **T05 (Ketahanan AI):** Galat AI memicu retry, model fallback, dan status `GAGAL` tanpa membatalkan skor (`analisis-be3.test.ts`).
- **T06 (Prompt Injection):** Pertahanan injeksi prompt; skor tetap dihitung rumus matematis (`analisis-be3.test.ts`).
- **T07 (Aturan Jalur Tender):** Membuka tender tanpa alasan jalur ditolak 409 (`status-be4.test.ts`).
- **T08 (Sanggahan Terbuka):** Memulai pengerjaan saat sanggahan masih terbuka ditolak 409 (`status-be4.test.ts`).
- **T09 (RBAC Pemenang):** Warga memanggil endpoint pemenang ditolak 403 (`status-be4.test.ts`, `rbac-matrix-be10.test.ts`).
- **T10 (Privasi Publik):** Respons publik bersih dari NIK mentah, hash NIK, atau identitas pelapor anonim (`open-data-be7.test.ts`, `ide-tiket-be8.test.ts`).
- **T11 (Laporan Mingguan & EXIF):** Laporan wajib melampirkan foto; foto tanpa metadata diberi flag `flagMetadataHilang` (`laporan-be9.test.ts`).
- **T12 (Termin Progres):** Termin berikutnya tetap terkunci saat progres verifikasi belum mencapai ambang batas (`laporan-be9.test.ts`, `kas-be6.test.ts`).
- **T13 (Audit Log Mutasi):** Setiap perubahan status menulis entri audit log yang immutable (`status-be4.test.ts`, `kas-be5.test.ts`).
- **T14 (Validitas Open Data):** Unduh berkas CSV valid dengan kolom sesuai kamus data (`open-data-be7.test.ts`).
- **T15 (Integritas Ledger Seed):** Audit integritas rantai hash data seed menghasilkan status `valid: true` (`kas-be5.test.ts`).
- **T16 (Deteksi Kerusakan Ledger):** Perubahan nominal langsung di database mendeteksi rantai rusak dan nomor entri pertama yang rusak (`kas-be5.test.ts`).
- **T17 (Komitmen Kas Otomatis):** Pemilihan pemenang membuat entri `KOMITMEN` otomatis dan mengurangi pagu tersedia (`kas-be6.test.ts`).
- **T18 (Bukti Pembayaran):** Entri `PEMBAYARAN` tanpa melampirkan berkas bukti transfer ditolak 400 (`kas-be6.test.ts`).
- **T19 (Batas Nilai Kontrak):** Pembayaran kumulatif melebihi nilai kontrak ditolak 409 (`kas-be6.test.ts`).
- **T20 (Termin Belum Terbuka):** Pembayaran pada termin yang belum terbuka ditolak 409 (`kas-be6.test.ts`).
- **T21 (Pemisahan Wewenang):** Pencatat entri kas dilarang memverifikasi entrinya sendiri (ditolak 409) (`kas-be6.test.ts`).
- **T22 (Koreksi Komitmen):** Entri `KOREKSI` mengembalikan pagu terikat tanpa menghapus entri sebelumnya di log (`kas-be6.test.ts`).
- **T23 (Penyamaran Penerima):** Respons publik untuk entri bertanda `penerimaDisamarkan` menyamarkan nama perorangan (`kas-be6.test.ts`).
- **T24 (Kesesuaian Angka 3 Pos PRD 48.2):** Saldo Balai Warga, Jalan Setapak, dan Drainase persis sesuai tabel acuan (`kas-be5.test.ts`).
- **T25 (Immutability Database):** Operasi `UPDATE` atau `DELETE` pada tabel `EntriKas`, `VerifikasiEntri`, dan `AuditLog` ditolak oleh trigger SQL (`kas-be5.test.ts`).
- **T26 (Kunci Transaksi Konkuren):** Dua penulisan simultan pada desa yang sama menghasilkan urutan nomor urut sekuensial dan rantai hash tetap utuh (`kas-be5.test.ts`).

---

## ⚠️ Batasan Teknis yang Diketahui (Known Limitations)

1. **Lingkungan Offline Tanpa Kunci OpenRouter:**
   Jika `OPENROUTER_API_KEY` tidak diisi di `.env`, pipeline analisis AI akan otomatis beralih ke status `GAGAL` sesuai PRD Kasus Uji T05, namun perhitungan skor formula deterministik dan deteksi flag kemiripan tetap berjalan 100% normal.
2. **Rate Limiting In-Memory:**
   Pembatasan laju permintaan (*rate limit*) untuk aduan tiket, pengiriman ide (5/hari/akun), dan unduh Open Data (60/menit/IP) saat ini menggunakan implementasi in-memory sliding window pada instance server Next.js. Pada kluster multi-server produksi, disarankan menggunakan Redis / Upstash store.
3. **Penyimpanan Berkas Offline:**
   Di lingkungan lokal tanpa konfigurasi bucket Supabase Storage aktif, modul berkas proposal dan foto progres memanfaatkan simulasi penyimpanan aman lokal terenkode biner.
