import React, { useState, useEffect, useRef } from "react";

interface Testimonial {
  id: string;
  system: string;
  author_name: string;
  author_role: string;
  before: string;
  after: string;
  extra_comments?: string;
  headline: string;
  approved: boolean;
  created_at: string;
}

const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-1",
    system: "Tetring",
    author_name: "Elena M.",
    author_role: "Gerente de Finanzas y Control de Gestión",
    before: "El equipo dedicaba más de 35 horas semanales a cotejar facturas PDF a mano en hojas de cálculo, con un margen de error del 8% en capturas.",
    after: "Extrajimos 12.000 facturas sin intervención manual. La conciliación bajó a segundos y el margen de error se redujo a cero este trimestre.",
    extra_comments: "La interfaz es intuitiva y el OCR determinista ahorra semanas enteras de auditoría tributaria.",
    headline: "De 35h semanales a conciliación instantánea en 12.000 facturas",
    approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: "seed-2",
    system: "Graphito",
    author_name: "Carlos R.",
    author_role: "Director de Operaciones y Logística",
    before: "Para resolver cuellos de botella en rutas de distribución nos tomaba 40 minutos evaluar manualmente grafos y árboles de decisión en papel.",
    after: "El evaluador de grafos redujo el análisis de 40 minutos a 1.2 segundos con visualización interactiva en tiempo real.",
    extra_comments: "Ver los nodos iluminarse y recalcular la ruta óptima en segundos nos dio control absoluto de nuestras operaciones.",
    headline: "Reducción de 40 min a 1.2s en optimización de rutas operativas",
    approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: "seed-3",
    system: "PAIDEA",
    author_name: "Marcos T.",
    author_role: "Tech Lead & Enterprise Architect",
    before: "Los modelos de lenguaje comerciales alucinaban respuestas ambiguas al consultar manuales técnicos internos de más de 800 páginas.",
    after: "La arquitectura RAG con ChromaDB responde con fuentes exactas y cero alucinaciones con latencia menor a 400ms.",
    extra_comments: "Es el primer sistema de agentes que podemos desplegar a producción sin miedo a respuestas inventadas.",
    headline: "Consultas técnicas de 800 págs en <400ms con cero alucinaciones",
    approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: "seed-4",
    system: "Paralel",
    author_name: "Sofía V.",
    author_role: "Científica de Datos y Rendimiento",
    before: "Nuestros scripts en Python tardaban más de 2 horas en procesar simulaciones masivas de datos debido al bloqueo del GIL y ejecución secuencial.",
    after: "Con el runtime concurrente en C++ paralelizado, el tiempo de ejecución cayó de 2 horas a solo 4 minutos.",
    extra_comments: "Aprovecha al máximo todos los núcleos de CPU del servidor sin complejidad innecesaria en el código.",
    headline: "Simulaciones masivas de 2 horas reducidas a 4 minutos en C++",
    approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: "seed-5",
    system: "Tetring",
    author_name: "Rodrigo A.",
    author_role: "Fundador de Startup B2B",
    before: "Perdíamos contratos porque tardábamos 3 días en emitir estados de cuenta validados para nuestros clientes corporativos.",
    after: "Ahora el pipeline procesa y valida los balances en menos de 10 segundos directamente desde la web.",
    extra_comments: "Excelente solución. Nos permitió cerrar clientes corporativos que exigían validación inmediata sin esperas.",
    headline: "Validación de balances corporativos de 3 días a 10 segundos",
    approved: true,
    created_at: new Date().toISOString()
  }
];

