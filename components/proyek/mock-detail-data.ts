import { ProjectDetailData } from "./types";

export const mockProjectDrainase: ProjectDetailData = {
  id: "seed_proyek_001",
  desaId: "seed_desa_001",
  judul: "Pembangunan Saluran Drainase RT 3",
  deskripsi:
    "Pembangunan saluran drainase lingkungan permanen sepanjang 350 meter menggunakan batu kali mortar untuk mencegah genangan air saat musim hujan di RT 3 Dusun Krajan.",
  lokasi: "RT 03 Dusun Krajan",
  pagu: 100_000_000,
  kelas: "KECIL",
  jalur: "SAYEMBARA",
  alasanJalur:
    "Pekerjaan padat karya sederhana yang dikerjakan secara swakelola oleh kelompok warga dan tukang lokal desa. Memastikan serapan tenaga kerja lokal ≥ 70% sehingga anggaran dana desa berputar langsung di warga RT 03.",
  status: "TENDER_DIBUKA",
  tanggalPublikasi: "10 April 2026",
  tenggatProposal: "25 April 2026",
  tenggatHari: 7,
  syaratLokalMin: 70,
  durasiMin: 30,
  durasiMax: 60,
  sumberDana: "Dana Desa (APBDes TA 2026)",
  rabItems: [
    {
      id: "rab_001",
      uraian: "Pekerjaan Galian Tanah Saluran",
      volume: 250,
      satuan: "m³",
      hargaSatuan: 80_000,
      subtotal: 20_000_000,
    },
    {
      id: "rab_002",
      uraian: "Pekerjaan Pasangan Batu Kali Mortar",
      volume: 150,
      satuan: "m³",
      hargaSatuan: 400_000,
      subtotal: 60_000_000,
    },
    {
      id: "rab_003",
      uraian: "Pekerjaan Plesteran & Siaran Saluran",
      volume: 400,
      satuan: "m²",
      hargaSatuan: 50_000,
      subtotal: 20_000_000,
    },
  ],
  proposals: [
    {
      id: "prop_makmur_jaya_01",
      namaKelompok: "Pokmas Makmur Jaya RT 03",
      ketua: "Slamet Rahardjo",
      penawaran: 88_000_000,
      durasiHari: 45,
      tenagaTotal: 10,
      tenagaLokal: 9,
      persentaseLokal: 90,
      narasiMetode:
        "Metode galian saluran swakelola bergiliran per regu warga RT 03 dengan pasangan batu kali mortar kedap air dan pemasangan gorong-gorong drainase bertahap 25 meter per segmen.",
      narasiJadwal:
        "Minggu 1: Pembersihan parit dan galian tanah dasar. Minggu 2-3: Pasangan batu kali mortar dan gorong-gorong beton. Minggu 4: Plesteran siar kedap air dan uji alir drainase.",
      narasiRisiko:
        "Disediakan 2 unit pompa sedot portabel dan saluran sodetan sementara agar pemukiman warga tidak terdampak genangan air saat hujan deras.",
      dokumen: [
        "proposal-pokmas-makmur-jaya.pdf",
        "daftar-22-ktp-warga-rt03.pdf",
        "rencana-kerja-swakelola.pdf",
      ],
      skor: {
        total: 92.4,
        rincian: {
          harga: 37.0,
          tenagaLokal: 28.6,
          pengalaman: 9.0,
          durasi: 17.8,
        },
        flags: [],
        versiBobot: "v1.0",
      },
      flagsDetail: [],
      ringkasanAi: {
        model: "meta-llama/llama-3.3-70b-instruct",
        ringkasanEksekutif:
          "Proposal Pokmas Makmur Jaya RT 03 mendapatkan skor tertinggi dengan serapan tenaga kerja lokal mencapai 90% (9 dari 10 pekerja warga desa) serta nilai penawaran hemat dan rasional di angka Rp88.000.000 (88% pagu).",
        poinKekuatan: [
          "Serapan tenaga kerja lokal 90% (9 dari 10 pekerja adalah warga RT 03 Dusun Krajan)",
          "Efisiensi anggaran optimal dengan sisa buffer Rp12.000.000 dari pagu Rp100 juta",
          "Metode mitigasi risiko matang dengan pompa air portabel dan sodetan sementara",
        ],
        poinPerhatian: [
          "Pastikan suplai batu kali dan semen mortar dipesan di muka agar ritme kerja 45 hari terjaga",
        ],
        rekomendasiCatatan:
          "Rekomendasi Utama: Sangat layak ditetapkan sebagai pelaksana sayembara swakelola drainase RT 03.",
      },
    },
    {
      id: "prop_sari_guyub_02",
      namaKelompok: "Kelompok Tukang Sari Guyub",
      ketua: "Budi Santoso",
      penawaran: 99_000_000,
      durasiHari: 25,
      tenagaTotal: 12,
      tenagaLokal: 6,
      persentaseLokal: 50,
      narasiMetode:
        "Pengerjaan fisik saluran drainase dengan tim tukang batu berpengalaman dan bantuan tenaga angkut warga lingkungan Dusun Krajan.",
      narasiJadwal:
        "Pelaksanaan terencana selama 25 hari kalender dengan monitoring berkala bersama pengurus RT dan BPD.",
      narasiRisiko:
        "Keterlambatan suplai material batu kali diantisipasi dengan pemesanan awal dari kuari terdekat.",
      dokumen: ["proposal-sari-guyub.pdf", "daftar-tukang-lokal.pdf"],
      skor: {
        total: 84.1,
        rincian: {
          harga: 34.1,
          tenagaLokal: 25.0,
          pengalaman: 9.0,
          durasi: 16.0,
        },
        flags: [
          "Tenaga kerja lokal di bawah syarat minimal KAK (50% < 70%)",
          "Durasi pengerjaan di bawah estimasi toleransi KAK (25 hari < 30 hari)",
        ],
        versiBobot: "v1.0",
      },
      flagsDetail: [
        {
          tipe: "PELANGGARAN_SYARAT",
          label: "Tenaga Kerja Lokal Di Bawah Syarat (50% < 70%)",
          deskripsi:
            "Serapan tenaga kerja warga desa hanya 50% (6/12 orang). Batas minimal regulasi sayembara adalah 70%.",
          tingkat: "warning",
        },
        {
          tipe: "JADWAL_TIDAK_REALISTIS",
          label: "Durasi di Bawah Batas KAK (25 hari < 30 hari)",
          deskripsi:
            "Estimasi waktu 25 hari berada di bawah toleransi minimal KAK (30–60 hari) berpotensi menurunkan mutu pekerjaan.",
          tingkat: "warning",
        },
      ],
      ringkasanAi: {
        model: "meta-llama/llama-3.3-70b-instruct",
        ringkasanEksekutif:
          "Penawaran sebesar Rp99.000.000 dengan kecepatan pengerjaan 25 hari. Namun serapan tenaga kerja lokal perlu ditingkatkan agar memenuhi standar minimal 70%.",
        poinKekuatan: [
          "Durasi pengerjaan sangat cepat (25 hari)",
          "Tukang batu berpengalaman dengan sertifikat kerja",
        ],
        poinPerhatian: [
          "Serapan tenaga kerja lokal masih di bawah ambang batas regulasi 70%",
        ],
        rekomendasiCatatan:
          "Perlu komitmen penambahan tenaga kerja warga setempat sebelum penandatanganan SPK.",
      },
    },
    {
      id: "prop_warga_muda_03",
      namaKelompok: "Paguyuban Warga Muda Dusun 1",
      ketua: "Agus Setiawan",
      penawaran: 62_000_000,
      durasiHari: 40,
      tenagaTotal: 8,
      tenagaLokal: 8,
      persentaseLokal: 100,
      narasiMetode:
        "Pemberdayaan pemuda karang taruna dusun untuk pekerjaan galian tanah saluran dibantu oleh tukang senior.",
      narasiJadwal:
        "Target pengerjaan 40 hari kerja dengan rotasi regu pemuda pada akhir pekan dan sore hari.",
      narasiRisiko:
        "Pengawasan mutu adukan semen mortar dipandu langsung oleh tukang senior berpengalaman.",
      dokumen: ["proposal-paguyuban-muda.pdf", "daftar-anggota-ktp.pdf"],
      skor: {
        total: 77.8,
        rincian: {
          harga: 31.8,
          tenagaLokal: 23.0,
          pengalaman: 8.0,
          durasi: 15.0,
        },
        flags: [],
        versiBobot: "v1.0",
      },
      flagsDetail: [],
      ringkasanAi: {
        model: "meta-llama/llama-3.3-70b-instruct",
        ringkasanEksekutif:
          "Penawaran hemat Rp62.000.000 dengan serapan tenaga kerja lokal 100% (8 dari 8 pekerja adalah warga lokal). Pengerjaan berbasis gotong royong penuh.",
        poinKekuatan: [
          "Serapan tenaga lokal sempurna 100%",
          "Penawaran anggaran sangat hemat dan efisien",
        ],
        poinPerhatian: [
          "Efisiensi RAB optimal dengan sisa buffer Rp38.000.000 dari pagu Rp100.000.000",
          "Durasi pengerjaan 40 hari memenuhi batas toleransi KAK",
        ],
        rekomendasiCatatan:
          "Peringkat 3. Memenuhi syarat minimal KAK sayembara swakelola desa.",
      },
    },
  ],
};

