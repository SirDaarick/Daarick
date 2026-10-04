"""
Esquemas Pydantic para el asistente interactivo Wiki y el sistema de citas de Google Calendar.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class ContactAction(BaseModel):
    type: str = Field(..., description="Tipo de canal: 'whatsapp', 'linkedin', 'email'")
    label: str = Field(..., description="Texto visible del botón")
    url: str = Field(..., description="Enlace de acción directo")

class ProjectAction(BaseModel):
    id: str = Field(..., description="Identificador: 'paidea', 'tetring', 'invoicing', 'graphito', 'paralel'")
    title: str = Field(..., description="Título comprensible del proyecto")
    tagline: str = Field(..., description="Resumen breve enfocado en el beneficio/automatización")
    demo_url: Optional[str] = Field(None, description="Enlace a la demo en vivo o sandbox")
    github_url: Optional[str] = Field(None, description="Enlace al repositorio de GitHub")
    action_label: Optional[str] = Field("Ver Cómo Funciona", description="Texto del botón")

class CalendarSlot(BaseModel):
    start_iso: str = Field(..., description="Fecha y hora de inicio en ISO 8601")
    end_iso: str = Field(..., description="Fecha y hora de fin en ISO 8601")
    label: str = Field(..., description="Texto amigable para el usuario (ej: 'Lunes 14 Oct - 11:00 AM')")

class BookingAction(BaseModel):
    slots: List[CalendarSlot] = Field(default_factory=list, description="Horarios disponibles sugeridos")
    default_summary: Optional[str] = Field(None, description="Resumen breve de la necesidad del cliente")

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"] = Field(..., description="Rol del emisor")
    content: str = Field(..., max_length=4000, description="Contenido del mensaje")
    timestamp: Optional[str] = Field(None, description="Hora de envío formateada")
    sig: Optional[str] = Field(None, description="Firma criptográfica HMAC del turno del asistente")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., min_length=1, max_length=15, description="Historial de mensajes recientes")
    current_page: Optional[str] = Field("home", description="Contexto de la página actual")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Respuesta del asistente breve y en lenguaje de negocio")
    suggestions: List[str] = Field(default_factory=list, description="Tarjetas de mensajes sugeridos para el usuario")
    stage: Optional[str] = Field("DESCUBRIR", description="Etapa del embudo: DESCUBRIR, PROPUESTA, PRUEBA, CIERRE, FUERA_DE_ALCANCE")
    source: str = Field("wiki_engine", description="Motor de generación")
    contact_actions: Optional[List[ContactAction]] = Field(default_factory=list, description="Botones de contacto directo")
    project_action: Optional[ProjectAction] = Field(None, description="Tarjeta de caso análogo comprobado")
    booking_action: Optional[BookingAction] = Field(None, description="Acción de agendado directo con Google Calendar")
    message_sig: Optional[str] = Field(None, description="Firma HMAC del mensaje generado")

class BookSlotRequest(BaseModel):
    start_iso: str = Field(..., description="Horario de inicio seleccionado")
    end_iso: str = Field(..., description="Horario de fin seleccionado")
    client_name: str = Field(..., min_length=2, max_length=100, description="Nombre del cliente")
    client_email: str = Field(..., min_length=5, max_length=150, description="Correo electrónico del cliente")
    need_summary: Optional[str] = Field("", max_length=1500, description="Resumen estructurado de la necesidad e interés del cliente")
    honeypot: Optional[str] = Field(None, description="Campo anti-bots oculto")

class BookSlotResponse(BaseModel):
    success: bool
    message: str
    event_id: Optional[str] = None
    meet_link: Optional[str] = None
