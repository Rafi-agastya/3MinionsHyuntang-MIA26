/**
 * /lib/kas-ringkasan.ts
 * Logika perhitungan agregasi angka Buku Kas sesuai PRD Bagian 42.2 & 48.2.
 */

import {
  EntriKas,
  PosAnggaran,
  SumberDana,
  VerifikasiEntri,
  StatusVerifikasi,
  JenisEntri,
  RefAkun,
} from "@prisma/client";

export interface RingkasanPos {
  posId: string;
  uraian: string;
  dianggarkan: number;
  terikat: number;
  terealisasi: number;
  menungguVerifikasi: number;
  tersedia: number;
}

export interface RingkasanSumberDana {
  id: string;
  nama: string;
  pagu: number;
  diterima: number;
  belumCair: number;
}

export interface RingkasanBidang {
  kode: string;
  nama: string;
  dianggarkan: number;
  terikat: number;
  terealisasi: number;
  menungguVerifikasi: number;
  tersedia: number;
}

export interface RingkasanTotal {
  dianggarkan: number;
  terikat: number;
  terealisasi: number;
  menungguVerifikasi: number;
  tersedia: number;
  diterima: number;
  kasTersediaUntukDibayar: number;
}

export interface RingkasanKasDesa {
  sumberDana: RingkasanSumberDana[];
  total: RingkasanTotal;
  perPos: Record<string, RingkasanPos>;
  perBidang: RingkasanBidang[];
  hashTerakhir: string | null;
  diperbaruiPada: string;
}

export interface EntriWithVerifikasi extends EntriKas {
  verifikasi?: VerifikasiEntri[];
  pos?: (PosAnggaran & { akun?: RefAkun | null }) | null;
}

/**
 * Menentukan status verifikasi turunan dari catatan VerifikasiEntri terakhir.
 */
