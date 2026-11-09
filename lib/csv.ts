/**
 * /lib/csv.ts
 * Generator CSV murni yang patuh pada spesifikasi RFC 4180.
 * Menjamin escaping tanda kutip ganda, koma, dan karakter baris baru.
 */

export interface CsvColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
}

/**
 * Mengubah nilai tunggal menjadi representasi sel CSV yang aman sesuai RFC 4180.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (typeof value === "bigint") {
    str = value.toString();
  } else if (typeof value === "object") {
    str = JSON.stringify(value);
  } else {
    str = String(value);
  }

  // Cek apakah sel membutuhkan tanda kutip pembungkus
  const needsQuotes =
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r");

  if (needsQuotes) {
    // Gandakan setiap tanda kutip ganda di dalam nilai: " -> ""
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Mengonversi array objek data menjadi string CSV dengan header.
 *
 * @param data Array objek data baris
 * @param columns Definisi kolom (kunci properti dan label judul header)
 * @returns Teks CSV lengkap dengan baris header dan baris data (pemisah CRLF)
 */
export function generateCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[]
): string {
  const headerLine = columns
    .map((col) => escapeCsvCell(col.header))
    .join(",");

  const rowLines = data.map((row) =>
    columns
      .map((col) => {
        const val = row[col.key as keyof T];
        return escapeCsvCell(val);
      })
      .join(",")
  );

  return [headerLine, ...rowLines].join("\r\n");
}

