import React, { useState, useRef, useEffect } from 'react';
import { PROJECTS } from '../data/projects';

export const CoverFlowCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = PROJECTS.length;
  const autoPlayIntervalMs = 4600; // ~4.6s: suficiente para leer y apreciar la rotación

  // Auto-play / Rotación lenta continua
  useEffect(() => {
    if (isPaused) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const interval = setInterval(() => {
      if (document.hidden) return;
      setActiveIndex((prev) => (prev + 1) % total);
    }, autoPlayIntervalMs);

    return () => clearInterval(interval);
  }, [isPaused, total]);

  // Touch Swipe Gesture State
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 45;

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextCard();
    } else if (isRightSwipe) {
      prevCard();
    }
  };

  const openInspectModal = (key: string) => {
    window.dispatchEvent(
      new CustomEvent('open-inspect-modal', { detail: { projectKey: key } })
    );
  };

  return (
    <section className="flex flex-col gap-5 sm:gap-6" id="proyectos">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#c084fc]">
            <span>[ Proyectos en producción ]</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8F4E9] mt-2">
            Casos de estudio interactivos
          </h2>
          <p className="text-sm text-[#F6DBC0] mt-1 max-w-xl leading-relaxed">
            Sistemas reales con integración de IA. Desliza lateralmente para navegar o pulsa una tarjeta para abrir su simulador.
          </p>
        </div>

        {/* 3D Carousel Controls */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-[rgba(80,45,85,0.24)] border border-[rgba(147,80,115,0.3)] backdrop-blur-md self-start md:self-auto">
          <button
            onClick={prevCard}
            aria-label="Tarjeta Anterior"
            className="w-9 h-9 rounded flex items-center justify-center bg-[rgba(26,15,30,0.8)] hover:bg-[rgba(66,53,70,0.9)] text-[#F8F4E9] transition-all active:scale-95 cursor-pointer"
          >
            <span className="font-mono text-sm font-bold">&lt;</span>
          </button>
          <span className="font-mono text-xs text-[#c084fc] px-2 select-none">
            0{activeIndex + 1} / 0{total}
          </span>
          <button
            onClick={nextCard}
            aria-label="Siguiente Tarjeta"
            className="w-9 h-9 rounded flex items-center justify-center bg-[rgba(26,15,30,0.8)] hover:bg-[rgba(66,53,70,0.9)] text-[#F8F4E9] transition-all active:scale-95 cursor-pointer"
          >
            <span className="font-mono text-sm font-bold">&gt;</span>
          </button>
        </div>
      </div>

      {/* 3D Stage Wrapper with Touch Handlers */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => {
          setIsPaused(true);
          onTouchStart(e);
        }}
        onTouchMove={onTouchMove}
        onTouchEnd={() => {
          setIsPaused(false);
          onTouchEnd();
        }}
        className="relative w-full h-[500px] sm:h-[440px] my-2 sm:my-4 perspective-stage flex items-center justify-center overflow-hidden py-4 select-none touch-pan-y"
      >
        {PROJECTS.map((project, index) => {
          const diff = (index - activeIndex + total) % total;
          let positionClass = '';

          if (diff === 0) {
            positionClass = 'card-center';
          } else if (diff === 1) {
            positionClass = 'card-right';
          } else if (diff === 2) {
            positionClass = 'card-far-right';
          } else if (diff === total - 1) {
            positionClass = 'card-left';
          } else {
            positionClass = 'card-far-left';
          }

          return (
            <div
              key={project.id}
              onClick={() => handleCardClick(index)}
              className={`carousel-3d-card ${positionClass} absolute w-[90%] sm:w-full max-w-[360px] sm:max-w-[450px] p-5 sm:p-6 rounded-xl bg-[rgba(26,15,30,0.96)] border border-[rgba(147,80,115,0.4)] backdrop-blur-xl flex flex-col justify-between`}
            >
              {/* Corner Crosshairs */}
              <div className="absolute top-2 left-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute top-2 right-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute bottom-2 left-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute bottom-2 right-2 font-mono text-xs text-[#c084fc] select-none">+</div>

              {/* Card Header & Content */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[rgba(246,219,192,0.65)]">
                    {project.id}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 font-mono text-xs text-[#10B981] border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                    {project.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-[#F8F4E9]">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F6DBC0] mt-1.5 sm:mt-2 leading-relaxed line-clamp-3 sm:line-clamp-none">
                    {project.shortDesc}
                  </p>
                </div>

                {/* Metric Sparkline */}
                <div className="p-2.5 sm:p-3 rounded-lg bg-[rgba(21,10,25,0.85)] border border-[rgba(147,80,115,0.25)] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] sm:text-[11px] text-[rgba(246,219,192,0.65)]">
                      {project.metricLabel}
                    </span>
                    <span className="font-mono text-sm sm:text-base text-[#F8F4E9] font-semibold">
                      {project.metricValue}{' '}
                      <span className="text-xs text-[#10B981]">
                        {project.metricDelta}
                      </span>
                    </span>
                  </div>
                  <svg className="w-20 sm:w-24 h-7 sm:h-8" fill="none" viewBox="0 0 96 32">
                    <path
                      d="M0 26 L16 22 L32 25 L48 14 L64 18 L80 8 L96 4"
                      stroke={project.sparklineColor}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                    <circle cx="96" cy="4" fill={project.sparklineColor} r="3" />
                  </svg>
                </div>
              </div>

              {/* Tags & Action Buttons */}
              <div className="flex flex-col gap-2.5 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex flex-wrap gap-1 font-mono text-[11px] text-[#F6DBC0]">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-[rgba(39,27,43,0.8)] border border-[rgba(147,80,115,0.25)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInspectModal(project.key);
                    }}
                    className="py-2 px-3 rounded bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-md active:scale-95"
                  >
                    <span>Abrir sandbox</span>
                  </button>
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="py-2 px-3 rounded bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.5)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] font-mono text-xs transition-all text-center flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span>Ver demo ↗</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip below 3D Carousel */}
      <div className="flex items-center justify-center gap-2 text-[rgba(246,219,192,0.65)] font-mono text-[11px] sm:text-xs text-center px-4">
        <span>Desliza lateralmente con el dedo o pulsa cualquier tarjeta para enfocarla</span>
      </div>
    </section>
  );
};
