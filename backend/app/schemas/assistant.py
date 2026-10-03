from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="Rol del emisor: 'user' o 'assistant'")
    content: str = Field(..., description="Contenido del mensaje")
    timestamp: Optional[str] = Field(None, description="Hora de envío formateada (ej. 10:42 AM)")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(..., description="Historial de mensajes de la conversación")
    current_page: Optional[str] = Field("home", description="Contexto de la página actual")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Respuesta del asistente")
    suggestions: List[str] = Field(default_factory=list, description="Sugerencias o preguntas de seguimiento")
    feasibility_verdict: Optional[str] = Field(None, description="Veredicto de viabilidad técnica si aplica")
    tech_recommendations: Optional[List[str]] = Field(default_factory=list, description="Stack recomendado para el caso consultado")
    source: str = Field("engine", description="Motor de generación: 'gemini' o 'local_engine'")
