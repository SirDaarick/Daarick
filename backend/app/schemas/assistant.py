from typing import List, Optional
from pydantic import BaseModel, Field

class ContactAction(BaseModel):
    type: str = Field(..., description="Tipo de canal: 'whatsapp', 'linkedin', 'email', 'github'")
    label: str = Field(..., description="Texto visible del botón")
    url: str = Field(..., description="Enlace de acción directo")

class ProjectAction(BaseModel):
    id: str = Field(..., description="Identificador del proyecto (ej. 'graphito', 'tetring', 'paidea', 'paralel', 'invoicing')")
    title: str = Field(..., description="Título del proyecto")
    tagline: str = Field(..., description="Descripción técnica corta de la solución")
    demo_url: Optional[str] = Field(None, description="Enlace a la demo en vivo o sandbox")
    github_url: Optional[str] = Field(None, description="Enlace al repositorio de GitHub")
    action_label: Optional[str] = Field("Ver Proyecto", description="Texto de la llamada a la acción")

class ChatMessage(BaseModel):
    role: str = Field(..., description="Rol del emisor: 'user' o 'assistant'")
    content: str = Field(..., max_length=1500, description="Contenido del mensaje (máx 1500 caracteres)")
    timestamp: Optional[str] = Field(None, description="Hora de envío formateada (ej. 10:42 AM)")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Historial de mensajes (se aplica sliding window en el servidor)")
    current_page: Optional[str] = Field("home", description="Contexto de la página actual")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Respuesta del asistente")
    suggestions: List[str] = Field(default_factory=list, description="Sugerencias o preguntas de seguimiento")
    feasibility_verdict: Optional[str] = Field(None, description="Veredicto de viabilidad técnica si aplica")
    tech_recommendations: Optional[List[str]] = Field(default_factory=list, description="Stack recomendado para el caso consultado")
    source: str = Field("engine", description="Motor de generación: 'gemini' o 'local_engine'")
    strategy: Optional[str] = Field("standard", description="Estrategia aplicada: 'out_of_scope', 'predefined', 'grounded_rewrite', 'feasibility_eval'")
    contact_actions: Optional[List[ContactAction]] = Field(default_factory=list, description="Botones de contacto contextuales")
    project_action: Optional[ProjectAction] = Field(None, description="Proyecto relacionado recomendado")

