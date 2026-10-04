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
    """Verifica si el usuario pidió explícitamente medios de contacto directos con Erick."""
    q = text.lower()
    contact_patterns = [
        r"(tu|el)\s+whatsapp",
        r"(numero|número|telefono|teléfono)\s+(de\s+contacto|de\s+erick)?",
        r"(pásame|pasame|dame|darme)\s+(tu|el)?\s*(contacto|whatsapp|correo|email)",
        r"correo\s+(de\s+erick|electronico|electrónico)",
        r"hablar\s+directamente\s+con\s+erick",
        r"escribir\s+(directamente\s+)?a\s+erick"
    ]
    return any(re.search(pat, q) for pat in contact_patterns)

def is_user_asking_booking(text: str) -> bool:
    """
    Verifica si el usuario pide explícitamente agendar una cita o videollamada con Erick.
    No debe activarse si el usuario menciona 'citas' u 'horarios' como parte del problema de su propio negocio (ej: peluquería, clínica).
    """
    q = text.lower()

    # Si habla del negocio, sus clientes/pacientes o su sistema, NO es agendar con Erick
    business_context_patterns = [
        r"(para|de|mis)\s+(clientes?|clientas?|pacientes?|alumnos?|usuarios?)",
        r"(en|para)\s+mi\s+(peluqueria|peluquería|salon|salón|estetica|estética|barberia|barbería|consultorio|negocio|taller|tienda)",
        r"(sistema|bot|asistente|automatizacion|automatización|app|aplicacion|aplicación|web)\s+(para\s+)?(agendar|citas?|horarios?)",
        r"agendador\s+(de\s+)?(citas?|turnos?)",
        r"agendar\s+(citas?|turnos?)\s+por\s+whatsapp"
    ]
    if any(re.search(bp, q) for bp in business_context_patterns):
        if not re.search(r"(con\s+erick|contigo|con\s+ustedes|videollamada\s+de\s+15)", q):
            return False

    explicit_booking_patterns = [
        r"(agendar|reservar|tener|hacer)\s+(una\s+)?(videollamada|llamada|reunion|reunión|sesion|sesión)(\s+(breve|de\s+15\s+min|de\s+15\s+minutos))?",
        r"(agendar|reservar|apartar)\s+(una\s+)?cita\s+(con\s+erick|contigo|para\s+revisar|para\s+el\s+proyecto)",
        r"(quiero|quisiera|gustaria|gustaría|podemos)\s+(agendar|reunirnos|llamarnos|platicar\s+con\s+erick|hablar\s+con\s+erick)",
        r"(ver|revisar|mostrar)\s+(el\s+)?(calendario|horarios\s+disponibles?)\s+(de\s+erick|para\s+agendar)?",
        r"(agendame|agéndame|resérvame)\s+(una\s+)?(llamada|videollamada|espacio|cita)",
        r"llamada\s+de\s+15\s+min(utos)?"
    ]
    return any(re.search(pat, q) for pat in explicit_booking_patterns)

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
    
    # 0. Solicitud explícita de agendar con Erick (videollamada o cita con Erick)
    if is_user_asking_booking(latest_text):
        return {
            "reply": (
                "¡Con gusto! Puedes seleccionar el día y la hora que mejor te acomode en el calendario de abajo para una videollamada breve de 15 minutos con Erick, sin ningún compromiso."
            ),
            "stage": "CIERRE",
            "options": [],
            "project_ref": "ninguno",
            "client_need_summary": "• Solicitud: Agendado de videollamada de 15 minutos con Erick",
            "wants_contact": True,
            "offer_booking": True,
            "suggestions": ["Platicar por WhatsApp", "Enviar correo"]
        }

    # 1. Aprobación o satisfacción del cliente con la propuesta previa -> ETAPA CIERRE
    # Si el usuario dice 'me gusta la opción 1' o 'me interesa la opción 2', está eligiendo una opción, no cerrando.
    is_picking_option = any(o in q for o in ["opcion", "opción", "opciones"])
    if not is_picking_option and any(k in q for k in [
        "me gusta", "me agrada", "suena bien", "suena genial", "excelente", "perfecto",
        "me interesa", "me parece bien", "me late", "lo quiero", "vamos a darle", "avanzar",
        "agreguemos", "estoy de acuerdo", "de acuerdo", "trato hecho", "cómo empezamos"
    ]):
        return {
            "reply": (
                "¡Me alegra muchísimo que te haga sentido la solución! El siguiente paso ideal es agendar una videollamada breve de 15 minutos en el Google Calendar de Erick. "
                "Así podremos revisar a detalle tu caso, definir el prototipo funcional navegable sin compromiso y resolver cualquier duda, o si prefieres, platicar directamente por WhatsApp."
            ),
            "stage": "CIERRE",
            "options": [],
            "project_ref": "ninguno",
            "client_need_summary": "• Negocio: Cliente interesado en avanzar\n• Dolor detectado: Solución validada y aprobada\n• Lo que le interesó: Agendar llamada breve de 15 min o contacto directo",
            "wants_contact": True,
            "offer_booking": True,
            "suggestions": ["Agendar llamada breve", "Platicar por WhatsApp", "Enviar correo"]
        }

    # 2. Pregunta sobre precios o cotizaciones
    if is_user_asking_pricing(latest_text):
        return {
            "reply": (
                "Para el desarrollo no se cobra nada por adelantado; el pago inicial se realiza "
                "una vez que apruebas el prototipo navegable. Después se maneja una cuota mensual por soporte y mejoras. "
                "¿Te gustaría agendar una llamada breve de 15 minutos para aterrizar tu proyecto?"
            ),
            "stage": "CIERRE",
            "options": [],
            "project_ref": "ninguno",
            "client_need_summary": "• Negocio: Consulta de alcance\n• Dolor detectado: Precios y viabilidad\n• Lo que le interesó: Conocer esquema de trabajo y prototipo sin anticipo",
            "wants_contact": False,
            "offer_booking": True,
            "suggestions": ["Agendar llamada breve", "¿Cómo funciona el prototipo?", "Platicar por WhatsApp"]
        }

    # 3. Salones, peluquerías, barberías y estética
    if any(k in q for k in ["peluqueria", "peluquería", "salon", "salón", "estetica", "estética", "barberia", "barbería", "corte", "uñas", "spa"]):
        # A. Si ya eligió una opción o habla de automatizar WhatsApp/horarios
        if any(o in q for o in ["opcion 1", "opción 1", "opcion 2", "opción 2", "opcion 3", "opción 3", "agendador", "recordatorio", "me interesa esta opción"]):
            return {
                "reply": (
                    "¡Excelente elección! La solución sería exactamente como este mismo asistente con el que estás hablando ahora en tu pantalla, "
                    "adaptado a tu negocio para que tus clientes puedan consultar tus servicios, ver tus horas libres y apartar su cita directamente por WhatsApp, "
                    "evitando que tengas que interrumpir tu trabajo o atender llamadas mientras cortas el cabello. "
                    "¿Qué te parece esta propuesta para tu peluquería? ¿Crees que te serviría en tu día a día, o hay algo más que te gustaría agregar o ajustar?"
                ),
                "stage": "PROPUESTA",
                "options": [],
                "project_ref": "wiki",
                "client_need_summary": "• Negocio: Peluquería o salón de belleza\n• Dolor detectado: Empalmes de citas y tiempo contestando WhatsApp\n• Lo que le interesó: Asistente estilo Wiki para citas automáticas por WhatsApp",
                "wants_contact": False,
                "offer_booking": False,
                "suggestions": ["Me gusta la propuesta", "¿Cuánto cuesta?", "Me gustaría agregar otra cosa"]
            }
        # B. Si describe su dolor o problema con citas/horarios/tiempo
        if any(p in q for p in ["empalma", "empalman", "tiempo", "cancelan", "cancela", "agenda", "whatsapp", "horario", "horarios", "turno", "pierdo", "cuesta", "cruzan", "problema"]):
            return {
                "reply": (
                    "¡Te entiendo perfectamente! Cuando estás atendiendo clientes, contestar mensajes y coordinar citas a mano quita muchísimo tiempo y provoca cancelaciones. "
                    "Te preparé 3 opciones prácticas para automatizar tu negocio. Puedes elegir una o varias para profundizar:"
                ),
                "stage": "OPCIONES",
                "options": [
                    "Agendador automático por WhatsApp para que tus clientes reserven su hora sin cruces",
                    "Recordatorios automáticos 2 horas antes de la cita para reducir inasistencias",
                    "Registro ágil de clientes con notas de preferencias y cortes desde el celular"
                ],
                "project_ref": "ninguno",
                "client_need_summary": "• Negocio: Peluquería o salón de belleza\n• Dolor detectado: Empalmes de horarios y tiempo contestando citas\n• Lo que le interesó: Opciones de agendado y recordatorios automáticos",
                "wants_contact": False,
                "offer_booking": False,
                "suggestions": ["Me gusta la opción 1", "Me interesan las 3", "Tengo otra idea en mente"]
            }
        # C. Si apenas está describiendo de qué es su negocio
        return {
            "reply": (
                "¡Excelente negocio! En el área de estética y belleza la atención es continua y cada hora cuenta. "
                "Para poder darte la mejor recomendación personalizada: ¿cómo manejas hoy las citas de tus clientes y qué tarea del día sientes que te quita más tiempo?"
            ),
            "stage": "DESCUBRIR",
            "options": [],
            "project_ref": "ninguno",
            "client_need_summary": "• Negocio: Peluquería o salón de belleza\n• Dolor detectado: Por diagnosticar (manejo de citas y atención)\n• Lo que le interesó: Optimizar agenda y atención a clientes",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Se me empalman las citas", "Pierdo tiempo en WhatsApp", "Clientes que cancelan a última hora"]
        }

    # 4. Talleres, oficios o micronegocios (costura, reparación, comercio local, etc.)
    if any(k in q for k in ["taller", "costura", "costuras", "ropa", "artesano", "reparacion", "tienda", "solo", "sola", "propio"]):
        if any(p in q for p in ["tiempo", "papel", "mensaje", "whatsapp", "pedido", "pedidos", "entrega", "cobro", "nota", "pierdo", "cuesta", "tardo"]):
            return {
                "reply": (
                    "¡Entiendo perfectamente! Cuando estás al frente del negocio, anotar a mano y responder mensajes quita mucho tiempo. "
                    "Te preparé 3 opciones prácticas que podemos implementar a tu medida. Puedes seleccionar una o varias para evaluar el camino:"
                ),
                "stage": "OPCIONES",
                "options": [
                    "Avisos automáticos a clientes por WhatsApp cuando su trabajo o prenda esté lista",
                    "Registro ágil de pedidos, medidas y notas desde el celular sin papel",
                    "Recordatorios automáticos de cobros y abonos pendientes"
                ],
                "project_ref": "ninguno",
                "client_need_summary": "• Negocio: Taller u oficio propio\n• Dolor detectado: Tareas manuales y tiempo en avisos/pedidos\n• Lo que le interesó: Opciones de automatización ágil",
                "wants_contact": False,
                "offer_booking": False,
                "suggestions": ["Me gusta la opción 1", "Me interesan las 3", "Tengo otra idea en mente"]
            }
        return {
            "reply": (
                "¡Qué gran oficio! Cuando estás al frente de un taller o negocio propio, cada detalle cuenta. "
                "Para poder orientarte con algo que realmente te sirva a tu medida: "
                "¿cómo atiendes hoy a tus clientes y qué tarea del día sientes que te quita más tiempo?"
            ),
            "stage": "DESCUBRIR",
            "options": [],
            "project_ref": "ninguno",
            "client_need_summary": "• Negocio: Taller u oficio propio\n• Dolor detectado: Por diagnosticar (tiempo en atención/pedidos)\n• Lo que le interesó: Simplificar su día a día y tareas repetitivas",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Contestar dudas en WhatsApp", "Avisar entregas y cobros", "Notas y pedidos en papel"]
        }

    # 5. Consultas de base de datos, inventarios y expedientes (PAIDEA)
    if any(k in q for k in ["inventario", "inventarios", "stock", "datos", "alumno", "alumnos", "profesor", "profesores", "calificaciones", "expediente", "expedientes", "paidea"]):
        return {
            "reply": (
                "Es totalmente viable crear un asistente que responda preguntas consultando tu información, stock o base de datos automáticamente. "
                "Un caso parecido es PAIDEA, donde el agente responde dudas sobre registros e inventario sin intervención manual. "
                "¿Qué te parece esta propuesta? ¿Crees que te serviría en tu día a día, o hay algo más que te gustaría agregar o ajustar?"
            ),
            "stage": "PROPUESTA",
            "options": [],
            "project_ref": "paidea",
            "client_need_summary": "• Negocio: Consultas de inventario o base de datos\n• Dolor detectado: Tiempo buscando registros o respondiendo stock repetidamente\n• Lo que le interesó: Asistente PAIDEA para consulta de datos",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Me gusta la propuesta", "¿Cuánto cuesta?", "Me gustaría agregar otra cosa"]
        }

    # 6. Chatbots para ventas, atención a clientes o agendado de citas (WIKI)
    if any(k in q for k in ["chatbot", "bot", "asistente", "ventas", "venta", "atencion", "atención", "atender clientes", "prospectos", "cotizar", "prospecto", "citas", "cita", "whatsapp"]):
        return {
            "reply": (
                "¡Exactamente para eso sirve la automatización conversacional! La solución sería como este mismo asistente con el que estás hablando ahora en tu pantalla: "
                "atiende a tus clientes al instante, responde sus dudas frecuentes, filtra prospectos y agenda citas automáticamente por WhatsApp o tu web 24/7. "
                "¿Qué te parece esta propuesta? ¿Crees que se adapta a lo que necesitas en tu negocio o hay algo más que te gustaría agregar o ajustar?"
            ),
            "stage": "PROPUESTA",
            "options": [],
            "project_ref": "wiki",
            "client_need_summary": "• Negocio: Ventas y atención a clientes\n• Dolor detectado: Pérdida de prospectos y tiempo en atención repetitiva\n• Lo que le interesó: Asistente conversacional en vivo estilo Wiki",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Me gusta la propuesta", "¿Cuánto cuesta?", "Me gustaría agregar otra cosa"]
        }

    # 7. Horarios o turnos
    if any(k in q for k in ["horario", "horarios", "turno", "turnos", "empalme", "cuadrante"]):
        # A. Si ya eligió una opción o habla de motor/algoritmo/tetring
        if any(o in q for o in ["opcion 1", "opción 1", "opcion 2", "opción 2", "opcion 3", "opción 3", "tetring", "motor", "agendador", "me interesa esta opción"]):
            return {
                "reply": (
                    "¡Excelente! Con un motor inteligente como el que diseñamos en Tetring, se coordinan turnos y horarios sin choques automáticamente. "
                    "¿Qué te parece esta propuesta? ¿Crees que resolvería la organización de tus horarios o hay algo más que te gustaría agregar o ajustar?"
                ),
                "stage": "PROPUESTA",
                "options": [],
                "project_ref": "tetring",
                "client_need_summary": "• Negocio: Coordinación de turnos/horarios\n• Dolor detectado: Choques de horarios y cálculo manual\n• Lo que le interesó: Generador de turnos automático",
                "wants_contact": False,
                "offer_booking": False,
                "suggestions": ["Me gusta la propuesta", "¿Cuánto cuesta?", "Me gustaría agregar otra cosa"]
            }
        # B. Si describe su dolor o problema de horarios/turnos
        return {
            "reply": (
                "¡Coordinar horarios y turnos sin choques es un reto que quita muchísimo tiempo! "
                "Te comparto 3 alternativas comprobadas para resolverlo. Puedes elegir una o varias para profundizar:"
            ),
            "stage": "OPCIONES",
            "options": [
                "Generador inteligente de turnos y cuadrantes según disponibilidad sin traslapes",
                "Portal web o bot para que tu personal o clientes elijan su horario libre",
                "Notificaciones automáticas por WhatsApp ante confirmaciones o cambios de turno"
            ],
            "project_ref": "ninguno",
            "client_need_summary": "• Negocio: Gestión de turnos y agendas\n• Dolor detectado: Empalmes y cálculo manual de horarios\n• Lo que le interesó: Opciones de calendarización y turnos automáticos",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Me gusta la opción 1", "Me interesan las 3", "Tengo otra idea en mente"]
        }

    # 8. Facturas o tickets
    if any(k in q for k in ["factura", "facturas", "ticket", "tickets", "recibo", "ocr", "excel"]):
        return {
            "reply": (
                "Extraer datos de facturas y tickets a Excel de forma automática evita horas de captura manual, como en nuestra demo de extracción. "
                "¿Crees que una herramienta así te ahorraría tiempo, o qué proceso te interesa más mejorar?"
            ),
            "stage": "PROPUESTA",
            "options": [],
            "project_ref": "invoicing",
            "client_need_summary": "• Negocio: Control administrativo y gastos\n• Dolor detectado: Captura manual de tickets y facturas\n• Lo que le interesó: Extractor automático a Excel",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Me gusta la idea", "Probar demo", "¿Cuánto tiempo toma implementarlo?"]
        }

    # 9. ERPs y Sistemas a Medida
    if any(k in q for k in ["erp", "sistema", "gestión", "gestion", "sucursal", "sucursales"]):
        return {
            "reply": (
                "¡Totalmente factible! Desarrollamos sistemas y ERPs a medida para centralizar inventarios, ventas, pedidos y clientes en un solo panel. "
                "Para poder proponerte la mejor arquitectura: ¿qué procesos son los que hoy más te urge conectar o sincronizar?"
            ),
            "stage": "PROPUESTA",
            "options": [],
            "project_ref": "ninguno",
            "client_need_summary": "• Negocio: Gestión comercial o pyme\n• Dolor detectado: Falta de integración entre áreas\n• Lo que le interesó: ERP o plataforma a medida",
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Inventario y stock", "Ventas y clientes", "Facturación y pedidos"]
        }

    # 10. Selección de opción general (cuando el usuario responde 'opción 1', 'me interesa la 2', etc.)
    if is_picking_option:
        if any(k in q for k in ["horario", "horarios", "turno", "turnos", "cuadrante", "personal"]):
            project_key = "tetring"
            reply_text = (
                "¡Excelente elección! Con un motor inteligente como el que diseñamos en Tetring, se coordinan turnos y horarios sin choques automáticamente. "
                "¿Qué te parece esta propuesta? ¿Crees que resolvería la organización de tus horarios o hay algo más que te gustaría agregar o ajustar?"
            )
            summary = "• Negocio: Coordinación de turnos y personal\n• Dolor detectado: Empalmes de horarios y cuadrantes\n• Lo que le interesó: Motor Tetring de turnos"
        elif any(k in q for k in ["inventario", "stock", "datos", "registro", "expediente", "alumno", "alumnos"]):
            project_key = "paidea"
            reply_text = (
                "¡Excelente elección! Con una solución como PAIDEA, tus usuarios y tú pueden consultar stock, datos y registros en segundos sin trabajo manual. "
                "¿Qué te parece esta propuesta? ¿Crees que resolvería lo que necesitas en tu día a día, o hay algo más que te gustaría agregar o ajustar?"
            )
            summary = "• Negocio: Consulta de datos e inventarios\n• Dolor detectado: Búsqueda manual de registros y stock\n• Lo que le interesó: Asistente PAIDEA de consulta de datos"
        elif any(k in q for k in ["factura", "facturas", "ticket", "tickets", "ocr", "gasto", "gastos"]):
            project_key = "invoicing"
            reply_text = (
                "¡Excelente elección! Con nuestra demo de extracción de facturas y tickets a Excel, eliminas horas de captura manual y verificas las cuentas al instante. "
                "¿Qué te parece esta propuesta? ¿Crees que te ahorraría tiempo administrativo o hay algo más que te gustaría agregar o ajustar?"
            )
            summary = "• Negocio: Control de gastos y facturas\n• Dolor detectado: Captura manual de tickets y comprobantes\n• Lo que le interesó: Extractor automático a Excel"
        else:
            project_key = "wiki"
            reply_text = (
                "¡Excelente elección! La solución sería exactamente como este mismo asistente con el que estás hablando ahora en tu pantalla, "
                "adaptado a tu negocio para atender clientes, resolver dudas frecuentes y agendar citas o pedidos automáticamente por WhatsApp o tu web. "
                "¿Qué te parece esta propuesta? ¿Crees que resolvería lo que necesitas en tu día a día, o hay algo más que te gustaría agregar o ajustar?"
            )
            summary = "• Negocio: Ventas y atención automatizada\n• Dolor detectado: Tiempo atendiendo mensajes y coordinando clientes\n• Lo que le interesó: Asistente en vivo estilo Wiki"

        return {
            "reply": reply_text,
            "stage": "PROPUESTA",
            "options": [],
            "project_ref": project_key,
            "client_need_summary": summary,
            "wants_contact": False,
            "offer_booking": False,
            "suggestions": ["Me gusta la propuesta", "¿Cuánto cuesta?", "Me gustaría agregar otra cosa"]
        }

    # 10. Respuesta general amigable (Paso 1 del embudo)
    return {
        "reply": (
            "Para poder darte la mejor recomendación adaptada a tu realidad: "
            "¿de qué es tu negocio o qué actividad realizas, y trabajas por tu cuenta o con equipo?"
        ),
        "stage": "DESCUBRIR",
        "options": [],
        "project_ref": "ninguno",
        "client_need_summary": "• Negocio: Por especificar\n• Dolor detectado: Por diagnosticar\n• Lo que le interesó: Asesoría general",
        "wants_contact": False,
        "offer_booking": False,
        "suggestions": ["Tengo un taller o tienda propia", "Trabajo por mi cuenta", "Tengo un equipo pequeño"]
    }