export function getStatusVerifikasiEntri(
  verifikasiList?: VerifikasiEntri[]
): StatusVerifikasi {
  if (!verifikasiList || verifikasiList.length === 0) {
    return StatusVerifikasi.MENUNGGU;
  }
  const sorted = [...verifikasiList].sort(
    (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime()
  );
  return sorted[0].keputusan;
}

/**
 * Menghitung ringkasan Buku Kas secara menyeluruh dari data pos, sumber dana, dan entri kas.
 */
export function hitungRingkasanKas({
  sumberDanaList,
  posList,
  entriList,
  bidangList = [],
}: {
  sumberDanaList: SumberDana[];
  posList: Array<
    PosAnggaran & {
      akun?: (RefAkun & { parent?: (RefAkun & { parent?: RefAkun | null }) | null }) | null;
    }
  >;
  entriList: EntriWithVerifikasi[];
  bidangList?: RefAkun[];
}): RingkasanKasDesa {
  // 1. Identifikasi entri yang dikoreksi (dinetralkan)
  const koreksiTargets = new Set<string>();
  for (const e of entriList) {
    if (e.jenis === JenisEntri.KOREKSI && e.koreksiDariId) {
      koreksiTargets.add(e.koreksiDariId);
    }
  }

  // Filter entri aktif (bukan KOREKSI dan belum dikoreksi oleh entri KOREKSI lain)
  const entriAktif = entriList.filter(
    (e) => e.jenis !== JenisEntri.KOREKSI && !koreksiTargets.has(e.id)
  );

  // 2. Hitung per Sumber Dana
  const ringkasanSumberDana: RingkasanSumberDana[] = sumberDanaList.map((sd) => {
    const diterima = entriAktif
      .filter(
        (e) => e.jenis === JenisEntri.PENERIMAAN && e.sumberDanaId === sd.id
      )
      .reduce((acc, e) => acc + Number(e.jumlah), 0);

    const pagu = Number(sd.pagu);
    const belumCair = pagu - diterima;

    return {
      id: sd.id,
      nama: sd.nama,
      pagu,
      diterima,
      belumCair,
    };
  });

  // Total penerimaan kas yang masuk
  const totalDiterima = ringkasanSumberDana.reduce(
    (acc, sd) => acc + sd.diterima,
    0
  );

  // 3. Hitung per Pos Anggaran
  const perPos: Record<string, RingkasanPos> = {};

  for (const pos of posList) {
    const dianggarkan = Number(pos.anggaran);

    // Komitmen pada pos ini
    const terikat = entriAktif
      .filter((e) => e.jenis === JenisEntri.KOMITMEN && e.posId === pos.id)
      .reduce((acc, e) => acc + Number(e.jumlah), 0);

    // Pembayaran yang sudah disetujui
    const terealisasi = entriAktif
      .filter((e) => {
        if (e.jenis !== JenisEntri.PEMBAYARAN || e.posId !== pos.id) return false;
        const status = getStatusVerifikasiEntri(e.verifikasi);
        return status === StatusVerifikasi.DISETUJUI;
      })
      .reduce((acc, e) => acc + Number(e.jumlah), 0);

    // Pembayaran yang menunggu verifikasi (tidak termasuk yang ditolak)
    const menungguVerifikasi = entriAktif
      .filter((e) => {
        if (e.jenis !== JenisEntri.PEMBAYARAN || e.posId !== pos.id) return false;
        const status = getStatusVerifikasiEntri(e.verifikasi);
        return status === StatusVerifikasi.MENUNGGU;
      })
      .reduce((acc, e) => acc + Number(e.jumlah), 0);

    const tersedia = dianggarkan - terikat;

    perPos[pos.id] = {
      posId: pos.id,
      uraian: pos.uraian,
      dianggarkan,
      terikat,
      terealisasi,
      menungguVerifikasi,
      tersedia,
    };
  }

  // 4. Hitung Total Global Kas
  const totalDianggarkan = Object.values(perPos).reduce(
    (acc, p) => acc + p.dianggarkan,
    0
  );
  const totalTerikat = Object.values(perPos).reduce(
    (acc, p) => acc + p.terikat,
    0
  );
  const totalTerealisasi = Object.values(perPos).reduce(
    (acc, p) => acc + p.terealisasi,
    0
  );
  const totalMenungguVerifikasi = Object.values(perPos).reduce(
    (acc, p) => acc + p.menungguVerifikasi,
    0
  );
  const totalTersedia = totalDianggarkan - totalTerikat;

  // Kas tersedia untuk dibayar = Dana diterima − Terealisasi − Menunggu verifikasi
  const kasTersediaUntukDibayar =
    totalDiterima - totalTerealisasi - totalMenungguVerifikasi;

  const total: RingkasanTotal = {
    dianggarkan: totalDianggarkan,
    terikat: totalTerikat,
    terealisasi: totalTerealisasi,
    menungguVerifikasi: totalMenungguVerifikasi,
    tersedia: totalTersedia,
    diterima: totalDiterima,
    kasTersediaUntukDibayar,
  };

  // 5. Hitung per Bidang
  // Petakan setiap pos ke bidang induknya
  const perBidangMap = new Map<string, RingkasanBidang>();

  // Inisialisasi dari bidangList
  for (const b of bidangList) {
    perBidangMap.set(b.id, {
      kode: b.kode,
      nama: b.uraian,
      dianggarkan: 0,
      terikat: 0,
      terealisasi: 0,
      menungguVerifikasi: 0,
      tersedia: 0,
    });
  }

  for (const pos of posList) {
    const rPos = perPos[pos.id];
    if (!rPos) continue;

    // Cari bidang: pos -> akun (kegiatan) -> parent (sub-bidang) -> parent (bidang)
    let bidang = pos.akun?.parent?.parent ?? pos.akun?.parent ?? pos.akun;
    if (bidang && bidang.level !== "BIDANG" && pos.akun?.parent?.parent) {
      bidang = pos.akun.parent.parent;
    }

    const bidangId = bidang?.id || "lainnya";
    let bSummary = perBidangMap.get(bidangId);
    if (!bSummary) {
      bSummary = {
        kode: bidang?.kode || "-",
        nama: bidang?.uraian || "Bidang Lainnya",
        dianggarkan: 0,
        terikat: 0,
        terealisasi: 0,
        menungguVerifikasi: 0,
        tersedia: 0,
      };
      perBidangMap.set(bidangId, bSummary);
    }

    bSummary.dianggarkan += rPos.dianggarkan;
    bSummary.terikat += rPos.terikat;
    bSummary.terealisasi += rPos.terealisasi;
    bSummary.menungguVerifikasi += rPos.menungguVerifikasi;
    bSummary.tersedia += rPos.tersedia;
  }

  const perBidang = Array.from(perBidangMap.values());

  // 6. Ambil hash terakhir dari entri terakhir
  const sortedEntries = [...entriList].sort((a, b) => a.nomorUrut - b.nomorUrut);
  const hashTerakhir =
    sortedEntries.length > 0
      ? sortedEntries[sortedEntries.length - 1].hash
      : null;

  return {
    sumberDana: ringkasanSumberDana,
    total,
    perPos,
    perBidang,
    hashTerakhir,
    diperbaruiPada: new Date().toISOString(),
  };
}

