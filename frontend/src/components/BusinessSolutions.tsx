import React, { useState } from 'react';
import {
  MessageSquareCode,
  FileCheck2,
  CalendarClock,
  LineChart,
  ArrowRight,
  Check,
  ChevronDown
} from 'lucide-react';

interface SolutionItem {
  title: string;
  desc: string;
}

interface BusinessCase {
  id: string;
  category: string;
  customerPain: string;
  accentColor: string;
  borderColor: string;
  activeBorderColor: string;
  badgeBg: string;
  icon: React.ReactNode;
  solutions: [SolutionItem, SolutionItem];
  proofProject: string;
  proofExplanation: string;
  actionLabel: string;
  actionType: 'copilot' | 'inspect';
  actionPayload?: string;
}

const BUSINESS_CASES: BusinessCase[] = [
  {
    id: 'case-whatsapp',
    category: 'Atención & Ventas 24/7',
    customerPain: '“Quiero mejorar la atención y no perder ventas en WhatsApp por responder tarde.”',
    accentColor: '#c084fc',
    borderColor: 'border-[rgba(147,80,115,0.25)]',
    activeBorderColor: 'border-[#c084fc]/80',
    badgeBg: 'bg-[rgba(192,132,252,0.12)] text-[#c084fc]',
    icon: <MessageSquareCode className="w-4 h-4 text-[#c084fc]" />,
    solutions: [
      {
        title: 'Asistente de Pedidos y Citas en WhatsApp',
        desc: 'Recibe mensajes o notas de voz, revisa disponibilidad al momento y registra la orden o cita sin que tengas que intervenir.'
      },
      {
        title: 'Canalización Automática de Mensajes',
        desc: 'Identifica si es una duda común, una urgencia o un cliente listo para comprar y se lo pasa a la persona correcta al instante.'
      }
    ],
    proofProject: 'Asistente Wiki & Proyecto PAIDEA',
    proofExplanation: 'La misma lógica que usa este sitio para responderte en vivo y que implementamos para resolver consultas en segundos.',
    actionLabel: 'Ver cómo funciona',
    actionType: 'copilot',
    actionPayload: '¿Cómo funciona un asistente de WhatsApp para tomar pedidos o citas en un negocio?'
  },
  {
    id: 'case-ocr',
    category: 'Documentos & Facturación',
    customerPain: '“Mi equipo pasa horas pasando a mano facturas y tickets a Excel.”',
    accentColor: '#10B981',
    borderColor: 'border-[rgba(147,80,115,0.25)]',
    activeBorderColor: 'border-emerald-500/80',
    badgeBg: 'bg-emerald-500/10 text-emerald-400',
    icon: <FileCheck2 className="w-4 h-4 text-emerald-400" />,
    solutions: [
      {
        title: 'Lectura Automática de Facturas y Tickets a Excel',
        desc: 'Le tomas foto al papel o subes el PDF y extrae importes, fechas y datos fiscales con cuentas matemáticas verificadas.'
      },
      {
        title: 'Cruce Automático de Compras vs. Pagos',
        desc: 'Compara tus notas de compra contra los estados de cuenta bancarios y te avisa de inmediato si hay cobros que no cuadran.'
      }
    ],
    proofProject: 'Sistema de Extracción de Documentos',
    proofExplanation: 'Tecnología de lectura visual programada con reglas estrictas que impiden errores humanos al capturar números.',
    actionLabel: 'Consultar solución',
    actionType: 'copilot',
    actionPayload: 'Quiero automatizar la lectura de facturas y tickets a Excel. ¿Cómo se aplicaría a mi negocio?'
  },
  {
    id: 'case-shifts',
    category: 'Organización de Personal & Stock',
    customerPain: '“Los turnos de mi equipo se cruzan, no sabemos el stock real y es un desorden.”',
    accentColor: '#38bdf8',
    borderColor: 'border-[rgba(147,80,115,0.25)]',
    activeBorderColor: 'border-sky-400/80',
    badgeBg: 'bg-sky-500/10 text-sky-400',
    icon: <CalendarClock className="w-4 h-4 text-sky-400" />,
    solutions: [
      {
        title: 'Generador Inteligente de Turnos y Horarios',
        desc: 'Calcula los horarios semanales de tu personal en segundos, respetando días de descanso y cubriendo las horas de mayor venta sin empalmes.'
      },
      {
        title: 'Panel Sencillo de Inventario y Ventas',
        desc: 'Una pantalla web clara y fácil de usar donde todo tu equipo lleva el control de productos sin pagar mensualidades caras.'
      }
    ],
    proofProject: 'Proyecto Tetring',
    proofExplanation: 'Un motor de cálculo que resuelve miles de combinaciones en milisegundos para encontrar el horario perfecto sin choques.',
    actionLabel: 'Ver proyecto Tetring',
    actionType: 'inspect',
    actionPayload: 'B'
  },
  {
    id: 'case-bi',
    category: 'Reportes & Datos del Negocio',
    customerPain: '“No tengo tiempo de revisar números y me entero de las pérdidas semanas después.”',
    accentColor: '#f59e0b',
    borderColor: 'border-[rgba(147,80,115,0.25)]',
    activeBorderColor: 'border-amber-400/80',
    badgeBg: 'bg-amber-500/10 text-amber-300',
    icon: <LineChart className="w-4 h-4 text-amber-300" />,
    solutions: [
      {
        title: 'Resumen Semanal por WhatsApp',
        desc: 'El sistema analiza tus ventas de la semana y te envía un resumen claro los lunes a primera hora con lo más vendido y alertas de gastos.'
      },
      {
        title: 'Pregúntale a tu Negocio en Español',
        desc: 'Escribe dudas como: “¿Qué se vendió menos este mes?” y recibe la respuesta con números y gráficas al momento.'
      }
    ],
    proofProject: 'Paneles de Datos & Reportes',
    proofExplanation: 'Sistemas que conectan tus registros diarios para convertirlos en gráficas y respuestas comprensibles para cualquier persona.',
    actionLabel: 'Consultar solución',
    actionType: 'copilot',
    actionPayload: '¿Cómo podemos crear reportes automáticos por WhatsApp y un chat para consultar los datos de mi negocio?'
  }
];

