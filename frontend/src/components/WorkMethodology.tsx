import React, { useState, useRef } from 'react';
import {
  Compass,
  Layers,
  Cpu,
  ShieldCheck,
  Rocket,
  Wrench,
  Check,
  ArrowRight
} from 'lucide-react';

interface StepData {
  id: string;
  num: string;
  shortTitle: string;
  fullTitle: string;
  timeTag: string;
  icon: React.ReactNode;
  whatWeDo: string;
  deliverables: [string, string];
}

const STEPS: StepData[] = [
  {
    id: 'step-1',
    num: '01',
    shortTitle: 'Diagnóstico',
    fullTitle: 'Diagnóstico y Mapeo de Procesos',
    timeTag: '2 a 3 días',
    icon: <Compass className="w-5 h-5 text-[#c084fc]" />,
    whatWeDo: 'Revisamos tus tareas manuales, cuellos de botella y herramientas en uso para definir exactamente qué automatizar y cuánto tiempo o dinero vas a ahorrar.',
    deliverables: [
      'Mapa de tus procesos manuales y cuellos de botella',
      'Objetivos claros y cálculo de ahorro estimado'
    ]
  },
  {
    id: 'step-2',
    num: '02',
    shortTitle: 'Prototipo',
    fullTitle: 'Arquitectura y Prototipo Funcional',
    timeTag: '3 a 5 días',
    icon: <Layers className="w-5 h-5 text-sky-400" />,
    whatWeDo: 'Te muestro un prototipo visual interactivo y un plan de fechas cerrado para que apruebes cómo funcionará la solución antes de empezar a programar.',
    deliverables: [
      'Prototipo navegable para que lo pruebe tu equipo',
      'Fechas de entrega transparentes y sin sorpresas'
    ]
  },
  {
    id: 'step-3',
    num: '03',
    shortTitle: 'Desarrollo',
    fullTitle: 'Construcción e Integración del Core',
    timeTag: 'Fase Principal',
    icon: <Cpu className="w-5 h-5 text-emerald-400" />,
    whatWeDo: 'Construimos los agentes, automatizaciones y conexiones a tu WhatsApp, Excel o bases de datos con reglas estrictas que impiden errores humanos.',
    deliverables: [
      'Sistemas conectados directamente a tus herramientas diarias',
      'Reglas de validación que garantizan cero equivocaciones'
    ]
  },
  {
    id: 'step-4',
    num: '04',
    shortTitle: 'Pruebas',
    fullTitle: 'Pruebas con Datos Reales y Blindaje',
    timeTag: 'Control de Calidad',
    icon: <ShieldCheck className="w-5 h-5 text-amber-300" />,
    whatWeDo: 'Ponemos a prueba el sistema con datos e información real de tu negocio para comprobar que responda rápido y no cometa fallas ni alucinaciones.',
    deliverables: [
      'Pruebas con los casos más exigentes de tu operación diaria',
      'Ajuste de tiempos de respuesta y cero fallos operativos'
    ]
  },
  {
    id: 'step-5',
    num: '05',
    shortTitle: 'Producción',
    fullTitle: 'Puesta en Marcha y Capacitación',
    timeTag: 'Puesta en Marcha',
    icon: <Rocket className="w-5 h-5 text-purple-300" />,
    whatWeDo: 'Dejamos la solución lista en tus servidores o cuentas seguras y capacitamos a tu personal para que lo usen con total facilidad desde el primer día.',
    deliverables: [
      'Instalación completa y lista para trabajar',
      'Capacitación práctica a las personas que usarán el sistema'
    ]
  },
  {
    id: 'step-6',
    num: '06',
    shortTitle: 'Soporte',
    fullTitle: 'Mantenimiento, Soporte y Actualizaciones',
    timeTag: 'Continuidad',
    icon: <Wrench className="w-5 h-5 text-[#10B981]" />,
    whatWeDo: 'Tu negocio no queda desatendido: damos seguimiento continuo, soporte prioritario ante dudas y actualizamos el sistema conforme tu empresa crezca.',
    deliverables: [
      'Soporte técnico directo ante cualquier necesidad',
      'Actualizaciones y mejoras cuando sumes nuevos servicios'
    ]
  }
];

