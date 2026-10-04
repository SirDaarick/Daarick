"""
Orquestador principal de Wiki 2.0 y generador SSE para streaming reactivo en tiempo real.
Aplica la arquitectura: 'El LLM propone, el servidor decide' con políticas deterministas y fallback semántico.
"""
import re
import json
import asyncio
from datetime import datetime, date
import httpx
from typing import Dict, Any, List, Optional
from app.schemas.assistant import ChatMessage, ChatResponse, BookingAction, CalendarSlot
from app.services.assistant.actions import CONTACT_BUTTONS, PROJECT_ACTIONS_CATALOG
from app.services.assistant.guardrails import (
    check_security_guardrails, 
    validate_and_sanitize_history, 
    generate_message_signature,
    sanitize_suggestions
)
from app.services.assistant.knowledge import PRICING_POLICY
from app.services.assistant.llm_client import query_llm_for_wiki
from app.services.calendar_service import calendar_service

def is_user_asking_contact(text: str) -> bool:
    """Verifica si el usuario pidió explícitamente medios de contacto."""
    q = text.lower()
    contact_keywords = ["whatsapp", "contacto", "correo", "email", "telefono", "teléfono", "escribir a erick", "hablar con erick"]
    return any(k in q for k in contact_keywords)

def is_user_asking_booking(text: str) -> bool:
    """Verifica si el usuario pide agendar o reunirse."""
    q = text.lower()
    booking_keywords = ["agendar", "cita", "llamada", "reunion", "reunión", "videollamada", "calendario", "horario"]
    return any(k in q for k in booking_keywords)

def is_user_asking_pricing(text: str) -> bool:
    """Verifica si el usuario pregunta sobre precios o cotizaciones."""
    q = text.lower()
    pricing_keywords = ["precio", "precios", "cuanto cuesta", "cuánto cuesta", "costo", "costos", "cotizacion", "cotización", "cobras", "cobran"]
    return any(k in q for k in pricing_keywords)

def extract_date_heuristic(text: str) -> Optional[date]:
    """Extrae heurísticamente fechas como '8 de octubre' o 'el 8' si el LLM no envió el formato ISO."""
    q = text.lower()
    months = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
        "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12
    }
    # Buscar patrón tipo '8 de octubre' o '08 de octubre'
    match = re.search(r"(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)", q)
    if match:
        day = int(match.group(1))
        month = months[match.group(2)]
        now = datetime.now()
        year = now.year
        # Si el mes ya pasó este año, asumir el siguiente
        if month < now.month or (month == now.month and day < now.day):
            year += 1
        try:
            return date(year, month, day)
        except Exception:
            pass
    return None