export default function TestimonialsInteractive() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(SEED_TESTIMONIALS);

  // Modales
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Testimonial | null>(null);

  // Formulario nuevo veredicto
  const [formSystem, setFormSystem] = useState("Graphito");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formBefore, setFormBefore] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [formExtra, setFormExtra] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Moderación Admin
  const [adminToken, setAdminToken] = useState("");
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [adminList, setAdminList] = useState<Testimonial[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // --- Animación GPU-accelerated con Translate3d y Física de Inercia ---
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSetRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const offsetRef = useRef(0);
  const speedRef = useRef(0.45);
  const targetSpeedRef = useRef(0.45);
  const lastXRef = useRef(0);
  const dragVelocityRef = useRef(0);

  // Cargar testimonios aprobados de la API
  const fetchApproved = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/testimonials");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTestimonials(data);
        }
      }
    } catch {
      // Fallback local garantizado
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  // Animación continua mediante translate3d acelerado por GPU (cero temblores / cero reflow)
  useEffect(() => {
    let animId: number;

    const animate = () => {
      const track = trackRef.current;
      const firstSet = firstSetRef.current;

      if (track && firstSet) {
        const singleSetWidth = firstSet.offsetWidth + 20; // 20px gap

        if (!isDraggingRef.current) {
          targetSpeedRef.current = isHoveredRef.current ? 0 : 0.45;

          // Amortiguación hacia velocidad objetivo con inercia suave
          speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.05;

          // Inercia de arrastre
          if (Math.abs(dragVelocityRef.current) > 0.05) {
            speedRef.current += dragVelocityRef.current;
            dragVelocityRef.current *= 0.92;
          }

          if (Math.abs(speedRef.current) > 0.005) {
            offsetRef.current += speedRef.current;

            // Bucle continuo matemáticamente perfecto
            if (singleSetWidth > 0) {
              if (offsetRef.current >= singleSetWidth) {
                offsetRef.current -= singleSetWidth;
              } else if (offsetRef.current < 0) {
                offsetRef.current += singleSetWidth;
              }
            }

            track.style.transform = `translate3d(-${offsetRef.current.toFixed(2)}px, 0, 0)`;
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [testimonials]);

  // Manejo de arrastre con mouse o touch
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    dragStartOffsetRef.current = offsetRef.current;
    lastXRef.current = e.pageX;
    dragVelocityRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const delta = e.pageX - startXRef.current;
    offsetRef.current = dragStartOffsetRef.current - delta;

    dragVelocityRef.current = (lastXRef.current - e.pageX) * 0.35;
    lastXRef.current = e.pageX;

    trackRef.current.style.transform = `translate3d(-${offsetRef.current.toFixed(2)}px, 0, 0)`;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Envío del nuevo veredicto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBefore.trim() || !formAfter.trim()) return;

    setSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: formSystem,
          author_name: formName.trim() || "Usuario Verificado",
          author_role: formRole.trim() || "Evaluador de Sistema",
          before: formBefore.trim(),
          after: formAfter.trim(),
          extra_comments: formExtra.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitFeedback(
          `¡Veredicto registrado! La IA sintetizó el titular: "${data.headline}". Se publicará tras la revisión de Erick.`
        );
        setFormBefore("");
        setFormAfter("");
        setFormName("");
        setFormRole("");
        setFormExtra("");
      } else {
        setSubmitFeedback("Ocurrió un error al enviar el veredicto. Revisa los datos e intenta de nuevo.");
      }
    } catch {
      setSubmitFeedback("No se pudo conectar con el servidor local de base de datos.");
    } finally {
      setSubmitting(false);
    }
  };

  // Moderación Admin
  const fetchAdminTestimonials = async (token: string) => {
    setAdminLoading(true);
    setAdminMsg(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/testimonials/admin", {
        headers: { "X-Admin-Token": token }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminList(data);
        setAdminToken(token);
      } else {
        setAdminMsg("Clave de administrador incorrecta.");
      }
    } catch {
      setAdminMsg("Error al conectar con el servidor.");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApprove = async (id: string, customHeadline?: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/testimonials/admin/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken
        },
        body: JSON.stringify({ headline: customHeadline })
      });
      if (res.ok) {
        fetchAdminTestimonials(adminToken);
        fetchApproved();
      }
    } catch {
      alert("Error al aprobar testimonio");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas descartar este veredicto?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/testimonials/admin/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": adminToken }
      });
      if (res.ok) {
        fetchAdminTestimonials(adminToken);
        fetchApproved();
      }
    } catch {
      alert("Error al eliminar testimonio");
    }
  };

  // Render individual de una tarjeta con altura fija uniforme (previene layout shift)
  const renderCard = (item: Testimonial, key: string) => (
    <div
      key={key}
      onClick={() => setSelectedCard(item)}
      className="w-[330px] sm:w-[390px] h-[370px] shrink-0 p-5 rounded-2xl bg-[rgba(35,23,39,0.85)] border border-[rgba(147,80,115,0.35)] backdrop-blur-md flex flex-col justify-between transition-all duration-200 hover:border-[#c084fc] hover:shadow-[0_8px_30px_rgba(192,132,252,0.16)] group cursor-pointer relative"
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(147,80,115,0.25)] font-mono text-xs">
        <span className="px-2.5 py-0.5 rounded bg-[rgba(16,185,129,0.12)] text-[#10B981] font-semibold border border-[rgba(16,185,129,0.3)]">
          [ Sistema: {item.system} ]
        </span>
        <span className="text-[#c084fc] font-bold text-sm">“</span>
      </div>

      {/* Titular de impacto generado por LLM */}
      <div className="my-2">
        <h4 className="text-base sm:text-lg font-semibold text-[#F8F4E9] leading-snug group-hover:text-[#ddb8ff] transition-colors line-clamp-2">
          {item.headline}
        </h4>
      </div>

      {/* Sección central con scroll interno suave y limpio */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 my-1 pr-1">
        <div className="p-2.5 rounded-lg bg-[rgba(255,95,86,0.08)] border border-[rgba(255,95,86,0.25)] text-xs text-[#F6DBC0]">
          <span className="font-mono text-[#ff5f56] font-bold block text-[10px] mb-0.5">
            [ 🔴 Antes del sistema ]
          </span>
          <p className="leading-relaxed italic line-clamp-3">"{item.before}"</p>
        </div>

        <div className="p-2.5 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] text-xs text-[#F6DBC0]">
          <span className="font-mono text-[#10B981] font-bold block text-[10px] mb-0.5">
            [ 🟢 Ahora con la herramienta ]
          </span>
          <p className="leading-relaxed line-clamp-3">"{item.after}"</p>
        </div>

        {item.extra_comments && (
          <div className="p-2.5 rounded-lg bg-[rgba(192,132,252,0.08)] border border-[rgba(192,132,252,0.25)] text-xs text-[#F8F4E9]">
            <span className="font-mono text-[#c084fc] font-bold block text-[10px] mb-0.5">
              [ ✦ Comentario adicional ]
            </span>
            <p className="leading-relaxed line-clamp-2">"{item.extra_comments}"</p>
          </div>
        )}
      </div>

      {/* Pie de tarjeta */}
      <div className="pt-2.5 border-t border-[rgba(147,80,115,0.2)] flex items-center justify-between text-xs mt-1 shrink-0">
        <div className="flex flex-col max-w-[70%]">
          <span className="font-semibold text-[#F8F4E9] truncate">{item.author_name}</span>
          <span className="text-[11px] text-[rgba(246,219,192,0.65)] font-mono truncate">
            {item.author_role}
          </span>
        </div>

        <span className="text-[10px] font-mono text-[#c084fc] opacity-80 group-hover:opacity-100 transition-opacity">
          [ ver completo ↗ ]
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Barra superior de acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-[#F6DBC0] max-w-xl leading-relaxed">
          Comentarios reales de personas y equipos. Haz clic en cualquier tarjeta para leer el veredicto completo o comparte tu propia experiencia.
        </p>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Dejar mi veredicto</span>
          </button>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2.5 rounded-lg bg-[rgba(80,45,85,0.24)] hover:bg-[rgba(80,45,85,0.4)] border border-[rgba(147,80,115,0.3)] text-[rgba(246,219,192,0.65)] hover:text-[#F8F4E9] transition-all text-xs font-mono cursor-pointer"
            title="Panel de moderación (Erick)"
          >
            ⚙ Moderar
          </button>
        </div>
      </div>

      {/* Riel Horizontal Continuo con Física de Inercia y Aceleración por GPU */}
      <div
        className="relative w-full overflow-hidden py-3 select-none cursor-grab active:cursor-grabbing"
        onMouseEnter={() => (isHoveredRef.current = true)}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          handleMouseUp();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Sombras laterales de desvanecimiento */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[rgba(21,10,25,0.95)] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[rgba(21,10,25,0.95)] to-transparent z-10" />

        {/* Track interior con Translate3d acelerado por hardware */}
        <div
          ref={trackRef}
          className="flex items-center gap-5 py-2"
          style={{ willChange: "transform" }}
        >
          {/* Primer set de tarjetas (originales) */}
          <div ref={firstSetRef} className="flex items-center gap-5 shrink-0">
            {testimonials.map((item, idx) => renderCard(item, `first-${item.id}-${idx}`))}
          </div>

          {/* Segundo set de tarjetas (duplicadas para loop continuo sin cortes) */}
          <div className="flex items-center gap-5 shrink-0" aria-hidden="true">
            {testimonials.map((item, idx) => renderCard(item, `second-${item.id}-${idx}`))}
          </div>
        </div>
      </div>

      {/* MODAL 1: Lectura de Veredicto Completo */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[rgba(26,15,30,0.98)] border border-[rgba(147,80,115,0.45)] shadow-2xl p-6 sm:p-8 flex flex-col gap-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.25)] font-mono text-xs">
              <span className="px-2.5 py-0.5 rounded bg-[rgba(16,185,129,0.12)] text-[#10B981] font-semibold border border-[rgba(16,185,129,0.3)]">
                [ Sistema: {selectedCard.system} ]
              </span>
              <button
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 rounded-lg bg-[rgba(80,45,85,0.2)] hover:bg-[rgba(80,45,85,0.4)] text-[#F6DBC0] flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <span className="font-mono text-xs text-[#c084fc]">// TITULAR SINTETIZADO POR IA</span>
              <h3 className="text-xl font-semibold text-[#F8F4E9] mt-1 leading-snug">
                {selectedCard.headline}
              </h3>
            </div>

            <div className="flex flex-col gap-3 my-2">
              <div className="p-3.5 rounded-xl bg-[rgba(255,95,86,0.08)] border border-[rgba(255,95,86,0.25)] text-xs text-[#F6DBC0]">
                <strong className="font-mono text-[#ff5f56] block mb-1.5">[ 🔴 ¿Cómo era el proceso antes? ]</strong>
                <p className="leading-relaxed italic">"{selectedCard.before}"</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] text-xs text-[#F6DBC0]">
                <strong className="font-mono text-[#10B981] block mb-1.5">[ 🟢 ¿Cómo es ahora con la herramienta? ]</strong>
                <p className="leading-relaxed">"{selectedCard.after}"</p>
              </div>

              {selectedCard.extra_comments && (
                <div className="p-3.5 rounded-xl bg-[rgba(192,132,252,0.08)] border border-[rgba(192,132,252,0.25)] text-xs text-[#F8F4E9]">
                  <strong className="font-mono text-[#c084fc] block mb-1.5">[ ✦ Comentarios adicionales del evaluador ]</strong>
                  <p className="leading-relaxed">"{selectedCard.extra_comments}"</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[rgba(147,80,115,0.2)] flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-semibold text-[#F8F4E9]">{selectedCard.author_name}</span>
                <span className="text-[11px] text-[rgba(246,219,192,0.65)] font-mono">
                  {selectedCard.author_role}
                </span>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 rounded-lg bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.5)] text-[#F8F4E9] font-mono text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Dejar mi veredicto */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[rgba(26,15,30,0.98)] border border-[rgba(147,80,115,0.45)] shadow-2xl p-6 sm:p-8 flex flex-col gap-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.25)]">
              <div>
                <span className="font-mono text-xs text-[#c084fc]">[ VEREDICTO DE USUARIO ]</span>
                <h3 className="text-xl font-semibold text-[#F8F4E9]">Dejar mi veredicto</h3>
              </div>
              <button
                onClick={() => {
                  setIsSubmitOpen(false);
                  setSubmitFeedback(null);
                }}
                className="w-8 h-8 rounded-lg bg-[rgba(80,45,85,0.2)] hover:bg-[rgba(80,45,85,0.4)] text-[#F6DBC0] flex items-center justify-center font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submitFeedback ? (
              <div className="p-4 rounded-xl bg-[rgba(16,185,129,0.1)] border border-[#10B981]/30 flex flex-col gap-3">
                <span className="font-mono text-sm text-[#10B981] font-semibold">
                  ✓ Veredicto Registrado
                </span>
                <p className="text-sm text-[#F6DBC0] leading-relaxed">{submitFeedback}</p>
                <button
                  onClick={() => setIsSubmitOpen(false)}
                  className="mt-2 px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#042f2e] font-mono text-xs font-bold cursor-pointer"
                >
                  Entendido, cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Sistema */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-[#F6DBC0]">Sistema evaluado:</label>
                  <select
                    value={formSystem}
                    onChange={(e) => setFormSystem(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] font-mono text-xs focus:border-[#c084fc] outline-none"
                  >
                    <option value="Graphito">Graphito (Visualizador de Grafos IA)</option>
                    <option value="Tetring">Tetring (Conciliación y Extracción de Facturas)</option>
                    <option value="PAIDEA">PAIDEA (Agentes IA con Base de Conocimiento)</option>
                    <option value="Paralel">Paralel (Ejecución y Cómputo Concurrente)</option>
                  </select>
                </div>

                {/* Nombre y Ocupación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs text-[#F6DBC0]">Tu nombre:</label>
                      <span className="text-[10px] font-mono text-[rgba(246,219,192,0.5)]">
                        {formName.length}/50
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={50}
                      placeholder="ej. Elena M. (opcional)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#c084fc] outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-mono text-xs text-[#F6DBC0]">Ocupación / Cargo:</label>
                      <span className="text-[10px] font-mono text-[rgba(246,219,192,0.5)]">
                        {formRole.length}/60
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="ej. Gerente de Finanzas (opcional)"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#c084fc] outline-none"
                    />
                  </div>
                </div>

                {/* ¿Cómo era el proceso antes? */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs text-[#ff5f56]">
                      ¿Cómo era el proceso antes? (El problema o lentitud):
                    </label>
                    <span className={`text-[10px] font-mono ${formBefore.length > 270 ? "text-[#ff5f56]" : "text-[rgba(246,219,192,0.5)]"}`}>
                      {formBefore.length}/300
                    </span>
                  </div>
                  <textarea
                    required
                    rows={2}
                    maxLength={300}
                    placeholder="ej. Tardábamos 35 horas semanales a mano revisando facturas en Excel con alto margen de error..."
                    value={formBefore}
                    onChange={(e) => setFormBefore(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#ff5f56] outline-none resize-none"
                  />
                </div>

                {/* ¿Cómo era el proceso después? */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs text-[#10B981]">
                      ¿Cómo era el proceso después con la herramienta?:
                    </label>
                    <span className={`text-[10px] font-mono ${formAfter.length > 270 ? "text-[#10B981]" : "text-[rgba(246,219,192,0.5)]"}`}>
                      {formAfter.length}/300
                    </span>
                  </div>
                  <textarea
                    required
                    rows={2}
                    maxLength={300}
                    placeholder="ej. Se extrajeron 12.000 documentos sin fallas y la validación bajó a solo 1.2 segundos..."
                    value={formAfter}
                    onChange={(e) => setFormAfter(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#10B981] outline-none resize-none"
                  />
                </div>

                {/* Espacio libre */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs text-[#ddb8ff]">
                      Espacio libre para escribir lo que quieras (opcional):
                    </label>
                    <span className="text-[10px] font-mono text-[rgba(246,219,192,0.5)]">
                      {formExtra.length}/400
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={400}
                    placeholder="ej. Reflexión general, facilidad de integración, recomendaciones al equipo..."
                    value={formExtra}
                    onChange={(e) => setFormExtra(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#c084fc] outline-none resize-none"
                  />
                </div>

                {/* Botones de acción */}
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-[rgba(147,80,115,0.3)] text-[#F6DBC0] font-mono text-xs hover:bg-[rgba(80,45,85,0.2)] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3 h-3 rounded-full border-2 border-[#500989] border-t-transparent animate-spin" />
                        <span>Sintetizando titular con IA...</span>
                      </>
                    ) : (
                      <span>[ Enviar mi veredicto ↗ ]</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Moderación Admin (Erick) */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[rgba(26,15,30,0.98)] border border-[rgba(147,80,115,0.45)] shadow-2xl p-6 sm:p-8 flex flex-col gap-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.25)]">
              <div>
                <span className="font-mono text-xs text-[#10B981]">[ PANEL DE CONTROL ]</span>
                <h3 className="text-xl font-semibold text-[#F8F4E9]">Moderar Veredictos</h3>
              </div>
              <button
                onClick={() => setIsAdminOpen(false)}
                className="w-8 h-8 rounded-lg bg-[rgba(80,45,85,0.2)] hover:bg-[rgba(80,45,85,0.4)] text-[#F6DBC0] flex items-center justify-center font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!adminToken ? (
              <div className="flex flex-col gap-4 py-4">
                <p className="text-xs text-[#F6DBC0] leading-relaxed">
                  Ingresa tu clave maestra de administrador para revisar, editar titulares y aprobar testimonios.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Clave maestra (por defecto: erick-admin-2026)"
                    value={adminTokenInput}
                    onChange={(e) => setAdminTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchAdminTestimonials(adminTokenInput)}
                    className="flex-1 p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] font-mono text-xs focus:border-[#c084fc] outline-none"
                  />
                  <button
                    onClick={() => fetchAdminTestimonials(adminTokenInput)}
                    disabled={adminLoading}
                    className="px-4 py-2.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {adminLoading ? "Validando..." : "Ingresar"}
                  </button>
                </div>
                {adminMsg && <span className="font-mono text-xs text-[#ff5f56]">{adminMsg}</span>}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono text-[rgba(246,219,192,0.65)]">
                  <span>Total registrados: {adminList.length}</span>
                  <button
                    onClick={() => fetchAdminTestimonials(adminToken)}
                    className="text-[#c084fc] hover:underline cursor-pointer"
                  >
                    ↻ Actualizar lista
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {adminList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[rgba(35,23,39,0.7)] border border-[rgba(147,80,115,0.25)] flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[#10B981] font-semibold">
                          {item.system} · {item.author_name} ({item.author_role})
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                            item.approved
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {item.approved ? "APROBADO" : "PENDIENTE"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[11px] text-[#c084fc]">Titular LLM:</span>
                        <input
                          type="text"
                          defaultValue={item.headline}
                          id={`headline-input-${item.id}`}
                          className="p-2 rounded bg-[rgba(21,10,25,0.8)] border border-[rgba(147,80,115,0.3)] text-xs text-[#F8F4E9]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#F6DBC0]">
                        <div className="p-2 rounded bg-[rgba(255,95,86,0.06)] border border-[rgba(255,95,86,0.2)]">
                          <strong className="text-[#ff5f56] block text-[10px] font-mono">Antes:</strong>
                          <p>{item.before}</p>
                        </div>
                        <div className="p-2 rounded bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.2)]">
                          <strong className="text-[#10B981] block text-[10px] font-mono">Ahora:</strong>
                          <p>{item.after}</p>
                        </div>
                      </div>

                      {item.extra_comments && (
                        <div className="p-2 rounded bg-[rgba(192,132,252,0.06)] border border-[rgba(192,132,252,0.2)] text-xs text-[#F8F4E9]">
                          <strong className="text-[#c084fc] block text-[10px] font-mono">Espacio libre:</strong>
                          <p>{item.extra_comments}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(147,80,115,0.2)]">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 rounded bg-[rgba(255,95,86,0.15)] hover:bg-[rgba(255,95,86,0.3)] text-[#ff5f56] font-mono text-xs cursor-pointer"
                        >
                          ✕ Descartar
                        </button>
                        {!item.approved && (
                          <button
                            onClick={() => {
                              const input = document.getElementById(
                                `headline-input-${item.id}`
                              ) as HTMLInputElement;
                              handleApprove(item.id, input ? input.value : item.headline);
                            }}
                            className="px-3 py-1.5 rounded bg-[#10B981] hover:bg-[#34D399] text-[#042f2e] font-mono text-xs font-bold cursor-pointer"
                          >
                            ✓ Aprobar y Publicar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
