import React, { useState, useEffect, useRef } from "react";

interface Testimonial {
  id: string;
  system: string;
  author_name: string;
  author_role: string;
  before: string;
  after: string;
  headline: string;
  approved: boolean;
  created_at: string;
}

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    id: "seed-1",
    system: "Graphito",
    author_name: "Elena M.",
    author_role: "Directora de Operaciones, Retail Supply",
    before: "Teníamos que revisar manualmente diagramas y árboles de decisión en papel con esperas de 40 minutos por caso de incidencia crítica.",
    after: "El sistema de triaje redujo de 40 minutos a 1.2 segundos la respuesta a incidencias críticas. Cero errores contables este trimestre.",
    headline: "Reducción de 40 min a 1.2s en respuesta a incidencias críticas",
    approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: "seed-2",
    system: "Tetring",
    author_name: "Carlos R.",
    author_role: "Head of Logistics, Global Express",
    before: "El equipo perdía mañanas enteras transcribiendo a mano facturas en PDF desordenadas y con formatos variados.",
    after: "Extrajimos más de 12.000 facturas PDF desordenadas sin una sola intervención manual. El retorno de inversión fue inmediato en el primer mes.",
    headline: "12.000 facturas PDF extraídas sin intervención manual en 30 días",
    approved: true,
    created_at: new Date().toISOString()
  },
  {
    id: "seed-3",
    system: "PAIDEA",
    author_name: "Marcos T.",
    author_role: "Tech Lead & Enterprise Architect",
    before: "Los modelos de lenguaje alucinaban respuestas ambiguas sin conexión confiable a nuestra base de conocimiento interna.",
    after: "Los agentes son deterministas y seguros. Nada de alucinaciones descontroladas; el backend responde como un reloj suizo a diario.",
    headline: "Agentes deterministas sin alucinaciones con latencia sub-segundo",
    approved: true,
    created_at: new Date().toISOString()
  }
];

