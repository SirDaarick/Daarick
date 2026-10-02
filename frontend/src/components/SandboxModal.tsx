import React, { useState, useEffect } from 'react';
import { PROJECTS, type ProjectData } from '../data/projects';

export const SandboxModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>('A');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('// ESTADO: LISTO PARA PROCESAR');
  const [payloadText, setPayloadText] = useState('');

  const currentProject = PROJECTS.find((p) => p.key === activeKey) || PROJECTS[0];

  useEffect(() => {
    setPayloadText(currentProject.payload);
  }, [currentProject]);

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

  const runSimulation = () => {
    setIsProcessing(true);
    setStatusMessage('// ESTADO: PROCESANDO AGENTE...');
    setTimeout(() => {
      setIsProcessing(false);
      setStatusMessage('// ESTADO: COMPLETADO CON ÉXITO');
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl bg-[rgba(26,15,30,0.98)] border border-[rgba(192,132,252,0.4)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_35px_rgba(192,132,252,0.15)] overflow-hidden"
      >
        {/* Window Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[rgba(21,10,25,0.95)] border-b border-[rgba(147,80,115,0.3)] select-none">
          <div className="flex items-center gap-2">
            <span
              onClick={closeModal}
              className="w-3 h-3 rounded-full bg-[#ff5f56] cursor-pointer hover:opacity-80 transition-opacity"
              title="Cerrar"
            />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="ml-3 font-mono text-xs text-[#c084fc]">
              inspector://{currentProject.filename}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#10B981] hidden sm:inline">
              [ ● OPERATIVO ]
            </span>
            <button
              onClick={closeModal}
              className="px-2 py-0.5 rounded text-xs font-mono text-[rgba(246,219,192,0.8)] hover:text-[#F8F4E9] bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.5)] transition-colors cursor-pointer"
            >
              [ ESC Cerrar ]
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          {/* Scenario Tab Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(147,80,115,0.25)]">
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-[rgba(246,219,192,0.65)]">// SISTEMA:</span>
              {PROJECTS.map((p) => {
                const isActive = p.key === activeKey;
                return (
                  <button
                    key={p.key}
                    onClick={() => setActiveKey(p.key)}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#c084fc] text-[#500989] font-medium shadow'
                        : 'bg-[rgba(80,45,85,0.25)] hover:bg-[rgba(80,45,85,0.4)] text-[#F6DBC0]'
                    }`}
                  >
                    {p.code}. {p.title.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            <a
              href={currentProject.demoUrl}
              className="px-3 py-1 rounded bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-sm"
            >
              <span>Acceder a la aplicación / Probar Demo en Vivo ↗</span>
            </a>
          </div>

          {/* Problem & Solution Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 flex flex-col gap-3 p-4 rounded-lg bg-[rgba(35,23,39,0.5)] border border-[rgba(147,80,115,0.25)]">
              <div>
                <span className="font-mono text-xs text-[#c084fc]">
                  // PROBLEMA REAL RESUELTO
                </span>
                <h4 className="text-lg font-medium text-[#F8F4E9] mt-1">
                  {currentProject.title}
                </h4>
                <p className="text-sm text-[#F6DBC0] mt-1.5 leading-relaxed">
                  {currentProject.problem}
                </p>
              </div>

              <div className="pt-2 border-t border-[rgba(147,80,115,0.2)]">
                <span className="font-mono text-xs text-[#10B981]">
                  // IMPACTO EN PRODUCCIÓN
                </span>
                <p className="text-sm text-[#F8F4E9] mt-1 leading-relaxed">
                  {currentProject.solution}
                </p>
              </div>
            </div>

            {/* Metrics 4-Box */}
            <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-lg bg-[rgba(35,23,39,0.5)] border border-[rgba(147,80,115,0.25)]">
              <span className="font-mono text-xs text-[#c084fc] mb-2">
                // ACTIVIDAD AUDITADA [ 100% VALIDADA ]
              </span>
              <div className="grid grid-cols-2 gap-2">
                {currentProject.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="p-2.5 rounded bg-[rgba(26,15,30,0.8)] border border-[rgba(147,80,115,0.2)]"
                  >
                    <span className="text-[11px] text-[rgba(246,219,192,0.65)] block">
                      {m.label}
                    </span>
                    <span className={`font-mono text-base font-bold ${m.color}`}>
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
              <p className="font-mono text-[11px] text-[rgba(246,219,192,0.65)] mt-3">
                ✓ Rendimiento mantenido en producción continua.
              </p>
            </div>
          </div>

          {/* Interactive Logs & Payload Simulator */}
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-[rgba(21,10,25,0.9)] border border-[rgba(147,80,115,0.25)]">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[#c084fc]">
                // SIMULADOR / SANDBOX FUNCIONAL DE PAYLOAD
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  isProcessing
                    ? 'bg-[#c084fc]/20 text-[#c084fc] animate-pulse'
                    : 'bg-emerald-500/10 text-[#10B981]'
                }`}
              >
                {statusMessage}
              </span>
            </div>

            {/* Logs Window */}
            <div className="p-3 rounded bg-[rgba(15,7,18,0.9)] border border-[rgba(147,80,115,0.2)] font-mono text-xs flex flex-col gap-1 max-h-36 overflow-y-auto">
              <span className="text-[rgba(246,219,192,0.5)]">
                // REGISTRO DE EVENTOS EN TIEMPO REAL (LOG AUDITORÍA):
              </span>
              {currentProject.logs.map((log, idx) => (
                <div key={idx} className={log.cls}>
                  {log.text}
                </div>
              ))}
            </div>

            {/* JSON Payload Editor & Live Output */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-[rgba(246,219,192,0.65)]">
                  // ENTRADA (PAYLOAD JSON MODIFICABLE):
                </span>
                <textarea
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  rows={7}
                  className="w-full p-2.5 rounded bg-[rgba(15,7,18,0.9)] border border-[rgba(147,80,115,0.3)] font-mono text-xs text-[#F6DBC0] focus:border-[#c084fc] focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-xs text-[rgba(246,219,192,0.65)]">
                  // TELEMETRÍA DE PROCESO & RESPUESTA IA:
                </span>
                <div className="p-2.5 rounded bg-[rgba(15,7,18,0.9)] border border-[rgba(147,80,115,0.3)] font-mono text-xs flex flex-col gap-2 h-full justify-between">
                  <div>
                    <div className="text-[rgba(246,219,192,0.65)]">// TELEMETRÍA</div>
                    <div className="text-[#F8F4E9] mt-0.5">
                      TIEMPO: <span className="text-[#c084fc] font-bold">{currentProject.time}</span> · PRECISIÓN:{' '}
                      <span className="text-[#10B981] font-bold">{currentProject.accuracy}</span> · TOKENS:{' '}
                      <span className="text-[#F6DBC0]">{currentProject.tokens}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[rgba(147,80,115,0.2)]">
                    <div className="text-[rgba(246,219,192,0.65)]">// CLASIFICACIÓN</div>
                    <div className="text-[#F8F4E9]">{currentProject.category}</div>
                    <div className="text-[#ffafd5] font-semibold">{currentProject.priority}</div>
                  </div>

                  <div className="pt-2 border-t border-[rgba(147,80,115,0.2)]">
                    <div className="text-[rgba(246,219,192,0.65)]">// ACCIONES DISPARADAS</div>
                    {currentProject.actions.map((act, i) => (
                      <div key={i} className="text-[#10B981] text-[11px]">
                        {act}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="flex justify-end mt-2">
              <button
                onClick={runSimulation}
                disabled={isProcessing}
                className="px-5 py-2 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span>[ Ejecutar Automatización ⚡ ]</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
