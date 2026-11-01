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
   - 📖 **Buku Kas Publik Desa:** [`http://localhost:3000/kas`](http://localhost:3000/kas) (Transparansi neraca mutasi kas real-time, pencairan termin proyek, dan integritas ledger).

---

## 🛠️ Tech Stack & Arsitektur

- **Framework:** Next.js (App Router) + TypeScript (Strict Mode)
- **Styling & UI:** Tailwind CSS + shadcn/ui + Lucide React
- **Database & ORM:** PostgreSQL (Supabase Session Pooler via Port 5432) + Prisma ORM
- **Validasi Skema:** Zod
- **AI Engine:** OpenRouter API (Llama 3.3 70B / Gemini $\rightarrow$ Fallback: DeepSeek Chat) via OpenAI SDK
- **Integritas Teks:** Algoritma N-gram Trigram Jaccard Similarity (Prinsip `pg_trgm`)
- **Testing:** Vitest

---

## 📂 Struktur Proyek

```text
├── /app
│   ├── /api
│   │   ├── /desa/[id]/kas/ringkasan/route.ts  # Endpoint ringkasan neraca kas desa
│   │   ├── /proyek/route.ts                  # Endpoint agregasi daftar proyek
│   │   ├── /proyek/[id]/route.ts             # Endpoint detail proyek
│   │   └── /proyek/[id]/proposal/route.ts    # Endpoint proposal, skor, flags, & AI
│   ├── /proyek                               # Halaman direktori sayembara swakelola desa
│   │   └── /[id]                             # Halaman detail proyek & papan skor AI
│   └── /kas                                  # Halaman transparansi buku kas publik desa
├── /components
│   ├── /proyek                               # Komponen header detail, direktori, tabs, & modal proposal
│   └── /ui                                   # Komponen atomik UI (Button, Card, Badge, dll)
├── /lib
│   ├── prisma.ts                             # Singleton Prisma Client & serialisasi BigInt
│   ├── scoring.ts                            # Algoritma perhitungan skor proposal (fungsi murni PRD)
│   ├── overlap.ts                            # Logika deteksi tumpang tindih anggota
│   └── similarity.ts                         # Logika Trigram Jaccard kemiripan teks
├── /prisma
│   ├── schema.prisma                         # Skema database relasional
│   ├── migrations/                           # Riwayat migrasi DDL database
│   └── seed.ts                               # Seeder data percontohan Desa Karang Sari
├── /scripts
│   ├── detect-flags.ts                       # Pipeline deteksi anggota ganda & plagiarisme
│   └── generate-ringkasan.ts                 # Pipeline analisis dan ringkasan proposal via AI
├── __tests__                                 # Unit testing kalkulasi skor & integritas (Vitest)
├── .env.example                              # Template environment variables
└── README.md                                 # Dokumentasi teknis sistem
```

---

## 🎯 Fitur Inti & Logika Bisnis

### 1. Perhitungan Skor Murni Proposal (`lib/scoring.ts`)
Mengikuti aturan deterministik PRD Bagian 25 tanpa ketergantungan AI:
- **Efisiensi Biaya (Bobot 40%):** Skor tertinggi jika penawaran berada di rentang wajar (80%–95% pagu). Penawaran di bawah 70% memicu flag *"perlu klarifikasi harga"*, sedangkan penawaran $> 100\%$ otomatis ditolak.
- **Serapan Tenaga Kerja Lokal (Bobot 30%):** Proporsional berdasarkan persentase tenaga kerja warga setempat. Jika di bawah batas minimum (default 70%), memicu flag *"tenaga lokal di bawah syarat"*.
- **Rasionalitas Jadwal (Bobot 20%):** Evaluasi terhadap durasi standar jenis pekerjaan (`durasiMin`–`durasiMax`).
- **Kelengkapan Dokumen (Bobot 10%):** Verifikasi ketersediaan jadwal, metode, mitigasi risiko, susunan anggota, dan rekam jejak.

### 2. Deteksi Integritas & Anti-Kolusi (`scripts/detect-flags.ts`)
- **Deteksi Anggota Ganda (`lib/overlap.ts`):** Melacak keterlibatan identitas (hash NIK / nama warga) yang terdaftar di lebih dari satu kelompok penawar pada proyek yang sama (`JenisFlag.ANGGOTA`).
- **Kemiripan Teks Narasi (`lib/similarity.ts`):** Menggunakan representasi N-gram Trigram untuk mendeteksi indikasi salin-tempel/sindikat proposal antar-kelompok (`JenisFlag.TEKS`) dengan ambang batas $\ge 60\%$.
- Kedua flag otomatis diagregasi ke dalam data proposal pada endpoint publik.

### 3. Pipeline Generator Ringkasan AI Nyata (`scripts/generate-ringkasan.ts`)
- Menganalisis proposal berbasis model AI OpenRouter (`google/gemini-2.0-flash` / `meta-llama/llama-3.3-70b-instruct`).
- **Perlindungan Injeksi Prompt:** Narasi proposal diperlakukan murni sebagai data mentah, bukan instruksi eksekutif.
- **Validasi Output Ketat:** Output diwajibkan berformat JSON murni yang divalidasi dengan skema Zod:
  - `ringkasanEksekutif`: substansi usulan pekerjaan.
  - `poinKekuatan`: keunggulan metode dan kapasitas lokal.
  - `poinPerhatian`: mitigasi teknis dan risiko lapangan.
  - `rekomendasiCatatan`: saran verifikasi faktual tanpa menentukan pemenang.
- **Resilience:** Mekanisme penanganan galat otomatis (*retry* 1x) dan *fallback* ke model cadangan (`deepseek/deepseek-chat`).

### 4. Transparansi Neraca Buku Kas Desa (`app/api/desa/[id]/kas/ringkasan`)
- Menampilkan pencatatan kas desa secara transparan:
  - **Total Pemasukan:** Rp1.500.000.000 (Dana Desa Tahap 1 & 2, ADD, PADes, Bagi Hasil Pajak).
  - **Total Pengeluaran:** Rp850.000.000 (Siltap, Operasional, Termin Proyek Balai Warga, Swakelola Jalan, Ketahanan Pangan).
  - **Sisa Saldo Kas:** Rp650.000.000 secara matematis akurat dan sinkron dengan mutasi.
  - **Riwayat Mutasi:** Log transaksi lengkap dengan nomor referensi, tanggal, uraian, dan tautan bukti bayar.

---

## 📡 Kontrak Endpoint API (Read-Only T1)

Semua endpoint mengembalikan struktur respons terstandarisasi: `{ data, error, meta? }`.

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/proyek` | Mengambil daftar proyek percontohan, pagu anggaran, dan rincian micro-RAB. |
| `GET` | `/api/proyek/:id` | Detail spesifik proyek lengkap dengan relasi kelompok, proposal, dan status verifikasi. |
| `GET` | `/api/proyek/:id/proposal` | Daftar proposal peserta sayembara dengan kalkulasi skor dinamis, flag peringatan integritas, dan analisis ringkasan AI. |
| `GET` | `/api/desa/:id/kas/ringkasan` | Ringkasan neraca kas desa (total pemasukan, pengeluaran, saldo akhir, dan mutasi transaksi). |

---

## 🚀 Panduan Eksekusi & Pengujian Mandiri

### 1. Persiapan Lingkungan
Salin berkas template lingkungan dan konfigurasikan koneksi basis data:
```bash
cp .env.example .env
```
Pastikan variabel `DATABASE_URL` dan `DIRECT_URL` merujuk pada instance PostgreSQL/Supabase Anda, serta `OPENROUTER_API_KEY` terisi jika ingin menjalankan generator AI langsung.

### 2. Instalasi Dependensi
```bash
pnpm install
```

### 3. Migrasi Skema & Generate Prisma Client
```bash
pnpm db:generate
# Jika menggunakan database baru atau ingin sinkronisasi skema langsung:
pnpm prisma db push
```

### 4. Inisialisasi Data Awal (Seeding)
Menghapus data lama dan mengisi data percontohan realistis Desa Karang Sari, paket pekerjaan proyek, rincian micro-RAB, kelompok peserta, serta transaksi buku kas desa:
```bash
pnpm db:seed
```

### 5. Menjalankan Analisis Flag Integritas (Opsional/Pipeline)
Mendeteksi anggota tumpang tindih dan kemiripan teks antar-proposal:
```bash
pnpm flags:detect
```

### 6. Menjalankan Generator Ringkasan AI (Opsional)
Menghasilkan ringkasan terstruktur dari OpenRouter dan menyimpannya ke tabel `RingkasanAi`:
```bash
pnpm ai:summarize
```

### 7. Menjalankan Pengujian Kualitas Kode
```bash
# Validasi formula kalkulasi skor proposal terhadap skenario PRD
pnpm test

# Pemeriksaan linter kode
pnpm lint

# Pemeriksaan kesesuaian tipe data
pnpm tsc --noEmit
```

### 8. Menjalankan Server Aplikasi
```bash
pnpm dev
```
Akses platform melalui peramban pada **`http://localhost:3000`**.
