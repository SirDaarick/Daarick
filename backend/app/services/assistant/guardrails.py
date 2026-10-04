"""
Filtros de seguridad, validación criptográfica HMAC y saneamiento de entradas y respuestas.
"""
import re
import hmac
import hashlib
from typing import List, Tuple, Optional
from app.core.settings import settings
from app.schemas.assistant import ChatMessage

PROMPT_INJECTION_PATTERNS = [
    r"olvida\s+(tus|las)\s+instrucciones",
    r"ignora\s+(tus|las|todas)\s+instrucciones",
    r"reset\s+(your)?\s+prompt",
    r"repite\s+(tu|el)\s+(prompt|sistema)",
    r"actua\s+como\s+dan",
    r"developer\s+mode",
    r"system\s+prompt",
    r"jailbreak"
]

OUT_OF_SCOPE_PATTERNS = [
    r"\breceta\b", r"\bcocinar\b", r"\bdieta\b",
    r"\bhackear\b", r"\bvulnerar\b", r"\bdos attack\b",
    r"\bremedio\b", r"\bsintomas\b", r"\bmedicamento\b",
    r"\bhoroscopo\b", r"\btarot\b", r"\bfutbol\b",
    r"\b(hazme|escribe(me)?|crea(me)?|generame|dame)\s+(un\s+)?(script|codigo|programa|bot|tarea)\b",
    r"\b(resuelve|haz)\s+(mi\s+)?(tarea|examen|ejercicio)\b"
]

def generate_message_signature(content: str) -> str:
    """Genera una firma HMAC-SHA256 para verificar que los mensajes del asistente provienen del servidor."""
    key = settings.CHAT_HMAC_SECRET.encode("utf-8")
    msg = content.strip().encode("utf-8")
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def verify_message_signature(content: str, sig: Optional[str]) -> bool:
    """Verifica la firma HMAC de un mensaje de turno de asistente."""
    if not sig:
        return False
    expected = generate_message_signature(content)
    return hmac.compare_digest(expected, sig)

def validate_and_sanitize_history(messages: List[ChatMessage]) -> List[ChatMessage]:
    """
    Filtra los mensajes para garantizar que los turnos con rol 'assistant' no hayan sido inventados por el cliente
    y asegura que el historial sea coherente y seguro.
    """
    sanitized: List[ChatMessage] = []
    for m in messages:
        if m.role == "assistant":
            # Si tiene firma válida se conserva; si no tiene firma o es inválida, se descarta para evitar manipulación
            if m.sig and verify_message_signature(m.content, m.sig):
                sanitized.append(m)
            else:
                # Omitir mensaje de asistente sospechoso
                continue
        elif m.role == "user":
            sanitized.append(m)

    # Conservar máximo los últimos 6 mensajes válidos
    return sanitized[-6:]

def check_security_guardrails(text: str) -> Tuple[bool, Optional[str]]:
    """
    Revisa si el texto contiene intentos de inyección o peticiones fuera de alcance.
    Retorna (es_invalido, mensaje_de_respuesta_local)
    """
    q = text.lower()
    
    # 1. Inyección de prompt
    if any(re.search(pat, q) for pat in PROMPT_INJECTION_PATTERNS):
        return (True, "Mi rol como Wiki está enfocado exclusivamente en asesorarte sobre automatizaciones, proyectos y soluciones para negocios desarrollados por Erick. ¿En qué idea o proceso te gustaría que enfoquemos la solución?")

    # 2. Peticiones de código o ajenas
    if any(re.search(pat, q) for pat in OUT_OF_SCOPE_PATTERNS):
        if any(k in q for k in ["codigo", "script", "programa", "bot", "tarea"]):
            return (True, "Como asesor del portafolio de Erick Daniel, mi objetivo no es generar código genérico ni resolver tareas externas, sino orientarte sobre cómo automatizar procesos en tu negocio con soluciones a medida. Si tienes una idea para tu empresa, con gusto la evaluamos.")
        return (True, "Mi función como Wiki está centrada en soluciones de inteligencia artificial y automatización para negocios y empresas. ¿Tienes algún proceso repetitivo o idea que te gustaría optimizar?")

    return (False, None)

def sanitize_suggestions(suggestions: List[str]) -> List[str]:
    """Limpia las sugerencias para que sean concisas, sin enlaces y útiles."""
    cleaned = []
    for s in suggestions:
        clean_text = re.sub(r"[#*`\[\]()]", "", s).strip()
        # Limitar longitud
        if 3 <= len(clean_text) <= 45:
            cleaned.append(clean_text)
    return cleaned[:3]