export const mockProjectBalaiWarga: ProjectDetailData = {
  id: "seed_proyek_002",
  desaId: "seed_desa_001",
  judul: "Rehabilitasi Gedung Pertemuan Balai Warga Dusun",
  deskripsi:
    "Peningkatan fasilitas aula desa dan ruang serbaguna dusun untuk kegiatan posyandu, pelatihan tani mandiri, dan kegiatan kepemudaan karang taruna setempat.",
  lokasi: "Dusun Karang Anyar",
  pagu: 140_000_000,
  kelas: "MENENGAH",
  jalur: "SAYEMBARA",
  alasanJalur:
    "Dikerjakan oleh kelompok pertukangan desa dengan serapan tenaga kerja lokal mencapai 75% untuk memberdayakan tukang dan pemuda setempat.",
  status: "PENGERJAAN",
  tanggalPublikasi: "1 Maret 2026",
  tenggatProposal: "15 Maret 2026",
  tenggatHari: 0,
  syaratLokalMin: 75,
  durasiMin: 45,
  durasiMax: 90,
  sumberDana: "Dana Desa (APBDes TA 2026)",
  rabItems: [
    { id: "rab_b1", uraian: "Pekerjaan Pembongkaran & Rangka Atap Baja Ringan", volume: 180, satuan: "m²", hargaSatuan: 250_000, subtotal: 45_000_000 },
    { id: "rab_b2", uraian: "Pekerjaan Pasangan Genteng & Plafond Gypsum", volume: 180, satuan: "m²", hargaSatuan: 200_000, subtotal: 36_000_000 },
    { id: "rab_b3", uraian: "Pekerjaan Lantai Keramik Granit 60x60 cm", volume: 220, satuan: "m²", hargaSatuan: 180_000, subtotal: 39_600_000 },
    { id: "rab_b4", uraian: "Pekerjaan Pengecatan Interior & Eksterior", volume: 450, satuan: "m²", hargaSatuan: 43_100, subtotal: 19_400_000 },
  ],
  proposals: [
    {
      id: "prop_balai_pemenang",
      namaKelompok: "Pokmas Karya Warga RT 02",
      ketua: "Hendra Gunawan",
      penawaran: 138_000_000,
      durasiHari: 60,
      tenagaTotal: 18,
      tenagaLokal: 15,
      persentaseLokal: 83,
      narasiMetode: "Pengerjaan bertahap dari pembongkaran atap sisi timur agar kegiatan musyawarah warga tetap dapat berlangsung sebagian.",
      narasiJadwal: "Bulan 1: Struktur atap dan plafond. Bulan 2: Pasangan lantai granit dan pengecatan tuntas.",
      narasiRisiko: "Penyediaan terpal pelindung hujan lebar 200m2 untuk melindungi material lantai dari tampias air.",
      dokumen: ["spk-swakelola-balai.pdf", "pakta-integritas-rt02.pdf"],
      skor: { total: 91.5, rincian: { harga: 36.5, tenagaLokal: 28.0, pengalaman: 9.0, durasi: 18.0 }, flags: [], versiBobot: "v1.0" },
      flagsDetail: [],
    },
  ],
};

