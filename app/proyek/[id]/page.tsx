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
    <div className="min-h-screen bg-[#FAFAF7] bg-[radial-gradient(#1F6F43_0.6px,transparent_0.6px)] [background-size:24px_24px] text-zinc-900 flex flex-col antialiased selection:bg-[#1F6F43] selection:text-white font-sans">
      {/* Global Header Navigation */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* 1. Header & Status Action Banner */}
          <ProjectDetailHeader proyek={proyek} />

          {/* 2. Horizontal Project Stepper Timeline */}
          <ProjectTimeline currentStatus={proyek.status} />

          {/* 3. Quick Summary Metric Cards (4 Cards) */}
          <ProjectSummaryCards
            pagu={proyek.pagu}
            durasiMin={proyek.durasiMin}
            durasiMax={proyek.durasiMax}
            syaratLokalMin={proyek.syaratLokalMin}
            proposalCount={proyek.proposals.length}
            sumberDana={proyek.sumberDana}
          />

          {/* 4. Interactive Tabs: Papan Skor AI, Teknis, Micro-RAB, Timeline/Audit */}
          <ProjectTabs proyek={proyek} initialTab="proposal" />
        </div>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