async def orchestrate_wiki_turn(
    client: httpx.AsyncClient,
    raw_messages: List[ChatMessage]
) -> ChatResponse:
    """Procesa un turno conversacional aplicando guardrails, LLM y políticas de acción deterministas."""
    if not raw_messages:
        return ChatResponse(
            reply="¡Hola! Soy Wiki 👋 Estoy aquí para ayudarte a que tu trabajo sea más sencillo y te rinda más el día.\n\nPara empezar a orientarte, ¿de qué es tu negocio o a qué te dedicas?",
            suggestions=[
                "Tengo un taller o tienda propia",
                "Vendo productos o hago entregas",
                "Doy servicios o consultas",
                "Trabajo por mi cuenta"
            ],
            options=[],
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
            options=[],
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
    raw_options = llm_output.get("options", [])
    options = []
    if isinstance(raw_options, list):
        options = [str(opt).strip() for opt in raw_options if str(opt).strip()][:3]

    # 4. POLÍTICAS DE ACCIÓN DETERMINISTAS EN EL SERVIDOR
    
    user_explicitly_asking_booking = is_user_asking_booking(latest_user_text)
    user_explicitly_asking_contact = is_user_asking_contact(latest_user_text)

    # Si hay opciones en pantalla o la etapa es DESCUBRIR u OPCIONES,
    # el servidor IMPONE DETERMINISTAMENTE que NO haya agendado ni proyecto anticipado:
    if options or stage in ["DESCUBRIR", "OPCIONES"]:
        stage = "OPCIONES" if options else "DESCUBRIR"
        offer_booking = False
        wants_contact = False
        project_ref = "ninguno"

    # Si la etapa es PROPUESTA o PRUEBA, el agendado y contacto quedan estrictamente bloqueados salvo
    # que el usuario solicite explícitamente agendar videollamada con Erick o pida datos de contacto:
    if stage in ["PROPUESTA", "PRUEBA"]:
        if not user_explicitly_asking_booking:
            offer_booking = False
        if not user_explicitly_asking_contact:
            wants_contact = False

    # Política de proyecto análogo:
    # Solo se muestra en etapas PROPUESTA o PRUEBA. En DESCUBRIR, OPCIONES o CIERRE NO se muestra.
    project_action = None
    if stage in ["PROPUESTA", "PRUEBA"] and project_ref in PROJECT_ACTIONS_CATALOG:
        project_action = PROJECT_ACTIONS_CATALOG[project_ref]

    # Política de agendado en Google Calendar:
    # REGLA DE ORO: La tarjeta de Google Calendar solo se muestra al final (etapa CIERRE),
    # después de que el cliente evaluó la propuesta adaptada y confirmó que le gusta o está satisfecho.
    # En etapas DESCUBRIR y OPCIONES está terminantemente prohibido ofrecer calendario.
    booking_action = None

    should_offer_calendar = False
    if stage == "CIERRE" and (offer_booking or user_explicitly_asking_booking or is_user_asking_pricing(latest_user_text)):
        should_offer_calendar = True
    elif stage in ["PROPUESTA", "PRUEBA"] and user_explicitly_asking_booking:
        # Si el usuario ya está viendo la propuesta y pide explícitamente agendar con Erick
        should_offer_calendar = True

    # Política de contacto directo (WhatsApp, Email, LinkedIn):
    # En CIERRE se muestra para dar alternativas directas de contacto.
    # En etapas previas, solo si el usuario pide explícitamente comunicarse con Erick.
    contact_actions = []
    if user_explicitly_asking_contact or (stage == "CIERRE" and (wants_contact or should_offer_calendar)):
        contact_actions = CONTACT_BUTTONS

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
                default_summary=client_need_summary or "• Negocio: Por detallar en llamada\n• Dolor detectado: Optimización de procesos\n• Lo que le interesó: Asesoría técnica con Erick"
            )

    # Limpiar sugerencias y contextualizarlas según la etapa
    clean_suggestions = sanitize_suggestions(raw_sug)
    if stage in ["DESCUBRIR", "OPCIONES", "PROPUESTA"]:
        clean_suggestions = [
            s for s in clean_suggestions 
            if not any(k in s.lower() for k in ["agendar", "videollamada", "calendario", "cita"])
        ]
    if not clean_suggestions:
        if stage == "CIERRE":
            clean_suggestions = ["Agendar llamada breve", "Platicar por WhatsApp", "¿Cuánto cuesta?"]
        elif stage == "PROPUESTA":
            clean_suggestions = ["Me gusta la propuesta", "¿Cuánto cuesta?", "Me gustaría agregar otra cosa"]
        elif stage == "OPCIONES":
            clean_suggestions = ["Me gusta la opción 1", "Me interesan las 3", "Tengo otra idea en mente"]
        else:
            clean_suggestions = ["Tengo un negocio propio", "Doy servicios o citas", "Trabajo por mi cuenta"]

    # Generar firma HMAC para el nuevo mensaje
    sig = generate_message_signature(reply_text)

    return ChatResponse(
        reply=reply_text,
        suggestions=clean_suggestions,
        options=options,
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
                await asyncio.sleep(0.025)

        if buffer:
            data_obj = {"token": buffer}
            yield f"data: {json.dumps(data_obj, ensure_ascii=False)}\n\n"

        # Evento final de cierre con los objetos resueltos
        final_payload = {
            "done": True,
            "reply": reply_text,
            "suggestions": response.suggestions,
            "options": response.options or [],
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
