"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  HardHat,
  CheckCircle2,
  MapPin,
  Tag,
  User,
  ThumbsUp,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectPreview, CommunityIdeaPreview } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/format";

interface LandingProjectsIdeasProps {
  projects: ProjectPreview[];
  ideas: CommunityIdeaPreview[];
}

type FilterCategory = "SEMUA" | "TENDER_DIBUKA" | "PENGERJAAN" | "SELESAI" | "IDE";

export function LandingProjectsIdeas({ projects, ideas }: LandingProjectsIdeasProps) {
  const [activeFilter, setActiveFilter] = React.useState<FilterCategory>("SEMUA");
  const [supportedIdeas, setSupportedIdeas] = React.useState<Record<string, boolean>>({});
  const [voteCounts, setVoteCounts] = React.useState<Record<string, number>>(() =>
    ideas.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.jumlahDukungan }), {})
  );

  const toggleSupport = (id: string) => {
    setSupportedIdeas((prev) => {
      const isCurrentlySupported = !!prev[id];
      const newStatus = !isCurrentlySupported;
      setVoteCounts((counts) => ({
        ...counts,
        [id]: (counts[id] || 0) + (newStatus ? 1 : -1),
      }));
      return { ...prev, [id]: newStatus };
    });
  };

  const filteredProjects = React.useMemo(() => {
    if (activeFilter === "IDE") return [];
    if (activeFilter === "SEMUA") return projects;
    if (activeFilter === "TENDER_DIBUKA") {
      return projects.filter(
        (p) =>
          p.status === "TENDER_DIBUKA" ||
          p.status === "MASA_SANGGAH" ||
          p.status === "SELEKSI"
      );
    }
    return projects.filter((p) => p.status === activeFilter);
  }, [projects, activeFilter]);

  const isShowingIdeas = activeFilter === "IDE";

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col justify-center items-center my-auto">
      {/* Header & Filter Pills */}
      <div className="w-full flex flex-col sm:flex-row sm:items-end sm:justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-akar-ink">
            Sayembara &amp; Aspirasi Warga
          </h2>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-akar-border/80 text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("SEMUA")}
            className={`px-3 py-1.5 rounded-lg transition-all min-h-[36px] font-semibold ${
              activeFilter === "SEMUA"
                ? "bg-white text-akar-primary shadow-xs border border-akar-border/60"
                : "text-akar-muted hover:text-akar-ink"
            }`}
          >
            Semua ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("TENDER_DIBUKA")}
            className={`px-3 py-1.5 rounded-lg transition-all min-h-[36px] font-semibold ${
              activeFilter === "TENDER_DIBUKA"
                ? "bg-white text-akar-primary shadow-xs border border-akar-border/60"
                : "text-akar-muted hover:text-akar-ink"
            }`}
          >
            Tender Aktif
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("PENGERJAAN")}
            className={`px-3 py-1.5 rounded-lg transition-all min-h-[36px] font-semibold ${
              activeFilter === "PENGERJAAN"
                ? "bg-white text-akar-earth shadow-xs border border-akar-border/60"
                : "text-akar-muted hover:text-akar-ink"
            }`}
          >
            Pengerjaan
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("IDE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all min-h-[36px] font-semibold ${
              activeFilter === "IDE"
                ? "bg-white text-akar-earth shadow-xs border border-akar-border/60"
                : "text-akar-muted hover:text-akar-ink"
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 text-akar-accent" />
            <span>Aspirasi ({ideas.length})</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {!isShowingIdeas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 w-full animate-in fade-in duration-300">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group flex flex-col justify-between border-akar-border/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-akar-primary/60 cursor-default"
            >
              <CardHeader className="p-4 sm:p-5 pb-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      project.status === "TENDER_DIBUKA"
                        ? "default"
                        : project.status === "PENGERJAAN"
                        ? "earth"
                        : "neutral"
                    }
                    className={`text-[11px] font-semibold ${
                      project.status === "MASA_SANGGAH"
                        ? "border-amber-500 text-amber-700 bg-amber-50"
                        : ""
                    }`}
                  >
                    {project.status === "TENDER_DIBUKA" && <Clock className="h-3 w-3 mr-1" />}
                    {project.status === "MASA_SANGGAH" && <Clock className="h-3 w-3 mr-1 text-amber-600" />}
                    {project.status === "PENGERJAAN" && <HardHat className="h-3 w-3 mr-1" />}
                    {project.status === "SELESAI" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {project.statusLabel}
                  </Badge>

                  <Badge variant="outline" className="text-[10px] text-akar-muted">
                    {project.sumberIdeLabel}
                  </Badge>
                </div>

                <CardTitle className="text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-akar-primary transition-colors">
                  {project.judul}
                </CardTitle>

                <div className="flex items-center gap-1.5 text-xs text-akar-muted">
                  <MapPin className="h-3.5 w-3.5 text-akar-earth shrink-0" />
                  <span className="truncate">{project.lokasi}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                <p className="text-xs text-akar-muted line-clamp-2 leading-relaxed">
                  {project.deskripsi}
                </p>

                <div className="rounded-lg bg-stone-50 border border-akar-border/80 p-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-akar-muted">Pagu Anggaran:</span>
                    <span className="font-extrabold text-akar-primary text-sm">
                      {formatRupiah(project.pagu)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-akar-muted text-[11px]">
                    <span>Serapan Lokal:</span>
                    <span className="font-semibold text-akar-ink">
                      {project.serapanLokal}% Warga
                    </span>
                  </div>
                  {project.tenggatHari && (
                    <div className="flex justify-between items-center text-akar-earth font-medium pt-1 border-t border-akar-border/40 text-[11px]">
                      <span>Batas Tender:</span>
                      <span className="font-bold">{project.tenggatHari} hari lagi</span>
                    </div>
                  )}
                  {project.progresPersen !== undefined && (
                    <div className="pt-1 border-t border-akar-border/40">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-akar-muted">Progres Fisik:</span>
                        <span className="font-bold text-akar-ink">{project.progresPersen}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-akar-primary rounded-full transition-all duration-700"
                          style={{ width: `${project.progresPersen}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 sm:p-5 pt-2 flex items-center justify-between border-t border-akar-border/60">
                <span className="text-[11px] text-akar-muted">
                  {project.jalurLabel}
                </span>

                <Link href={`/proyek/${project.id}`}>
                  <Button
                    size="sm"
                    variant={project.status === "TENDER_DIBUKA" ? "default" : "outline"}
                    className="min-h-[40px] text-xs font-semibold px-3"
                  >
                    {project.status === "TENDER_DIBUKA" ? "Ajukan Proposal" : "Lihat Detail"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Ideas Grid */}
      {isShowingIdeas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 w-full animate-in fade-in duration-300">
          {ideas.map((idea) => {
            const isSupported = !!supportedIdeas[idea.id];
            const count = voteCounts[idea.id] ?? idea.jumlahDukungan;

            return (
              <Card
                key={idea.id}
                className="group flex flex-col justify-between border-akar-border/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-akar-earth/60 cursor-default"
              >
                <CardHeader className="p-4 sm:p-5 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-akar-muted">
                      {idea.nomor}
                    </span>
                    <Badge
                      variant={idea.status === "VERIFIKASI" ? "earth" : "neutral"}
                      className="text-[11px]"
                    >
                      {idea.status === "VERIFIKASI" && (
                        <CheckCircle2 className="h-3 w-3 mr-1 text-akar-earth" />
                      )}
                      {idea.statusLabel}
                    </Badge>
                  </div>

                  <CardTitle className="text-base sm:text-lg leading-snug line-clamp-2 group-hover:text-akar-earth transition-colors">
                    {idea.judul}
                  </CardTitle>

                  <div className="flex items-center gap-2 pt-0.5">
                    <Badge variant="outline" className="text-[10px] text-akar-muted">
                      <Tag className="h-3 w-3 mr-1 text-akar-primary" />
                      {idea.kategori}
                    </Badge>
                    <span className="text-[11px] text-akar-muted flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 text-akar-earth shrink-0" />
                      <span className="truncate">{idea.lokasi}</span>
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 space-y-2">
                  <p className="text-xs text-akar-muted line-clamp-2 leading-relaxed">
                    {idea.deskripsi}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-akar-muted pt-1">
                    <User className="h-3 w-3 text-akar-earth shrink-0" />
                    <span className="truncate">
                      Pengusul: <strong className="text-akar-ink font-medium">{idea.pengusul}</strong>
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-4 sm:p-5 pt-2 flex items-center justify-between border-t border-akar-border/60">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-akar-muted">Dukungan Warga</span>
                    <span className="text-sm font-extrabold text-akar-earth">
                      {count} <span className="text-[10px] font-normal text-akar-ink">suara</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={isSupported ? "earth" : "outline"}
                      onClick={() => toggleSupport(idea.id)}
                      className="min-h-[40px] px-3 text-xs font-semibold transition-transform active:scale-95"
                      aria-label={`Dukung aspirasi ${idea.judul}`}
                    >
                      <ThumbsUp className={`h-3.5 w-3.5 mr-1 ${isSupported ? "fill-white" : ""}`} />
                      {isSupported ? "Didukung" : "Dukung"}
                    </Button>
                    <Link href={`/ide/${idea.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-[40px] px-2 text-xs text-akar-muted hover:text-akar-ink"
                      >
                        Detail
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Footer for Slide 4 */}
      <div className="w-full mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-akar-border/60">
        <span className="text-xs text-akar-muted text-center sm:text-left">
          {isShowingIdeas
            ? "Aspirasi warga yang didukung publik diverifikasi perangkat desa dalam waktu maksimal 14 hari."
            : "Pemenang sayembara ditentukan melalui seleksi rumus aturan objektif dan transparansi serapan lokal."}
        </span>
        <div className="flex items-center gap-2.5">
          <Link href={isShowingIdeas ? "/ide" : "/proyek"}>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px] text-xs font-semibold border-akar-primary/30 text-akar-primary hover:bg-akar-primary-light"
            >
              <span>{isShowingIdeas ? "Buka Semua Aspirasi" : "Buka Semua Sayembara"}</span>
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
