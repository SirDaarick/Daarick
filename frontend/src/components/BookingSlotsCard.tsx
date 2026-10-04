import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

export interface CalendarSlot {
  start_iso: string;
  end_iso: string;
  label: string;
}

export interface BookingActionProps {
  slots: CalendarSlot[];
  defaultSummary?: string;
  apiBase: string;
}

export const BookingSlotsCard: React.FC<BookingActionProps> = ({
  slots,
  defaultSummary = 'Evaluación de proyecto y automatización',
  apiBase
}) => {
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [meetLink, setMeetLink] = useState<string | null>(null);

  if (!slots || slots.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const res = await fetch(`${apiBase}/api/v1/assistant/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_iso: selectedSlot.start_iso,
          end_iso: selectedSlot.end_iso,
          client_name: name.trim(),
          client_email: email.trim(),
          need_summary: defaultSummary,
          honeypot: honeypot || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Cita agendada con éxito.');
        setMeetLink(data.meet_link || null);
      } else {
        setStatus('error');
        setMessage(data.message || 'No se pudo reservar el horario. Intenta con otro.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Error de conexión al agendar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="mt-3.5 p-4 rounded-xl bg-[rgba(16,185,129,0.1)] border border-[#10B981]/40 text-[#F8F4E9] flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[#10B981]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            ¡Cita confirmada en Google Calendar!
          </span>
        </div>
        <p className="text-xs text-[#F6DBC0]/90 leading-relaxed font-sans">
          {message}
        </p>
        {selectedSlot && (
          <div className="p-2 rounded bg-[rgba(0,0,0,0.3)] font-mono text-xs text-[#6ee7b7]">
            📅 {selectedSlot.label}
          </div>
        )}
        {meetLink && (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#10B981] underline hover:text-[#6ee7b7] font-mono mt-1"
          >
            Enlace de Google Meet: {meetLink}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3.5 p-3.5 rounded-xl bg-[rgba(26,12,30,0.85)] border border-[#c084fc]/35 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(147,80,115,0.25)] pb-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-[#c084fc]/20 text-[#c084fc]">
            <Calendar className="w-3.5 h-3.5" />
          </span>
          <span className="font-mono text-xs font-bold text-[#F8F4E9]">
            Agendar llamada breve (15-20 min)
          </span>
        </div>
        <span className="font-mono text-[10px] text-[#c084fc] bg-[#c084fc]/15 px-2 py-0.5 rounded border border-[#c084fc]/30">
          Google Calendar
        </span>
      </div>

      <p className="font-sans text-xs text-[#F6DBC0]/85 leading-relaxed">
        Elige un horario disponible para revisar tu idea con Erick:
      </p>

      {/* Selector de Horarios */}
      <div className="flex flex-col gap-1.5">
        {slots.map((slot, idx) => {
          const isSelected = selectedSlot?.start_iso === slot.start_iso;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`w-full text-left px-3 py-2 rounded-lg font-mono text-xs transition-all flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-[#c084fc] text-[#160B1A] font-bold shadow-md'
                  : 'bg-[rgba(55,26,62,0.5)] hover:bg-[rgba(80,45,85,0.5)] border border-[rgba(147,80,115,0.3)] text-[#F6DBC0]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 opacity-80" />
                <span>{slot.label}</span>
              </span>
              <span className="text-[10px] uppercase opacity-75">
                {isSelected ? 'Seleccionado' : 'Elegir'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Formulario de confirmación al elegir un horario */}
      {selectedSlot && (
        <form onSubmit={handleSubmit} className="pt-2 flex flex-col gap-2.5 animate-fadeIn">
          <div className="text-[11px] font-mono text-[#ddb8ff]">
            Confirmar para: <span className="font-bold">{selectedSlot.label}</span>
          </div>

          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#F6DBC0]/50" />
            <input
              type="text"
              required
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[rgba(20,10,25,0.7)] border border-[rgba(147,80,115,0.35)] text-xs text-[#F8F4E9] focus:outline-none focus:border-[#c084fc]"
            />
          </div>

          <div className="relative">
            <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#F6DBC0]/50" />
            <input
              type="email"
              required
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[rgba(20,10,25,0.7)] border border-[rgba(147,80,115,0.35)] text-xs text-[#F8F4E9] focus:outline-none focus:border-[#c084fc]"
            />
          </div>

          {/* Campo honeypot oculto anti-spam */}
          <input
            type="text"
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />

          {status === 'error' && (
            <span className="text-[11px] font-mono text-rose-300">{message}</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-1 py-2 px-3 rounded-lg bg-[#c084fc] hover:bg-[#d8b4fe] active:scale-95 text-[#160B1A] font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Reservando en Google Calendar...' : 'Confirmar y Recibir Invitación'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
