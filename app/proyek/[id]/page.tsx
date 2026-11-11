import * as React from "react";
import { Metadata } from "next";
import { ArrowDown } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SlideIndicator } from "@/components/slide-indicator";
import { ProjectDetailHeader } from "@/components/proyek/project-detail-header";
import { ProjectTimeline } from "@/components/proyek/project-timeline";
import { ProjectSummaryCards } from "@/components/proyek/project-summary-cards";
import { ProjectTabs } from "@/components/proyek/project-tabs";
import { getProyekDetail } from "@/lib/proyek-api";
import { getMockProjectById } from "@/components/proyek/mock-detail-data";

const detailSlides = [
  { id: "detail-frame-1", label: "Ringkasan Proyek" },
  { id: "detail-frame-2", label: "Papan Skor & Rincian" },
  { id: "detail-frame-footer", label: "Transparansi" },
];

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
    <>
      <Navbar />

      <main className="h-[calc(100dvh-64px)] mt-16 overflow-y-auto snap-y snap-proximity scroll-smooth bg-[#FAFAF7] text-zinc-900 antialiased selection:bg-[#1F6F43] selection:text-white font-sans relative">
        {/* Desktop Dot Pagination */}
        <SlideIndicator slides={detailSlides} />

        {/* FRAME 1: Ringkasan Proyek & Timeline */}
        <section
          id="detail-frame-1"
          aria-label="Ringkasan & Timeline Proyek"
          className="min-h-[calc(100dvh-64px)] snap-start flex flex-col py-6 md:py-10 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full space-y-5 md:space-y-6 my-auto">
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

            {/* Helper Jump Action Button */}
            <div className="pt-2 flex justify-start">
              <a
                href="#detail-frame-2"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white border border-zinc-200/90 shadow-sm text-sm font-semibold text-[#1F6F43] hover:bg-emerald-50/50 hover:border-[#1F6F43]/30 transition-all min-h-[44px]"
              >
                <span>Lihat Papan Skor AI & Rincian Teknis</span>
                <ArrowDown className="w-4 h-4 text-[#1F6F43] animate-bounce" />
              </a>
            </div>
          </div>
        </section>

        {/* FRAME 2: Interactive Tabs (Papan Skor AI, Teknis, Micro-RAB, Timeline/Audit) */}
        <section
          id="detail-frame-2"
          aria-label="Papan Skor AI dan Rincian Teknis"
          className="min-h-[calc(100dvh-64px)] snap-start flex flex-col py-8 md:py-12 pb-16 px-4 sm:px-6 lg:px-8"
        >
          <div className="max-w-7xl mx-auto w-full flex flex-col justify-start">
            <ProjectTabs proyek={proyek} initialTab="proposal" />
          </div>
        </section>

        {/* FRAME 3: Footer Snap End */}
        <div
          id="detail-frame-footer"
          aria-label="Informasi Footer"
          className="snap-end w-full"
        >
          <Footer />
        </div>
      </main>
    </>
  );
}