export const mockProjectJalanSetapak: ProjectDetailData = {
  id: "seed_proyek_003",
  desaId: "seed_desa_001",
  judul: "Pavingisasi Jalan Setapak Permukiman Dusun Makmur",
  deskripsi:
    "Pemasangan paving block jalan setapak pemukiman sepanjang 400 meter dengan sistem Padat Karya Tunai Desa (PKTD) guna mempermudah akses anak sekolah dan mobilitas panen.",
  lokasi: "Dusun Tani Makmur",
  pagu: 60_000_000,
  kelas: "KECIL",
  jalur: "SAYEMBARA",
  alasanJalur:
    "Pekerjaan sederhana padat karya tunai desa (PKTD) berbasis gotong royong warga rukun tetangga setempat.",
  status: "SELESAI",
  tanggalPublikasi: "15 Januari 2026",
  tenggatProposal: "30 Januari 2026",
  tenggatHari: 0,
  syaratLokalMin: 85,
  durasiMin: 20,
  durasiMax: 40,
  sumberDana: "Dana Desa (APBDes TA 2026)",
  rabItems: [
    { id: "rab_j1", uraian: "Pekerjaan Perataan & Pemadatan Tanah Dasar", volume: 400, satuan: "m²", hargaSatuan: 25_000, subtotal: 10_000_000 },
    { id: "rab_j2", uraian: "Pemasangan Pasir Urug Tebal 5 cm", volume: 20, satuan: "m³", hargaSatuan: 250_000, subtotal: 5_000_000 },
    { id: "rab_j3", uraian: "Pemasangan Paving Block Segienam K-250", volume: 400, satuan: "m²", hargaSatuan: 95_000, subtotal: 38_000_000 },
    { id: "rab_j4", uraian: "Pemasangan Kanstin Beton Pengunci Tepi", volume: 140, satuan: "m'", hargaSatuan: 50_000, subtotal: 7_000_000 },
  ],
  proposals: [
    {
      id: "prop_jalan_selesai",
      namaKelompok: "Kelompok Tani Makmur Sejahtera",
      ketua: "Rudi Hermawan",
      penawaran: 58_500_000,
      durasiHari: 25,
      tenagaTotal: 20,
      tenagaLokal: 18,
      persentaseLokal: 90,
      narasiMetode: "Pemasangan paving swakelola gotong royong dengan target 20 meter per hari dipimpin oleh 3 tukang paving ahli.",
      narasiJadwal: "Minggu 1: Pemadatan dasar. Minggu 2-3: Pasang paving & kanstin. Minggu 4: Finishing abu batu dan pemadatan stamper.",
      narasiRisiko: "Penyiraman air berkala untuk mencegah debu mengotori pekarangan rumah warga.",
      dokumen: ["baphp-100-jalan.pdf", "laporan-lpj-lengkap.pdf", "berita-acara-audit-bpd.pdf"],
      skor: { total: 94.0, rincian: { harga: 38.0, tenagaLokal: 29.0, pengalaman: 9.0, durasi: 18.0 }, flags: [], versiBobot: "v1.0" },
      flagsDetail: [],
    },
  ],
};

