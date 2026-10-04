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
      <div className="wiki-booking-card wiki-booking-success mt-3.5 p-4 rounded-xl bg-[rgba(16,185,129,0.15)] border border-[#10B981]/50 text-[#FFFFFF] flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-[#34d399]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-sans text-sm font-bold uppercase tracking-wider">
            ¡Cita confirmada en Google Calendar!
          </span>
        </div>
        <p className="text-sm text-[#F8F4E9] leading-relaxed font-sans">
          {message} Te enviamos la confirmación con el enlace de Google Meet a tu correo.
        </p>
        {selectedSlot && (
          <div className="p-2.5 rounded-lg bg-[rgba(0,0,0,0.35)] font-sans text-sm text-[#6ee7b7] font-medium">
            📅 {selectedSlot.label}
          </div>
        )}
        {meetLink && (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#34d399] underline hover:text-[#a7f3d0] font-sans font-semibold mt-1"
          >
            Enlace de Google Meet: {meetLink}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="wiki-booking-card mt-3.5 p-4 rounded-xl bg-[rgba(26,12,30,0.95)] border border-[#c084fc]/50 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(147,80,115,0.3)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#c084fc]/20 text-[#c084fc]">
            <Calendar className="w-4 h-4" />
          </span>
          <span className="wiki-booking-title font-sans text-sm font-bold text-[#FFFFFF]">
            Agendar llamada breve (15-20 min)
          </span>
        </div>
        <span className="wiki-booking-badge font-mono text-xs text-[#d8b4fe] bg-[#c084fc]/20 px-2 py-0.5 rounded font-semibold border border-[#c084fc]/40">
          Google Calendar
        </span>
      </div>

      <p className="wiki-booking-desc font-sans text-sm text-[#F8F4E9] leading-relaxed">
        Elige un horario disponible para revisar tu idea con Erick:
      </p>

      {/* Selector de Horarios */}
      <div className="flex flex-col gap-2">
        {slots.map((slot, idx) => {
          const isSelected = selectedSlot?.start_iso === slot.start_iso;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className={`wiki-booking-slot w-full text-left px-3.5 py-2.5 rounded-lg font-sans text-sm transition-all flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'selected bg-[#c084fc] text-[#160B1A] font-bold shadow-md'
                  : 'bg-[rgba(55,26,62,0.65)] hover:bg-[rgba(80,45,85,0.7)] border border-[rgba(192,132,252,0.35)] text-[#FFFFFF]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 opacity-80" />
                <span className="font-medium">{slot.label}</span>
              </span>
              <span className="text-xs uppercase font-bold opacity-85">
                {isSelected ? 'Seleccionado' : 'Elegir'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Formulario de confirmación al elegir un horario */}
      {selectedSlot && (
        <form onSubmit={handleSubmit} className="pt-2 flex flex-col gap-3 animate-fadeIn">
          <div className="text-xs font-sans text-[#d8b4fe] font-semibold">
            Confirmar para: <span className="font-bold text-white">{selectedSlot.label}</span>
          </div>

          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-[#F6DBC0]/70" />
            <input
              type="text"
              required
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="wiki-booking-input w-full pl-9 pr-3.5 py-2 rounded-lg bg-[rgba(20,10,25,0.85)] border border-[rgba(192,132,252,0.4)] text-sm text-[#FFFFFF] placeholder-[#F6DBC0]/70 focus:outline-none focus:border-[#c084fc]"
            />
          </div>

          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-[#F6DBC0]/70" />
            <input
              type="email"
              required
              placeholder="Tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="wiki-booking-input w-full pl-9 pr-3.5 py-2 rounded-lg bg-[rgba(20,10,25,0.85)] border border-[rgba(192,132,252,0.4)] text-sm text-[#FFFFFF] placeholder-[#F6DBC0]/70 focus:outline-none focus:border-[#c084fc]"
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
            <span className="text-xs font-sans text-rose-300 font-semibold">{message}</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="wiki-booking-submit w-full mt-1 py-2.5 px-4 rounded-lg bg-[#c084fc] hover:bg-[#d8b4fe] active:scale-95 text-[#160B1A] font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Reservando en Google Calendar...' : 'Confirmar y Recibir Invitación'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
