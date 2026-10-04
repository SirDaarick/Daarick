import React, { useState, useEffect, useRef } from 'react';
import {
  Dog,
  Send,
  Mic,
  MicOff,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Mail
} from 'lucide-react';
import { BookingSlotsCard, type CalendarSlot } from './BookingSlotsCard';

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

export interface BookingAction {
  slots: CalendarSlot[];
  default_summary?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sig?: string;
  stage?: string;
  suggestions?: string[];
  contact_actions?: ContactAction[];
  project_action?: ProjectAction | null;
  booking_action?: BookingAction | null;
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
  'Tengo un taller o tienda propia',
  'Vendo productos o hago entregas',
  'Doy servicios o atiendo clientes',
  'Trabajo por mi cuenta'
];

export const CopilotAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        '¡Hola! Soy **Wiki** 👋 Estoy aquí para ayudarte a que el día a día de tu negocio sea más fácil y ahorres tiempo en tareas repetitivas.\n\n' +
        'Para empezar a orientarte, **¿de qué es tu negocio o a qué te dedicas?**',
      timestamp: '10:00 AM',
      suggestions: INITIAL_SUGGESTIONS
    }
  ]);

  const streamEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef('');

  // Adaptación al teclado virtual en móvil
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [viewportOffsetTop, setViewportOffsetTop] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (window.innerWidth < 640 && isOpen) {
        setViewportHeight(window.visualViewport?.height ?? window.innerHeight);
        setViewportOffsetTop(window.visualViewport?.offsetTop ?? 0);
      } else {
        setViewportHeight(null);
        setViewportOffsetTop(0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    window.addEventListener('resize', handleResize);

    if (isOpen) {
      handleResize();
    }

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Soporte de voz con Web Speech API
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

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          const base = baseTextRef.current ? `${baseTextRef.current.trim()} ` : '';
          setInputValue(`${base}${currentTranscript}`);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
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
    } else {
      baseTextRef.current = inputValue;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error al iniciar micrófono:', err);
      }
    }
  };

  // Hidratación de sesión
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
      console.error('Error restaurando sesión:', e);
    }
  }, []);

  // Mantener referencia actualizada de handleSendMessage para evitar cierres obsoletos en eventos
  const handleSendMessageRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__toggleDaarickChat = () => setIsOpen((prev) => !prev);
      (window as any).__openDaarickChat = () => setIsOpen(true);

      const handleGlobalOpen = (e?: Event) => {
        setIsOpen(true);
        const customEvt = e as CustomEvent<{ prompt?: string }>;
        if (customEvt?.detail?.prompt) {
          setTimeout(() => {
            handleSendMessageRef.current(customEvt.detail.prompt);
          }, 150);
        }
      };
      window.addEventListener('open-copilot-chat', handleGlobalOpen);
      return () => window.removeEventListener('open-copilot-chat', handleGlobalOpen);
    }
  }, []);

  // Persistir en sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('daarick_copilot_history', JSON.stringify(messages));
      } catch (e) {
        console.error('Error guardando historial:', e);
      }
    }
  }, [messages]);

  // Auto-scroll al final
  useEffect(() => {
    if (isOpen) {
      streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Mostrar globo interactivo de bienvenida tras 3.5 segundos si no ha interactuado
  useEffect(() => {
    if (isOpen || bubbleDismissed || hasInteracted) return;
    const timer = setTimeout(() => {
      setShowWelcomeBubble(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [isOpen, bubbleDismissed, hasInteracted]);

  // Enviar mensaje
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    setHasInteracted(true);
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: timeStr
    };

    const updatedHistory = [...messages, userMsg];
    const botMsgId = `bot-${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      timestamp: timeStr
    };

    setMessages([...updatedHistory, initialBotMsg]);
    setIsLoading(true);

    try {
      const slidingWindow = updatedHistory.slice(-6);
      const payload = {
        messages: slidingWindow.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          sig: m.sig
        })),
        current_page: typeof window !== 'undefined' ? window.location.pathname : 'home'
      };

      const res = await fetch(`${API_BASE}/api/v1/assistant/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No stream body');

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
                        sig: data.message_sig,
                        stage: data.stage,
                        contact_actions: data.contact_actions || [],
                        project_action: data.project_action || null,
                        booking_action: data.booking_action || null,
                        suggestions:
                          data.suggestions && data.suggestions.length > 0
                            ? data.suggestions
                            : INITIAL_SUGGESTIONS
                      }
                    : m
                )
              );
            }
          } catch (e) {
            // Ignorar errores parciales de JSON en chunks
          }
        }
      }
    } catch (err) {
      console.warn('Fallback local asistido:', err);
      // Mensaje de fallback amigable
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                content:
                  'Para ese proceso, una automatización conectada a tus herramientas ' +
                  'es totalmente viable y te ahorrará horas de trabajo manual. ' +
                  '¿Te gustaría agendar una llamada breve de 15 minutos para revisar los detalles con Erick?',
                suggestions: ['Agendar llamada breve', '¿Cómo son los precios?', 'Ver proyectos']
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  handleSendMessageRef.current = handleSendMessage;

  const handleReset = () => {
    sessionStorage.removeItem('daarick_copilot_history');
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'init-fresh',
        role: 'assistant',
        content:
          '¡Conversación reiniciada! 👋 Para orientarte desde cero:\n\n' +
          '**¿De qué es tu negocio o a qué actividad te dedicas día a día?**',
        timestamp: timeStr,
        suggestions: INITIAL_SUGGESTIONS
      }
    ]);
  };

  // Renderizador seguro de Markdown con alto contraste y tipografía accesible
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
            <strong key={pIdx} className="font-bold text-[#FFFFFF]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          const href = linkMatch[2];
          const isSafe = href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('/');
          if (isSafe) {
            return (
              <a
                key={pIdx}
                href={href}
                target={href.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                className="text-[#d8b4fe] hover:text-white underline inline-flex items-center gap-1 font-semibold text-sm transition-colors"
              >
                {linkMatch[1]}
                <ExternalLink className="w-3.5 h-3.5 inline" />
              </a>
            );
          }
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1 text-[15px] sm:text-base text-[#FFFFFF]">
            <span className="text-[#c084fc] text-sm mt-0.5 font-bold select-none">▸</span>
            <div className="flex-1 leading-relaxed">{content}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed my-1.5 text-[15px] sm:text-base text-[#FFFFFF]">
          {content}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. VENTANA FLOTANTE DEL CHAT */}
      <div
        id="chat-window"
        style={{
          zIndex: 99999,
          display: isOpen ? 'flex' : 'none',
          ...(viewportHeight !== null
            ? {
                height: `${viewportHeight}px`,
                top: `${viewportOffsetTop}px`,
                bottom: 'auto'
              }
            : {})
        }}
        className={`fixed bg-[#160B1A] border-0 sm:border border-[rgba(147,80,115,0.5)] shadow-2xl flex flex-col overflow-hidden transition-[width,height,transform] duration-200 ease-out z-[99999] ${
          isExpanded
            ? 'inset-0 sm:inset-auto sm:bottom-8 sm:right-8 w-full sm:w-[680px] md:w-[760px] h-full sm:h-[720px] rounded-none sm:rounded-2xl'
            : 'inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full sm:w-[460px] md:w-[490px] h-full sm:h-[580px] rounded-none sm:rounded-2xl'
        }`}
        role="dialog"
        aria-label="Wiki Asesor de Automatización"
      >
        {/* Encabezado del Chat */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-[rgba(30,15,35,0.98)] border-b border-[rgba(147,80,115,0.3)] shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(80,45,85,0.6)] border border-[rgba(192,132,252,0.4)] text-[#c084fc] shadow-sm">
              <Dog className="w-5 h-5 text-[#c084fc]" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-[#160B1A]"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-sans text-base font-bold tracking-tight text-[#FFFFFF]">
                  Wiki
                </span>
                <span className="px-2 py-0.5 rounded bg-[#c084fc]/20 border border-[#c084fc]/40 text-[#d8b4fe] font-mono text-xs font-bold uppercase tracking-wider">
                  Asesor
                </span>
              </div>
              <span className="font-sans text-xs text-[#F6DBC0] font-medium">
                Soluciones & Automatización
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 text-[#F6DBC0]/60">
            <button
              type="button"
              onClick={handleReset}
              title="Reiniciar conversación"
              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg hover:bg-[rgba(80,45,85,0.5)] hover:text-[#F8F4E9] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Restaurar tamaño' : 'Expandir ventana'}
              className="hidden sm:flex w-7 h-7 items-center justify-center rounded hover:bg-[rgba(80,45,85,0.5)] hover:text-[#F8F4E9] transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Cerrar chat"
              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-[rgba(80,45,85,0.3)] hover:bg-[rgba(80,45,85,0.6)] text-[#F8F4E9] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Flujo de Mensajes */}
        <div
          id="conversation-stream"
          className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto font-sans text-sm text-[#F8F4E9] scrollbar-thin scrollbar-thumb-[rgba(147,80,115,0.3)]"
        >
          {messages.map((msg, index) => {
            const isBot = msg.role === 'assistant';
            const isLastMessage = index === messages.length - 1;

            if (isBot && !msg.content) return null;

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
                    <div
                      className={`p-4 rounded-2xl shadow-md text-[15px] sm:text-base leading-relaxed ${
                        isBot
                          ? 'rounded-tl-sm bg-[rgba(42,18,50,0.95)] border border-[rgba(192,132,252,0.4)] text-[#FFFFFF] font-sans'
                          : 'rounded-tr-sm bg-[#521f61] border border-[rgba(216,180,254,0.5)] text-[#FFFFFF] font-normal shadow-md'
                      }`}
                    >
                      {isBot ? (
                        <div className="space-y-1">
                          {renderFormattedText(msg.content)}

                          {/* Cursor parpadeante durante streaming */}
                          {isLastMessage && isLoading && msg.content && (
                            <span className="inline-block w-2 h-4 ml-1 bg-[#c084fc] animate-pulse align-middle" />
                          )}

                          {/* TARJETA DE PROYECTO COMPROBADO */}
                          {msg.project_action && (
                            <div className="mt-3.5 p-4 rounded-xl bg-[rgba(24,10,28,0.95)] border border-[#c084fc]/50 shadow-md flex flex-col gap-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-1 rounded bg-[#c084fc]/20 text-[#c084fc]">
                                    <Sparkles className="w-4 h-4" />
                                  </span>
                                  <span className="font-sans text-sm sm:text-base font-bold text-[#FFFFFF] tracking-tight">
                                    {msg.project_action.title}
                                  </span>
                                </div>
                                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[rgba(192,132,252,0.2)] text-[#d8b4fe] font-semibold border border-[#c084fc]/40">
                                  ✓ Caso Comprobado
                                </span>
                              </div>

                              <p className="font-sans text-xs sm:text-sm text-[#F8F4E9] leading-relaxed">
                                {msg.project_action.tagline}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {msg.project_action.demo_url && (
                                  <a
                                    href={msg.project_action.demo_url}
                                    target={msg.project_action.demo_url.startsWith('http') ? '_blank' : '_self'}
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c084fc] hover:bg-[#d8b4fe] text-[#160B1A] font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                                  >
                                    <span>{msg.project_action.action_label || 'Ver Cómo Funciona'}</span>
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                {msg.project_action.github_url && (
                                  <a
                                    href={msg.project_action.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[rgba(80,45,85,0.5)] hover:bg-[rgba(80,45,85,0.8)] border border-[rgba(192,132,252,0.4)] text-[#FFFFFF] text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                                  >
                                    <GitHubIcon className="w-4 h-4 text-[#ddb8ff]" />
                                    <span>Código</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* ACCIÓN DE AGENDADO DIRECTO EN GOOGLE CALENDAR */}
                          {msg.booking_action && msg.booking_action.slots && msg.booking_action.slots.length > 0 && (
                            <BookingSlotsCard
                              slots={msg.booking_action.slots}
                              defaultSummary={msg.booking_action.default_summary}
                              apiBase={API_BASE}
                            />
                          )}

                          {/* BOTONES DE CONTACTO DIRECTO */}
                          {msg.contact_actions && msg.contact_actions.length > 0 && (
                            <div className="mt-3.5 pt-3 border-t border-[rgba(147,80,115,0.35)] flex flex-col gap-2">
                              <span className="font-sans text-xs text-[#F6DBC0] uppercase tracking-wider font-bold">
                                Canales directos con Erick:
                              </span>
                              <div className="flex flex-wrap items-center gap-2">
                                {msg.contact_actions.map((act, aIdx) => (
                                  <a
                                    key={aIdx}
                                    href={act.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer ${
                                      act.type === 'whatsapp'
                                        ? 'bg-[rgba(16,185,129,0.2)] hover:bg-[rgba(16,185,129,0.3)] border border-[#10B981]/50 text-[#34d399]'
                                        : act.type === 'linkedin'
                                        ? 'bg-[rgba(192,132,252,0.2)] hover:bg-[rgba(192,132,252,0.3)] border border-[#c084fc]/50 text-[#d8b4fe]'
                                        : 'bg-[rgba(255,175,213,0.2)] hover:bg-[rgba(255,175,213,0.3)] border border-[#ffafd5]/50 text-[#ffafd5]'
                                    }`}
                                  >
                                    {act.type === 'whatsapp' && <WhatsAppIcon className="w-4 h-4 text-[#10B981]" />}
                                    {act.type === 'linkedin' && <LinkedInIcon className="w-4 h-4 text-[#c084fc]" />}
                                    {act.type === 'email' && <Mail className="w-4 h-4 text-[#ffafd5]" />}
                                    <span>{act.label}</span>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="leading-relaxed whitespace-pre-wrap text-[#FFFFFF]">{msg.content}</span>
                      )}
                    </div>

                    <span
                      className={`font-mono text-xs px-1 select-none font-medium ${
                        isBot ? 'text-[#F3E5D8]' : 'text-[#FFFFFF] text-right'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>

                {/* SUGERENCIAS: Solo se muestran en el último mensaje para no saturar la pantalla */}
                {isBot && isLastMessage && msg.suggestions && msg.suggestions.length > 0 && !isLoading && (
                  <div className="pt-2.5 pl-10 flex flex-wrap gap-2 max-w-full">
                    {msg.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSendMessage(sug)}
                        className="px-4 py-2 rounded-xl bg-[rgba(58,25,69,0.95)] hover:bg-[#c084fc] hover:text-[#160B1A] border border-[rgba(192,132,252,0.45)] hover:border-[#c084fc] text-[#FFFFFF] text-[13px] sm:text-sm font-semibold transition-all shadow-md flex items-center gap-2 active:scale-95 text-left cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Estado de carga / pensando con animación fluida */}
          {isLoading && (!messages[messages.length - 1]?.content || messages[messages.length - 1]?.role === 'user') && (
            <div className="flex items-start gap-3 max-w-[85%] animate-fadeIn">
              <div className="w-8 h-8 rounded-lg bg-[rgba(80,45,85,0.7)] border border-[rgba(192,132,252,0.4)] flex items-center justify-center shrink-0 text-[#c084fc] mt-1 shadow-md">
                <Dog className="w-4 h-4 text-[#c084fc] animate-pulse" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[rgba(42,18,50,0.95)] border border-[rgba(192,132,252,0.4)] shadow-md flex items-center gap-3">
                  <div className="flex items-center gap-1.5 py-0.5" aria-label="Wiki está pensando">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c084fc] animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d8b4fe] animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f3e8ff] animate-bounce"></span>
                  </div>
                  <span className="text-xs sm:text-sm font-sans text-[#FFFFFF] font-medium tracking-wide">
                    Wiki está pensando...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={streamEndRef} />
        </div>

        {/* Barra de Entrada (Input Area) */}
        <div className="p-3 sm:p-4 bg-[rgba(26,12,30,0.95)] border-t border-[rgba(147,80,115,0.3)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1 rounded-xl bg-[rgba(45,20,52,0.7)] border border-[rgba(192,132,252,0.4)] focus-within:border-[#c084fc] transition-colors">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Escribe tu mensaje o cuéntame de tu negocio..."
                rows={1}
                maxLength={800}
                className="w-full px-3.5 py-2.5 bg-transparent text-[15px] sm:text-base text-[#FFFFFF] placeholder-[#F6DBC0]/70 resize-none focus:outline-none font-normal"
              />
            </div>

            {speechSupported && (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`w-11 h-11 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-rose-500/25 border-rose-500 text-rose-300 animate-pulse'
                    : 'bg-[rgba(45,20,52,0.7)] border-[rgba(192,132,252,0.4)] text-[#FFFFFF] hover:text-[#c084fc] hover:border-[#c084fc]'
                }`}
                title={isListening ? 'Detener micrófono' : 'Hablar por micrófono'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-11 h-11 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] disabled:opacity-40 text-[#160B1A] transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center shrink-0"
              title="Enviar mensaje"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* 2. BOTÓN FLOTANTE (FAB) CON EFECTO DE RESPLANDOR Y GLOBO PROACTIVO */}
      <div
        style={{ display: isOpen ? 'none' : 'flex' }}
        className="fixed bottom-6 right-6 z-[99990] flex flex-col items-end gap-2.5 pointer-events-none"
      >
        {/* Globo de bienvenida proactivo */}
        {showWelcomeBubble && !bubbleDismissed && (
          <div className="wiki-bubble-float pointer-events-auto relative max-w-[280px] sm:max-w-[320px] p-4 rounded-2xl bg-[rgba(26,12,30,0.98)] border border-[#c084fc]/60 shadow-2xl backdrop-blur-md text-[#FFFFFF] flex items-start gap-2.5 animate-fadeIn">
            <div className="flex-1 cursor-pointer" onClick={() => { setIsOpen(true); setShowWelcomeBubble(false); }}>
              <div className="flex items-center gap-1.5 font-sans text-xs text-[#d8b4fe] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#c084fc]" />
                <span>¿Tienes un negocio?</span>
              </div>
              <p className="text-sm text-[#FFFFFF] leading-relaxed font-sans">
                ¿Qué tarea te quita más tiempo en el día? Pregúntame cómo simplificarla.
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowWelcomeBubble(false);
                setBubbleDismissed(true);
              }}
              className="text-[#F6DBC0]/70 hover:text-[#FFFFFF] p-1 rounded cursor-pointer"
              title="Cerrar mensaje"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Flechita del globo apuntando hacia el botón */}
            <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-[#1A0C1E] border-r border-b border-[#c084fc]/60 transform rotate-45" />
          </div>
        )}

        {/* Botón Flotante con Resplandor (Glow Pulse) */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setShowWelcomeBubble(false);
          }}
          className="pointer-events-auto wiki-fab-glow items-center gap-3 px-4 py-3 rounded-2xl bg-[rgba(26,12,30,0.96)] hover:bg-[rgba(45,20,52,0.98)] border border-[#c084fc]/60 text-[#FFFFFF] shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer group flex"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#c084fc]/25 text-[#c084fc]">
            <Dog className="w-5 h-5 text-[#c084fc] group-hover:scale-110 transition-transform" />
            {/* Anillo de pulso verde en vivo */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] ring-2 ring-[#160B1A]"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-bold text-[#FFFFFF]">
                Hablar con Wiki
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#34d399] font-mono text-[10px] font-semibold border border-[#10B981]/40">
                En vivo
              </span>
            </div>
            <span className="font-sans text-xs text-[#F6DBC0] font-medium">
              Asesor de soluciones
            </span>
          </div>
        </button>
      </div>
    </>
  );
};
