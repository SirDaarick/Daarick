import React, { useState, useEffect, useRef } from 'react';
import {
  Dog,
  Send,
  Mic,
  MicOff,
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
  ExternalLink,
  Mail
} from 'lucide-react';

export interface ContactAction {
  type: 'whatsapp' | 'linkedin' | 'email' | string;
  label: string;
  url: string;
}

export interface ProjectAction {
  id: string;
  title: string;
  tagline: string;
  demo_url?: string | null;
  github_url?: string | null;
  action_label?: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feasibility_verdict?: string | null;
  tech_recommendations?: string[];
  suggestions?: string[];
  contact_actions?: ContactAction[];
  project_action?: ProjectAction | null;
}

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const LinkedInIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const GitHubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const API_BASE = import.meta.env.PUBLIC_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

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
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        '¡Hola! Soy **Wiki**, el copiloto técnico del portafolio.\n\n' +
        'Puedo resolver dudas sobre la trayectoria y proyectos de Erick (**Graphito**, **Tetring**, **PAIDEA**, **Paralel**), ' +
        'o evaluar con total honestidad la **viabilidad técnica y arquitectura** de lo que quieras automatizar en tu negocio.\n\n' +
        '¿En qué te puedo asesorar hoy?',
      timestamp: '10:00 AM',
      suggestions: INITIAL_SUGGESTIONS
    }
  ]);

  const streamEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  // Inicialización de reconocimiento de voz (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-MX';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          const base = baseTextRef.current ? `${baseTextRef.current.trim()} ` : '';
          const newText = `${base}${currentTranscript}`;
          setInputValue(newText);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Error en reconocimiento de voz:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleToggleVoice = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Tu navegador no tiene activado el soporte para entrada de voz.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      baseTextRef.current = inputValue;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error al iniciar micrófono:', err);
      }
    }
  };

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

      const handleGlobalOpen = (e?: Event) => {
        setIsOpen(true);
        const customEvt = e as CustomEvent<{ prompt?: string }>;
        if (customEvt?.detail?.prompt) {
          setTimeout(() => {
            handleSendMessage(customEvt.detail.prompt);
          }, 200);
        }
      };
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

  // Enfocar textarea al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Copilot] Toggle clicked. Previous state:', isOpen);
    setIsOpen((prev) => !prev);
  };

  const streamPremeditatedText = async (
    targetId: string,
    fullText: string,
    suggestions?: string[],
    verdict?: string | null,
    tech?: string[],
    contactActions?: ContactAction[],
    projectAction?: ProjectAction | null
  ) => {
    const tokens = fullText.split(/(\s+)/);
    let current = '';
    for (let i = 0; i < tokens.length; i++) {
      current += tokens[i];
      if (tokens[i].trim() || i === tokens.length - 1) {
        setMessages((prev) =>
          prev.map((m) => (m.id === targetId ? { ...m, content: current } : m))
        );
        await new Promise((r) => setTimeout(r, 18));
      }
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.id === targetId
          ? {
              ...m,
              content: fullText,
              feasibility_verdict: verdict,
              tech_recommendations: tech,
              contact_actions: contactActions || [],
              project_action: projectAction || null,
              suggestions: suggestions && suggestions.length > 0 ? suggestions : INITIAL_SUGGESTIONS
            }
          : m
      )
    );
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const botMsgId = `bot-${Date.now()}`;
    const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Mensaje inicial del bot preparado para recibir tokens vía SSE
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: botTime,
      suggestions: []
    };

    setMessages([...updatedHistory, initialBotMsg]);
    setIsLoading(true);

    try {
      const slidingWindow = updatedHistory.slice(-6);

      const payload = {
        messages: slidingWindow.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        })),
        current_page: typeof window !== 'undefined' ? window.location.pathname : 'home'
      };

      const res = await fetch(`${API_BASE}/api/v1/assistant/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Error en servidor: ${res.status}`);
      }

      if (!res.body) {
        throw new Error('ReadableStream no disponible');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let sseBuffer = '';
      let streamFinished = false;

      while (!streamFinished) {
        const { value, done } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n\n');
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              throw new Error(data.detail || 'Error en stream SSE');
            }

            if (data.token) {
              accumulated += data.token;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId ? { ...m, content: accumulated } : m
                )
              );
            }

            if (data.done) {
              streamFinished = true;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botMsgId
                    ? {
                        ...m,
                        content: data.reply || accumulated,
                        feasibility_verdict: data.feasibility_verdict,
                        tech_recommendations: data.tech_recommendations,
                        contact_actions: data.contact_actions || [],
                        project_action: data.project_action || null,
                        suggestions:
                          data.suggestions && data.suggestions.length > 0
                            ? data.suggestions
                            : INITIAL_SUGGESTIONS
                      }
                    : m
                )
              );
            }
          } catch (parseErr) {
            console.warn('Error procesando fragmento SSE:', parseErr);
          }
        }
      }
    } catch (err) {
      console.warn('Fallback a respuesta local asistida progresiva:', err);
      const isContact = /contacto|whatsapp|correo|agendar|contratar|precio|llamada|reunion/i.test(text);
      const fallbackContactActions: ContactAction[] = isContact
        ? [
            {
              type: 'whatsapp',
              label: 'WhatsApp Directo',
              url: 'https://wa.me/525578666313?text=Hola%20Erick,%20vi%20tu%20portafolio%20y%20me%20gustar%C3%ADa%20platicar%20sobre%20un%20proyecto'
            },
            {
              type: 'linkedin',
              label: 'LinkedIn',
              url: 'https://www.linkedin.com/in/erickgarcia-ai/'
            },
            {
              type: 'email',
              label: 'Enviar Correo',
              url: 'mailto:e.danielgrz10@gmail.com?subject=Consulta%20desde%20Portafolio'
            }
          ]
        : [];

      let fallbackProjectAction: ProjectAction | null = null;
      if (/horario|turno|empalme|cuadrante|saes|tetring/i.test(text)) {
        fallbackProjectAction = {
          id: 'tetring',
          title: 'Tetring',
          tagline: 'Motor combinatorio de satisfacción de restricciones (CSP 42ms) sin empalmes',
          demo_url: 'https://tetring.vercel.app/',
          github_url: 'https://github.com/SirDaarick/Tetring',
          action_label: 'Ver Demo de Tetring'
        };
      } else if (/factura|recibo|ticket|albaran|ocr/i.test(text)) {
        fallbackProjectAction = {
          id: 'invoicing',
          title: 'Extractor de Facturas & Documentos',
          tagline: 'Extracción OCR multimodal con esquemas matemáticos y validación determinista',
          demo_url: '/demo/invoicing',
          action_label: 'Probar Sandbox de Facturas'
        };
      } else if (/paidea|soporte|atencion|alumno|rubrica|rag/i.test(text)) {
        fallbackProjectAction = {
          id: 'paidea',
          title: 'PAIDEA',
          tagline: 'Arquitectura multi-agente con RAG sobre documentos y rúbricas (ChromaDB)',
          demo_url: 'https://paidea-reloaded-xi.vercel.app/',
          github_url: 'https://github.com/SirDaarick/paidea-reloaded',
          action_label: 'Ver Demo de PAIDEA'
        };
      } else if (/graphito|plagio|copia|ast|tree-sitter/i.test(text)) {
        fallbackProjectAction = {
          id: 'graphito',
          title: 'Graphito',
          tagline: 'Detección inteligente de plagio semántico y similitud en código (Tree-sitter + LoRA)',
          demo_url: 'https://graphito-escom.vercel.app/',
          github_url: 'https://github.com/SirDaarick/Graphito',
          action_label: 'Ver Demo de Graphito'
        };
      } else if (/paralel|latencia|openmp|c\+\+/i.test(text)) {
        fallbackProjectAction = {
          id: 'paralel',
          title: 'Paralel',
          tagline: 'Motor de IA heurística multihilo en C++ para decisiones en tiempo real (<12ms)',
          demo_url: 'https://paralel-iota.vercel.app/',
          github_url: 'https://github.com/SirDaarick/Paralel',
          action_label: 'Ver Demo de Paralel'
        };
      }

      const fallbackText =
        '**Nota técnica:** No pude conectar con el gateway de FastAPI en este instante, pero te adelanto:\n\n' +
        '• **Proyectos clave:** Graphito (Tree-sitter + Deep Learning contra plagio), Tetring (CSP 42ms), PAIDEA (RAG con ChromaDB) y Paralel (C++ OpenMP).\n' +
        '• **Contacto directo:** Puedes escribir a Erick directamente vía WhatsApp, LinkedIn o correo electrónico.';

      await streamPremeditatedText(
        botMsgId,
        fallbackText,
        INITIAL_SUGGESTIONS,
        null,
        [],
        fallbackContactActions,
        fallbackProjectAction
      );
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
        className={`fixed bg-[#160B1A] border border-[rgba(147,80,115,0.5)] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out z-[99999] ${
          isExpanded
            ? 'inset-x-0 bottom-0 sm:inset-auto sm:bottom-8 sm:right-8 w-full sm:w-[680px] md:w-[760px] h-[92vh] sm:h-[720px] rounded-t-2xl sm:rounded-2xl'
            : 'inset-x-0 bottom-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full sm:w-[460px] md:w-[490px] h-[85vh] sm:h-[580px] rounded-t-2xl sm:rounded-2xl'
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
              <Dog className="w-5 h-5 text-[#c084fc]" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-[#160B1A]"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-semibold tracking-tight text-[#F8F4E9]">
                  Wiki
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#c084fc]/15 border border-[#c084fc]/30 text-[#c084fc] font-mono text-[10px] font-bold uppercase tracking-wider">
                  IA
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#F6DBC0]/70">
                Copiloto Técnico
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

            // Si el mensaje del bot aún no tiene tokens durante el inicio del streaming, el indicador de carga se encarga
            if (isBot && !msg.content) {
              return null;
            }

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
                      <Dog className="w-4 h-4 text-[#c084fc]" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 w-full">
                    {/* Burbuja de Mensaje: Fondo sólido de alto contraste para el usuario (adiós degradado ilegible) */}
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-sm ${
                        isBot
                          ? 'rounded-tl-sm bg-[rgba(45,20,52,0.7)] border border-[rgba(147,80,115,0.35)] text-[#F8F4E9] font-sans'
                          : 'rounded-tr-sm bg-[#381a3e] border border-[rgba(192,132,252,0.3)] text-[#F8F4E9] font-normal shadow-md'
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

                          {/* TARJETA INTERACTIVA DE PROYECTO ANÁLOGO */}
                          {msg.project_action && (
                            <div className="mt-3.5 p-3.5 rounded-xl bg-[rgba(30,15,35,0.85)] border border-[#c084fc]/40 shadow-md flex flex-col gap-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 rounded bg-[#c084fc]/20 text-[#c084fc]">
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="font-mono text-xs font-bold text-[#F8F4E9] tracking-tight">
                                    {msg.project_action.title}
                                  </span>
                                </div>
                                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-[rgba(192,132,252,0.15)] text-[#c084fc] font-semibold border border-[#c084fc]/30">
                                  Caso Análogo
                                </span>
                              </div>

                              <p className="font-sans text-xs text-[#F6DBC0]/90 leading-relaxed">
                                {msg.project_action.tagline}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {msg.project_action.demo_url && (
                                  <a
                                    href={msg.project_action.demo_url}
                                    target={msg.project_action.demo_url.startsWith('http') ? '_blank' : '_self'}
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer group"
                                  >
                                    <span>{msg.project_action.action_label || 'Ver Proyecto'}</span>
                                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                  </a>
                                )}
                                {msg.project_action.github_url && (
                                  <a
                                    href={msg.project_action.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgba(80,45,85,0.4)] hover:bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.4)] text-[#F6DBC0] hover:text-[#F8F4E9] text-xs font-mono transition-all active:scale-95 cursor-pointer"
                                  >
                                    <GitHubIcon className="w-3.5 h-3.5 text-[#ddb8ff]" />
                                    <span>Código</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* BOTONES DE ACCIÓN DE CONTACTO DIRECTO */}
                          {msg.contact_actions && msg.contact_actions.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-[rgba(147,80,115,0.35)] flex flex-col gap-2">
                              <span className="font-mono text-[10px] text-[#F6DBC0]/70 uppercase tracking-wider font-semibold">
                                Canales directos con Erick:
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                {msg.contact_actions.map((act, aIdx) => (
                                  <a
                                    key={aIdx}
                                    href={act.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer ${
                                      act.type === 'whatsapp'
                                        ? 'bg-[rgba(16,185,129,0.15)] hover:bg-[rgba(16,185,129,0.25)] border border-[#10B981]/40 hover:border-[#10B981] text-[#10B981] hover:text-[#6ee7b7]'
                                        : act.type === 'linkedin'
                                        ? 'bg-[rgba(192,132,252,0.15)] hover:bg-[rgba(192,132,252,0.25)] border border-[#c084fc]/40 hover:border-[#c084fc] text-[#c084fc] hover:text-[#e9d5ff]'
                                        : 'bg-[rgba(255,175,213,0.15)] hover:bg-[rgba(255,175,213,0.25)] border border-[#ffafd5]/40 hover:border-[#ffafd5] text-[#ffafd5] hover:text-[#ffe4e6]'
                                    }`}
                                  >
                                    {act.type === 'whatsapp' && <WhatsAppIcon className="w-3.5 h-3.5 text-[#10B981]" />}
                                    {act.type === 'linkedin' && <LinkedInIcon className="w-3.5 h-3.5 text-[#c084fc]" />}
                                    {act.type === 'email' && <Mail className="w-3.5 h-3.5 text-[#ffafd5]" />}
                                    <span>{act.label}</span>
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="leading-relaxed whitespace-pre-wrap">{msg.content}</span>
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

          {/* Estado de Carga (Typing indicator mientras espera el primer token) */}
          {isLoading && (!messages[messages.length - 1]?.content || messages[messages.length - 1]?.role === 'user') && (
            <div className="flex items-start gap-2.5 max-w-[85%]">
              <div className="w-7 h-7 rounded-md bg-[rgba(80,45,85,0.5)] border border-[rgba(147,80,115,0.3)] flex items-center justify-center shrink-0 text-[#c084fc] mt-1 shadow-sm animate-pulse">
                <Dog className="w-4 h-4 text-[#c084fc]" />
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
            <div className="flex items-end gap-2">
              <div className="flex-1 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-[rgba(22,11,26,0.9)] border border-[rgba(147,80,115,0.35)] focus-within:border-[#c084fc]/60 transition-all shadow-inner">
                <span className="text-[#c084fc] font-mono text-sm font-bold select-none mt-0.5">&gt;</span>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  maxLength={1200}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'Escuchando tu voz... habla ahora'
                      : 'Pregunta sobre proyectos o viabilidad...'
                  }
                  className="w-full bg-transparent border-0 p-0 text-[#F8F4E9] placeholder-[#F6DBC0]/40 focus:ring-0 text-sm focus:outline-none font-sans resize-none overflow-y-auto leading-relaxed max-h-[120px]"
                />
              </div>

              {/* Botón de Entrada por Voz */}
              <button
                type="button"
                onClick={handleToggleVoice}
                title={isListening ? 'Detener dictado por voz (escuchando...)' : 'Dictar por voz'}
                aria-label={isListening ? 'Detener dictado por voz' : 'Dictar por voz'}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500/25 border border-rose-500 text-rose-300 animate-pulse ring-2 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    : 'bg-[rgba(80,45,85,0.4)] hover:bg-[rgba(80,45,85,0.7)] text-[#F6DBC0] border border-[rgba(147,80,115,0.3)] hover:text-[#F8F4E9]'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-300" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Botón de Enviar (Solo el Iconito) */}
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                title="Enviar mensaje"
                aria-label="Enviar mensaje"
                className="w-10 h-10 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 ml-0.5" />
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
            <span>¿Dudas sobre IA? Pregúntale a Wiki</span>
          </button>
        )}

        {/* Botón Circular con Resplandor Ambiental */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#c084fc] to-[#d8b4fe] opacity-60 blur-md group-hover:opacity-100 transition duration-300 pointer-events-none"></div>

          <button
            type="button"
            aria-label={isOpen ? 'Cerrar Wiki' : 'Abrir Wiki'}
            onClick={handleToggle}
            className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-tr from-[#935073] via-[#a855f7] to-[#c084fc] text-[#160B1A] flex items-center justify-center shadow-2xl transition-transform duration-200 group-hover:scale-105 active:scale-95 cursor-pointer"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-[#160B1A]" />
            ) : (
              <Dog className="w-6 h-6 text-[#160B1A]" />
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