def get_intelligent_fallback(latest_text: str) -> Dict[str, Any]:
    """Genera una respuesta de respaldo de alta fidelidad si las cuotas externas se agotan."""
    q = latest_text.lower()
    
    # 1. Pregunta sobre precios
    if is_user_asking_pricing(latest_text):
        return {
            "reply": (
                "Regularmente no se cobra nada por adelantado; el pago inicial del desarrollo se realiza "
                "una vez que apruebas el prototipo funcional interactivo. Posteriormente, en producción, "
                "se maneja una cuota mensual por soporte y mejoras continuas. El costo se adapta a la complejidad de cada idea. "
                "¿Te gustaría agendar una llamada breve de 15 minutos para aterrizar tu proyecto?"
            ),
            "stage": "CIERRE",
            "project_ref": "ninguno",
            "client_need_summary": "Consulta de precios y alcance",
            "wants_contact": False,
            "offer_booking": True,
            "suggestions": ["Agendar llamada breve", "¿Cómo funciona el prototipo?", "Ver casos realizados"]
        }

    # 2. Base de datos / Chatbot
    if any(k in q for k in ["chatbot", "datos", "alumno", "profesor", "inventario", "consultar", "paidea"]):
        return {
            "reply": (
                "Es totalmente viable crear un asistente que responda preguntas consultando tu base de datos en tiempo real. "
                "Un caso parecido es PAIDEA, donde el agente responde dudas sobre alumnos, calificaciones y trámites sin intervención manual. "
                "¿Te gustaría implementarlo en WhatsApp o en tu página web?"
            ),
            "stage": "PRUEBA",
            "project_ref": "paidea",
            "client_need_summary": "Chatbot para consultar base de datos",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["En WhatsApp", "En mi página web", "Agendar llamada breve"]
        }

    # 3. Horarios o turnos
    if any(k in q for k in ["horario", "horarios", "turno", "turnos", "empalme", "cuadrante"]):
        return {
            "reply": (
                "Armar horarios de personal o turnos sin choques es perfectamente automatizable. "
                "En el proyecto Tetring implementamos un motor que evalúa miles de combinaciones en milisegundos "
                "para encontrar el rol perfecto sin empalmes. ¿Qué tipo de horarios manejas hoy?"
            ),
            "stage": "PRUEBA",
            "project_ref": "tetring",
            "client_need_summary": "Organización de turnos y horarios",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Turnos rotativos", "Horarios fijos", "¿Cómo agendar?"]
        }

    # 4. Facturas o tickets
    if any(k in q for k in ["factura", "facturas", "ticket", "tickets", "recibo", "ocr", "excel"]):
        return {
            "reply": (
                "Extraer datos de facturas y tickets a Excel de forma automática evita horas de captura manual. "
                "Contamos con una demo interactiva de extracción de documentos con validación matemática de totales que puedes probar. "
                "¿Manejas principalmente PDFs o fotos de tickets?"
            ),
            "stage": "PRUEBA",
            "project_ref": "invoicing",
            "client_need_summary": "Extracción automática de facturas a Excel",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Facturas en PDF", "Tickets en foto", "Probar demo"]
        }

    # 5. Respuesta general amigable
    return {
        "reply": (
            "Esa idea es completamente viable de automatizar y te ahorrará tiempo en tareas repetitivas. "
            "Primero diseñamos un prototipo navegable para que compruebes cómo funcionará antes del desarrollo. "
            "¿Te gustaría que revisemos los detalles en una breve videollamada?"
        ),
        "stage": "PROPUESTA",
        "project_ref": "ninguno",
        "client_need_summary": "Idea de automatización para negocio",
        "wants_contact": False,
        "offer_booking": False,
        "suggestions": ["¿Cómo es la metodología?", "Ver proyectos realizados", "Agendar videollamada"]
    }

