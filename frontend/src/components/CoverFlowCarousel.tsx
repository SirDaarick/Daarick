import React, { useState, useRef, useEffect } from 'react';
import { PROJECTS } from '../data/projects';

export const CoverFlowCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = PROJECTS.length;
  const autoPlayIntervalMs = 4200; // ~4.2s por tarjeta

  // Auto-play continuo y suave
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden || isPaused) return;
      setActiveIndex((prev) => (prev + 1) % total);
    }, autoPlayIntervalMs);

    return () => clearInterval(interval);
  }, [isPaused, total]);

  // Pointer / Mouse Drag & Touch Gestures
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const minSwipeDistance = 35;

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, textarea')) return;
    isDragging.current = true;
    dragStartX.current = e.clientX;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const distance = dragStartX.current - e.clientX;
    if (distance > minSwipeDistance) {
      nextCard();
    } else if (distance < -minSwipeDistance) {
      prevCard();
    }
    isDragging.current = false;
  };

  const onPointerCancel = () => {
    isDragging.current = false;
  };

  const openInspectModal = (key: string) => {
    window.dispatchEvent(
      new CustomEvent('open-inspect-modal', { detail: { projectKey: key } })
    );
  };

  return (
    <section className="flex flex-col gap-5 sm:gap-6 overflow-x-clip" id="proyectos">
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
            Sistemas reales con integración de IA. Desliza con el ratón o pulsa cualquier tarjeta para traerla al frente.
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

      {/* 3D Stage Wrapper with Pointer (Mouse + Touch) Handlers */}
      <div
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="relative w-full h-[560px] sm:h-[490px] my-2 sm:my-4 perspective-stage flex items-center justify-center py-4 select-none touch-pan-y cursor-grab active:cursor-grabbing"
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

          const isCenter = diff === 0;

          return (
            <div
              key={project.id}
              onClick={() => handleCardClick(index)}
              onMouseEnter={() => {
                if (isCenter) setIsPaused(true);
              }}
              onMouseLeave={() => {
                if (isCenter) setIsPaused(false);
              }}
              className={`carousel-3d-card ${positionClass} absolute w-[92%] sm:w-full max-w-[380px] sm:max-w-[480px] p-4 sm:p-5 rounded-2xl bg-[rgba(26,15,30,0.97)] border border-[rgba(147,80,115,0.4)] backdrop-blur-xl flex flex-col justify-between transition-all shadow-[0_20px_50px_rgba(0,0,0,0.6)]`}
            >
              {/* Corner Crosshairs */}
              <div className="absolute top-2 left-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute top-2 right-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute bottom-2 left-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute bottom-2 right-2 font-mono text-xs text-[#c084fc] select-none">+</div>

              {/* Card Top: Header & Prominent Hero GIF */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="font-mono text-xs text-[rgba(246,219,192,0.7)] flex items-center gap-1.5">
                    <span className="text-[#c084fc] font-bold">{project.id}</span>
                    <span>·</span>
                    <span>{project.filename}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 font-mono text-[11px] text-[#10B981] border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                    {project.status}
                  </span>
                </div>

                {/* Hero GIF Showcase Frame (Dominant Visual Element) */}
                <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-[rgba(147,80,115,0.4)] bg-[rgba(15,7,18,0.95)] shadow-inner group">
                  <img
                    src={project.gifUrl}
                    alt={`Demo interactiva de ${project.title}`}
                    className="w-full h-full object-cover object-top opacity-95 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                  {/* Subtle cinema gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(21,10,25,0.95)] via-transparent to-black/20 pointer-events-none" />

                  {/* Top-left Live badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 font-mono text-[10px] text-[#c084fc] bg-[rgba(15,7,18,0.85)] px-2.5 py-0.5 rounded-full border border-[rgba(147,80,115,0.35)] backdrop-blur-sm pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>INTERACTIVE DEMO</span>
                  </div>

                  {/* Bottom Metric Pill inside Frame */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between font-mono text-[11px] pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md bg-[rgba(21,10,25,0.9)] text-[#F8F4E9] border border-[rgba(147,80,115,0.3)] backdrop-blur-sm text-[10px] sm:text-[11px]">
                      {project.metricLabel}: <strong className="text-emerald-400 font-bold">{project.metricValue}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold border border-emerald-500/25 backdrop-blur-sm">
                      {project.metricDelta}
                    </span>
                  </div>
                </div>

                {/* Title & Concise Summary */}
                <div className="px-1 mt-1">
                  <h3 className="text-lg sm:text-xl font-medium text-[#F8F4E9]">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F6DBC0] mt-1 leading-relaxed line-clamp-2">
                    {project.shortDesc}
                  </p>
                </div>
              </div>

              {/* Tags & Action Buttons */}
              <div className="flex flex-col gap-2.5 sm:gap-3 mt-3 pt-2 border-t border-[rgba(147,80,115,0.2)]">
                <div className="flex flex-wrap gap-1 font-mono text-[11px] text-[#F6DBC0]">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-[rgba(39,27,43,0.8)] border border-[rgba(147,80,115,0.25)] text-[10px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInspectModal(project.key);
                    }}
                    className="py-2.5 px-3 rounded-lg bg-[rgba(80,45,85,0.35)] hover:bg-[rgba(80,45,85,0.55)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] font-mono text-xs font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>Más detalles</span>
                  </button>
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="py-2.5 px-3 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Probar demo ↗</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip below 3D Carousel */}
      <div className="flex items-center justify-center gap-2 text-[rgba(246,219,192,0.65)] font-mono text-[11px] sm:text-xs text-center px-4">
        <span>Arrastra con el ratón/dedo o pulsa cualquier tarjeta para enfocarla</span>
      </div>
    </section>
  );
};
