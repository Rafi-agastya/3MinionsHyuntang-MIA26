import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusProyek } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetId = id === "seed_proyek_001" || id === "proj-drainase-rt3" ? "seed_proyek_001" : id;

    // 1. Update status proyek ke TENDER_DIBUKA dan perpanjang tenggat 14 hari
    const proyek = await prisma.proyek.update({
      where: { id: targetId },
      data: {
        status: StatusProyek.TENDER_DIBUKA,
        tenggatProposal: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        judul: true,
        status: true,
        tenggatProposal: true,
      },
    });

    // 2. Bersihkan keputusan penetapan pemenang lama jika ada
    await prisma.keputusan.deleteMany({
      where: {
        proposal: {
          proyekId: targetId,
        },
      },
    });

    return NextResponse.json({
      data: {
        proyek,
        message: `Proyek '${proyek.judul}' (ID: ${proyek.id}) berhasil direset ke status TENDER_DIBUKA.`,
      },
      error: null,
    });
  } catch (error) {
    console.error("[ResetProyekAPI] Error resetting proyek:", error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Gagal mereset status proyek.",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return GET(req, context);
}

