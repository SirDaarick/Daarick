import React, { useState, useEffect } from 'react';
import { PROJECTS, type ProjectData } from '../data/projects';

export const SandboxModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>('A');

  const currentProject = PROJECTS.find((p) => p.key === activeKey) || PROJECTS[0];

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ projectKey?: string }>;
      if (customEvent.detail?.projectKey) {
        setActiveKey(customEvent.detail.projectKey);
      }
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('open-inspect-modal', handleOpen);
    return () => window.removeEventListener('open-inspect-modal', handleOpen);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[rgba(24,13,28,0.98)] border border-[rgba(192,132,252,0.4)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(192,132,252,0.15)] overflow-hidden"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[rgba(18,9,22,0.95)] border-b border-[rgba(147,80,115,0.3)] select-none">
          <div className="flex items-center gap-3">
            <span
              onClick={closeModal}
              className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] cursor-pointer hover:opacity-80 transition-opacity"
              title="Cerrar ventana"
            />
            <span className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
            <span className="ml-2 text-base font-semibold text-[#F8F4E9]">
              {currentProject.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentProject.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Abrir aplicación ↗</span>
            </a>
            <button
              onClick={closeModal}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-[rgba(246,219,192,0.8)] hover:text-[#F8F4E9] bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.5)] transition-colors cursor-pointer"
            >
              [ Cerrar ]
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          {/* System Tabs Selector */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-[rgba(147,80,115,0.2)]">
            <span className="font-mono text-xs text-[rgba(246,219,192,0.6)] mr-1">
              Ver otro proyecto:
            </span>
            {PROJECTS.map((p) => {
              const isActive = p.key === activeKey;
              return (
                <button
                  key={p.key}
                  onClick={() => setActiveKey(p.key)}
                  className={`px-3 py-1 rounded-full font-mono text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#c084fc] text-[#500989] font-bold shadow'
                      : 'bg-[rgba(80,45,85,0.25)] hover:bg-[rgba(80,45,85,0.45)] text-[#F6DBC0]'
                  }`}
                >
                  {p.title}
                </button>
              );
            })}
          </div>

          {/* 3 Pillars Cards: Problema, Solución y Resultados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: ¿Qué problema existía? */}
            <div className="flex flex-col p-4 rounded-xl bg-[rgba(35,23,39,0.6)] border border-[rgba(147,80,115,0.3)]">
              <span className="font-mono text-xs text-[#ff5f56] font-semibold mb-1">
                // 01. EL PROBLEMA
              </span>
              <h4 className="text-sm font-semibold text-[#F8F4E9] mb-2">
                ¿Qué problema existía?
              </h4>
              <p className="text-xs text-[#F6DBC0] leading-relaxed">
                {currentProject.problem}
              </p>
            </div>

            {/* Card 2: ¿Cómo lo resolvemos? */}
            <div className="flex flex-col p-4 rounded-xl bg-[rgba(35,23,39,0.6)] border border-[rgba(147,80,115,0.3)]">
              <span className="font-mono text-xs text-[#c084fc] font-semibold mb-1">
                // 02. LA SOLUCIÓN
              </span>
              <h4 className="text-sm font-semibold text-[#F8F4E9] mb-2">
                ¿Cómo lo resolvemos?
              </h4>
              <p className="text-xs text-[#F8F4E9] leading-relaxed">
                {currentProject.solution}
              </p>
            </div>

            {/* Card 3: Resultados obtenidos */}
            <div className="flex flex-col p-4 rounded-xl bg-[rgba(35,23,39,0.6)] border border-[rgba(147,80,115,0.3)]">
              <span className="font-mono text-xs text-[#10B981] font-semibold mb-1">
                // 03. IMPACTO
              </span>
              <h4 className="text-sm font-semibold text-[#F8F4E9] mb-2">
                Resultados obtenidos
              </h4>
              <div className="grid grid-cols-2 gap-2 mt-auto">
                {currentProject.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="p-2 rounded bg-[rgba(21,10,25,0.8)] border border-[rgba(147,80,115,0.2)]"
                  >
                    <span className="text-[10px] text-[rgba(246,219,192,0.65)] block">
                      {m.label}
                    </span>
                    <span className={`font-mono text-xs font-bold ${m.color}`}>
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Demo Window (Iframe) */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-[rgba(147,80,115,0.35)] bg-[rgba(18,9,22,0.95)] overflow-hidden shadow-xl">
            {/* Browser Header Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[rgba(26,15,30,0.9)] border-b border-[rgba(147,80,115,0.25)] font-mono text-xs">
              <div className="flex items-center gap-2 text-[rgba(246,219,192,0.7)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[#c084fc]">DEMO EN VIVO:</span>
                <span className="hidden sm:inline text-xs text-[rgba(246,219,192,0.8)]">
                  {currentProject.demoUrl}
                </span>
              </div>

              <a
                href={currentProject.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-sm active:scale-95"
              >
                <span>Ir a la página directamente ↗</span>
              </a>
            </div>

            {/* Embedded Interactive Iframe */}
            <div className="relative w-full h-[460px] sm:h-[540px] bg-black/60">
              <iframe
                key={currentProject.demoUrl}
                src={currentProject.demoUrl}
                title={`Demo interactiva de ${currentProject.title}`}
                className="w-full h-full border-0"
                loading="lazy"
                allow="clipboard-write; fullscreen"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
