/**
 * /lib/hooks.ts
 * Hook events untuk integrasi antar domain (misalnya dengan Buku Kas di BE-6).
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export async function onKomitmenDibuat(
  _proyekId: string,
  _proposalId: string,
  _nilai: bigint | number
): Promise<void> {
  // Placeholder kosong: akan dihubungkan ke pencatatan KOMITMEN Buku Kas pada BE-6
}

export async function onProyekDibatalkan(
  _proyekId: string,
  _alasan: string
): Promise<void> {
  // Placeholder kosong: akan dihubungkan ke pencatatan KOREKSI Buku Kas pada BE-6
}
