import { Prisma, KelasProyek, Jalur, StatusProyek, StatusAnalisis, JenisFlag, KeputusanFlag, Peran, StatusAkun } from "@prisma/client";
import { hitungSkor } from "../lib/scoring";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Memulai proses seeding data awal (T1 & Buku Kas)...");

  // 1. Bersihkan data lama dengan urutan relasi aman
  await prisma.flagKemiripan.deleteMany();
  await prisma.skor.deleteMany();
  await prisma.ringkasanAi.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.anggotaKelompok.deleteMany();
  await prisma.kelompok.deleteMany();
  await prisma.rabItem.deleteMany();
  await prisma.proyek.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pengguna.deleteMany();
  await prisma.desa.deleteMany();

  console.log("Data lama berhasil dibersihkan.");

  // ================= 2. DATA TRANSAKSI BUKU KAS DESA =================
  const transaksiKasList = [
    {
      id: "kas_001",
      tanggal: "2026-01-10T08:00:00.000Z",
      jenis: "PEMASUKAN",
      kategori: "Dana Desa",
      uraian: "Penyaluran Dana Desa Tahap 1 dari RKUN ke RKD Karang Sari",
      jumlah: 600_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_001.pdf",
    },
    {
      id: "kas_002",
      tanggal: "2026-01-25T10:30:00.000Z",
      jenis: "PENGELUARAN",
      kategori: "Siltap & Tunjangan",
      uraian: "Pembayaran Penghasilan Tetap dan Tunjangan Perangkat & BPD Triwulan I",
      jumlah: 280_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_002.pdf",
    },
    {
      id: "kas_003",
      tanggal: "2026-02-05T09:00:00.000Z",
      jenis: "PEMASUKAN",
      kategori: "Alokasi Dana Desa (ADD)",
      uraian: "Penyaluran ADD Tahap 1 dari Rekening Kas Daerah Kabupaten",
      jumlah: 250_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_003.pdf",
    },
    {
      id: "kas_004",
      tanggal: "2026-02-20T14:00:00.000Z",
      jenis: "PENGELUARAN",
      kategori: "Operasional Perkantoran",
      uraian: "Biaya operasional kantor desa, listrik, internet, dan Musdes Khusus",
      jumlah: 115_400_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_004.pdf",
    },
    {
      id: "kas_005",
      tanggal: "2026-03-01T11:00:00.000Z",
      jenis: "PEMASUKAN",
      kategori: "Pendapatan Asli Desa (PADes)",
      uraian: "Bagi hasil dividen unit pengelolaan pasar desa BUMDes Karang Sari",
      jumlah: 150_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_005.pdf",
    },
    {
      id: "kas_006",
      tanggal: "2026-03-10T13:30:00.000Z",
      jenis: "PENGELUARAN",
      kategori: "Termin Proyek",
      uraian: "Pencairan Termin 0 (Uang Muka 30%) Renovasi Gedung Balai Warga",
      jumlah: 41_400_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_006.pdf",
    },
    {
      id: "kas_007",
      tanggal: "2026-04-05T09:15:00.000Z",
      jenis: "PENGELUARAN",
      kategori: "Swakelola Penuh",
      uraian: "Pembayaran 100% Pengerjaan Padat Karya Jalan Setapak Dusun Makmur",
      jumlah: 58_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_007.pdf",
    },
    {
      id: "kas_008",
      tanggal: "2026-04-12T10:00:00.000Z",
      jenis: "PEMASUKAN",
      kategori: "Bagi Hasil Pajak & Retribusi",
      uraian: "Penerimaan bagian daerah hasil pajak dan retribusi daerah kabupaten",
      jumlah: 100_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_008.pdf",
    },
    {
      id: "kas_009",
      tanggal: "2026-05-18T15:00:00.000Z",
      jenis: "PENGELUARAN",
      kategori: "Termin Proyek",
      uraian: "Pencairan Termin 50% Proyek Renovasi Balai Warga (Progres Terverifikasi)",
      jumlah: 55_200_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_009.pdf",
    },
    {
      id: "kas_010",
      tanggal: "2026-06-02T10:30:00.000Z",
      jenis: "PENGELUARAN",
      kategori: "Ketahanan Pangan",
      uraian: "Pengadaan bibit unggul padi dan alsintan kelompok tani desa",
      jumlah: 300_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_010.pdf",
    },
    {
      id: "kas_011",
      tanggal: "2026-06-15T08:45:00.000Z",
      jenis: "PEMASUKAN",
      kategori: "Dana Desa",
      uraian: "Penyaluran Dana Desa Tahap 2 Reguler dari RKUN ke RKD Karang Sari",
      jumlah: 400_000_000,
      buktiUrl: "https://akar-desa.id/bukti/kas_011.pdf",
    },
  ];

  const totalPemasukan = transaksiKasList
    .filter((t) => t.jenis === "PEMASUKAN")
    .reduce((acc, curr) => acc + curr.jumlah, 0); // 1.500.000.000

  const totalPengeluaran = transaksiKasList
    .filter((t) => t.jenis === "PENGELUARAN")
    .reduce((acc, curr) => acc + curr.jumlah, 0); // 850.000.000

  const sisaSaldo = totalPemasukan - totalPengeluaran; // 650.000.000

  // 3. Buat Desa dengan ID seed_desa_001
  const desa = await prisma.desa.create({
    data: {
      id: "seed_desa_001",
      nama: "Desa Karang Sari",
      kecamatan: "Kecamatan Harapan",
      kabupaten: "Kabupaten Contoh",
      tahun: 2026,
      pagu: BigInt(1_000_000_000), // Rp1 Miliar
      pagukdmp: BigInt(580_300_000), // Alokasi KDMP 58.03%
      konfigurasi: {
        targetSwakelolaPersen: 40,
        masaSanggahHari: 3,
        tenggatTanggapanHari: 14,
        bukuKas: {
          saldoAwal: 0,
          totalPemasukan,
          totalPengeluaran,
          sisaSaldo,
          transaksiTerakhir: transaksiKasList,
        },
      },
    },
  });
  console.log(`Desa dibuat: ${desa.nama} (ID: ${desa.id})`);

  // 4. Buat Pengguna (Minimal 4 peran)
  const kades = await prisma.pengguna.create({
    data: {
      authId: "seed_auth_kades",
      email: "kades@karangsari.desa.id",
      nama: "Pak Hendy (Kepala Desa / Perangkat)",
      peran: Peran.PERANGKAT,
      statusAkun: StatusAkun.AKTIF,
      desaId: desa.id,
      rtRw: "01/01",
      kontak: "081234567890",
      setujuSyaratPada: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const pengawas = await prisma.pengguna.create({
    data: {
      authId: "seed_auth_pengawas",
      email: "bpd@karangsari.desa.id",
      nama: "Pak Bambang (Pengawas BPD)",
      peran: Peran.PENGAWAS,
      statusAkun: StatusAkun.AKTIF,
      desaId: desa.id,
      rtRw: "02/01",
      kontak: "081234567891",
      setujuSyaratPada: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const admin = await prisma.pengguna.create({
    data: {
      authId: "seed_auth_admin",
      email: "admin@karangsari.desa.id",
      nama: "Siti Rahma (Admin Desa)",
      peran: Peran.ADMIN,
      statusAkun: StatusAkun.AKTIF,
      desaId: desa.id,
      rtRw: "01/02",
      kontak: "081234567892",
      setujuSyaratPada: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const ketuaA = await prisma.pengguna.create({
    data: {
      authId: "seed_auth_ketua_a",
      email: "rudi@karangsari.desa.id",
      nama: "Rudi Hermawan (Ketua Kelompok Tani Muda)",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: desa.id,
      rtRw: "01/02",
      kontak: "081234567893",
      setujuSyaratPada: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const ketuaB = await prisma.pengguna.create({
    data: {
      authId: "seed_auth_ketua_b",
      email: "joko@karangsari.desa.id",
      nama: "Joko Widodo (Ketua CV Karya Warga)",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: desa.id,
      rtRw: "02/03",
      kontak: "081234567894",
      setujuSyaratPada: new Date("2026-01-01T00:00:00.000Z"),
    },
  });
  const ketuaC = await prisma.pengguna.create({
    data: {
      authId: "seed_auth_ketua_c",
      email: "budi@karangsari.desa.id",
      nama: "Budi Santoso (Ketua Kelompok Tukang RT 3)",
      peran: Peran.WARGA,
      statusAkun: StatusAkun.AKTIF,
      desaId: desa.id,
      rtRw: "03/03",
      kontak: "081234567895",
      setujuSyaratPada: new Date("2026-01-01T00:00:00.000Z"),
    },
  });

  console.log("Pengguna (Perangkat, Pengawas, Admin, dan Warga) berhasil dibuat.");

  // 5. Buat Kelompok Warga
  const kelompokA = await prisma.kelompok.create({
    data: {
      nama: "Kelompok Tani Muda",
      ketuaId: ketuaA.id,
    },
  });

  const kelompokB = await prisma.kelompok.create({
    data: {
      nama: "CV Karya Warga",
      ketuaId: ketuaB.id,
    },
  });

  const kelompokC = await prisma.kelompok.create({
    data: {
      nama: "Kelompok Tukang RT 3",
      ketuaId: ketuaC.id,
    },
  });

  // 6. Tambahkan Anggota Kelompok (Wahyu Pratama ada di B dan C untuk trigger overlap)
  const wahyuHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  await prisma.anggotaKelompok.createMany({
    data: [
      // Kelompok A
      { kelompokId: kelompokA.id, nama: "Rudi Hermawan", rtRw: "01/02", ketua: true, nikHash: "hash_rudi_001" },
      { kelompokId: kelompokA.id, nama: "Slamet Riyadi", rtRw: "01/02", ketua: false, nikHash: "hash_slamet_002" },
      { kelompokId: kelompokA.id, nama: "Ahmad Dahlan", rtRw: "01/02", ketua: false, nikHash: "hash_ahmad_003" },

      // Kelompok B
      { kelompokId: kelompokB.id, nama: "Joko Widodo", rtRw: "02/03", ketua: true, nikHash: "hash_joko_004" },
      { kelompokId: kelompokB.id, nama: "Hendra Gunawan", rtRw: "02/03", ketua: false, nikHash: "hash_hendra_005" },
      { kelompokId: kelompokB.id, nama: "Wahyu Pratama", rtRw: "02/03", ketua: false, nikHash: wahyuHash },

      // Kelompok C
      { kelompokId: kelompokC.id, nama: "Budi Santoso", rtRw: "03/03", ketua: true, nikHash: "hash_budi_006" },
      { kelompokId: kelompokC.id, nama: "Agus Salim", rtRw: "03/03", ketua: false, nikHash: "hash_agus_007" },
      { kelompokId: kelompokC.id, nama: "Wahyu Pratama", rtRw: "03/03", ketua: false, nikHash: wahyuHash },
    ],
  });

  // 7. Buat Proyek Drainase RT 3 (ID: seed_proyek_001)
  const proyekDrainase = await prisma.proyek.create({
    data: {
      id: "seed_proyek_001",
      desaId: desa.id,
      judul: "Pembangunan Saluran Drainase RT 3",
      deskripsi: "Pembangunan saluran drainase lingkungan untuk mencegah genangan air saat musim hujan di RT 3 Dusun Krajan.",
      lokasi: "RT 03 Dusun Krajan",
      pagu: BigInt(100_000_000),
      kelas: KelasProyek.KECIL,
      jalur: Jalur.SAYEMBARA,
      alasanJalur: "Pekerjaan padat karya sederhana yang dapat dikerjakan secara gotong royong oleh kelompok tukang warga desa.",
      status: StatusProyek.TENDER_DIBUKA,
      tenggatProposal: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      syaratLokalMin: 70,
      durasiMin: 30,
      durasiMax: 60,
    },
  });

  // Micro-RAB Drainase RT 3 (Total = Pagu = Rp100.000.000)
  await prisma.rabItem.createMany({
    data: [
      { proyekId: proyekDrainase.id, uraian: "Pekerjaan Galian Tanah Saluran", volume: 250, satuan: "m3", hargaSatuan: BigInt(80_000) },
      { proyekId: proyekDrainase.id, uraian: "Pekerjaan Pasangan Batu Kali Mortar", volume: 150, satuan: "m3", hargaSatuan: BigInt(400_000) },
      { proyekId: proyekDrainase.id, uraian: "Pekerjaan Plesteran & Siaran Saluran", volume: 400, satuan: "m2", hargaSatuan: BigInt(50_000) },
    ],
  });

  // Proyek Balai Warga (PENGERJAAN)
  await prisma.proyek.create({
    data: {
      desaId: desa.id,
      judul: "Renovasi Gedung Pertemuan Balai Warga",
      deskripsi: "Renovasi atap dan lantai balai warga serbaguna.",
      lokasi: "Dusun Karang Anyar",
      pagu: BigInt(140_000_000),
      kelas: KelasProyek.MENENGAH,
      jalur: Jalur.SAYEMBARA,
      alasanJalur: "Dikerjakan oleh kelompok pertukangan desa dengan serapan tenaga kerja lokal.",
      status: StatusProyek.PENGERJAAN,
      syaratLokalMin: 70,
      durasiMin: 45,
      durasiMax: 90,
    },
  });

  // Proyek Jalan Setapak Dusun (SELESAI)
  await prisma.proyek.create({
    data: {
      desaId: desa.id,
      judul: "Pavingisasi Jalan Setapak Dusun",
      deskripsi: "Pemasangan paving block jalan setapak pemukiman.",
      lokasi: "Dusun Tani Makmur",
      pagu: BigInt(60_000_000),
      kelas: KelasProyek.KECIL,
      jalur: Jalur.SAYEMBARA,
      alasanJalur: "Pekerjaan sederhana padat karya tunai desa (PKTD).",
      status: StatusProyek.SELESAI,
      syaratLokalMin: 80,
      durasiMin: 20,
      durasiMax: 40,
    },
  });

  // Proyek Pemandian Air Panas (PEMATANGAN)
  await prisma.proyek.create({
    data: {
      desaId: desa.id,
      judul: "Pengembangan Kawasan Wisata Pemandian Air Panas",
      deskripsi: "Proyek strategis desa untuk fasilitas pariwisata pemandian air panas terpadu.",
      lokasi: "Dusun Sumber Rejeki",
      pagu: BigInt(80_000_000),
      kelas: KelasProyek.BESAR,
      status: StatusProyek.PEMATANGAN,
      syaratLokalMin: 60,
      durasiMin: 60,
      durasiMax: 120,
    },
  });

  // ================= 8. PROPOSAL A, B, C =================
  // Proposal A
  const propA = await prisma.proposal.create({
    data: {
      id: "seed_proposal_001",
      proyekId: proyekDrainase.id,
      kelompokId: kelompokA.id,
      penawaran: BigInt(88_000_000),
      durasiHari: 45,
      tenagaTotal: 10,
      tenagaLokal: 9,
      narasiMetode: "Metode galian manual dengan rotasi kelompok gotong royong dan pemasangan batu kali mortar bertahap.",
      narasiJadwal: "Minggu 1-2 galian saluran, Minggu 3-5 pasangan batu kali, Minggu 6 plesteran siar dan pembersihan akhir.",
      narasiRisiko: "Risiko hujan diatasi dengan pompa air dan penutupan terpal plastik pada galian basah.",
      dokumen: ["proposal-tani-muda.pdf"],
      kelengkapan: { jadwal: true, metode: true, risiko: true, anggota: true, pengalaman: false },
      statusAnalisis: StatusAnalisis.BERHASIL,
    },
  });

  const skorA = hitungSkor({
    pagu: 100_000_000,
    penawaran: 88_000_000,
    tenagaTotal: 10,
    tenagaLokal: 9,
    durasi: 45,
    durasiMin: 30,
    durasiMax: 60,
    kelengkapan: 4,
  });

  await prisma.skor.create({
    data: {
      proposalId: propA.id,
      total: skorA.total,
      rincian: skorA.rincian,
      flags: skorA.flags,
      versiBobot: skorA.versiBobot,
    },
  });

  await prisma.ringkasanAi.create({
    data: {
      proposalId: propA.id,
      model: "meta-llama/llama-3.3-70b-instruct",
      versiPrompt: "v1.0",
      json: {
        ringkasanEksekutif: "Pengerjaan galian drainase RT 3 dengan 90% tenaga lokal dan metode bertahap gotong royong.",
        poinKekuatan: [
          "Serapan tenaga kerja lokal mencapai 90% dari warga setempat",
          "Metode kerja bertahap dengan manajemen risiko genangan yang baik",
          "Biaya penawaran rasional di angka Rp88 juta (88% pagu)",
        ],
        poinPerhatian: [
          "Bukti pengalaman proyek serupa belum disertakan secara tertulis",
          "Perlu jadwal cadangan jika curah hujan tinggi di bulan pengerjaan",
        ],
        rekomendasiCatatan: "Proposal layak dipertimbangkan dengan verifikasi komitmen ketersediaan tenaga kerja di lapangan.",
      },
    },
  });

  // Teks narasi teknis serupa antara Proposal B dan Proposal C (disusun oleh penyusun yang sama)
  const templateSpesifikasiTeknis =
    "Pekerjaan dinding penahan dan saluran drainase menggunakan pasangan batu belah tipe 1:4 dengan sistem pengeringan air tanah dan plesteran kedap air ketebalan 15mm. Manajemen material batu belah dipasok dari kuari terdekat dengan kontrol mutu harian.";

  // Proposal B
  const propB = await prisma.proposal.create({
    data: {
      id: "seed_proposal_002",
      proyekId: proyekDrainase.id,
      kelompokId: kelompokB.id,
      penawaran: BigInt(99_000_000),
      durasiHari: 25,
      tenagaTotal: 12,
      tenagaLokal: 6,
      narasiMetode: `Pengerjaan cepat dengan alat bantu mekanis dan tenaga terampil campuran. ${templateSpesifikasiTeknis}`,
      narasiJadwal: "Jadwal padat 25 hari kerja maraton dengan dua shift kerja harian.",
      narasiRisiko: "Keterlambatan suplai material batu diantisipasi dengan pemesanan awal dari pemasok utama kuari lokal.",
      dokumen: ["proposal-cv-karya-warga.pdf"],
      kelengkapan: { jadwal: true, metode: true, risiko: true, anggota: false, pengalaman: false },
      statusAnalisis: StatusAnalisis.BERHASIL,
    },
  });

  const skorB = hitungSkor({
    pagu: 100_000_000,
    penawaran: 99_000_000,
    tenagaTotal: 12,
    tenagaLokal: 6,
    durasi: 25,
    durasiMin: 30,
    durasiMax: 60,
    kelengkapan: 3,
  });

  await prisma.skor.create({
    data: {
      proposalId: propB.id,
      total: skorB.total,
      rincian: skorB.rincian,
      flags: skorB.flags,
      versiBobot: skorB.versiBobot,
    },
  });

  await prisma.ringkasanAi.create({
    data: {
      proposalId: propB.id,
      model: "meta-llama/llama-3.3-70b-instruct",
      versiPrompt: "v1.0",
      json: {
        ringkasanEksekutif: "Penawaran harga mendekati pagu (Rp99 juta) dengan durasi maraton 25 hari kerja.",
        poinKekuatan: [
          "Waktu pelaksanaan sangat cepat (25 hari)",
          "Didukung peralatan mekanis yang memadai",
        ],
        poinPerhatian: [
          "Serapan tenaga kerja lokal hanya 50%, berada di bawah syarat minimum 70%",
          "Nilai penawaran mendekati batas atas pagu (99%)",
          "Ada indikasi anggota tumpang tindih dengan kelompok lain",
        ],
        rekomendasiCatatan: "Perlu klarifikasi terkait serapan tenaga kerja lokal sebelum melangkah ke tahap seleksi berikutnya.",
      },
    },
  });

  // Proposal C
  const propC = await prisma.proposal.create({
    data: {
      id: "seed_proposal_003",
      proyekId: proyekDrainase.id,
      kelompokId: kelompokC.id,
      penawaran: BigInt(62_000_000),
      durasiHari: 40,
      tenagaTotal: 8,
      tenagaLokal: 8,
      narasiMetode: `Dikerjakan 100% oleh warga tukang RT 3 dengan rincian material lokal yang hemat. ${templateSpesifikasiTeknis}`,
      narasiJadwal: "Pengerjaan teratur selama 40 hari kalender dengan pengawasan ketua RT.",
      narasiRisiko: "Keterlambatan suplai material batu diantisipasi dengan pemesanan awal dari pemasok utama kuari lokal.",
      dokumen: ["proposal-tukang-rt3.pdf", "sk-kelompok.pdf"],
      kelengkapan: { jadwal: true, metode: true, risiko: true, anggota: true, pengalaman: true },
      statusAnalisis: StatusAnalisis.BERHASIL,
    },
  });

  const skorC = hitungSkor({
    pagu: 100_000_000,
    penawaran: 62_000_000,
    tenagaTotal: 8,
    tenagaLokal: 8,
    durasi: 40,
    durasiMin: 30,
    durasiMax: 60,
    kelengkapan: 5,
  });

  await prisma.skor.create({
    data: {
      proposalId: propC.id,
      total: skorC.total,
      rincian: skorC.rincian,
      flags: skorC.flags,
      versiBobot: skorC.versiBobot,
    },
  });

  await prisma.ringkasanAi.create({
    data: {
      proposalId: propC.id,
      model: "meta-llama/llama-3.3-70b-instruct",
      versiPrompt: "v1.0",
      json: {
        ringkasanEksekutif: "Penawaran sangat murah (Rp62 juta) dengan pelibatan 100% tukang warga RT 3.",
        poinKekuatan: [
          "Serapan tenaga kerja lokal maksimal 100%",
          "Kelengkapan berkas administrasi dan pengalaman kerja lengkap (5/5)",
          "Anggaran sangat efisien",
        ],
        poinPerhatian: [
          "Harga penawaran jauh di bawah pagu (62%), perlu klarifikasi apakah micro-RAB mencukupi",
          "Terdapat anggota yang sama dengan kelompok CV Karya Warga",
        ],
        rekomendasiCatatan: "Wajib verifikasi kewajaran harga dan klarifikasi komitmen anggota ganda.",
      },
    },
  });

  // ================= 9. FLAG KEMIRIPAN (ANGGOTA & TEKS) =================
  // 9.1 Flag Tumpang Tindih Anggota antara Proposal B dan Proposal C
  await prisma.flagKemiripan.create({
    data: {
      proyekId: proyekDrainase.id,
      proposalAId: propB.id,
      proposalBId: propC.id,
      jenis: JenisFlag.ANGGOTA,
      nilai: 1.0,
      keputusan: KeputusanFlag.BELUM,
      catatan: "Terdeteksi 1 anggota ganda (Wahyu Pratama) terdaftar di Kelompok CV Karya Warga dan Kelompok Tukang RT 3.",
    },
  });

  // 9.2 Flag Kemiripan Teks antara Proposal B dan Proposal C
  await prisma.flagKemiripan.create({
    data: {
      proyekId: proyekDrainase.id,
      proposalAId: propB.id,
      proposalBId: propC.id,
      jenis: JenisFlag.TEKS,
      nilai: 0.68,
      keputusan: KeputusanFlag.BELUM,
      catatan: "Kemiripan narasi teks sebesar 68.0% terdeteksi antara CV Karya Warga dan Kelompok Tukang RT 3 pada bagian metode teknis dan mitigasi risiko.",
    },
  });

  console.log("Seeding data awal dan buku kas desa berhasil diselesaikan!");
}

main()
  .catch((e) => {
    console.error("Kesalahan saat menjalankan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
