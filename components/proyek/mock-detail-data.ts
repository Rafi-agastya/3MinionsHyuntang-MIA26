import { ProjectDetailData } from "./types";

export const mockProjectDrainase: ProjectDetailData = {
  id: "seed_proyek_001",
  desaId: "seed_desa_001",
  judul: "Pembangunan Saluran Drainase & Gorong-Gorong RT 03",
  deskripsi:
    "Pengerjaan fisik saluran drainase pemukiman warga sepanjang 250 meter berbasis Padat Karya Tunai Desa (PKTD) guna mencegah genangan air musim hujan.",
  lokasi: "Dusun Krajan RT 03 / RW 01",
  pagu: 50_000_000,
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
  durasiMax: 45,
  sumberDana: "Dana Desa (APBDes TA 2026)",
  rabItems: [
    {
      id: "rab_001",
      uraian: "Pekerjaan Galian Tanah Saluran & Gorong-gorong",
      volume: 120,
      satuan: "m³",
      hargaSatuan: 80_000,
      subtotal: 9_600_000,
    },
    {
      id: "rab_002",
      uraian: "Pekerjaan Pasangan Batu Kali Mortar (1:4)",
      volume: 60,
      satuan: "m³",
      hargaSatuan: 450_000,
      subtotal: 27_000_000,
    },
    {
      id: "rab_003",
      uraian: "Pekerjaan Pemasangan Pipa Beton Gorong-gorong & Plesteran Siar",
      volume: 268,
      satuan: "m²",
      hargaSatuan: 50_000,
      subtotal: 13_400_000,
    },
  ],
  proposals: [
    {
      id: "prop_makmur_jaya_01",
      namaKelompok: "Pokmas Makmur Jaya RT 03",
      ketua: "Slamet Rahardjo",
      penawaran: 46_200_000,
      durasiHari: 30,
      tenagaTotal: 25,
      tenagaLokal: 22,
      persentaseLokal: 88,
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
          "Proposal Pokmas Makmur Jaya RT 03 mendapatkan skor tertinggi dengan serapan tenaga kerja lokal mencapai 88% (22 warga desa) serta nilai penawaran hemat dan rasional di angka Rp46.200.000 (92,4% pagu).",
        poinKekuatan: [
          "Serapan tenaga kerja lokal 88% (22 dari 25 pekerja adalah warga RT 03 Dusun Krajan)",
          "Efisiensi anggaran optimal dengan sisa buffer Rp3.800.000 dari pagu Rp50 juta",
          "Metode mitigasi risiko matang dengan pompa air portabel dan sodetan sementara",
        ],
        poinPerhatian: [
          "Pastikan suplai batu kali dan semen mortar dipesan di muka agar ritme kerja 30 hari terjaga",
        ],
        rekomendasiCatatan:
          "Rekomendasi Utama: Sangat layak ditetapkan sebagai pelaksana sayembara swakelola drainase RT 03.",
      },
    },
    {
      id: "prop_sari_guyub_02",
      namaKelompok: "Kelompok Tukang Sari Guyub",
      ketua: "Budi Santoso",
      penawaran: 48_500_000,
      durasiHari: 35,
      tenagaTotal: 20,
      tenagaLokal: 15,
      persentaseLokal: 75,
      narasiMetode:
        "Pengerjaan fisik saluran drainase dengan tim tukang batu berpengalaman dan bantuan tenaga angkut warga lingkungan Dusun Krajan.",
      narasiJadwal:
        "Pelaksanaan terencana selama 35 hari kalender dengan monitoring berkala bersama pengurus RT dan BPD.",
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
        flags: [],
        versiBobot: "v1.0",
      },
      flagsDetail: [],
      ringkasanAi: {
        model: "meta-llama/llama-3.3-70b-instruct",
        ringkasanEksekutif:
          "Penawaran realistis sebesar Rp48.500.000 dengan tingkat serapan tukang lokal 75% (15 dari 20 pekerja). Metode pengerjaan memenuhi standar KAK proyek desa.",
        poinKekuatan: [
          "Tukang batu berpengalaman dengan rekam jejak pekerjaan fisik desa yang baik",
          "Serapan tenaga lokal 75% melampaui batas regulasi minimal (70%)",
        ],
        poinPerhatian: [
          "Estimasi waktu pelaksanaan 35 hari lebih lama dibandingkan Pokmas Makmur Jaya",
        ],
        rekomendasiCatatan:
          "Peringkat 2. Memenuhi seluruh syarat administrasi dan teknis jika kelompok peringkat 1 berhalangan.",
      },
    },
    {
      id: "prop_warga_muda_03",
      namaKelompok: "Paguyuban Warga Muda Dusun 1",
      ketua: "Agus Setiawan",
      penawaran: 49_800_000,
      durasiHari: 40,
      tenagaTotal: 20,
      tenagaLokal: 14,
      persentaseLokal: 70,
      narasiMetode:
        "Pemberdayaan pemuda karang taruna dusun untuk pekerjaan galian tanah saluran dibantu oleh 4 tukang senior.",
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
          "Penawaran Rp49.800.000 mendekati batas pagu dengan serapan tenaga kerja lokal tepat di batas 70%. Rencana kerja padat karya pemuda sangat positif untuk pemberdayaan.",
        poinKekuatan: [
          "Semangat gotong royong pemuda desa tinggi untuk pemeliharaan infrastruktur lingkungan",
          "Keterlibatan 14 pemuda lokal Dusun 1 dalam padat karya tunai",
        ],
        poinPerhatian: [
          "Efisiensi RAB rendah (hanya selisih Rp200.000 dari pagu maksimal Rp50.000.000)",
          "Durasi pengerjaan 40 hari mendekati batas maksimal toleransi KAK",
        ],
        rekomendasiCatatan:
          "Peringkat 3. Memenuhi syarat minimal KAK sayembara swakelola desa.",
      },
    },
  ],
};

export function getMockProjectById(id?: string): ProjectDetailData {
  if (!id || id === "seed_proyek_001" || id === "proj-drainase-rt3") {
    return mockProjectDrainase;
  }

  // Fallback variant for other IDs
  return {
    ...mockProjectDrainase,
    id,
    judul: `Proyek Sayembara (${id})`,
  };
}