export const WorkMethodology: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const detailRef = useRef<HTMLDivElement>(null);
  const activeStep = STEPS[activeStepIndex];

  const handleStepSelect = (idx: number, isMobileClick = false) => {
    setActiveStepIndex(idx);
    if (isMobileClick && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  };

  return (
    <section className="flex flex-col gap-6" id="metodologia">
      {/* Título de la sección limpio y directo */}
      <div className="flex flex-col gap-1 max-w-2xl">
        <span className="font-mono text-xs text-[#c084fc] font-medium tracking-wide">
          [ Metodología de trabajo ]
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8F4E9] tracking-tight">
          Cómo trabajamos, paso a paso
        </h2>
        <p className="text-xs sm:text-sm text-[rgba(246,219,192,0.7)] leading-relaxed">
          Toca o pasa el cursor por cada fase para ver qué hacemos y qué recibes en cada etapa.
        </p>
      </div>

      {/* Layout de 2 Columnas: Pipeline a la izquierda + Panel a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Columna Izquierda: Pipeline de Nodos Conectados (Desktop vertical / Mobile carrusel deslizable con snap) */}
        <div className="lg:col-span-5 p-3.5 sm:p-5 rounded-2xl bg-[rgba(32,19,36,0.65)] backdrop-blur-md border border-[rgba(147,80,115,0.25)] relative">
          {/* Línea conectora vertical entre nodos (Solo en desktop/tablet grande) */}
          <div className="hidden lg:block absolute left-[2.6rem] top-7 bottom-7 w-0.5 bg-[rgba(147,80,115,0.25)] -z-0" />

          {/* En móvil: selector minimalista de solo circulitos con línea conectora horizontal. En desktop: columna vertical con títulos y tiempos */}
          <div className="relative">
            {/* Línea horizontal en móvil que conecta los circulitos */}
            <div className="block lg:hidden absolute top-1/2 left-4 right-4 h-0.5 bg-[rgba(147,80,115,0.3)] -translate-y-1/2 -z-0" />

            <div className="flex lg:flex-col items-center lg:items-stretch justify-between lg:justify-start gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 scrollbar-none snap-x relative z-10 px-1 py-1">
              {STEPS.map((step, idx) => {
                const isActive = idx === activeStepIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onMouseEnter={() => handleStepSelect(idx, false)}
                    onClick={() => handleStepSelect(idx, true)}
                    className={`transition-all duration-150 text-left cursor-pointer shrink-0 snap-center ${
                      /* En móvil es un círculo puro sin bordes de caja exterior */
                      'p-0 lg:p-3 rounded-full lg:rounded-xl flex items-center justify-center lg:justify-between'
                    } ${
                      isActive
                        ? 'lg:bg-[rgba(80,45,85,0.55)] lg:border lg:border-[rgba(147,80,115,0.5)] text-[#F8F4E9] lg:shadow-sm'
                        : 'lg:bg-transparent hover:lg:bg-[rgba(45,20,55,0.3)] lg:border lg:border-transparent text-[rgba(246,219,192,0.65)] hover:text-[#F8F4E9]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      {/* Nodo circular con número */}
                      <div
                        className={`w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'bg-[#10B981] text-[#150a19] scale-110 shadow-[0_0_14px_rgba(16,185,129,0.45)] ring-2 ring-[#c084fc]/50'
                            : 'bg-[rgba(26,15,30,0.95)] text-[rgba(246,219,192,0.7)] border border-[rgba(147,80,115,0.4)] hover:border-[#c084fc]/60'
                        }`}
                      >
                        {step.num}
                      </div>

                      {/* Título (Oculto en móvil, visible en desktop) */}
                      <span className="hidden lg:inline text-sm font-medium truncate">
                        {step.shortTitle}
                      </span>
                    </div>

                    {/* Badge de Tiempo (Oculto en móvil) */}
                    <span
                      className={`hidden lg:inline font-mono text-[10px] px-2 py-0.5 rounded shrink-0 ml-1.5 ${
                        isActive
                          ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]'
                          : 'text-[rgba(246,219,192,0.4)]'
                      }`}
                    >
                      {step.timeTag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Detalle Conciso */}
        <div
          ref={detailRef}
          className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-7 rounded-2xl bg-[rgba(32,19,36,0.65)] backdrop-blur-md border border-[rgba(147,80,115,0.35)] transition-all duration-200 scroll-mt-20"
        >
          <div className="flex flex-col gap-3.5 sm:gap-4">
            {/* Cabecera del paso */}
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.2)]">
              <div className="flex items-center gap-2">
                {activeStep.icon}
                <span className="font-mono text-xs text-[rgba(246,219,192,0.6)]">
                  Paso {activeStep.num} de 06
                </span>
              </div>

              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[rgba(80,45,85,0.3)] text-[#F8F4E9] border border-[rgba(147,80,115,0.25)]">
                {activeStep.timeTag}
              </span>
            </div>

            {/* Título de la Fase */}
            <h3 className="text-base sm:text-xl font-semibold text-[#F8F4E9]">
              {activeStep.fullTitle}
            </h3>

            {/* Qué Hacemos (Breve y claro) */}
            <p className="text-xs sm:text-sm text-[rgba(246,219,192,0.85)] leading-relaxed">
              {activeStep.whatWeDo}
            </p>

            {/* Entregables sencillos */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="font-mono text-[10px] uppercase text-[rgba(246,219,192,0.55)] font-medium tracking-wider">
                Lo que obtienes:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {activeStep.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[rgba(20,10,24,0.55)] border border-[rgba(147,80,115,0.2)] flex items-center gap-2.5 text-xs text-[#F8F4E9]"
                  >
                    <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Botón de Siguiente con tamaño táctil optimizado */}
          <div className="mt-5 pt-3.5 border-t border-[rgba(147,80,115,0.2)] flex justify-end">
            <button
              type="button"
              onClick={() => handleStepSelect((activeStepIndex + 1) % STEPS.length, true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-1.5 rounded-lg bg-[rgba(80,45,85,0.35)] hover:bg-[#c084fc] text-[#F8F4E9] hover:text-[#500989] border border-[rgba(147,80,115,0.3)] hover:border-[#c084fc] font-mono text-xs font-semibold transition-colors duration-150 active:scale-95 cursor-pointer min-h-[42px] sm:min-h-0"
            >
              <span>{activeStepIndex === STEPS.length - 1 ? 'Volver al paso 1' : 'Siguiente paso'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
