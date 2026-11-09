# Kamus Data Terbuka (Open Data Dictionary) Platform AKAR

> **Lisensi Data:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)  
> **Tanggal Pembaruan Terakhir:** 7 November 2026  
> **Penyedia Data:** Pemerintah Desa Karang Sari melalui Platform AKAR (Aspirasi, Keterbukaan, Aksi, dan Realisasi)  
> **Endpoint Akses API:** `GET /api/data/:dataset?format=json|csv`  
> **Ketentuan Privasi (FR-ID1 & T10):** Seluruh dataset publik dijamin bebas dari NIK (Nomor Induk Kependudukan), hash NIK, data pribadi perorangan, dan identitas pelapor anonim.

---

## 1. Dataset: Anggaran APBDes (`anggaran`)
Menampilkan rincian pos anggaran pendapatan dan belanja desa (APBDes), penyerapan komitmen sayembara/kontrak, dan realisasi pembayaran per pos kegiatan.

| Nama Kolom | Tipe Data | Deskripsi | Contoh Nilai |
|---|---|---|---|
| `tahun` | Integer | Tahun anggaran APBDes | `2026` |
| `kode_bidang` | String | Kode klasifikasi bidang pemerintahan/pembangunan | `2` atau `02` |
| `nama_bidang` | String | Nama bidang sesuai standar regulasi desa | `Bidang Pelaksanaan Pembangunan Desa` |
| `kode_kegiatan` | String | Kode rekening kegiatan Siskeudes | `2.3.01` |
| `uraian` | String | Uraian kegiatan pos anggaran | `Pembangunan Balai Pertemuan Warga` |
| `sumber_dana` | String | Asal sumber dana APBDes | `Dana Desa (DDS)` |
| `jenis_belanja` | String | Klasifikasi jenis belanja (`PEGAWAI`, `BARANG_JASA`, `MODAL`, `TAK_TERDUGA`) | `MODAL` |
| `anggaran` | Number (IDR) | Total pagu dana yang dianggarkan pada pos ini | `140000000` |
| `terikat` | Number (IDR) | Total dana yang telah terikat dalam komitmen kontrak sayembara/vendor | `135000000` |
| `terealisasi` | Number (IDR) | Total dana yang telah dibayarkan dan disetujui pengawas | `70000000` |
| `sisa_anggaran` | Number (IDR) | Sisa anggaran yang masih tersedia untuk dialokasikan (`anggaran - terikat`) | `5000000` |

---

## 2. Dataset: Daftar Proyek & Sayembara (`proyek`)
Menampilkan direktori proyek pembangunan fisik dan non-fisik desa baik yang melalui jalur Sayembara Swakelola Warga maupun Jalur Vendor/Pengadaan.

| Nama Kolom | Tipe Data | Deskripsi | Contoh Nilai |
|---|---|---|---|
| `id` | String | Pengenal unik proyek | `proyek_balai_1` |
| `judul` | String | Nama atau judul paket proyek sayembara | `Pembangunan Balai Pertemuan RW 02` |
| `deskripsi` | String | Deskripsi atau latar belakang paket pekerjaan | `Fasilitas musyawarah warga RW 02` |
| `lokasi` | String | Lokasi fisik pelaksanaan pekerjaan di desa | `Dusun Krajan RW 02` |
| `kelas` | String | Klasifikasi skala teknis proyek (`SEDERHANA`, `MENENGAH`, `KOMPLEKS`) | `SEDERHANA` |
| `pagu` | Number (IDR) | Batas maksimal pagu anggaran RAB proyek | `140000000` |
| `status` | String | Status tahapan siklus hidup proyek (`PEMATANGAN`, `TENDER_DIBUKA`, `PENGERJAAN`, `SELESAI`, `DIBATALKAN`, dll.) | `TENDER_DIBUKA` |
| `jalur` | String | Jalur pelaksanaan pekerjaan (`SAYEMBARA` atau `VENDOR`) | `SAYEMBARA` |
| `durasi_min` | Integer | Batas minimal durasi pengerjaan (dalam hari kalender) | `30` |
| `durasi_max` | Integer | Batas maksimal durasi pengerjaan (dalam hari kalender) | `90` |
| `syarat_lokal_min` | Integer | Persentase minimal kewajiban penyerapan tenaga kerja lokal (%) | `70` |
| `tanggal_dibuat` | Date (ISO) | Tanggal paket proyek pertama kali dibuat/dipublikasikan | `2026-11-01` |

---

