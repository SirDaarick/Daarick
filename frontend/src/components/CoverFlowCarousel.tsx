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
          <span className="font-mono text-xs text-[#c084fc] font-medium tracking-wide">
            [ Proyectos en producción ]
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8F4E9] mt-1">
            Casos de estudio y sistemas desarrollados
          </h2>
          <p className="text-sm text-[#F6DBC0] mt-1 max-w-2xl leading-relaxed">
            Sistemas reales con integración de IA e ingeniería de optimización orientados a resolver problemas concretos.
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
        className="relative w-full h-[620px] sm:h-[570px] my-2 sm:my-4 perspective-stage flex items-center justify-center py-4 select-none touch-pan-y cursor-grab active:cursor-grabbing"
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
              className={`carousel-3d-card ${positionClass} absolute w-[92%] sm:w-full max-w-[390px] sm:max-w-[490px] p-5 sm:p-6 rounded-2xl bg-[rgba(26,15,30,0.97)] border border-[rgba(147,80,115,0.4)] backdrop-blur-xl flex flex-col justify-between transition-all shadow-[0_25px_60px_rgba(0,0,0,0.6)] min-h-[440px] sm:min-h-[460px]`}
            >
              {/* Corner Crosshairs */}
              <div className="absolute top-2 left-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute top-2 right-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute bottom-2 left-2 font-mono text-xs text-[#c084fc] select-none">+</div>
              <div className="absolute bottom-2 right-2 font-mono text-xs text-[#c084fc] select-none">+</div>

              {/* Card Body: Pure GIF + Title + Full Description */}
              <div className="flex flex-col gap-3.5">
                {/* Hero GIF Showcase */}
                <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-[rgba(147,80,115,0.35)] bg-[rgba(15,7,18,0.95)] shadow-md group">
                  <img
                    src={project.gifUrl}
                    alt={`Demostración de ${project.title}`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>

                {/* Title & Human-Friendly Summary */}
                <div className="px-1">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#F8F4E9]">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#F6DBC0] mt-1.5 leading-relaxed">
                    {project.shortDesc}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-[rgba(147,80,115,0.2)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openInspectModal(project.key);
                  }}
                  className="py-2.5 px-4 rounded-lg bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.5)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] font-mono text-xs font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>Más detalles</span>
                </button>
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="py-2.5 px-4 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Probar demo ↗</span>
                </a>
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
