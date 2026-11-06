import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { serializeBigInt } from "./prisma";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "AI_FAILED"
  | "INTERNAL";

export const HTTP_STATUS_MAP: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  AI_FAILED: 502,
  INTERNAL: 500,
};

export interface ApiResponseSuccess<T> {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
}

export interface ApiResponseError {
  data: null;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public fields?: Record<string, unknown>,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status ?? HTTP_STATUS_MAP[code];
  }
}

/**
 * Format error Zod menjadi Record per kolom/field
 */
export function formatZodError(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!fields[key]) {
      fields[key] = [];
    }
    fields[key].push(issue.message);
  }
  return fields;
}

/**
 * Helper untuk response API sukses dengan format seragam { data, error: null, meta }
 */
export function ok<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiResponseSuccess<T>> {
  const payload: ApiResponseSuccess<T> = {
    data: serializeBigInt(data),
    error: null,
  };
  if (meta) {
    payload.meta = meta;
  }
  return NextResponse.json(payload, { status });
}

/**
 * Helper untuk response API galat dengan format seragam { data: null, error: { code, message, fields } }
 */
export function fail(
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, unknown>,
  status?: number
): NextResponse<ApiResponseError> {
  const httpStatus = status ?? HTTP_STATUS_MAP[code] ?? 500;
  const payload: ApiResponseError = {
    data: null,
    error: {
      code,
      message,
      ...(fields && Object.keys(fields).length > 0 ? { fields } : {}),
    },
  };
  return NextResponse.json(payload, { status: httpStatus });
}

/**
 * Wrapper handler API route Next.js:
 * Menangkap ZodError (mengubah ke VALIDATION_ERROR 400), ApiError, dan kesalahan internal tak terduga.
 */
export function apiHandler<C = unknown>(
  fn: (req: Request, context: C) => Promise<NextResponse>
) {
  return async (req: Request, context: C): Promise<NextResponse> => {
    try {
      return await fn(req, context);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return fail(
          "VALIDATION_ERROR",
          "Data yang dikirim tidak memenuhi validasi skema.",
          formatZodError(error),
          400
        );
      }

      if (error instanceof ApiError) {
        return fail(error.code, error.message, error.fields, error.status);
      }

      console.error("[API_INTERNAL_ERROR]", error);
      return fail(
        "INTERNAL",
        "Terjadi kesalahan tak terduga pada server desa.",
        undefined,
        500
      );
    }
  };
}