export default function TestimonialsInteractive() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Formulario nuevo veredicto
  const [formSystem, setFormSystem] = useState("Graphito");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formBefore, setFormBefore] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Moderación Admin
  const [adminToken, setAdminToken] = useState("");
  const [adminTokenInput, setAdminTokenInput] = useState("");
  const [adminList, setAdminList] = useState<Testimonial[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  // Estado de tarjeta seleccionada en móvil o hover
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // --- Animación con física e inercia ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const speedRef = useRef(0.5); // Velocidad actual
  const targetSpeedRef = useRef(0.5); // Velocidad objetivo
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
      // Fallback a los estáticos si el backend está en otra red
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  // Animación suave de carrusel con inercia (Damping)
  useEffect(() => {
    let animId: number;

    const animate = () => {
      const el = scrollContainerRef.current;
      if (el) {
        // Si hay hover, objetivo = 0; si no, objetivo = 0.5
        if (isDraggingRef.current) {
          // Durante el drag no sumamos velocidad automática
        } else {
          if (isHoveredRef.current) {
            targetSpeedRef.current = 0;
          } else {
            targetSpeedRef.current = 0.55;
          }

          // Amortiguación hacia targetSpeed con inercia suave
          speedRef.current += (targetSpeedRef.current - speedRef.current) * 0.06;

          // Si hay inercia de arrastre remanente, sumarla y disiparla
          if (Math.abs(dragVelocityRef.current) > 0.05) {
            speedRef.current += dragVelocityRef.current;
            dragVelocityRef.current *= 0.92; // Fricción
          }

          if (Math.abs(speedRef.current) > 0.01) {
            el.scrollLeft += speedRef.current;

            // Bucle infinito: si llega a la mitad, resetea sin que se note
            const maxScroll = el.scrollWidth / 2;
            if (el.scrollLeft >= maxScroll) {
              el.scrollLeft -= maxScroll;
            } else if (el.scrollLeft <= 0) {
              el.scrollLeft += maxScroll;
            }
          }
        }
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [testimonials]);

  // Manejadores de arrastre con mouse o toque
  const onMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    lastXRef.current = e.pageX;
    dragVelocityRef.current = 0;
    if (scrollContainerRef.current) {
      scrollStartRef.current = scrollContainerRef.current.scrollLeft;
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startXRef.current) * 1.2;
    scrollContainerRef.current.scrollLeft = scrollStartRef.current - walk;

    // Calcular velocidad instantánea para inercia al soltar
    dragVelocityRef.current = (lastXRef.current - x) * 0.4;
    lastXRef.current = x;
  };

  const onMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Enviar nuevo testimonio
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
          after: formAfter.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitFeedback(
          `¡Veredicto recibido! La IA sintetizó tu titular: "${data.headline}". Se publicará tras la revisión de Erick.`
        );
        setFormBefore("");
        setFormAfter("");
        setFormName("");
        setFormRole("");
      } else {
        setSubmitFeedback("Ocurrió un error al enviar el veredicto. Inténtalo de nuevo.");
      }
    } catch {
      setSubmitFeedback("No se pudo conectar con el servidor. Revisa tu conexión.");
    } finally {
      setSubmitting(false);
    }
  };

  // Cargar lista de admin
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
      alert("Error al aprobar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Deseas descartar y eliminar este veredicto?")) return;
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
      alert("Error al eliminar");
    }
  };

  // Duplicamos la lista para crear un riel continuo infinito
  const loopList = [...testimonials, ...testimonials];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Barra superior de acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs sm:text-sm text-[#F6DBC0] max-w-xl leading-relaxed">
          Comentarios reales de personas y equipos. Pasa el cursor por las tarjetas para detener el riel y conocer el proceso <span className="text-[#ff5f56]">Antes</span> vs <span className="text-[#10B981]">Ahora</span>.
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>+ Dejar mi veredicto</span>
          </button>
          <button
            onClick={() => setIsAdminOpen(true)}
            className="p-2 rounded-lg bg-[rgba(80,45,85,0.24)] hover:bg-[rgba(80,45,85,0.4)] border border-[rgba(147,80,115,0.3)] text-[rgba(246,219,192,0.65)] hover:text-[#F8F4E9] transition-all text-xs font-mono"
            title="Panel de moderación (Erick)"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Riel Horizontal Continuo con Física de Inercia */}
      <div
        className="relative w-full overflow-hidden py-2 select-none cursor-grab active:cursor-grabbing"
        onMouseEnter={() => (isHoveredRef.current = true)}
        onMouseLeave={() => {
          isHoveredRef.current = false;
          onMouseUp();
        }}
      >
        {/* Sombras laterales de desvanecimiento */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[rgba(21,10,25,0.9)] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[rgba(21,10,25,0.9)] to-transparent z-10" />

        {/* Track desplazable */}
        <div
          ref={scrollContainerRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          className="flex items-stretch gap-5 overflow-x-hidden no-scrollbar py-2"
          style={{ scrollBehavior: "auto" }}
        >
          {loopList.map((item, idx) => {
            const isHovered = activeCardId === `${item.id}-${idx}`;

            return (
              <div
                key={`${item.id}-${idx}`}
                onMouseEnter={() => setActiveCardId(`${item.id}-${idx}`)}
                onMouseLeave={() => setActiveCardId(null)}
                onClick={() =>
                  setActiveCardId(activeCardId === `${item.id}-${idx}` ? null : `${item.id}-${idx}`)
                }
                className="w-[320px] sm:w-[380px] shrink-0 p-5 rounded-2xl bg-[rgba(35,23,39,0.75)] border border-[rgba(147,80,115,0.3)] backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:border-[#c084fc]/60 hover:shadow-[0_8px_30px_rgba(192,132,252,0.15)] group relative"
              >
                {/* Cabecera de tarjeta */}
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.25)] font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-[rgba(16,185,129,0.12)] text-[#10B981] font-semibold border border-[rgba(16,185,129,0.25)]">
                    [ Sistema: {item.system} ]
                  </span>
                  <span className="text-[#c084fc] font-bold text-sm">“</span>
                </div>

                {/* Titular de impacto generado por LLM */}
                <div className="my-3">
                  <h4 className="text-base sm:text-lg font-semibold text-[#F8F4E9] leading-snug group-hover:text-[#ddb8ff] transition-colors">
                    {item.headline}
                  </h4>
                </div>

                {/* Detalle Antes vs Ahora (Despliegue al Hover / Clic) */}
                <div
                  className={`transition-all duration-300 ease-out overflow-hidden flex flex-col gap-2.5 ${
                    isHovered ? "max-h-96 opacity-100 mb-4" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-3 rounded-lg bg-[rgba(255,95,86,0.08)] border border-[rgba(255,95,86,0.25)] text-xs text-[#F6DBC0]">
                    <span className="font-mono text-[#ff5f56] font-bold block mb-1">
                      [ 🔴 Antes del sistema ]
                    </span>
                    <p className="leading-relaxed italic">"{item.before}"</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)] text-xs text-[#F6DBC0]">
                    <span className="font-mono text-[#10B981] font-bold block mb-1">
                      [ 🟢 Ahora con la herramienta ]
                    </span>
                    <p className="leading-relaxed">"{item.after}"</p>
                  </div>
                </div>

                {/* Pie de tarjeta */}
                <div className="pt-3 border-t border-[rgba(147,80,115,0.2)] flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#F8F4E9]">{item.author_name}</span>
                    <span className="text-[11px] text-[rgba(246,219,192,0.65)] font-mono">
                      {item.author_role}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#c084fc] opacity-80 group-hover:opacity-100 transition-opacity">
                    {isHovered ? "▲ caso completo" : "▼ ver detalle"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Dejar mi veredicto */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[rgba(26,15,30,0.95)] border border-[rgba(147,80,115,0.4)] shadow-2xl p-6 sm:p-8 flex flex-col gap-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(147,80,115,0.25)]">
              <div>
                <span className="font-mono text-xs text-[#c084fc]">[ FEEDBACK DE USUARIO ]</span>
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
                  className="mt-2 px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#34D399] text-[#042f2e] font-mono text-xs font-bold"
                >
                  Entendido, cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-[#F6DBC0]">Tu nombre (opcional):</label>
                    <input
                      type="text"
                      placeholder="ej. Elena M. / Anónimo"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#c084fc] outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-xs text-[#F6DBC0]">Tu rol o cargo (opcional):</label>
                    <input
                      type="text"
                      placeholder="ej. Directora de Operaciones"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#c084fc] outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-[#ff5f56]">
                    ¿Cómo era el proceso antes? (El problema o lentitud):
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="ej. Tardábamos 40 minutos en revisar cada factura a mano y cometíamos errores de captura..."
                    value={formBefore}
                    onChange={(e) => setFormBefore(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#ff5f56] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-xs text-[#10B981]">
                    ¿Cómo es ahora con la herramienta? (Resultados / tiempo ahorrado):
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="ej. El sistema procesa 12.000 documentos automáticamente y bajó el tiempo a 1.2 segundos..."
                    value={formAfter}
                    onChange={(e) => setFormAfter(e.target.value)}
                    className="p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs focus:border-[#10B981] outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubmitOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-[rgba(147,80,115,0.3)] text-[#F6DBC0] font-mono text-xs hover:bg-[rgba(80,45,85,0.2)]"
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
                        <span>Sintetizando con IA...</span>
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

      {/* MODAL 2: Moderación de Erick (Admin) */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[rgba(26,15,30,0.98)] border border-[rgba(147,80,115,0.4)] shadow-2xl p-6 sm:p-8 flex flex-col gap-5 relative">
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
                  Ingresa tu clave maestra de administrador configurada en tu backend para revisar y aprobar veredictos enviados por usuarios.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Clave maestra (ej. erick-admin-2026)"
                    value={adminTokenInput}
                    onChange={(e) => setAdminTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchAdminTestimonials(adminTokenInput)}
                    className="flex-1 p-2.5 rounded-lg bg-[rgba(35,23,39,0.9)] border border-[rgba(147,80,115,0.3)] text-[#F8F4E9] font-mono text-xs focus:border-[#c084fc] outline-none"
                  />
                  <button
                    onClick={() => fetchAdminTestimonials(adminTokenInput)}
                    disabled={adminLoading}
                    className="px-4 py-2.5 rounded-lg bg-[#c084fc] hover:bg-[#D8B4FE] text-[#500989] font-mono text-xs font-bold transition-all shadow-md"
                  >
                    {adminLoading ? "Validando..." : "Ingresar"}
                  </button>
                </div>
                {adminMsg && <span className="font-mono text-xs text-[#ff5f56]">{adminMsg}</span>}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono text-[rgba(246,219,192,0.65)]">
                  <span>Total en base de datos: {adminList.length}</span>
                  <button
                    onClick={() => fetchAdminTestimonials(adminToken)}
                    className="text-[#c084fc] hover:underline"
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

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(147,80,115,0.2)]">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 rounded bg-[rgba(255,95,86,0.15)] hover:bg-[rgba(255,95,86,0.3)] text-[#ff5f56] font-mono text-xs"
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
                            className="px-3 py-1.5 rounded bg-[#10B981] hover:bg-[#34D399] text-[#042f2e] font-mono text-xs font-bold"
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
