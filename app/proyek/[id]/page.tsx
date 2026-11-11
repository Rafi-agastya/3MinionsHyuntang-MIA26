import * as React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ProjectDetailHeader } from "@/components/proyek/project-detail-header";
import { ProjectTimeline } from "@/components/proyek/project-timeline";
import { ProjectSummaryCards } from "@/components/proyek/project-summary-cards";
import { ProjectTabs } from "@/components/proyek/project-tabs";
import { getProyekDetail } from "@/lib/proyek-api";
import { getMockProjectById } from "@/components/proyek/mock-detail-data";

interface ProyekDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProyekDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const proyek = await getProyekDetail(id);

    return {
      title: `${proyek.judul} | AKAR Transparansi Desa`,
      description: proyek.deskripsi,
    };
  } catch {
    const fallback = getMockProjectById(id);
    return {
      title: `${fallback.judul} | AKAR Transparansi Desa`,
      description: fallback.deskripsi,
    };
  }
}

export default async function ProyekDetailPage({
  params,
}: ProyekDetailPageProps) {
  const { id } = await params;
  let proyek;
  try {
    proyek = await getProyekDetail(id);
  } catch (error) {
    console.warn(`[ProyekDetailPage] Backend API fetch failed for id '${id}', falling back to mock data:`, error);
    proyek = getMockProjectById(id);
  }

  if (!proyek) {
    proyek = getMockProjectById(id);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-zinc-900 font-sans">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* FRAME 1: Ringkasan Proyek & Timeline */}
        <section
          id="detail-frame-1"
          aria-label="Ringkasan & Timeline Proyek"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full space-y-5 md:space-y-6">
            {/* Header & Status Action Banner */}
            <ProjectDetailHeader proyek={proyek} />

            {/* Horizontal Project Stepper Timeline */}
            <ProjectTimeline currentStatus={proyek.status} />

            {/* Quick Summary Metric Cards (4 Cards) */}
            <ProjectSummaryCards
              pagu={proyek.pagu}
              durasiMin={proyek.durasiMin}
              durasiMax={proyek.durasiMax}
              syaratLokalMin={proyek.syaratLokalMin}
              proposalCount={proyek.proposals.length}
              sumberDana={proyek.sumberDana}
            />
          </div>
        </section>

        {/* FRAME 2: Interactive Tabs (Papan Skor AI, Teknis, Micro-RAB, Timeline/Audit) */}
        <section
          id="detail-frame-2"
          aria-label="Papan Skor AI dan Rincian Teknis"
          className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 border-t border-zinc-200/80"
        >
          <div className="max-w-7xl mx-auto w-full flex flex-col justify-start">
            <ProjectTabs proyek={proyek} initialTab="proposal" />
          </div>
        </section>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