## 3. Dataset: Realisasi & Ambang Termin (`termin`)
Menampilkan tahapan pencairan termin pengerjaan proyek dan status keterbukaan pencairannya oleh Badan Permusyawaratan Desa (BPD) / Pengawas.

| Nama Kolom | Tipe Data | Deskripsi | Contoh Nilai |
|---|---|---|---|
| `proyek_id` | String | Pengenal unik proyek induk | `proyek_balai_1` |
| `judul_proyek` | String | Nama/judul proyek terkait | `Pembangunan Balai Pertemuan RW 02` |
| `tahap` | Integer | Urutan tahapan termin (1: Uang Muka, 2: Progres 50%, 3: Selesai 100%) | `1` |
| `nilai` | Number (IDR) | Nominal pencairan dana pada termin tersebut | `70000000` |
| `terbuka` | Boolean | Status verifikasi pengawas apakah termin sudah dibuka untuk dicairkan (`true`/`false`) | `true` |

---

## 4. Dataset: Buku Kas Publik (`kas`)
Menampilkan buku kas umum desa berbasis ledger append-only dengan rantai kriptografi SHA-256 anti-manipulasi.

> **Catatan Penyamaran (FR-O8 & FR-OD1):**  
> 1. Nama penerima perorangan (tukang, buruh, warga) disamarkan menjadi `"Penerima Perorangan (Disamarkan)"` untuk melindungi privasi warga.  
> 2. Uraian pos belanja berkategori sensitif (mis. Siltap kepala desa dan aparatur) disamarkan menjadi `"Belanja Pos Sensitif (Disamarkan)"`.  
> 3. NIK atau hash NIK tidak pernah disertakan.

| Nama Kolom | Tipe Data | Deskripsi | Contoh Nilai |
|---|---|---|---|
| `nomor_urut` | Integer | Nomor urut transaksi berurutan mutlak | `1` |
| `tanggal` | Date (ISO) | Tanggal transaksi kas dicatat | `2026-11-02` |
| `jenis` | String | Jenis entri kas (`PENERIMAAN`, `KOMITMEN`, `PEMBAYARAN`, `KOREKSI`) | `PEMBAYARAN` |
| `jumlah` | Number (IDR) | Nominal transaksi kas | `70000000` |
| `uraian` | String | Uraian transaksi (sudah disamarkan jika pos sensitif) | `Pencairan dana Termin 1 Sayembara Balai RW 02` |
| `penerima` | String | Pihak penerima transaksi (sudah disamarkan jika perorangan) | `Kelompok Warga RT 03` |
| `sumber_dana` | String | Sumber dana kas | `Dana Desa (DDS)` |
| `pos_anggaran` | String | Pos rekening kegiatan APBDes | `Balai warga` |
| `judul_proyek` | String | Judul proyek terkait (jika ada) | `Pembangunan Balai Pertemuan RW 02` |
| `hash` | String | Hash kriptografi SHA-256 rantai integritas | `a8f3b2c1d4...` |
| `status_verifikasi` | String | Status persetujuan pengawas BPD (`MENUNGGU`, `DISETUJUI`, `DITOLAK`) | `DISETUJUI` |

---

## 5. Dataset: Statistik Tiket Aduan & Aspirasi Agregat (`tiket-agregat`)
Menampilkan ringkasan statistik agregat dari aduan masyarakat dan pengawasan proyek tanpa mengungkap isi aduan pribadi atau identitas pelapor anonim (FR-OD1 & T10).

| Nama Kolom | Tipe Data | Deskripsi | Contoh Nilai |
|---|---|---|---|
| `kategori` | String | Kategori aduan (`DUGAAN_PENYIMPANGAN`, `KERUSAKAN`, `KETERLAMBATAN`, `LAINNYA`) | `DUGAAN_PENYIMPANGAN` |
| `jumlah_total` | Integer | Total tiket yang masuk dalam kategori ini | `12` |
| `status_baru` | Integer | Jumlah tiket yang berstatus BARU | `2` |
| `status_ditinjau` | Integer | Jumlah tiket yang sedang DITINJAU perangkat/pengawas | `3` |
| `status_ditanggapi` | Integer | Jumlah tiket yang telah DITANGGAPI resmi | `4` |
| `status_selesai` | Integer | Jumlah tiket yang penanganannya telah SELESAI | `3` |
| `rata_rata_hari_tanggapan` | Number (Hari) | Rata-rata waktu tanggapan oleh pemerintah desa (dalam hari) | `4.2` |

