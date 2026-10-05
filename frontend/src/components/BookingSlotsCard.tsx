import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, User, Mail, CheckCircle2, ArrowRight, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

export interface CalendarSlot {
  start_iso: string;
  end_iso: string;
  label: string;
}

export interface BookingActionProps {
  slots: CalendarSlot[];
  defaultSummary?: string;
  apiBase: string;
  onSuccess?: (slotLabel: string) => void;
}

interface DayGroup {
  dateKey: string;     // e.g. "2026-10-05"
  dayLabel: string;    // e.g. "Lun 5 Oct"
  fullDayName: string; // e.g. "Lunes 5 de Oct"
  slots: CalendarSlot[];
}

export const BookingSlotsCard: React.FC<BookingActionProps> = ({
  slots,
  defaultSummary = 'Evaluación de proyecto y automatización',
  apiBase,
  onSuccess
}) => {
  // Agrupar los slots por día para permitir selección de fecha + hora
  const dayGroups: DayGroup[] = useMemo(() => {
    if (!slots || slots.length === 0) return [];
    const map = new Map<string, { dayLabel: string; fullDayName: string; slots: CalendarSlot[] }>();

    for (const slot of slots) {
      const dateKey = slot.start_iso.split('T')[0];
      const parts = slot.label.split(' - ');
      const dayPart = parts[0] || 'Día disponible';

      if (!map.has(dateKey)) {
        // Abreviar el nombre para la pestaña (ej: "Lunes 5 de Octubre" -> "Lun 5 Oct")
        const shortened = dayPart
          .replace('Lunes', 'Lun')
          .replace('Martes', 'Mar')
          .replace('Miércoles', 'Mié')
          .replace('Miercoles', 'Mié')
          .replace('Jueves', 'Jue')
          .replace('Viernes', 'Vie')
          .replace('Sábado', 'Sáb')
          .replace('Sabado', 'Sáb')
          .replace('Domingo', 'Dom')
          .replace(' de ', ' ');

        map.set(dateKey, {
          dayLabel: shortened,
          fullDayName: dayPart,
          slots: []
        });
      }
      map.get(dateKey)!.slots.push(slot);
    }

    return Array.from(map.entries()).map(([dateKey, val]) => ({
      dateKey,
      dayLabel: val.dayLabel,
      fullDayName: val.fullDayName,
      slots: val.slots
    }));
  }, [slots]);

  const [selectedDateKey, setSelectedDateKey] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<CalendarSlot | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [meetLink, setMeetLink] = useState<string | null>(null);

  // Inicializar día seleccionado
  useEffect(() => {
    if (dayGroups.length > 0 && !selectedDateKey) {
      setSelectedDateKey(dayGroups[0].dateKey);
    }
  }, [dayGroups, selectedDateKey]);

  if (!slots || slots.length === 0) return null;

  const activeGroup = dayGroups.find((g) => g.dateKey === selectedDateKey) || dayGroups[0];
  const currentSlots = activeGroup?.slots || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    try {
      const cleanApiBase = (apiBase || '').replace(/\/+$/, '');
      const res = await fetch(`${cleanApiBase}/api/v1/assistant/book`, {
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
        if (onSuccess && selectedSlot) {
          onSuccess(selectedSlot.label);
        }
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

  // PANTALLA DE ÉXITO CON CERTIDUMBRE Y BRIEFING ENVIADO
  if (status === 'success') {
    return (
      <div className="wiki-booking-card wiki-booking-success mt-3.5 p-4 rounded-xl bg-[rgba(16,185,129,0.15)] border border-[#10B981]/50 text-[#FFFFFF] flex flex-col gap-3 shadow-lg animate-fadeIn">
        <div className="flex items-center gap-2 text-[#34d399]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-sans text-[13px] sm:text-sm font-bold uppercase tracking-wider">
            ¡Cita confirmada en Google Calendar!
          </span>
        </div>

        <p className="text-[15px] text-[#F8F4E9] leading-relaxed font-sans">
          {message} Te enviamos la invitación a tu correo con la liga de Google Meet.
        </p>

        {selectedSlot && (
          <div className="p-3 rounded-lg bg-[rgba(0,0,0,0.4)] font-sans text-[15px] text-[#6ee7b7] font-semibold flex items-center gap-2 border border-[#10B981]/30">
            <span>📅</span>
            <span>{selectedSlot.label}</span>
          </div>
        )}

        {meetLink && (
          <a
            href={meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#10B981]/25 hover:bg-[#10B981]/35 border border-[#10B981]/50 text-[#34d399] font-sans font-semibold text-sm transition-all"
          >
            <span className="flex items-center gap-1.5">
              <span>🔗 Enlace de Google Meet:</span>
              <span className="underline truncate max-w-[200px] sm:max-w-xs">{meetLink}</span>
            </span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>
        )}

        {/* Retroalimentación de no empezar de cero */}
        <div className="p-3.5 rounded-lg bg-[rgba(0,0,0,0.35)] border border-[#10B981]/40 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-[#34d399] font-bold text-[13px]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Erick ya recibió el resumen de esta conversación:</span>
          </div>
          <p className="text-[#F6DBC0]/90 text-[13px] whitespace-pre-line leading-relaxed pl-1 border-l-2 border-[#10B981]/50">
            {defaultSummary}
          </p>
          <span className="text-[11px] text-[#a7f3d0] font-medium pt-1 block">
            ✓ ¡No empezarán de cero! Todo lo que platicamos aquí quedó adjunto en la reunión para llegar directamente a aterrizar tu propuesta y prototipo.
          </span>
          <div className="pt-2 border-t border-[#10B981]/30 mt-1 flex items-center justify-between text-xs text-[#34d399] font-semibold">
            <span>🏁 Cita confirmada • No necesitas hacer nada más por aquí</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wiki-booking-card mt-3.5 p-4 rounded-xl bg-[rgba(26,12,30,0.95)] border border-[#c084fc]/50 shadow-lg flex flex-col gap-3">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2 border-b border-[rgba(147,80,115,0.3)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#c084fc]/20 text-[#c084fc]">
            <Calendar className="w-4 h-4" />
          </span>
          <span className="wiki-booking-title font-sans text-[15px] sm:text-base font-bold text-[#FFFFFF]">
            Agendar videollamada breve (15-20 min)
          </span>
        </div>
        <span className="wiki-booking-badge font-mono text-xs sm:text-[13px] text-[#d8b4fe] bg-[#c084fc]/20 px-2.5 py-0.5 rounded font-semibold border border-[#c084fc]/40">
          Google Calendar
        </span>
      </div>

      <p className="wiki-booking-desc font-sans text-[14px] sm:text-[15px] text-[#F8F4E9] leading-relaxed">
        Elige un día y horario para aterrizar tu prototipo navegable con Erick:
      </p>

      {/* 1. SELECTOR DE DÍAS (MARCADOR DE DÍA) */}
      {dayGroups.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-sans text-xs text-[#d8b4fe] font-semibold uppercase tracking-wider">
            1. Elige una fecha:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none pt-0.5">
            {dayGroups.map((g) => {
              const isSelected = (selectedDateKey || dayGroups[0]?.dateKey) === g.dateKey;
              return (
                <button
                  key={g.dateKey}
                  type="button"
                  onClick={() => {
                    setSelectedDateKey(g.dateKey);
                    if (selectedSlot && selectedSlot.start_iso.split('T')[0] !== g.dateKey) {
                      setSelectedSlot(null);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 select-none ${
                    isSelected
                      ? 'bg-[#c084fc] text-[#160B1A] font-bold shadow-md scale-[1.02]'
                      : 'bg-[rgba(55,26,62,0.65)] hover:bg-[rgba(80,45,85,0.7)] text-[#FFFFFF] border border-[rgba(192,132,252,0.35)]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  <span>{g.dayLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. SELECTOR DE HORARIOS DISPONIBLES PARA EL DÍA ACTIVO */}
      <div className="flex flex-col gap-1.5">
        <span className="font-sans text-xs text-[#d8b4fe] font-semibold uppercase tracking-wider">
          {dayGroups.length > 1 ? '2. Elige tu hora libre:' : 'Horarios disponibles:'}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {currentSlots.map((slot, idx) => {
            const isSelected = selectedSlot?.start_iso === slot.start_iso;
            const timeStr = slot.label.includes(' - ') ? slot.label.split(' - ')[1] : slot.label;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`wiki-booking-slot p-2.5 rounded-xl font-sans text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'selected bg-[#10B981] text-[#160B1A] font-bold shadow-md scale-[1.02]'
                    : 'bg-[rgba(48,22,58,0.7)] hover:bg-[rgba(72,32,86,0.85)] border border-[rgba(192,132,252,0.35)] text-[#FFFFFF]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 opacity-80" />
                <span className="font-semibold">{timeStr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FORMULARIO DE CONFIRMACIÓN CON BRIEFING PREVIO */}
      {selectedSlot && (
        <form onSubmit={handleSubmit} className="pt-2 flex flex-col gap-3 animate-fadeIn border-t border-[rgba(147,80,115,0.3)] mt-1">
          <div className="text-xs sm:text-sm font-sans text-[#d8b4fe] font-semibold flex items-center justify-between">
            <span>Horario seleccionado: <strong className="text-white">{selectedSlot.label}</strong></span>
            <button
              type="button"
              onClick={() => setSelectedSlot(null)}
              className="text-xs text-[#F6DBC0]/70 hover:text-white underline cursor-pointer"
            >
              Cambiar
            </button>
          </div>

          {/* Resumen que se le mandará a Erick para que no empiece de cero */}
          {defaultSummary && (
            <div className="p-3 rounded-xl bg-[rgba(15,7,20,0.85)] border border-[rgba(192,132,252,0.35)] text-xs text-[#e2d4e7] flex flex-col gap-1.5 shadow-inner">
              <div className="flex items-center gap-1.5 text-[#34d399] font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Resumen que recibirá Erick (no empezarás de cero):</span>
              </div>
              <p className="text-[12.5px] sm:text-[13px] text-[#F8F4E9]/90 leading-relaxed whitespace-pre-line pl-1 border-l-2 border-[#c084fc]/50">
                {defaultSummary}
              </p>
              <span className="text-[11px] text-[#F6DBC0]/70 italic mt-0.5">
                Erick revisará estos puntos antes de la llamada para ir directo al grano.
              </span>
            </div>
          )}

          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3.5 text-[#F6DBC0]/70" />
            <input
              type="text"
              required
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="wiki-booking-input w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[rgba(20,10,25,0.85)] border border-[rgba(192,132,252,0.4)] text-[14px] sm:text-[15px] text-[#FFFFFF] placeholder-[#F6DBC0]/70 focus:outline-none focus:border-[#c084fc]"
            />
          </div>

          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3.5 text-[#F6DBC0]/70" />
            <input
              type="email"
              required
              placeholder="Tu correo para la invitación y Meet"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="wiki-booking-input w-full pl-9 pr-3.5 py-2.5 rounded-lg bg-[rgba(20,10,25,0.85)] border border-[rgba(192,132,252,0.4)] text-[14px] sm:text-[15px] text-[#FFFFFF] placeholder-[#F6DBC0]/70 focus:outline-none focus:border-[#c084fc]"
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
            <span className="text-sm font-sans text-rose-300 font-semibold">{message}</span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="wiki-booking-submit w-full mt-1 py-3 px-4 rounded-xl bg-[#c084fc] hover:bg-[#d8b4fe] active:scale-95 text-[#160B1A] font-bold text-[14px] sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Reservando en Google Calendar...' : 'Confirmar Cita con Erick'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