export const BusinessSolutions: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [expandedTouchIds, setExpandedTouchIds] = useState<Record<string, boolean>>({
    'case-whatsapp': true // En móvil el primer caso abierto para educar el tap
  });

  const toggleMobileExpand = (id: string) => {
    setExpandedTouchIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAction = (c: BusinessCase, e: React.MouseEvent) => {
    e.stopPropagation();
    if (c.actionType === 'copilot') {
      window.dispatchEvent(
        new CustomEvent('open-copilot-chat', {
          detail: { prompt: c.actionPayload }
        })
      );
    } else if (c.actionType === 'inspect' && c.actionPayload) {
      window.dispatchEvent(
        new CustomEvent('open-inspect-modal', {
          detail: { projectKey: c.actionPayload }
        })
      );
    }
  };

  return (
    <section className="flex flex-col gap-6" id="soluciones">
      {/* Título de la sección limpio y directo */}
      <div className="flex flex-col gap-1 max-w-2xl">
        <span className="font-mono text-xs text-[#c084fc] font-medium tracking-wide">
          [ Soluciones para tu negocio ]
        </span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8F4E9] tracking-tight">
          ¿Qué problema quieres resolver hoy?
        </h2>
        <p className="text-xs sm:text-sm text-[rgba(246,219,192,0.7)] leading-relaxed">
          Toca cada tarjeta para ver la solución y el proyecto donde está comprobado.
        </p>
      </div>

      {/* Grid Minimalista de 4 Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {BUSINESS_CASES.map((bCase) => {
          const isHovered = hoveredId === bCase.id;
          const isTouchExpanded = !!expandedTouchIds[bCase.id];
          const isExpanded = isHovered || isTouchExpanded;

          return (
            <div
              key={bCase.id}
              onMouseEnter={() => setHoveredId(bCase.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => toggleMobileExpand(bCase.id)}
              className={`flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[rgba(32,19,36,0.65)] backdrop-blur-md border ${
                isExpanded ? bCase.activeBorderColor : bCase.borderColor
              } transition-all duration-200 cursor-pointer group`}
            >
              {/* Parte superior */}
              <div className="flex flex-col gap-3.5 sm:gap-4">
                {/* Categoría e Icono */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-md ${bCase.badgeBg}`}>
                    {bCase.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                      {bCase.icon}
                    </div>
                    {/* Indicador táctil para móviles */}
                    <span className="sm:hidden text-[rgba(246,219,192,0.5)]">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isTouchExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </div>
                </div>

                {/* La voz del cliente en grande y clara */}
                <h3 className="text-base sm:text-xl font-medium text-[#F8F4E9] leading-snug">
                  {bCase.customerPain}
                </h3>

                {/* Lista de soluciones: título visible, detalle se despliega en hover o tap */}
                <div className="flex flex-col gap-2.5 pt-1">
                  {bCase.solutions.map((sol, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        isExpanded
                          ? 'bg-[rgba(20,10,24,0.7)] border border-[rgba(147,80,115,0.3)]'
                          : 'bg-[rgba(20,10,24,0.3)] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#F8F4E9]">
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span>{sol.title}</span>
                      </div>

                      {/* Explicación en lenguaje claro */}
                      <div
                        className={`overflow-hidden transition-all duration-200 ease-in-out ${
                          isExpanded ? 'max-h-28 opacity-100 mt-1.5' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="text-xs text-[rgba(246,219,192,0.8)] leading-relaxed pl-5.5">
                          {sol.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parte inferior: Respaldo y Botón de acción */}
              <div className="mt-4 sm:mt-5 pt-3.5 border-t border-[rgba(147,80,115,0.2)] flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-mono text-[rgba(246,219,192,0.7)]">
                    Comprobado en: <span className="text-[#F8F4E9] font-medium">{bCase.proofProject}</span>
                  </div>

                  {/* Explicación sencilla sin tecnicismos */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out ${
                      isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-xs text-[rgba(246,219,192,0.65)] leading-relaxed">
                      {bCase.proofExplanation}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={(e) => handleAction(bCase, e)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-1.5 rounded-lg bg-[rgba(80,45,85,0.35)] hover:bg-[#c084fc] text-[#F8F4E9] hover:text-[#500989] border border-[rgba(147,80,115,0.3)] hover:border-[#c084fc] font-mono text-xs font-semibold transition-colors duration-150 active:scale-95 cursor-pointer min-h-[42px] sm:min-h-0"
                  >
                    <span>{bCase.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