async def orchestrate_wiki_turn(
    client: httpx.AsyncClient,
    raw_messages: List[ChatMessage]
) -> ChatResponse:
    """Procesa un turno conversacional aplicando guardrails, LLM y políticas de acción deterministas."""
    if not raw_messages:
        return ChatResponse(
            reply="¡Hola! Soy Wiki 👋 Cuéntame qué idea tienes en mente o qué proceso repetitivo te quita más tiempo en tu negocio, y te digo cómo lo podemos automatizar de forma sencilla.",
            suggestions=[
                "Tengo una idea para mi negocio",
                "Quiero un chatbot para mis clientes",
                "¿Cómo se manejan los precios?",
                "Quiero agendar una llamada breve"
            ],
            stage="DESCUBRIR",
            source="wiki_local"
        )

    # 1. Sanitizar historial y verificar firmas HMAC
    messages = validate_and_sanitize_history(raw_messages)
    if not messages:
        messages = [raw_messages[-1]]

    latest_user_text = messages[-1].content.strip()

    # 2. Guardrails de seguridad y alcance local (0 tokens)
    is_blocked, guardrail_reply = check_security_guardrails(latest_user_text)
    if is_blocked:
        sig = generate_message_signature(guardrail_reply)
        return ChatResponse(
            reply=guardrail_reply,
            suggestions=[
                "¿Cómo automatizar WhatsApp?",
                "¿Qué proyectos ha desarrollado Erick?",
                "Quiero agendar una videollamada"
            ],
            stage="FUERA_DE_ALCANCE",
            source="guardrail_shield",
            message_sig=sig
        )

    # 3. Llamada al LLM con Structured Outputs
    llm_output = await query_llm_for_wiki(client, messages)

    if not llm_output or not llm_output.get("reply"):
        llm_output = get_intelligent_fallback(latest_user_text)

    reply_text = llm_output.get("reply", "").strip()
    stage = llm_output.get("stage", "DESCUBRIR")
    project_ref = llm_output.get("project_ref", "ninguno")
    client_need_summary = llm_output.get("client_need_summary", "")
    preferred_date_raw = llm_output.get("preferred_date")
    wants_contact = llm_output.get("wants_contact", False)
    offer_booking = llm_output.get("offer_booking", False)
    raw_sug = llm_output.get("suggestions", [])

    # 4. POLÍTICAS DE ACCIÓN DETERMINISTAS EN EL SERVIDOR
    
    # Política de proyecto análogo:
    project_action = None
    if project_ref in PROJECT_ACTIONS_CATALOG and stage in ["PRUEBA", "PROPUESTA"]:
        project_action = PROJECT_ACTIONS_CATALOG[project_ref]

    # Política de contacto directo:
    contact_actions = []
    if is_user_asking_contact(latest_user_text) or (stage == "CIERRE" and wants_contact):
        contact_actions = CONTACT_BUTTONS

    # Política de agendado en Google Calendar:
    booking_action = None
    should_offer_calendar = (
        is_user_asking_booking(latest_user_text) or 
        (stage == "CIERRE" and offer_booking) or
        is_user_asking_pricing(latest_user_text)
    )

    if should_offer_calendar:
        # Resolver fecha preferida (del JSON del LLM o heurística del texto del usuario)
        parsed_target_date: Optional[date] = None
        if preferred_date_raw:
            try:
                parsed_target_date = datetime.strptime(preferred_date_raw.strip(), "%Y-%m-%d").date()
            except Exception:
                pass

        if not parsed_target_date:
            parsed_target_date = extract_date_heuristic(latest_user_text)

        slots = await calendar_service.get_available_slots(
            client=client,
            target_date=parsed_target_date,
            max_slots=3
        )
        if slots:
            booking_action = BookingAction(
                slots=slots,
                default_summary=client_need_summary or "Asesoría y automatización para negocio"
            )

    # Limpiar sugerencias
    clean_suggestions = sanitize_suggestions(raw_sug)
    if not clean_suggestions:
        clean_suggestions = ["¿Cuánto tiempo toma?", "¿Cómo es la metodología?", "Agendar una cita"]

    # Generar firma HMAC para el nuevo mensaje
    sig = generate_message_signature(reply_text)

    return ChatResponse(
        reply=reply_text,
        suggestions=clean_suggestions,
        stage=stage,
        source="wiki_engine",
        contact_actions=contact_actions,
        project_action=project_action,
        booking_action=booking_action,
        message_sig=sig
    )

async def stream_wiki_sse(
    client: httpx.AsyncClient,
    raw_messages: List[ChatMessage]
):
    """
    Emite la respuesta a través de Server-Sent Events (SSE).
    Envía los tokens progresivamente de forma rápida y el evento 'done' con los metadatos completos.
    """
    try:
        response = await orchestrate_wiki_turn(client, raw_messages)
        reply_text = response.reply

        tokens = re.split(r'(\s+)', reply_text)
        buffer = ""
        for i, token in enumerate(tokens):
            buffer += token
            if token.strip() or i == len(tokens) - 1:
                data_obj = {"token": buffer}
                yield f"data: {json.dumps(data_obj, ensure_ascii=False)}\n\n"
                buffer = ""
                await asyncio.sleep(0.005)

        if buffer:
            data_obj = {"token": buffer}
            yield f"data: {json.dumps(data_obj, ensure_ascii=False)}\n\n"

        # Evento final de cierre con los objetos resueltos
        final_payload = {
            "done": True,
            "reply": reply_text,
            "suggestions": response.suggestions,
            "stage": response.stage,
            "source": response.source,
            "contact_actions": [c.model_dump() for c in response.contact_actions] if response.contact_actions else [],
            "project_action": response.project_action.model_dump() if response.project_action else None,
            "booking_action": response.booking_action.model_dump() if response.booking_action else None,
            "message_sig": response.message_sig
        }
        yield f"data: {json.dumps(final_payload, ensure_ascii=False)}\n\n"

    except Exception as e:
        print(f"[SSE Error] {e}")
        err_data = {"error": True, "detail": "Disculpa, hubo un detalle temporal al procesar tu mensaje."}
        yield f"data: {json.dumps(err_data, ensure_ascii=False)}\n\n"