export const mockProjectWisata: ProjectDetailData = {
  id: "seed_proyek_004",
  desaId: "seed_desa_001",
  judul: "Pengembangan Kawasan Wisata Pemandian Air Panas",
  deskripsi:
    "Proyek strategis desa untuk pembangunan fasilitas pariwisata pemandian air panas terpadu berbasis Badan Usaha Milik Desa (BUMDes) dan Pokdarwis.",
  lokasi: "Dusun Sumber Rejeki",
  pagu: 80_000_000,
  kelas: "MENENGAH",
  jalur: "SAYEMBARA",
  alasanJalur:
    "Pemberdayaan kelompok sadar wisata (Pokdarwis) dan warga Dusun Sumber Rejeki untuk mengelola potensi alam desa.",
  status: "PEMATANGAN",
  tanggalPublikasi: "1 April 2026",
  tenggatProposal: "Menunggu Jadwal Sayembara",
  tenggatHari: 14,
  syaratLokalMin: 60,
  durasiMin: 60,
  durasiMax: 120,
  sumberDana: "Dana Desa (Penyertaan Modal BUMDes)",
  rabItems: [
    { id: "rab_w1", uraian: "Studi Kelayakan & Pemetaan Geologis Sumber Air Panas", volume: 1, satuan: "ls", hargaSatuan: 15_000_000, subtotal: 15_000_000 },
    { id: "rab_w2", uraian: "Pematangan Lahan & Pembuatan Jalur Akses Masuk", volume: 200, satuan: "m²", hargaSatuan: 175_000, subtotal: 35_000_000 },
    { id: "rab_w3", uraian: "Pembangunan Bak Penampung & Filter Air Panas", volume: 2, satuan: "unit", hargaSatuan: 15_000_000, subtotal: 30_000_000 },
  ],
  proposals: [],
};

export function getMockProjectById(id?: string): ProjectDetailData {
  if (!id || id === "seed_proyek_001" || id === "proj-drainase-rt3") {
    return mockProjectDrainase;
  }
  if (id === "seed_proyek_002" || id.includes("balai")) {
    return mockProjectBalaiWarga;
  }
  if (id === "seed_proyek_003" || id.includes("jalan") || id.includes("paving")) {
    return mockProjectJalanSetapak;
  }
  if (id === "seed_proyek_004" || id.includes("wisata") || id.includes("pemandian")) {
    return mockProjectWisata;
  }

  // Fallback variant for other IDs
  return {
    ...mockProjectDrainase,
    id,
    judul: `Proyek Sayembara (${id})`,
  };
}

