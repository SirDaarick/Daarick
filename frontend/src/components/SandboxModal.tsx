import React, { useState, useEffect } from 'react';
import { PROJECTS, type ProjectData } from '../data/projects';

export const SandboxModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>('A');
  const [scale, setScale] = useState<number>(0.75); // 75% escala por defecto para layout de escritorio óptimo
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);

  const currentProject = PROJECTS.find((p) => p.key === activeKey) || PROJECTS[0];

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ projectKey?: string }>;
      if (customEvent.detail?.projectKey) {
        setActiveKey(customEvent.detail.projectKey);
      }
      setIsOpen(true);
      setIsIframeLoading(true);
      document.body.style.overflow = 'hidden';
    };

    window.addEventListener('open-inspect-modal', handleOpen);
    return () => window.removeEventListener('open-inspect-modal', handleOpen);
  }, []);

  const closeModal = () => {
    setIsOpen(false);
    setIsMaximized(false);
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

  const handleSelectProject = (key: string) => {
    setActiveKey(key);
    setIsIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleReloadDemo = () => {
    setIsIframeLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={closeModal}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-200 ${
        isMaximized ? 'p-0' : 'p-2 sm:p-4 lg:p-5'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative flex flex-col bg-[rgba(24,13,28,0.98)] border border-[rgba(192,132,252,0.4)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(192,132,252,0.15)] overflow-hidden transition-all duration-200 ${
          isMaximized
            ? 'w-full h-full max-w-none max-h-none rounded-none border-0'
            : 'w-[96vw] max-w-[1520px] 2xl:max-w-[1680px] h-[95vh] max-h-[96vh] rounded-2xl'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[rgba(18,9,22,0.95)] border-b border-[rgba(147,80,115,0.3)] select-none shrink-0">
          <div className="flex items-center gap-3">
            <span
              onClick={closeModal}
              className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] cursor-pointer hover:opacity-80 transition-opacity"
              title="Cerrar ventana"
            />
            <span
              onClick={() => setShowDetails((prev) => !prev)}
              className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] cursor-pointer hover:opacity-80 transition-opacity"
              title="Alternar panel de resumen"
            />
            <span
              onClick={() => setIsMaximized((prev) => !prev)}
              className="w-3.5 h-3.5 rounded-full bg-[#27c93f] cursor-pointer hover:opacity-80 transition-opacity"
              title={isMaximized ? 'Restaurar tamaño' : 'Maximizar pantalla completa'}
            />
            <span className="ml-2 text-sm sm:text-base font-semibold text-[#F8F4E9] truncate max-w-xs sm:max-w-md">
              {currentProject.title}
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded text-[10px] font-mono bg-[rgba(80,45,85,0.3)] text-[#c084fc] border border-[rgba(147,80,115,0.3)]">
              {currentProject.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized((prev) => !prev)}
              className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg text-xs font-mono text-[rgba(246,219,192,0.8)] hover:text-[#F8F4E9] bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.5)] transition-colors cursor-pointer"
              title={isMaximized ? 'Restaurar ventana' : 'Pantalla completa'}
            >
              {isMaximized ? '[ ⛶ Restaurar ]' : '[ ⛶ Maximizar ]'}
            </button>
            <button
              onClick={closeModal}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-[rgba(246,219,192,0.8)] hover:text-[#F8F4E9] bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.5)] transition-colors cursor-pointer"
            >
              [ Cerrar ]
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar flex-1">
          {/* System Tabs Selector & Details Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(147,80,115,0.2)] shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-[rgba(246,219,192,0.6)] mr-1">
                Ver otro proyecto:
              </span>
              {PROJECTS.map((p) => {
                const isActive = p.key === activeKey;
                return (
                  <button
                    key={p.key}
                    onClick={() => handleSelectProject(p.key)}
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

            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="text-xs font-mono text-[rgba(246,219,192,0.7)] hover:text-[#c084fc] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{showDetails ? '[ ▲ Ocultar resumen ]' : '[ ▼ Ver resumen de arquitectura ]'}</span>
            </button>
          </div>

          {/* 3 Pillars Cards: Problema, Solución y Resultados (Colapsable) */}
          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 transition-all">
              {/* Card 1: ¿Qué problema existía? */}
              <div className="flex flex-col p-4 rounded-xl bg-[rgba(35,23,39,0.6)] border border-[rgba(147,80,115,0.3)]">
                <span className="font-mono text-xs text-[#ff5f56] font-semibold mb-1">
                  EL PROBLEMA
                </span>
                <h4 className="text-sm font-semibold text-[#F8F4E9] mb-1.5">
                  ¿Qué problema existía?
                </h4>
                <p className="text-xs text-[#F6DBC0] leading-relaxed">
                  {currentProject.problem}
                </p>
              </div>

              {/* Card 2: ¿Cómo lo resolvemos? */}
              <div className="flex flex-col p-4 rounded-xl bg-[rgba(35,23,39,0.6)] border border-[rgba(147,80,115,0.3)]">
                <span className="font-mono text-xs text-[#c084fc] font-semibold mb-1">
                  LA SOLUCIÓN
                </span>
                <h4 className="text-sm font-semibold text-[#F8F4E9] mb-1.5">
                  ¿Cómo lo resolvemos?
                </h4>
                <p className="text-xs text-[#F8F4E9] leading-relaxed">
                  {currentProject.solution}
                </p>
              </div>

              {/* Card 3: Resultados obtenidos */}
              <div className="flex flex-col p-4 rounded-xl bg-[rgba(35,23,39,0.6)] border border-[rgba(147,80,115,0.3)]">
                <span className="font-mono text-xs text-[#10B981] font-semibold mb-1">
                  IMPACTO
                </span>
                <h4 className="text-sm font-semibold text-[#F8F4E9] mb-1.5">
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
          )}

          {/* Interactive Live Demo Window (Iframe con Escala Dinámica) */}
          <div className="flex flex-col rounded-xl border border-[rgba(147,80,115,0.35)] bg-[rgba(18,9,22,0.95)] overflow-hidden shadow-2xl flex-1 min-h-[560px]">
            {/* Browser Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-[rgba(26,15,30,0.95)] border-b border-[rgba(147,80,115,0.25)] font-mono text-xs shrink-0 select-none">
              <div className="flex items-center gap-2 text-[rgba(246,219,192,0.7)] min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span className="text-[#c084fc] font-semibold shrink-0">DEMO EN VIVO:</span>
                <span className="hidden sm:inline text-xs text-[rgba(246,219,192,0.8)] truncate max-w-xs md:max-w-md">
                  {currentProject.demoUrl}
                </span>
              </div>

              {/* Controles de Escala / Zoom y Acciones */}
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                {/* Control de Escala / Zoom */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[rgba(80,45,85,0.25)] border border-[rgba(147,80,115,0.3)]">
                  <span className="text-[10px] text-[rgba(246,219,192,0.65)] hidden md:inline mr-1">
                    Escala:
                  </span>
                  <button
                    onClick={() => setScale((prev) => Math.max(0.5, Number((prev - 0.05).toFixed(2))))}
                    title="Reducir escala (zoom out)"
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-[rgba(192,132,252,0.2)] text-[#F8F4E9] font-bold text-xs transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold text-[#c084fc] px-1 min-w-[36px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={() => setScale((prev) => Math.min(1.25, Number((prev + 0.05).toFixed(2))))}
                    title="Aumentar escala (zoom in)"
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-[rgba(192,132,252,0.2)] text-[#F8F4E9] font-bold text-xs transition-colors cursor-pointer"
                  >
                    +
                  </button>
                  {scale !== 0.75 && (
                    <button
                      onClick={() => setScale(0.75)}
                      title="Restablecer al 75% recomendado"
                      className="text-[10px] text-[rgba(246,219,192,0.65)] hover:text-[#c084fc] ml-1 px-1 underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Accesos Rápidos de Escala */}
                <div className="hidden lg:flex items-center gap-1">
                  {[0.7, 0.75, 0.85, 1.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        scale === s
                          ? 'bg-[#c084fc] text-[#500989] font-bold'
                          : 'bg-[rgba(80,45,85,0.2)] hover:bg-[rgba(80,45,85,0.4)] text-[rgba(246,219,192,0.7)]'
                      }`}
                    >
                      {Math.round(s * 100)}%
                    </button>
                  ))}
                </div>

                {/* Recargar Demo */}
                <button
                  onClick={handleReloadDemo}
                  title="Recargar frame de la demo"
                  className="px-2.5 py-1 rounded bg-[rgba(80,45,85,0.25)] hover:bg-[rgba(80,45,85,0.45)] text-[#F8F4E9] font-mono text-xs transition-colors cursor-pointer"
                >
                  ↻
                </button>

                {/* Abrir en pestaña nueva */}
                <a
                  href={currentProject.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <span>Abrir ↗</span>
                </a>
              </div>
            </div>

            {/* Embedded Interactive Iframe con escalado de viewport */}
            <div
              className={`relative w-full ${
                showDetails
                  ? 'h-[580px] sm:h-[660px] lg:h-[720px] 2xl:h-[780px]'
                  : 'h-[720px] sm:h-[800px] lg:h-[850px] 2xl:h-[900px]'
              } bg-black/60 overflow-hidden transition-all duration-300`}
            >
              {/* Spinner de Carga Inicial */}
              {isIframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(18,9,22,0.9)] backdrop-blur-xs gap-3 z-10 pointer-events-none transition-opacity duration-300">
                  <div className="w-8 h-8 rounded-full border-2 border-[rgba(192,132,252,0.3)] border-t-[#c084fc] animate-spin" />
                  <span className="font-mono text-xs text-[#F6DBC0]/80">
                    Cargando demo interactiva ({currentProject.title})...
                  </span>
                </div>
              )}

              <iframe
                key={`${currentProject.demoUrl}-${iframeKey}`}
                src={currentProject.demoUrl}
                title={`Demo interactiva de ${currentProject.title}`}
                onLoad={() => setIsIframeLoading(false)}
                style={{
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
                className="border-0 select-auto"
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
