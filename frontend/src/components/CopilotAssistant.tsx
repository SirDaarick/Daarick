import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Minus,
  Maximize2,
  Minimize2,
  Sparkles,
  MessageSquare,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feasibility_verdict?: string | null;
  tech_recommendations?: string[];
  suggestions?: string[];
}

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://127.0.0.1:8000';

const INITIAL_SUGGESTIONS = [
  '✦ ¿Qué proyectos ha creado Erick?',
  '💬 ¿Es viable automatizar mi soporte o facturas?',
  '🧠 ¿Por qué no usar IA para contabilidad directa?',
  '⚡ ¿Cómo contactar a Erick para un proyecto?'
];

export const CopilotAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        '¡Hola! Soy **Daverick Assistant**, el copiloto técnico del portafolio.\n\n' +
        'Puedo resolver dudas sobre la trayectoria y proyectos de Erick (**Graphito**, **Tetring**, **PAIDEA**, **Paralel**), ' +
        'o evaluar con total honestidad la **viabilidad técnica y arquitectura** de lo que quieras automatizar en tu negocio.\n\n' +
        '¿En qué te puedo asesorar hoy?',
      timestamp: '10:00 AM',
      suggestions: INITIAL_SUGGESTIONS
    }
  ]);

  const streamEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hidratación segura del almacenamiento de sesión en cliente
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('daarick_copilot_history');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) =>
        prev.map((m) => (m.id === 'init-1' ? { ...m, timestamp: timeStr } : m))
      );
    } catch (e) {
      console.error('Error restaurando sesión del copiloto:', e);
    }
  }, []);

  // Exponer API global en window para accesibilidad y pruebas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__toggleDaarickChat = () => {
        setIsOpen((prev) => !prev);
      };
      (window as any).__openDaarickChat = () => {
        setIsOpen(true);
      };

      const handleGlobalOpen = () => setIsOpen(true);
      window.addEventListener('open-copilot-chat', handleGlobalOpen);
      return () => window.removeEventListener('open-copilot-chat', handleGlobalOpen);
    }
  }, []);

  // Guardar en sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('daarick_copilot_history', JSON.stringify(messages));
      } catch (e) {
        console.error('Error guardando historial:', e);
      }
    }
  }, [messages]);

  // Auto-scroll al fondo al llegar un nuevo mensaje
  useEffect(() => {
    if (isOpen) {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Enfocar input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Copilot] Toggle clicked. Previous state:', isOpen);
    setIsOpen((prev) => !prev);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setHasInteracted(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: timeStr
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      // Sliding window en el cliente (últimos 6 turnos)
      const slidingWindow = updatedHistory.slice(-6);

      const payload = {
        messages: slidingWindow.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })),
        current_page: typeof window !== 'undefined' ? window.location.pathname : 'home'
      };

      const res = await fetch(`${API_BASE}/api/v1/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Error en servidor: ${res.status}`);
      }

      const data = await res.json();
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: botTime,
        feasibility_verdict: data.feasibility_verdict,
        tech_recommendations: data.tech_recommendations,
        suggestions: data.suggestions && data.suggestions.length > 0 ? data.suggestions : INITIAL_SUGGESTIONS
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('Fallback a respuesta local asistida:', err);
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content:
          '**Nota técnica:** No pude conectar con el gateway de FastAPI en este instante, pero te adelanto:\n\n' +
          '• **Proyectos clave:** Graphito (Tree-sitter + Deep Learning contra plagio), Tetring (CSP 42ms), PAIDEA (RAG con ChromaDB) y Paralel (C++ OpenMP).\n' +
          '• **Contacto directo:** Puedes escribir a Erick vía WhatsApp o al correo **erick.daarick@gmail.com**.',
        timestamp: botTime,
        suggestions: INITIAL_SUGGESTIONS
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    sessionStorage.removeItem('daarick_copilot_history');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'init-fresh',
        role: 'assistant',
        content:
          'Conversación reiniciada. ¿Qué consulta técnica o proyecto te gustaría explorar ahora?',
        timestamp: timeStr,
        suggestions: INITIAL_SUGGESTIONS
      }
    ]);
  };

  // Renderizador seguro de Markdown simple
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.replace(/^[•-]\s*/, '') : line;

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

      const content = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-[#F8F4E9]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a
              key={pIdx}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c084fc] hover:underline inline-flex items-center gap-1 font-mono text-xs"
            >
              {linkMatch[1]}
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-[#c084fc] text-xs mt-1 select-none">▸</span>
            <div className="flex-1 leading-relaxed">{content}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed my-1">
          {content}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. VENTANA FLOTANTE DEL CHAT (MODAL / DRAWER) */}
      <div
        id="chat-window"
        style={{
          zIndex: 99999,
          display: isOpen ? 'flex' : 'none'
        }}
        className={`fixed rounded-2xl bg-[#160B1A] border border-[rgba(147,80,115,0.5)] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          isExpanded
            ? 'bottom-4 right-4 sm:bottom-8 sm:right-8 w-[calc(100vw-32px)] sm:w-[680px] md:w-[760px] h-[calc(100vh-64px)] sm:h-[720px] max-h-[92vh]'
            : 'bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] md:w-[490px] h-[580px] max-h-[82vh]'
        }`}
        role="dialog"
        aria-label="Daverick Assistant Chat"
      >
        {/* Marcadores Crosshairs en las 4 esquinas (Stitch Design Spec) */}
        <span className="absolute top-2 left-2 text-[#c084fc]/40 font-mono text-[10px] select-none pointer-events-none z-20">
          +
        </span>
        <span className="absolute top-2 right-2 text-[#c084fc]/40 font-mono text-[10px] select-none pointer-events-none z-20">
          +
        </span>
        <span className="absolute bottom-2 left-2 text-[#c084fc]/40 font-mono text-[10px] select-none pointer-events-none z-20">
          +
        </span>
        <span className="absolute bottom-2 right-2 text-[#c084fc]/40 font-mono text-[10px] select-none pointer-events-none z-20">
          +
        </span>

        {/* Encabezado del Chat */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-[rgba(30,15,35,0.95)] border-b border-[rgba(147,80,115,0.3)] shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(80,45,85,0.5)] border border-[rgba(147,80,115,0.4)] text-[#c084fc] shadow-sm">
              <Bot className="w-5 h-5 text-[#c084fc]" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-[#160B1A]"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-semibold tracking-tight text-[#F8F4E9]">
                  Daverick Assistant
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#c084fc]/15 border border-[#c084fc]/30 text-[#c084fc] font-mono text-[10px] font-bold uppercase tracking-wider">
                  IA
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#F6DBC0]/80">
                [ ● En línea // 24/7 ]
              </span>
            </div>
          </div>

          {/* Acciones de la ventana */}
          <div className="flex items-center gap-1 text-[#F6DBC0]/60">
            <button
              type="button"
              onClick={handleReset}
              title="Reiniciar conversación"
              aria-label="Reiniciar conversación"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgba(80,45,85,0.5)] hover:text-[#F8F4E9] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restaurar tamaño' : 'Expandir ventana'}
              aria-label={isExpanded ? 'Restaurar tamaño' : 'Expandir ventana'}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgba(80,45,85,0.5)] hover:text-[#F8F4E9] transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Cerrar chat"
              aria-label="Cerrar chat"
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[rgba(80,45,85,0.5)] hover:text-[#F8F4E9] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Flujo de Mensajes (Conversation Stream) */}
        <div
          id="conversation-stream"
          className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto font-sans text-sm text-[#F8F4E9] scrollbar-thin scrollbar-thumb-[rgba(147,80,115,0.3)]"
        >
          {/* Ancla de sesión activa */}
          <div className="flex justify-center my-1 select-none">
            <span className="px-3 py-1 rounded-full bg-[rgba(45,20,52,0.6)] border border-[rgba(147,80,115,0.25)] text-[#F6DBC0]/70 font-mono text-[10px] tracking-wider uppercase">
              [ SESIÓN ACTIVA · ASESORÍA TÉCNICA ]
            </span>
          </div>

          {messages.map((msg) => {
            const isBot = msg.role === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-full`}
              >
                <div
                  className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] ${
                    isBot ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  {isBot && (
                    <div className="w-7 h-7 rounded-md bg-[rgba(80,45,85,0.5)] border border-[rgba(147,80,115,0.3)] flex items-center justify-center shrink-0 text-[#c084fc] mt-1 shadow-sm">
                      <Bot className="w-4 h-4 text-[#c084fc]" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 w-full">
                    {/* Burbuja de Mensaje */}
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-sm ${
                        isBot
                          ? 'rounded-tl-sm bg-[rgba(45,20,52,0.7)] border border-[rgba(147,80,115,0.35)] text-[#F8F4E9] font-sans'
                          : 'rounded-tr-sm bg-gradient-to-r from-[#935073] to-[#c084fc] text-[#160B1A] font-medium shadow-md'
                      }`}
                    >
                      {isBot ? (
                        <div className="space-y-1">
                          {renderFormattedText(msg.content)}

                          {/* Veredicto de Viabilidad Técnica si existe */}
                          {msg.feasibility_verdict && (
                            <div className="mt-3 pt-2.5 border-t border-[rgba(147,80,115,0.3)] flex flex-wrap items-center gap-2">
                              {msg.feasibility_verdict === 'ALTA_VIABILIDAD' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] font-mono text-[10px] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  [ ✓ ALTA VIABILIDAD TÉCNICA ]
                                </span>
                              )}
                              {msg.feasibility_verdict === 'VIABLE_CON_RESTRICCIONES' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  [ ⚠️ REQUIERE ARQUITECTURA HÍBRIDA ]
                                </span>
                              )}
                              {msg.feasibility_verdict === 'CASO_DE_ÉXITO' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c084fc]/15 border border-[#c084fc]/40 text-[#c084fc] font-mono text-[10px] font-semibold">
                                  <Sparkles className="w-3 h-3" />
                                  [ ✦ CASO DE ÉXITO IMPLEMENTADO ]
                                </span>
                              )}
                              {msg.feasibility_verdict === 'ALTA_VIABILIDAD_DETERMINISTA' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-500/15 border border-sky-500/40 text-sky-300 font-mono text-[10px] font-semibold">
                                  <Cpu className="w-3 h-3" />
                                  [ ⚙️ MOTOR DETERMINISTA CSP RECOMENDADO ]
                                </span>
                              )}
                            </div>
                          )}

                          {/* Stack Técnico Recomendado */}
                          {msg.tech_recommendations && msg.tech_recommendations.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                              <span className="font-mono text-[10px] text-[#F6DBC0]/60 mr-1">
                                Stack:
                              </span>
                              {msg.tech_recommendations.map((t, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded bg-[rgba(80,45,85,0.35)] border border-[rgba(147,80,115,0.25)] text-[#F6DBC0] font-mono text-[10px]"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="leading-relaxed">{msg.content}</span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span
                      className={`font-mono text-[10px] px-1 select-none ${
                        isBot ? 'text-[#F6DBC0]/50' : 'text-[#F6DBC0]/70 text-right'
                      }`}
                    >
                      {msg.timestamp} · {isBot ? 'IA AUTÓNOMA' : 'ENVIADO'}
                    </span>
                  </div>
                </div>

                {/* Sugerencias o chips de seguimiento tras el último mensaje del bot */}
                {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 pl-9 flex flex-wrap gap-1.5 max-w-full">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="px-3 py-1.5 rounded-full bg-[rgba(45,20,52,0.6)] hover:bg-[rgba(80,45,85,0.6)] border border-[rgba(147,80,115,0.3)] hover:border-[#c084fc]/50 text-[#F6DBC0] hover:text-[#F8F4E9] font-mono text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 text-left cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Estado de Carga (Typing indicator) */}
          {isLoading && (
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="w-7 h-7 rounded-md bg-[rgba(80,45,85,0.5)] border border-[rgba(147,80,115,0.3)] flex items-center justify-center shrink-0 text-[#c084fc] mt-1 shadow-sm animate-pulse">
                <Bot className="w-4 h-4 text-[#c084fc]" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[rgba(45,20,52,0.65)] border border-[rgba(147,80,115,0.35)] text-[#F6DBC0] font-mono text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c084fc] animate-ping" />
                  <span>[ Analizando viabilidad técnica... ]</span>
                </div>
              </div>
            </div>
          )}

          <div ref={streamEndRef} />
        </div>

        {/* Barra de Entrada de Texto con Guardrail Anti-Biblia */}
        <div className="p-3.5 bg-[rgba(30,15,35,0.95)] border-t border-[rgba(147,80,115,0.3)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[rgba(22,11,26,0.9)] border border-[rgba(147,80,115,0.35)] focus-within:border-[#c084fc]/60 transition-all shadow-inner">
                <span className="text-[#c084fc] font-mono text-sm font-bold select-none">&gt;</span>
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={1200}
                  autoComplete="off"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Pregunta sobre proyectos o viabilidad..."
                  className="w-full bg-transparent border-0 p-0 text-[#F8F4E9] placeholder-[#F6DBC0]/40 focus:ring-0 text-sm focus:outline-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#935073] to-[#c084fc] hover:from-[#a855f7] hover:to-[#d8b4fe] text-[#160B1A] font-mono text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md cursor-pointer"
              >
                <span>[ Enviar</span>
                <Send className="w-3 h-3 font-bold" />
                <span>]</span>
              </button>
            </div>

            {/* Contador de caracteres discreto cuando el texto se alarga */}
            {inputValue.length > 600 && (
              <div className="flex justify-end px-1">
                <span
                  className={`font-mono text-[10px] ${
                    inputValue.length > 1100 ? 'text-amber-400' : 'text-[#F6DBC0]/50'
                  }`}
                >
                  {inputValue.length} / 1200 caracteres (Escudo de contexto activo)
                </span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* 2. BOTÓN LANZADOR FLOTANTE (FAB) CON GLOW & MICRO-TOOLTIP */}
      <aside
        style={{ zIndex: 99998 }}
        className="fixed bottom-6 right-6 flex items-center gap-3 select-none"
      >
        {/* Micro-Tooltip / Noticia discreta antes de interactuar */}
        {!isOpen && !hasInteracted && (
          <button
            type="button"
            onClick={handleToggle}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[rgba(30,15,35,0.95)] border border-[rgba(147,80,115,0.4)] text-[#F6DBC0] shadow-xl font-mono text-xs hover:border-[#c084fc]/60 transition-all animate-bounce"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>¿Dudas sobre IA? Habla conmigo</span>
          </button>
        )}

        {/* Botón Circular con Resplandor Ambiental */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#c084fc] to-[#d8b4fe] opacity-60 blur-md group-hover:opacity-100 transition duration-300 pointer-events-none"></div>

          <button
            type="button"
            aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente de chat'}
            onClick={handleToggle}
            className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-tr from-[#935073] via-[#a855f7] to-[#c084fc] text-[#160B1A] flex items-center justify-center shadow-2xl transition-transform duration-200 group-hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-[#160B1A]" />
            ) : (
              <MessageSquare className="w-6 h-6 text-[#160B1A]" />
            )}

            {/* Indicador de estado en vivo */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10B981] shadow-sm ring-2 ring-[#160B1A] pointer-events-none"></span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default CopilotAssistant;
