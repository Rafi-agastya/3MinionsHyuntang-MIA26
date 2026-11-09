"use client";

import * as React from "react";

const defaultSlides = [
  { id: "slide-hero", label: "Beranda" },
  { id: "slide-metrik", label: "Dampak" },
  { id: "slide-filosofi", label: "Cara Kerja" },
  { id: "slide-proyek-ide", label: "Proyek & Ide" },
  { id: "slide-footer", label: "Transparansi" },
];

export interface SlideItem {
  id: string;
  label: string;
}

interface SlideIndicatorProps {
  slides?: SlideItem[];
  className?: string;
}

export function SlideIndicator({ slides = defaultSlides, className = "" }: SlideIndicatorProps) {
  const [activeSlide, setActiveSlide] = React.useState(0);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            const index = slides.findIndex((s) => s.id === entry.target.id);
            if (index !== -1) {
              setActiveSlide(index);
            }
          }
        });
      },
      { threshold: 0.35 }
    );

    slides.forEach((slide) => {
      const el = document.getElementById(slide.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [slides]);

  const scrollToSlide = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Navigasi Halaman Slide"
      className={`fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-3 bg-white/90 backdrop-blur-md p-2.5 rounded-full border border-zinc-200/90 shadow-md ring-1 ring-black/5 ${className}`}
    >
      {slides.map((slide, idx) => {
        const isActive = activeSlide === idx;
        return (
          <button
            key={slide.id}
            type="button"
            onClick={() => scrollToSlide(slide.id)}
            className="group relative flex items-center justify-center min-h-[32px] min-w-[32px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-akar-primary"
            aria-label={`Pindah ke slide ${slide.label}`}
          >
            {/* Tooltip on hover */}
            <span className="absolute right-10 rounded-md bg-akar-ink px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-1 pointer-events-none whitespace-nowrap">
              {slide.label}
            </span>

            {/* Indicator Dot */}
            <span
              className={`rounded-full transition-all duration-300 ${
                isActive
                  ? "h-7 w-3 bg-akar-primary shadow-sm"
                  : "h-3 w-3 bg-stone-300 hover:bg-stone-400 group-hover:scale-125"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
