import React, { useState, useEffect, useRef, useMemo } from "react";
import { PROJECTS } from "../data/projects";

const API_BASE = import.meta.env.PUBLIC_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

const formatProjectOption = (proj: { code?: string; title: string; shortDesc?: string }) => {
  const codePrefix = proj.code ? `[0${parseInt(proj.code, 10)}] ` : "";
  if (!proj.shortDesc) return `${codePrefix}${proj.title}`;
  const firstClause = proj.shortDesc.split(/[,.]/)[0].trim();
  if (firstClause.length <= 48) {
    return `${codePrefix}${proj.title} — ${firstClause}`;
  }
  const truncated = firstClause.slice(0, 45).replace(/\s+\S*$/, "");
  return `${codePrefix}${proj.title} — ${truncated}...`;
};

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

export default function TestimonialsInteractive() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Lista circular infinita: 5 bloques continuos (2 a la izquierda, Set 2 al centro, 2 a la derecha)
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [cardStep, setCardStep] = useState(410);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isMovingRef = useRef(false);
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const N = testimonials.length;
  const isCarousel = N > visibleCount;
  const activeIndex = N > 0 ? ((displayIndex % N) + N) % N : 0;

  // 5 conjuntos idénticos para tener margen de sobra a ambos lados y evitar cualquier hueco
  const displayItems = useMemo(() => {
    if (testimonials.length === 0) return [];
    return [
      ...testimonials.map((t, i) => ({ ...t, _virtualKey: `set0-${t.id}-${i}` })),
      ...testimonials.map((t, i) => ({ ...t, _virtualKey: `set1-${t.id}-${i}` })),
      ...testimonials.map((t, i) => ({ ...t, _virtualKey: `set2-${t.id}-${i}` })),
      ...testimonials.map((t, i) => ({ ...t, _virtualKey: `set3-${t.id}-${i}` })),
      ...testimonials.map((t, i) => ({ ...t, _virtualKey: `set4-${t.id}-${i}` }))
    ];
  }, [testimonials]);

  // Medir ancho dinámico de la tarjeta y cuántas caben completas sin cortarse
  useEffect(() => {
    const updateDimensions = () => {
      if (cardRef.current) {
        const width = cardRef.current.getBoundingClientRect().width;
        if (width > 0) {
          const step = width + 20;
          setCardStep(step);
          if (containerRef.current) {
            const containerWidth = containerRef.current.getBoundingClientRect().width;
            const count = Math.max(1, Math.floor((containerWidth + 10) / step));
            setVisibleCount(count);
          }
        }
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [testimonials]);

  // Reposicionamiento silencioso e imperceptible al terminar la animación CSS
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== trackRef.current) return;
    isMovingRef.current = false;
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (!isCarousel) return;

    // Si cruzamos al set 3 o más hacia la derecha (>= 3 * N)
    // O si cruzamos al set 1 o menos hacia la izquierda (< 2 * N):
    // Nos reposicionamos instantáneamente en el Set 2 usando módulo normalizado
    if (displayIndex >= 3 * N || displayIndex < 2 * N) {
      setIsTransitioning(false);
      const normalized = ((displayIndex % N) + N) % N;
      setDisplayIndex(2 * N + normalized);
    }
  };

  // Re-activar la transición en el siguiente frame tras el salto invisible
  useEffect(() => {
    if (!isTransitioning) {
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
      return () => cancelAnimationFrame(r1);
    }
  }, [isTransitioning]);

  // Modales
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Formulario nuevo veredicto - Vinculado automáticamente al catálogo de proyectos del carrusel
  const defaultSystem = PROJECTS.find((p) => p.title.toLowerCase().includes("wiki"))?.title || PROJECTS[0]?.title || "Wiki Assistant";
  const [formSystem, setFormSystem] = useState(defaultSystem);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formBefore, setFormBefore] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [formExtra, setFormExtra] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Escuchar si se desea abrir el formulario para evaluar un proyecto específico
  useEffect(() => {
    const handleOpenWithSystem = (e: CustomEvent<{ system?: string }>) => {
      if (e.detail?.system) {
        setFormSystem(e.detail.system);
      }
      setIsSubmitOpen(true);
    };
    window.addEventListener("open-testimonial-modal" as any, handleOpenWithSystem);
    return () => window.removeEventListener("open-testimonial-modal" as any, handleOpenWithSystem);
  }, []);

  // Moderación Admin
  const [adminToken, setAdminToken] = useState("");
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [adminList, setAdminList] = useState<Testimonial[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Cargar testimonios aprobados de la API
  const fetchApproved = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/testimonials`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTestimonials(data);
          setDisplayIndex(data.length > 0 ? 2 * data.length : 0);
        }
      }
    } catch {
      // Fallback local asegurado
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  // Transición controlada con seguro anti-solapamiento (lock)
  const startSlide = (newIndex: number) => {
    if (isMovingRef.current || !isCarousel) return;
    isMovingRef.current = true;
    setIsTransitioning(true);
    setDisplayIndex(newIndex);

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      isMovingRef.current = false;
    }, 700);
  };

  const nextSlide = () => {
    if (isMovingRef.current || !isCarousel) return;
    startSlide(displayIndex + 1);
  };

  const prevSlide = () => {
    if (isMovingRef.current || !isCarousel) return;
    startSlide(displayIndex - 1);
  };

  const goToSlide = (targetIndex: number) => {
    if (isMovingRef.current || !isCarousel) return;
    startSlide(2 * N + targetIndex);
  };

  // Intervalo de auto-avance con pausa (Slide -> Pausa de 5s -> Slide)
  useEffect(() => {
    if (isPaused || expandedId !== null || !isCarousel) return;

    const timer = setInterval(() => {
      if (!isMovingRef.current) {
        startSlide(displayIndex + 1);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, expandedId, displayIndex, isCarousel]);

  // Soporte para gestos táctiles (Swipe) y rueda de ratón (Wheel / Scroll horizontal)
  const isDraggingTestimonials = useRef(false);
  const dragStartX = useRef(0);
  const lastWheelTime = useRef(0);

  const handleTestimonialWheel = (e: React.WheelEvent) => {
    if (!isCarousel || isMovingRef.current) return;
    const now = Date.now();
    if (now - lastWheelTime.current < 550) return;

    if (Math.abs(e.deltaX) > 15 || (e.shiftKey && Math.abs(e.deltaY) > 15)) {
      const delta = Math.abs(e.deltaX) > 15 ? e.deltaX : e.deltaY;
      if (delta > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      lastWheelTime.current = now;
    }
  };

  // Soporte dual táctil (Touch Events nativos + Pointer Events para desktop)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, a, textarea, input')) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isCarousel || isMovingRef.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if ((e.target as HTMLElement).closest('button, a, textarea, input')) return;
    isDraggingTestimonials.current = true;
    dragStartX.current = e.clientX;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingTestimonials.current || e.pointerType === 'touch' || !isCarousel || isMovingRef.current) return;
    const distance = dragStartX.current - e.clientX;
    if (Math.abs(distance) > 40) {
      if (distance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      isDraggingTestimonials.current = false;
    }
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    isDraggingTestimonials.current = false;
    if (e) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Envío del nuevo veredicto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBefore.trim() || !formAfter.trim()) return;

    setSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/testimonials`, {
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
        setFormSystem(defaultSystem);
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
      const res = await fetch(`${API_BASE}/api/v1/testimonials/admin`, {
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
      const res = await fetch(`${API_BASE}/api/v1/testimonials/admin/${id}/approve`, {
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
      const res = await fetch(`${API_BASE}/api/v1/testimonials/admin/${id}`, {
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

  // Renderizador unificado de tarjeta de testimonio
  const renderCard = (
    item: Testimonial,
    isExpanded: boolean,
    isDimmed: boolean,
    isFullyVisible: boolean,
    key: string,
    setRef?: boolean,
    idx?: number
  ) => {
    return (
      <div
        key={key}
        ref={setRef ? cardRef : undefined}
        onMouseEnter={() => {
          if (isFullyVisible) {
            setExpandedId(item.id);
          }
          setIsPaused(true);
        }}
        onMouseLeave={() => {
          if (isFullyVisible) {
            setExpandedId(null);
          }
          setIsPaused(false);
        }}
        onClick={() => {
          if (!isFullyVisible && idx !== undefined) {
            if (idx >= displayIndex + visibleCount) {
              nextSlide();
            } else if (idx < displayIndex) {
              prevSlide();
            }
            return;
          }
          setExpandedId(isExpanded ? null : item.id);
        }}
        className={`w-[315px] sm:w-[360px] lg:w-[375px] shrink-0 p-5 rounded-2xl backdrop-blur-md flex flex-col justify-between min-h-[220px] sm:min-h-[235px] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] origin-center group cursor-pointer relative ${
          isExpanded
            ? "scale-[1.02] sm:scale-[1.04] z-30 border-[#c084fc] shadow-[0_14px_36px_rgba(0,0,0,0.55),0_0_20px_rgba(192,132,252,0.18)] bg-[rgba(38,20,46,0.98)] ring-1 ring-[#c084fc]/40 opacity-100"
            : isDimmed
            ? "scale-[0.98] opacity-60 border-[rgba(147,80,115,0.2)] bg-[rgba(28,16,32,0.7)] z-0"
            : !isFullyVisible
            ? "opacity-45 hover:opacity-80 scale-[0.97] border-[rgba(147,80,115,0.2)] bg-[rgba(26,14,30,0.6)] z-0"
            : "scale-100 opacity-100 hover:border-[#c084fc]/60 hover:shadow-[0_8px_30px_rgba(192,132,252,0.12)] border-[rgba(147,80,115,0.35)] bg-[rgba(35,23,39,0.88)] z-10"
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.25)] font-mono text-xs shrink-0">
          <span className="px-2.5 py-0.5 rounded bg-[rgba(16,185,129,0.12)] text-[#10B981] font-semibold border border-[rgba(16,185,129,0.3)]">
            [ Sistema: {item.system} ]
          </span>
          <span className="text-[#c084fc] font-bold text-sm">“</span>
        </div>

        {/* Titular centrado verticalmente para altura uniforme */}
        <div className="my-auto py-2">
          <h4 className="text-base sm:text-lg font-semibold text-[#F8F4E9] leading-snug group-hover:text-[#ddb8ff] transition-colors line-clamp-3">
            "{item.headline}"
          </h4>
        </div>

        {/* Contenido expandible SOLO al hacer Hover o Toque */}
        <div
          className={`overflow-hidden transition-all duration-400 ease-out flex flex-col gap-2.5 ${
            isExpanded ? "max-h-[500px] opacity-100 my-2 pt-2 border-t border-[rgba(147,80,115,0.2)]" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3 rounded-lg bg-[rgba(255,95,86,0.08)] border border-[rgba(255,95,86,0.25)] text-xs text-[#F6DBC0]">
            <span className="font-mono text-[#ff5f56] font-bold block text-[10px] mb-1">
              [ 🔴 Cómo era el proceso antes ]
            </span>
            <p className="leading-relaxed italic">"{item.before}"</p>
          </div>

          <div className="p-3 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] text-xs text-[#F6DBC0]">
            <span className="font-mono text-[#10B981] font-bold block text-[10px] mb-1">
              [ 🟢 Cómo es ahora con la herramienta ]
            </span>
            <p className="leading-relaxed">"{item.after}"</p>
          </div>

          {item.extra_comments && (
            <div className="p-3 rounded-lg bg-[rgba(192,132,252,0.08)] border border-[rgba(192,132,252,0.25)] text-xs text-[#F8F4E9]">
              <span className="font-mono text-[#c084fc] font-bold block text-[10px] mb-1">
                [ ✦ Comentarios adicionales ]
              </span>
              <p className="leading-relaxed">"{item.extra_comments}"</p>
            </div>
          )}
        </div>

        {/* Pie de tarjeta anclado siempre abajo */}
        <div className="pt-3 border-t border-[rgba(147,80,115,0.2)] flex items-center justify-between text-xs mt-auto shrink-0">
          <div className="flex flex-col max-w-[70%]">
            <span className="font-semibold text-[#F8F4E9] truncate">{item.author_name}</span>
            <span className="text-[11px] text-[rgba(246,219,192,0.65)] font-mono truncate">
              {item.author_role}
            </span>
          </div>

          <span className="text-[10px] font-mono text-[#c084fc] opacity-80 group-hover:opacity-100 transition-opacity">
            {isFullyVisible ? (isExpanded ? "▲ plegar" : "▼ ver caso") : (idx !== undefined && idx >= displayIndex + visibleCount ? "→ ver" : "← ver")}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Cabecera y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-[#F6DBC0] max-w-xl leading-relaxed">
          {testimonials.length > 0
            ? "Veredictos reales resumidos en una frase. Al acercar el cursor se detiene el carrusel y se expande el caso completo."
            : "Espacio para veredictos de usuarios reales. Prueba las demos de los proyectos y sé el primero en evaluar su desempeño."}
        </p>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#160B1A] font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
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

      {/* ESTADO VACÍO (Sin testimonios publicados aún) */}
      {testimonials.length === 0 && !loading && (
        <div className="w-full p-8 sm:p-12 rounded-2xl bg-[rgba(35,23,39,0.7)] border border-[rgba(147,80,115,0.3)] shadow-xl backdrop-blur-md flex flex-col items-center justify-center text-center gap-5 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-[#c084fc]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-52 h-52 rounded-full bg-[rgba(16,185,129,0.08)] blur-3xl pointer-events-none" />

          <div className="w-14 h-14 rounded-2xl bg-[rgba(80,45,85,0.35)] border border-[rgba(192,132,252,0.4)] flex items-center justify-center text-[#c084fc] shadow-md">
            <span className="text-2xl">💬</span>
          </div>

          <div className="flex flex-col gap-2 max-w-lg">
            <span className="font-mono text-xs text-[#c084fc] font-semibold tracking-wider uppercase">
              [ Convocatoria de Veredictos ]
            </span>
            <h3 className="text-xl sm:text-2xl font-semibold text-[#F8F4E9]">
              Aún no hay opiniones publicadas
            </h3>
            <p className="text-sm text-[#F6DBC0]/80 leading-relaxed font-sans">
              ¿Has probado alguno de los proyectos, interactuado con las demos o conversado con Wiki? Sé el primero en dejar tu veredicto real sobre la experiencia.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="px-5 py-3 rounded-xl bg-[#c084fc] hover:bg-[#D8B4FE] text-[#160B1A] font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>+ Dejar mi veredicto</span>
            </button>
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-4 py-3 rounded-xl bg-[rgba(80,45,85,0.24)] hover:bg-[rgba(80,45,85,0.4)] border border-[rgba(147,80,115,0.3)] text-[rgba(246,219,192,0.65)] hover:text-[#F8F4E9] font-mono text-xs transition-all cursor-pointer"
              title="Panel de moderación (Erick)"
            >
              ⚙ Moderar
            </button>
          </div>
        </div>
      )}

      {/* ESTADO CON TESTIMONIOS REALES */}
      {testimonials.length > 0 && (
        <div
          className="relative w-full lg:w-[calc(100%+4rem)] overflow-hidden lg:-mx-8 py-4 sm:py-6 touch-pan-y cursor-grab active:cursor-grabbing select-none"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            handlePointerUp();
          }}
          onWheel={handleTestimonialWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div ref={containerRef} className="px-0 lg:px-8 w-full">
            {/* Si no hay suficientes tarjetas para carrusel, mostrarlas en fila estática limpia */}
            {!isCarousel ? (
              <div className="flex flex-wrap items-start justify-center sm:justify-start gap-5">
                {testimonials.map((item, i) =>
                  renderCard(item, expandedId === item.id, false, true, `static-${item.id}`, i === 0)
                )}
              </div>
            ) : (
              /* Contenedor del riel con desplazamiento circular infinito de 5 bloques */
              <div
                ref={trackRef}
                onTransitionEnd={handleTransitionEnd}
                className="flex items-start gap-5 will-change-transform"
                style={{
                  transform: `translateX(-${displayIndex * cardStep}px)`,
                  transition: isTransitioning
                    ? "transform 650ms cubic-bezier(0.16, 1, 0.3, 1)"
                    : "none"
                }}
              >
                {displayItems.map((item, idx) => {
                  const isExpanded = expandedId === item.id;
                  const isAnyExpanded = expandedId !== null;
                  const isDimmed = isAnyExpanded && !isExpanded;
                  const isFullyVisible = idx >= displayIndex && idx < displayIndex + visibleCount;

                  return renderCard(
                    item,
                    isExpanded,
                    isDimmed,
                    isFullyVisible,
                    item._virtualKey,
                    idx === 0,
                    idx
                  );
                })}
              </div>
            )}

            {/* Controles de navegación y estado de pausa (solo si hay más tarjetas que el viewport) */}
            {isCarousel && (
              <div className="flex items-center justify-between pt-4 mt-2 font-mono text-xs text-[rgba(246,219,192,0.65)]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="w-8 h-8 rounded-lg bg-[rgba(80,45,85,0.24)] hover:bg-[rgba(80,45,85,0.4)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] flex items-center justify-center cursor-pointer active:scale-95"
                    title="Anterior testimonio"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-8 h-8 rounded-lg bg-[rgba(80,45,85,0.24)] hover:bg-[rgba(80,45,85,0.4)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] flex items-center justify-center cursor-pointer active:scale-95"
                    title="Siguiente testimonio"
                  >
                    →
                  </button>
                  <span className="ml-2 text-[11px]">
                    {isPaused ? "[ ⏸ En pausa ]" : `[ 0${activeIndex + 1} / 0${testimonials.length} ]`}
                  </span>
                </div>

                {/* Dots indicadores */}
                <div className="flex items-center gap-1.5">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        activeIndex === i ? "w-6 bg-[#c084fc]" : "w-2 bg-[rgba(147,80,115,0.4)] hover:bg-[#c084fc]/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Dejar mi veredicto */}
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
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs text-[#F6DBC0]">Sistema evaluado:</label>
                    <span className="text-[10px] font-mono text-[#c084fc] font-semibold">
                      {PROJECTS.length} proyectos del carrusel sincronizados
                    </span>
                  </div>
                  <select
                    value={formSystem}
                    onChange={(e) => setFormSystem(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.95)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] font-mono text-xs focus:border-[#c084fc] outline-none cursor-pointer"
                  >
                    {PROJECTS.map((proj) => (
                      <option
                        key={proj.id}
                        value={proj.title}
                        className="bg-[#231727] text-[#F8F4E9] py-1.5"
                      >
                        {formatProjectOption(proj)}
                      </option>
                    ))}
                    <option
                      value="Consultoría / Servicios Generales"
                      className="bg-[#231727] text-[#F8F4E9] py-1.5"
                    >
                      [✦] Consultoría / Servicios Generales
                    </option>
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
                      placeholder="ej. Gerente de Negocio (opcional)"
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
                    placeholder="ej. Tardábamos 35 horas semanales a mano revisando notas en Excel con alto margen de error..."
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
                    placeholder="ej. Se automatizó el proceso sin fallas y la respuesta bajó a solo 1.2 segundos..."
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
                    placeholder="ej. Reflexión general, facilidad de uso, detalles o retos encontrados..."
                    value={formExtra}
                    onChange={(e) => setFormExtra(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#c084fc] outline-none resize-none"
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[rgba(80,45,85,0.2)] hover:bg-[rgba(80,45,85,0.4)] text-[rgba(246,219,192,0.7)] text-xs font-mono cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#160B1A] font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Procesando con IA..." : "Publicar veredicto"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Moderación de Erick */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[rgba(26,15,30,0.98)] border border-[rgba(147,80,115,0.45)] shadow-2xl p-6 sm:p-8 flex flex-col gap-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.25)]">
              <div>
                <span className="font-mono text-xs text-[#c084fc]">[ CONTROL ADMINISTRATIVO ]</span>
                <h3 className="text-xl font-semibold text-[#F8F4E9]">Moderar Veredictos</h3>
              </div>
              <button
                onClick={() => {
                  setIsAdminOpen(false);
                  setAdminMsg(null);
                }}
                className="w-8 h-8 rounded-lg bg-[rgba(80,45,85,0.2)] hover:bg-[rgba(80,45,85,0.4)] text-[#F6DBC0] flex items-center justify-center font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!adminToken ? (
              <div className="flex flex-col gap-3 py-4">
                <p className="text-xs text-[rgba(246,219,192,0.7)] font-mono">
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
                    className="px-4 py-2.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#160B1A] font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
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
                  {adminList.length === 0 ? (
                    <div className="p-6 rounded-xl bg-[rgba(35,23,39,0.5)] border border-[rgba(147,80,115,0.2)] text-center text-xs text-[rgba(246,219,192,0.6)] font-mono">
                      No hay testimonios pendientes de moderación en la base de datos.
                    </div>
                  ) : (
                    adminList.map((item) => (
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
