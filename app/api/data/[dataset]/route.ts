import { NextResponse } from "next/server";
import { apiHandler, ok, ApiError } from "@/lib/api";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateCsv } from "@/lib/csv";
import {
  getDatasetPayload,
  isValidDataset,
  VALID_DATASETS,
} from "@/lib/open-data";

export const GET = apiHandler(
  async (
    req: Request,
    { params }: { params: Promise<{ dataset: string }> }
  ) => {
    const { dataset } = await params;

    // 1. Validasi dataset yang diminta
    if (!isValidDataset(dataset)) {
      throw new ApiError(
        "NOT_FOUND",
        `Dataset '${dataset}' tidak ditemukan. Dataset publik yang valid: ${VALID_DATASETS.join(
          ", "
        )}`
      );
    }

    // 2. Pembatasan laju permintaan (Rate Limit 60 per menit per IP - PRD 35.4)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`data:${clientIp}`, 60, 60_000);

    if (!rateCheck.allowed) {
      throw new ApiError(
        "RATE_LIMITED",
        "Batas permintaan unduh data terlampaui (maksimal 60 per menit per IP). Silakan tunggu sebentar sebelum mencoba kembali.",
        undefined,
        429
      );
    }

    // 3. Baca parameter format (csv atau json)
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "json").toLowerCase();

    if (format !== "json" && format !== "csv") {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Format tidak didukung. Format yang tersedia: 'json' atau 'csv'"
      );
    }

    const desaId = url.searchParams.get("desaId") || undefined;
    const payload = await getDatasetPayload(dataset, desaId);
    const dateStr = new Date().toISOString().split("T")[0];

    // Header Cache-Control singkat (60 detik) untuk endpoint data terbuka
    const cacheHeader =
      "public, max-age=60, s-maxage=60, stale-while-revalidate=30";

    // 4. Keluaran format CSV (RFC 4180)
    if (format === "csv") {
      const csvString = generateCsv(payload.data, payload.columns);

      return new NextResponse(csvString, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${dataset}-${dateStr}.csv"`,
          "Cache-Control": cacheHeader,
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": String(rateCheck.remaining),
        },
      });
    }

    // 5. Keluaran format JSON seragam { data, error: null, meta }
    const res = ok(payload.data, {
      dataset: payload.dataset,
      total: payload.total,
      tanggalPembaruan: payload.tanggalPembaruan,
      lisensi: payload.lisensi,
      format: "json",
    });

    res.headers.set("Cache-Control", cacheHeader);
    res.headers.set("X-RateLimit-Limit", "60");
    res.headers.set("X-RateLimit-Remaining", String(rateCheck.remaining));

    return res;
  }
);

