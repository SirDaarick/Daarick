"""
Servicio de integración con Google Calendar API (OAuth 2.0).
Consulta de disponibilidad (freeBusy) y reserva de eventos con Google Meet.
Soporta búsqueda de huecos específicos para una fecha preferida por el usuario.
"""
import httpx
from datetime import datetime, timedelta, timezone, date
from zoneinfo import ZoneInfo
from typing import List, Dict, Any, Optional
from app.core.settings import settings
from app.schemas.assistant import CalendarSlot

class CalendarService:
    def __init__(self):
        self._access_token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None

    def is_configured(self) -> bool:
        return bool(
            settings.GOOGLE_CLIENT_ID and 
            settings.GOOGLE_CLIENT_SECRET and 
            settings.GOOGLE_REFRESH_TOKEN
        )

    async def get_valid_access_token(self, client: httpx.AsyncClient) -> Optional[str]:
        """Refresca el token de acceso OAuth 2.0 usando el refresh token."""
        if not self.is_configured():
            return None

        now = datetime.now(timezone.utc)
        if self._access_token and self._token_expiry and now < self._token_expiry:
            return self._access_token

        try:
            token_url = "https://oauth2.googleapis.com/token"
            payload = {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": settings.GOOGLE_REFRESH_TOKEN,
                "grant_type": "refresh_token"
            }
            resp = await client.post(token_url, data=payload, timeout=8.0)
            if resp.status_code == 200:
                data = resp.json()
                self._access_token = data.get("access_token")
                expires_in = data.get("expires_in", 3600)
                self._token_expiry = now + timedelta(seconds=expires_in - 60)
                return self._access_token
            else:
                print(f"[Calendar Token Error] Status: {resp.status_code}, Body: {resp.text[:120]}")
        except Exception as e:
            print(f"[Calendar Token Exception] {e}")
        return None

    async def get_free_busy(
        self, 
        client: httpx.AsyncClient, 
        time_min: datetime, 
        time_max: datetime
    ) -> List[Dict[str, datetime]]:
        """Consulta intervalos ocupados en el calendario de Google."""
        token = await self.get_valid_access_token(client)
        if not token:
            return []

        url = "https://www.googleapis.com/calendar/v3/freeBusy"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "timeMin": time_min.isoformat(),
            "timeMax": time_max.isoformat(),
            "timeZone": settings.BOOKING_TIMEZONE,
            "items": [{"id": settings.GOOGLE_CALENDAR_ID}]
        }

        try:
            resp = await client.post(url, headers=headers, json=payload, timeout=8.0)
            if resp.status_code == 200:
                data = resp.json()
                calendars = data.get("calendars", {})
                cal_data = calendars.get(settings.GOOGLE_CALENDAR_ID, {})
                busy_list = cal_data.get("busy", [])
                parsed_busy = []
                for b in busy_list:
                    parsed_busy.append({
                        "start": datetime.fromisoformat(b["start"]),
                        "end": datetime.fromisoformat(b["end"])
                    })
                return parsed_busy
            else:
                print(f"[Calendar freeBusy Error] {resp.status_code}: {resp.text[:100]}")
        except Exception as e:
            print(f"[Calendar freeBusy Exception] {e}")
        return []

    async def get_available_slots(
        self, 
        client: httpx.AsyncClient, 
        target_date: Optional[date] = None,
        max_slots: int = 20,
        max_days: int = 5,
        max_slots_per_day: int = 4
    ) -> List[CalendarSlot]:
        """
        Calcula los huecos libres respetando las reglas de trabajo.
        Si target_date se proporciona, busca prioritariamente en esa fecha específica.
        Distribuye los huecos a lo largo de varios días hábiles para permitir selección por día.
        """
        tz = ZoneInfo(settings.BOOKING_TIMEZONE)
        now_local = datetime.now(tz)
        min_start = now_local + timedelta(hours=settings.BOOKING_MIN_NOTICE_HOURS)
        max_end = now_local + timedelta(days=settings.BOOKING_HORIZON_DAYS)

        busy_intervals = []
        if self.is_configured():
            busy_intervals = await self.get_free_busy(client, min_start, max_end)

        valid_days = [d.strip().upper() for d in settings.BOOKING_DAYS.split(",") if d.strip()]
        day_map = {0: "MON", 1: "TUE", 2: "WED", 3: "THU", 4: "FRI", 5: "SAT", 6: "SUN"}

        start_h, end_h = 10, 18
        if "-" in settings.BOOKING_HOURS:
            try:
                p1, p2 = settings.BOOKING_HOURS.split("-")
                start_h = int(p1.split(":")[0])
                end_h = int(p2.split(":")[0])
            except Exception:
                pass

        day_names_es = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
        month_names_es = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

        def generate_slots_for_day(d: date) -> List[CalendarSlot]:
            day_slots = []
            weekday_idx = d.weekday()
            weekday_code = day_map.get(weekday_idx, "")
            if weekday_code not in valid_days:
                return day_slots

            slot_time = datetime(d.year, d.month, d.day, start_h, 0, tzinfo=tz)
            day_limit = datetime(d.year, d.month, d.day, end_h, 0, tzinfo=tz)

            while slot_time + timedelta(minutes=settings.BOOKING_DURATION_MIN) <= day_limit:
                slot_end = slot_time + timedelta(minutes=settings.BOOKING_DURATION_MIN)
                if slot_time >= min_start:
                    is_busy = False
                    for b in busy_intervals:
                        if not (slot_end <= b["start"] or slot_time >= b["end"]):
                            is_busy = True
                            break

                    if not is_busy:
                        d_name = day_names_es[weekday_idx]
                        m_name = month_names_es[d.month - 1]
                        time_str = slot_time.strftime("%I:%M %p").lstrip("0")
                        label = f"{d_name} {d.day} de {m_name} - {time_str}"
                        day_slots.append(CalendarSlot(
                            start_iso=slot_time.isoformat(),
                            end_iso=slot_end.isoformat(),
                            label=label
                        ))
                slot_time += timedelta(minutes=settings.BOOKING_DURATION_MIN)
            return day_slots

        # Si el usuario solicitó una fecha específica válida (ej: 8 de octubre)
        if target_date:
            if target_date >= min_start.date() and target_date <= max_end.date():
                target_slots = generate_slots_for_day(target_date)
                if target_slots:
                    return target_slots[:max_slots]

        # De lo contrario o como respaldo, buscar distribuyendo a lo largo de varios días hábiles
        slots: List[CalendarSlot] = []
        current_day = min_start.date()
        days_found = 0

        while current_day <= max_end.date() and days_found < max_days and len(slots) < max_slots:
            day_slots = generate_slots_for_day(current_day)
            if day_slots:
                selected_for_day = day_slots[:max_slots_per_day]
                slots.extend(selected_for_day)
                days_found += 1
            current_day += timedelta(days=1)

        return slots

    async def create_calendar_event(
        self,
        client: httpx.AsyncClient,
        start_iso: str,
        end_iso: str,
        client_name: str,
        client_email: str,
        need_summary: str = ""
    ) -> Dict[str, Any]:
        """Crea el evento en Google Calendar con enlace de Google Meet y notificación por email."""
        if not self.is_configured():
            return {
                "success": False,
                "message": "La integración con Google Calendar está pendiente de configuración."
            }

        t_start = datetime.fromisoformat(start_iso)
        t_end = datetime.fromisoformat(end_iso)
        busy_list = await self.get_free_busy(client, t_start - timedelta(minutes=5), t_end + timedelta(minutes=5))
        for b in busy_list:
            if not (t_end <= b["start"] or t_start >= b["end"]):
                return {
                    "success": False,
                    "message": "Este horario ya fue reservado recientemente. Por favor elige otro."
                }

        token = await self.get_valid_access_token(client)
        if not token:
            return {"success": False, "message": "Error al conectar con la cuenta de Google Calendar."}

        url = f"https://www.googleapis.com/calendar/v3/calendars/{settings.GOOGLE_CALENDAR_ID}/events?conferenceDataVersion=1&sendUpdates=all"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        clean_summary = need_summary.strip() if need_summary else "Evaluación de automatización y soluciones de software a medida"
        description = (
            f"🗓️ LLAMADA DE DIAGNÓSTICO Y ASESORÍA TÉCNICA - DAARICK\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"👤 DATOS DEL CLIENTE:\n"
            f"• Nombre: {client_name}\n"
            f"• Correo: {client_email}\n\n"
            f"📋 BRIEFING DE LA CONVERSACIÓN PREVIA (WIKI):\n"
            f"{clean_summary}\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"💡 ¡NO EMPEZARÁN DE CERO!\n"
            f"Erick ya cuenta con este resumen en sus notas para llegar con un enfoque claro y aterrizar directamente la propuesta y prototipo sin repetir preguntas.\n\n"
            f"🤖 Agendado automáticamente por Wiki (Asesor Daarick)\n"
            f"🔗 Enlace de Google Meet adjunto en esta invitación."
        )

        event_payload = {
            "summary": f"Diagnóstico de Automatización: {client_name} & Erick",
            "description": description,
            "start": {"dateTime": start_iso},
            "end": {"dateTime": end_iso},
            "attendees": [{"email": client_email, "displayName": client_name}],
            "conferenceData": {
                "createRequest": {
                    "requestId": f"daarick-{int(datetime.now().timestamp())}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 24 * 60},
                    {"method": "popup", "minutes": 30}
                ]
            }
        }

        try:
            resp = await client.post(url, headers=headers, json=event_payload, timeout=12.0)
            if resp.status_code in [200, 201]:
                event_data = resp.json()
                meet_link = event_data.get("hangoutLink") or event_data.get("conferenceData", {}).get("entryPoints", [{}])[0].get("uri")
                return {
                    "success": True,
                    "message": "Cita agendada con éxito. Te llegará un correo de confirmación de Google Calendar.",
                    "event_id": event_data.get("id"),
                    "meet_link": meet_link
                }
            else:
                print(f"[Calendar Create Event Error] {resp.status_code}: {resp.text}")
                return {"success": False, "message": f"Google Calendar rechazó la solicitud ({resp.status_code})."}
        except Exception as e:
            print(f"[Calendar Create Event Exception] {e}")
            return {"success": False, "message": f"Excepción al agendar: {str(e)}"}

calendar_service = CalendarService()
