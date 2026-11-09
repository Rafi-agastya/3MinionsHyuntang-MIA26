import {
  KelasProyek,
  Jalur,
  StatusProyek,
  StatusAnalisis,
  JenisFlag,
  KeputusanFlag,
  Peran,
  StatusAkun,
  JenisEntri,
  LevelAkun,
  JenisBelanja,
  StatusVerifikasi,
} from "@prisma/client";
import { hitungSkor } from "../lib/scoring";
import { prisma } from "../lib/prisma";
import { tambahEntri } from "../lib/kas-ledger";

async function main() {
  console.log("Memulai proses seeding data awal (T1 & Buku Kas Siskeudes)...");

  // 1. Bersihkan data lama dengan urutan relasi aman
  await prisma.verifikasiEntri.deleteMany();
  await prisma.entriKas.deleteMany();
  await prisma.termin.deleteMany();
  await prisma.flagKemiripan.deleteMany();
  await prisma.skor.deleteMany();
  await prisma.ringkasanAi.deleteMany();
  await prisma.sanggahan.deleteMany();
  await prisma.verifikasiKompetensi.deleteMany();
  await prisma.keputusan.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.anggotaKelompok.deleteMany();
  await prisma.kelompok.deleteMany();
  await prisma.rabItem.deleteMany();
  await prisma.proyek.deleteMany();
  await prisma.posAnggaran.deleteMany();
  await prisma.refAkun.deleteMany();
  await prisma.sumberDana.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.pengguna.deleteMany();
  await prisma.desa.deleteMany();

  console.log("Data lama berhasil dibersihkan.");

  // ================= 2. DESA UTAMA =================
  const desa = await prisma.desa.create({
    data: {
      id: "seed_desa_001",
      nama: "Desa Karang Sari",
      kecamatan: "Kecamatan Harapan",
      kabupaten: "Kabupaten Contoh",
      tahun: 2026,
      pagu: BigInt(1_000_000_000), // Pagu Dana Desa Rp1 Miliar
      pagukdmp: BigInt(580_300_000), // Alokasi wajib KDMP 58,03%
      konfigurasi: {
        bukuKas: {
          saldoAwal: 0,
          totalPemasukan: 850_000_000,
          totalPengeluaran: 194_400_000,
          sisaSaldo: 600_400_000,
        },
      },
    },
  });
  console.log(`Desa dibuat: ${desa.nama} (ID: ${desa.id})`);

  // ================= 3. REFERENSI AKUN ALA SISKEUDES (BAGIAN 40) =================
  // Bidang 1: Penyelenggaraan Pemerintahan Desa
  const bidang1 = await prisma.refAkun.create({
    data: {
      kode: "01",
      uraian: "Penyelenggaraan Pemerintahan Desa",
      level: LevelAkun.BIDANG,
    },
  });
  const subBidang11 = await prisma.refAkun.create({
    data: {
      kode: "01.01",
      uraian: "Penghasilan Tetap dan Tunjangan",
      level: LevelAkun.SUB_BIDANG,
      parentId: bidang1.id,
    },
  });
  const akunSiltap = await prisma.refAkun.create({
    data: {
      kode: "01.01.01",
      uraian: "Pembayaran Penghasilan Tetap dan Tunjangan Perangkat Desa",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang11.id,
      sensitif: true,
    },
  });
  const subBidang12 = await prisma.refAkun.create({
    data: {
      kode: "01.02",
      uraian: "Operasional Perkantoran",
      level: LevelAkun.SUB_BIDANG,
      parentId: bidang1.id,
    },
  });
  const akunOperasional = await prisma.refAkun.create({
    data: {
      kode: "01.02.01",
      uraian: "Operasional Kantor Desa dan Keperluan Musdes",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang12.id,
    },
  });
  const akunBpd = await prisma.refAkun.create({
    data: {
      kode: "01.02.02",
      uraian: "Operasional Badan Permusyawaratan Desa (BPD)",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang12.id,
    },
  });

  // Bidang 2: Pelaksanaan Pembangunan Desa
  const bidang2 = await prisma.refAkun.create({
    data: {
      kode: "02",
      uraian: "Pelaksanaan Pembangunan Desa",
      level: LevelAkun.BIDANG,
    },
  });
  const subBidang21 = await prisma.refAkun.create({
    data: {
      kode: "02.01",
      uraian: "Kawasan Permukiman dan Infrastruktur Dasar",
      level: LevelAkun.SUB_BIDANG,
      parentId: bidang2.id,
    },
  });
  const akunDrainase = await prisma.refAkun.create({
    data: {
      kode: "02.01.01",
      uraian: "Pembangunan Saluran Drainase Lingkungan",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang21.id,
    },
  });
  const akunBalaiWarga = await prisma.refAkun.create({
    data: {
      kode: "02.01.02",
      uraian: "Renovasi Gedung Pertemuan Balai Warga Serbaguna",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang21.id,
    },
  });
  const akunJalanSetapak = await prisma.refAkun.create({
    data: {
      kode: "02.01.03",
      uraian: "Pavingisasi Jalan Setapak Dusun Makmur",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang21.id,
    },
  });
  const akunCadangan = await prisma.refAkun.create({
    data: {
      kode: "02.01.04",
      uraian: "Pemeliharaan Sarana dan Cadangan Pembangunan",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang21.id,
    },
  });

  // Bidang 4: Pemberdayaan Masyarakat Desa
  const bidang4 = await prisma.refAkun.create({
    data: {
      kode: "04",
      uraian: "Pemberdayaan Masyarakat Desa",
      level: LevelAkun.BIDANG,
    },
  });
  const subBidang41 = await prisma.refAkun.create({
    data: {
      kode: "04.01",
      uraian: "Pengembangan Usaha Ekonomi & Koperasi",
      level: LevelAkun.SUB_BIDANG,
      parentId: bidang4.id,
    },
  });
  const akunKdmp = await prisma.refAkun.create({
    data: {
      kode: "04.01.01",
      uraian: "Alokasi Wajib Koperasi Desa Merah Putih (KDMP)",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang41.id,
    },
  });
  const akunWisata = await prisma.refAkun.create({
    data: {
      kode: "04.01.02",
      uraian: "Pengembangan Wisata Pemandian Air Panas Terpadu",
      level: LevelAkun.KEGIATAN,
      parentId: subBidang41.id,
    },
  });

  // ================= 4. SUMBER DANA =================
  const sdDanaDesa = await prisma.sumberDana.create({
    data: {
      desaId: desa.id,
      nama: "Dana Desa",
      tahun: 2026,
      pagu: BigInt(1_000_000_000),
    },
  });

  const sdAdd = await prisma.sumberDana.create({
    data: {
      desaId: desa.id,
      nama: "Alokasi Dana Desa (ADD)",
      tahun: 2026,
      pagu: BigInt(250_000_000),
    },
  });

  // ================= 5. POS ANGGARAN =================
  // Pos Dana Desa Reguler & KDMP
  const posKdmp = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunKdmp.id,
      sumberDanaId: sdDanaDesa.id,
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Alokasi Wajib Koperasi Desa Merah Putih (KDMP)",
      anggaran: BigInt(580_300_000),
    },
  });

  const posBalaiWarga = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunBalaiWarga.id,
      sumberDanaId: sdDanaDesa.id,
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Renovasi Gedung Pertemuan Balai Warga",
      anggaran: BigInt(140_000_000),
    },
  });

  const posJalanSetapak = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunJalanSetapak.id,
      sumberDanaId: sdDanaDesa.id,
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Pavingisasi Jalan Setapak Dusun",
      anggaran: BigInt(60_000_000),
    },
  });

  const posDrainase = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunDrainase.id,
      sumberDanaId: sdDanaDesa.id,
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Pembangunan Saluran Drainase RT 3",
      anggaran: BigInt(100_000_000),
    },
  });

  const posPemandian = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunWisata.id,
      sumberDanaId: sdDanaDesa.id,
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Pengembangan Kawasan Wisata Pemandian Air Panas",
      anggaran: BigInt(80_000_000),
    },
  });

  const posCadangan = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunCadangan.id,
      sumberDanaId: sdDanaDesa.id,
      jenisBelanja: JenisBelanja.MODAL,
      uraian: "Pemeliharaan dan Cadangan Pembangunan",
      anggaran: BigInt(39_700_000),
    },
  });

  // Pos ADD
  const posSiltap = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunSiltap.id,
      sumberDanaId: sdAdd.id,
      jenisBelanja: JenisBelanja.PEGAWAI,
      uraian: "Penghasilan Tetap dan Tunjangan Perangkat Desa",
      anggaran: BigInt(150_000_000),
      sensitif: true,
    },
  });

  const posOperasional = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunOperasional.id,
      sumberDanaId: sdAdd.id,
      jenisBelanja: JenisBelanja.BARANG_JASA,
      uraian: "Operasional Perkantoran Desa",
      anggaran: BigInt(60_000_000),
    },
  });

  const posBpd = await prisma.posAnggaran.create({
    data: {
      desaId: desa.id,
      tahun: 2026,
      akunId: akunBpd.id,
      sumberDanaId: sdAdd.id,
      jenisBelanja: JenisBelanja.BARANG_JASA,
      uraian: "Operasional Badan Permusyawaratan Desa (BPD)",
      anggaran: BigInt(40_000_000),
    },
  });

  console.log("Pos anggaran dan referensi akun berhasil dikonfigurasi.");

  // ================= 6. PENGGUNA =================
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

  // ================= 7. KELOMPOK DAN ANGGOTA =================
  const kelompokA = await prisma.kelompok.create({
    data: { nama: "Kelompok Tani Muda", ketuaId: ketuaA.id },
  });
  const kelompokB = await prisma.kelompok.create({
    data: { nama: "CV Karya Warga", ketuaId: ketuaB.id },
  });
  const kelompokC = await prisma.kelompok.create({
    data: { nama: "Kelompok Tukang RT 3", ketuaId: ketuaC.id },
  });

  const wahyuHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  await prisma.anggotaKelompok.createMany({
    data: [
      { kelompokId: kelompokA.id, nama: "Rudi Hermawan", rtRw: "01/02", ketua: true, nikHash: "hash_rudi_001" },
      { kelompokId: kelompokA.id, nama: "Slamet Riyadi", rtRw: "01/02", ketua: false, nikHash: "hash_slamet_002" },
      { kelompokId: kelompokA.id, nama: "Ahmad Dahlan", rtRw: "01/02", ketua: false, nikHash: "hash_ahmad_003" },

      { kelompokId: kelompokB.id, nama: "Joko Widodo", rtRw: "02/03", ketua: true, nikHash: "hash_joko_004" },
      { kelompokId: kelompokB.id, nama: "Hendra Gunawan", rtRw: "02/03", ketua: false, nikHash: "hash_hendra_005" },
      { kelompokId: kelompokB.id, nama: "Wahyu Pratama", rtRw: "02/03", ketua: false, nikHash: wahyuHash },

      { kelompokId: kelompokC.id, nama: "Budi Santoso", rtRw: "03/03", ketua: true, nikHash: "hash_budi_006" },
      { kelompokId: kelompokC.id, nama: "Agus Salim", rtRw: "03/03", ketua: false, nikHash: "hash_agus_007" },
      { kelompokId: kelompokC.id, nama: "Wahyu Pratama", rtRw: "03/03", ketua: false, nikHash: wahyuHash },
    ],
  });

  // ================= 8. PROYEK-PROYEK =================
  // Proyek 1: Drainase RT 3 (TENDER_DIBUKA, belum ada pemenang/komitmen)
  const proyekDrainase = await prisma.proyek.create({
    data: {
      id: "seed_proyek_001",
      desaId: desa.id,
      posAnggaranId: posDrainase.id,
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

  await prisma.rabItem.createMany({
    data: [
      { proyekId: proyekDrainase.id, uraian: "Pekerjaan Galian Tanah Saluran", volume: 250, satuan: "m3", hargaSatuan: BigInt(80_000) },
      { proyekId: proyekDrainase.id, uraian: "Pekerjaan Pasangan Batu Kali Mortar", volume: 150, satuan: "m3", hargaSatuan: BigInt(400_000) },
      { proyekId: proyekDrainase.id, uraian: "Pekerjaan Plesteran & Siaran Saluran", volume: 400, satuan: "m2", hargaSatuan: BigInt(50_000) },
    ],
  });

  // Proyek 2: Balai Warga (PENGERJAAN, progres 50%, termin 0 dan 50 terbuka)
  const proyekBalaiWarga = await prisma.proyek.create({
    data: {
      id: "seed_proyek_002",
      desaId: desa.id,
      posAnggaranId: posBalaiWarga.id,
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

  // Termin Balai Warga (30% - 40% - 30%)
  const terminBalai0 = await prisma.termin.create({
    data: {
      proyekId: proyekBalaiWarga.id,
      tahap: 0,
      nilai: BigInt(41_400_000),
      terbuka: true,
    },
  });
  const terminBalai50 = await prisma.termin.create({
    data: {
      proyekId: proyekBalaiWarga.id,
      tahap: 50,
      nilai: BigInt(55_200_000),
      terbuka: true,
    },
  });
  const terminBalai100 = await prisma.termin.create({
    data: {
      proyekId: proyekBalaiWarga.id,
      tahap: 100,
      nilai: BigInt(41_400_000),
      terbuka: false,
    },
  });

  // Proyek 3: Jalan Setapak Dusun (SELESAI, 100% serah terima)
  const proyekJalanSetapak = await prisma.proyek.create({
    data: {
      id: "seed_proyek_003",
      desaId: desa.id,
      posAnggaranId: posJalanSetapak.id,
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

  const terminJalan1 = await prisma.termin.create({
    data: { proyekId: proyekJalanSetapak.id, tahap: 1, nilai: BigInt(17_400_000), terbuka: true },
  });
  const terminJalan2 = await prisma.termin.create({
    data: { proyekId: proyekJalanSetapak.id, tahap: 2, nilai: BigInt(23_200_000), terbuka: true },
  });
  const terminJalan3 = await prisma.termin.create({
    data: { proyekId: proyekJalanSetapak.id, tahap: 3, nilai: BigInt(17_400_000), terbuka: true },
  });

  // Proyek 4: Pemandian Air Panas (PEMATANGAN)
  await prisma.proyek.create({
    data: {
      id: "seed_proyek_004",
      desaId: desa.id,
      posAnggaranId: posPemandian.id,
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

  // ================= 9. PROPOSAL, SKOR, RINGKASAN, DAN FLAG DRAINASE =================
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

  const templateSpesifikasiTeknis =
    "Pekerjaan dinding penahan dan saluran drainase menggunakan pasangan batu belah tipe 1:4 dengan sistem pengeringan air tanah dan plesteran kedap air ketebalan 15mm. Manajemen material batu belah dipasok dari kuari terdekat dengan kontrol mutu harian.";

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

  // ================= 10. PENULISAN BUKU KAS PUBLIK DENGAN TAMBAHENTRI (BAGIAN 48.1) =================
  console.log("Menulis entri Buku Kas Publik menggunakan rantai hash tambahEntri...");

  // Entri 1: Penyaluran Dana Desa Tahap 1 (Rp600.000.000)
  await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PENERIMAAN,
    jumlah: BigInt(600_000_000),
    tanggal: new Date("2026-01-10T08:00:00.000Z"),
    sumberDanaId: sdDanaDesa.id,
    uraian: "Penyaluran Dana Desa Tahap 1 dari RKUN ke RKD Karang Sari",
    pencatatId: kades.id,
    buktiUrls: ["https://akar-desa.id/bukti/kas_001.pdf"],
    dibuatPada: new Date("2026-01-10T08:00:00.000Z"),
  });

  // Entri 2: Penyaluran ADD Tahap 1 (Rp250.000.000)
  await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PENERIMAAN,
    jumlah: BigInt(250_000_000),
    tanggal: new Date("2026-01-15T09:00:00.000Z"),
    sumberDanaId: sdAdd.id,
    uraian: "Penyaluran ADD Tahap 1 dari Rekening Kas Daerah Kabupaten",
    pencatatId: kades.id,
    buktiUrls: ["https://akar-desa.id/bukti/kas_002.pdf"],
    dibuatPada: new Date("2026-01-15T09:00:00.000Z"),
  });

  // Entri 3: Komitmen Proyek Balai Warga (Rp138.000.000)
  await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.KOMITMEN,
    jumlah: BigInt(138_000_000),
    tanggal: new Date("2026-02-01T10:00:00.000Z"),
    posId: posBalaiWarga.id,
    proyekId: proyekBalaiWarga.id,
    uraian: "Komitmen nilai kontrak penetapan pelaksana Renovasi Gedung Pertemuan Balai Warga",
    pencatatId: kades.id,
    dibuatPada: new Date("2026-02-01T10:00:00.000Z"),
  });

  // Entri 4: Pembayaran Termin 0% (30%) Balai Warga (Rp41.400.000) -> Terverifikasi DISETUJUI
  const eBalaiT0 = await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PEMBAYARAN,
    jumlah: BigInt(41_400_000),
    tanggal: new Date("2026-02-10T11:00:00.000Z"),
    posId: posBalaiWarga.id,
    proyekId: proyekBalaiWarga.id,
    terminId: terminBalai0.id,
    uraian: "Pencairan Termin 0% (Uang Muka 30%) Renovasi Gedung Balai Warga",
    penerima: "Kelompok Pertukangan Balai Makmur",
    penerimaDisamarkan: false,
    buktiUrls: ["https://akar-desa.id/bukti/balai_t0.pdf"],
    pencatatId: kades.id,
    dibuatPada: new Date("2026-02-10T11:00:00.000Z"),
  });

  await prisma.verifikasiEntri.create({
    data: {
      entriId: eBalaiT0.id,
      pengawasId: pengawas.id,
      keputusan: StatusVerifikasi.DISETUJUI,
      catatan: "Uang muka sesuai ketentuan RAB dan SPK kegiatan swakelola",
      waktu: new Date("2026-02-11T09:00:00.000Z"),
    },
  });

  // Entri 5: Pembayaran Termin 50% (40%) Balai Warga (Rp55.200.000) -> Menunggu Verifikasi
  await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PEMBAYARAN,
    jumlah: BigInt(55_200_000),
    tanggal: new Date("2026-03-05T14:30:00.000Z"),
    posId: posBalaiWarga.id,
    proyekId: proyekBalaiWarga.id,
    terminId: terminBalai50.id,
    uraian: "Pencairan Termin 50% (Tahap II 40%) Renovasi Gedung Balai Warga",
    penerima: "Kelompok Pertukangan Balai Makmur",
    penerimaDisamarkan: false,
    buktiUrls: ["https://akar-desa.id/bukti/balai_t50.pdf"],
    pencatatId: kades.id,
    dibuatPada: new Date("2026-03-05T14:30:00.000Z"),
  });
  // (Tanpa catatan VerifikasiEntri = status turunan MENUNGGU)

  // Entri 6: Komitmen Proyek Jalan Setapak (Rp58.000.000)
  await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.KOMITMEN,
    jumlah: BigInt(58_000_000),
    tanggal: new Date("2026-01-20T09:00:00.000Z"),
    posId: posJalanSetapak.id,
    proyekId: proyekJalanSetapak.id,
    uraian: "Komitmen nilai kontrak penetapan swakelola Pavingisasi Jalan Setapak Dusun",
    pencatatId: kades.id,
    dibuatPada: new Date("2026-01-20T09:00:00.000Z"),
  });

  // Entri 7: Pembayaran Termin 1 Jalan Setapak (Rp17.400.000) -> Terverifikasi DISETUJUI
  const eJalanT1 = await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PEMBAYARAN,
    jumlah: BigInt(17_400_000),
    tanggal: new Date("2026-02-05T10:00:00.000Z"),
    posId: posJalanSetapak.id,
    proyekId: proyekJalanSetapak.id,
    terminId: terminJalan1.id,
    uraian: "Pembayaran Termin 1 (30%) Paving Jalan Setapak Dusun Makmur",
    penerima: "Kelompok Swakelola RT 01",
    penerimaDisamarkan: false,
    buktiUrls: ["https://akar-desa.id/bukti/jalan_t1.pdf"],
    pencatatId: kades.id,
    dibuatPada: new Date("2026-02-05T10:00:00.000Z"),
  });
  await prisma.verifikasiEntri.create({
    data: {
      entriId: eJalanT1.id,
      pengawasId: pengawas.id,
      keputusan: StatusVerifikasi.DISETUJUI,
      catatan: "Pekerjaan persiapan dan pemadatan tanah terverifikasi",
      waktu: new Date("2026-02-06T08:00:00.000Z"),
    },
  });

  // Entri 8: Pembayaran Termin 2 Jalan Setapak (Rp23.200.000) -> Terverifikasi DISETUJUI
  const eJalanT2 = await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PEMBAYARAN,
    jumlah: BigInt(23_200_000),
    tanggal: new Date("2026-02-25T13:00:00.000Z"),
    posId: posJalanSetapak.id,
    proyekId: proyekJalanSetapak.id,
    terminId: terminJalan2.id,
    uraian: "Pembayaran Termin 2 (40%) Paving Jalan Setapak Dusun Makmur",
    penerima: "Kelompok Swakelola RT 01",
    penerimaDisamarkan: false,
    buktiUrls: ["https://akar-desa.id/bukti/jalan_t2.pdf"],
    pencatatId: kades.id,
    dibuatPada: new Date("2026-02-25T13:00:00.000Z"),
  });
  await prisma.verifikasiEntri.create({
    data: {
      entriId: eJalanT2.id,
      pengawasId: pengawas.id,
      keputusan: StatusVerifikasi.DISETUJUI,
      catatan: "Pemasangan kanstin dan paving 50% terverifikasi baik",
      waktu: new Date("2026-02-26T10:00:00.000Z"),
    },
  });

  // Entri 9: Pembayaran Termin 3 Jalan Setapak (Rp17.400.000) -> Terverifikasi DISETUJUI (Total = 58jt)
  const eJalanT3 = await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PEMBAYARAN,
    jumlah: BigInt(17_400_000),
    tanggal: new Date("2026-03-20T15:00:00.000Z"),
    posId: posJalanSetapak.id,
    proyekId: proyekJalanSetapak.id,
    terminId: terminJalan3.id,
    uraian: "Pelunasan Termin 3 (30%) Paving Jalan Setapak Dusun Makmur 100% Selesai",
    penerima: "Kelompok Swakelola RT 01",
    penerimaDisamarkan: false,
    buktiUrls: ["https://akar-desa.id/bukti/jalan_t3.pdf"],
    pencatatId: kades.id,
    dibuatPada: new Date("2026-03-20T15:00:00.000Z"),
  });
  await prisma.verifikasiEntri.create({
    data: {
      entriId: eJalanT3.id,
      pengawasId: pengawas.id,
      keputusan: StatusVerifikasi.DISETUJUI,
      catatan: "Serah terima fisik 100% selesai dan diuji fungsi",
      waktu: new Date("2026-03-21T09:00:00.000Z"),
    },
  });

  // Entri 10-12: Tiga Entri Penghasilan Tetap (Sensitif / Disamarkan)
  for (let bulan = 1; bulan <= 3; bulan++) {
    const eSiltap = await tambahEntri(prisma, {
      desaId: desa.id,
      jenis: JenisEntri.PEMBAYARAN,
      jumlah: BigInt(50_000_000),
      tanggal: new Date(`2026-0${bulan}-28T10:00:00.000Z`),
      posId: posSiltap.id,
      uraian: `Penyaluran Penghasilan Tetap dan Tunjangan Aparatur Desa Bulan ${bulan}`,
      penerima: "Penerima Perorangan Aparatur Desa",
      penerimaDisamarkan: true,
      buktiUrls: [`https://akar-desa.id/bukti/siltap_bln_${bulan}.pdf`],
      pencatatId: kades.id,
      dibuatPada: new Date(`2026-0${bulan}-28T10:00:00.000Z`),
    });
    await prisma.verifikasiEntri.create({
      data: {
        entriId: eSiltap.id,
        pengawasId: pengawas.id,
        keputusan: StatusVerifikasi.DISETUJUI,
        catatan: `Slip payroll dan daftar tanda terima Siltap bulan ${bulan} lengkap`,
        waktu: new Date(`2026-0${bulan}-28T16:00:00.000Z`),
      },
    });
  }

  // Entri 13: Entri Operasional dengan Kesalahan Jumlah
  const eOpsSalah = await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PEMBAYARAN,
    jumlah: BigInt(25_000_000),
    tanggal: new Date("2026-02-15T11:00:00.000Z"),
    posId: posOperasional.id,
    uraian: "Belanja ATK dan konsumsi Musyawarah Perencanaan Desa (salah rekap kuitansi)",
    penerima: "Toko ATK Berkah Mandiri",
    penerimaDisamarkan: false,
    buktiUrls: ["https://akar-desa.id/bukti/ops_salah.pdf"],
    pencatatId: kades.id,
    dibuatPada: new Date("2026-02-15T11:00:00.000Z"),
  });

  // Entri 14: KOREKSI atas Entri 13
  await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.KOREKSI,
    jumlah: BigInt(25_000_000),
    tanggal: new Date("2026-02-16T09:00:00.000Z"),
    posId: posOperasional.id,
    koreksiDariId: eOpsSalah.id,
    uraian: "KOREKSI: Pembatalan entri operasional nomor 13 karena duplikasi nota belanja konsumsi",
    pencatatId: kades.id,
    dibuatPada: new Date("2026-02-16T09:00:00.000Z"),
  });

  // Entri 15: Entri Operasional Pengganti dengan Jumlah Benar (Rp20.000.000)
  const eOpsBenar = await tambahEntri(prisma, {
    desaId: desa.id,
    jenis: JenisEntri.PEMBAYARAN,
    jumlah: BigInt(20_000_000),
    tanggal: new Date("2026-02-16T10:00:00.000Z"),
    posId: posOperasional.id,
    uraian: "Belanja ATK dan konsumsi Musyawarah Perencanaan Desa (nilai rekonsiliasi faktur)",
    penerima: "Toko ATK Berkah Mandiri",
    penerimaDisamarkan: false,
    buktiUrls: ["https://akar-desa.id/bukti/ops_benar.pdf"],
    pencatatId: kades.id,
    dibuatPada: new Date("2026-02-16T10:00:00.000Z"),
  });
  await prisma.verifikasiEntri.create({
    data: {
      entriId: eOpsBenar.id,
      pengawasId: pengawas.id,
      keputusan: StatusVerifikasi.DISETUJUI,
      catatan: "Koreksi faktur telah diperiksa dan disetujui",
      waktu: new Date("2026-02-16T14:00:00.000Z"),
    },
  });

  console.log("Seeding data awal dan Buku Kas Publik berhasil diselesaikan dengan rantai hash valid!");
}

main()
  .catch((e) => {
    console.error("Kesalahan saat menjalankan seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
