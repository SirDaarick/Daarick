import os
import re
import httpx
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.assistant import ChatMessage, ChatResponse

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Base de conocimiento canónica inmutable
KNOWLEDGE_BASE = {
    "profile": {
        "name": "Erick Daniel (Daarick)",
        "role": "Ingeniero de Sistemas de IA & Automatización",
        "institution": "ESCOM - Instituto Politécnico Nacional (IPN)",
        "approach": "Arquitecturas limpias, deterministas y basadas en datos. La IA potencia la arquitectura, no la reemplaza.",
        "skills": ["FastAPI", "Python", "React", "TypeScript", "C++", "PyTorch", "LangChain", "ChromaDB", "Tree-sitter", "CSP / Branch-and-bound", "OpenMP"],
        "philosophy": "CONCEPTS > CODE. Una automatización robusta usa la herramienta correcta para cada problema: motores deterministas para números y lógica dura, y modelos de lenguaje para semántica, extracción e interacción humana."
    },
    "projects": {
        "graphito": {
            "name": "Graphito",
            "tagline": "Detección inteligente de plagio y copias en código",
            "tech": "GraphCodeBERT, LoRA, Tree-sitter, FastAPI, PyTorch",
            "accuracy": "96.8% en código ofuscado",
            "problem": "Detectores tradicionales como Moss o JPlag fallan cuando cambian nombres de variables o cambian for por while.",
            "solution": "Extrae grafos de flujo de datos (DFG) con Tree-sitter y embeddings con GraphCodeBERT + LoRA con análisis estilométrico CharCNN.",
            "demo": "https://graphito-escom.vercel.app/",
            "github": "https://github.com/SirDaarick/Graphito"
        },
        "tetring": {
            "name": "Tetring",
            "tagline": "Optimizador combinatorio de horarios universitarios",
            "tech": "Algoritmos Combinatorios, CSP (Constraint Satisfaction Problem), TypeScript, React",
            "speed": "42ms (14,200 combinaciones/s)",
            "problem": "La inscripción en SAES exige comparar decenas de grupos a mano, generando empalmes involuntarios y huecos de horas.",
            "solution": "Motor CSP con poda branch-and-bound que evalúa miles de combinaciones viables sin empalmes en 42 milisegundos sin consumir tokens de LLM.",
            "demo": "https://tetring.vercel.app/",
            "github": "https://github.com/SirDaarick/Tetring"
        },
        "paidea": {
            "name": "PAIDEA",
            "tagline": "Plataforma educativa multi-agente con RAG",
            "tech": "Multi-Agentes, FastAPI, RAG, ChromaDB, LangChain",
            "metric": "95.4% de precisión en recuperación RAG",
            "problem": "Docentes saturados de dudas repetitivas sobre rúbricas y alumnos sin retroalimentación fuera de clase.",
            "solution": "Agente TecnoBurro con herramientas especializadas (alumno_tools, rubric_evaluator) y memoria vectorial en ChromaDB.",
            "demo": "https://paidea-reloaded-xi.vercel.app/",
            "github": "https://github.com/SirDaarick/paidea-reloaded"
        },
        "paralel": {
            "name": "Paralel",
            "tagline": "IA de alta velocidad en C++ para toma de decisiones en tiempo real",
            "tech": "C++, Computación Paralela, OpenMP, Heurísticas Minimax/Alpha-Beta",
            "speed": "68,000 nodos/seg (7.4x speedup en 8 núcleos)",
            "problem": "Explosión combinatoria al evaluar jugadas futuras con lookahead profundo en un solo hilo.",
            "solution": "Motor multihilo con OpenMP y heurísticas de altura, huecos y rugosidad para jugar Tetris a velocidad sobrehumana.",
            "demo": "https://paralel-iota.vercel.app/",
            "github": "https://github.com/SirDaarick/Paralel"
        },
        "extractor": {
            "name": "Extractor de Documentos y Facturación",
            "tagline": "Pipeline inteligente de procesamiento de facturas y albaranes",
            "tech": "OCR, Modelos de Visión / LLM, Schemas Pydantic, FastAPI",
            "problem": "Captura manual de facturas y cotejo con órdenes de compra propenso a errores humanos.",
            "solution": "Extracción estructurada con validación de tipo matemática y semántica en tiempo real."
        }
    }
}

SYSTEM_INSTRUCTION = """
Eres 'Daverick Assistant', el copiloto técnico y asesor senior de inteligencia artificial del portafolio de Erick Daniel (Daarick).
Tu personalidad:
- Eres un Senior AI Solutions Architect y apasionado docente (GDE & MVP style).
- Tu misión es tender un puente pedagógico y honesto entre la alta ingeniería técnica y personas o clientes con o sin conocimiento técnico.
- Tono: Cálido, profesional, pedagógico y directo. En español.
- Filosofía: CONCEPTS > CODE. Una buena solución no es 'meterle IA a todo', sino usar la herramienta adecuada (motores deterministas para números/reglas, LLMs para lenguaje y extracción).
- Honestidad radical en viabilidad:
  1. Si alguien pregunta si puede usar un LLM para contabilidad/balances matemáticos: Explícale por qué los LLMs son probabilísticos y NUNCA deben sumar o calcular impuestos directamente. Recomienda una arquitectura híbrida (LLM para extraer los datos + motor Python/SQL para el cálculo matemático exacto).
  2. Si preguntan sobre extracción de documentos, soporte WhatsApp, análisis de código, optimización o agentes: Explica la viabilidad (VIABLE), los retos reales (calidad de datos, latencia, costos) y la arquitectura recomendada.
  3. Si preguntan sobre Erick: Menciona su formación en ESCOM - IPN, sus proyectos (Graphito, Tetring, PAIDEA, Paralel) y su enfoque de ahorro de tiempo y costes mediante automatización a medida.

Respuestas estructuradas:
- Comienza con una respuesta clara y directa.
- Usa analogías sencillas cuando el concepto sea abstracto.
- Termina con 2 o 3 sugerencias accionables de preguntas siguientes.
"""

def is_out_of_scope(text: str) -> bool:
    """Detecta si la consulta está completamente fuera del alcance del portafolio."""
    q = text.lower()
    out_of_scope_patterns = [
        r"\breceta\b", r"\bcocinar\b", r"\bdieta\b",
        r"\bhackear\b", r"\bvulnerar\b", r"\bdos attack\b",
        r"\bremedio\b", r"\bsintomas\b", r"\bmedicamento\b",
        r"\bhoroscopo\b", r"\btarot\b", r"\bfutbol\b", r"\bpartido de hoy\b"
    ]
    return any(re.search(pat, q) for pat in out_of_scope_patterns)

def evaluate_feasibility(query_text: str) -> Tuple[Optional[str], List[str]]:
    """Evalúa la viabilidad técnica de una idea de automatización planteada por el usuario."""
    q = query_text.lower()
    
    # Caso: Cálculos matemáticos puros / Contabilidad con LLMs
    if any(k in q for k in ["contabilidad", "calcular impuestos", "balance contable", "sumar facturas", "matemática pura", "cálculo financiero"]):
        return (
            "VIABLE_CON_RESTRICCIONES",
            ["FastAPI", "SQL / PostgreSQL", "Pydantic", "LLM sólo para extracción"]
        )
        
    # Caso: Extracción de documentos / facturas / contratos
    if any(k in q for k in ["factura", "facturas", "documento", "pdf", "contrato", "extraer datos", "ocr"]):
        return (
            "ALTA_VIABILIDAD",
            ["FastAPI", "Vision Models / OCR", "Pydantic Schemas", "PostgreSQL"]
        )
        
    # Caso: WhatsApp / Atención a clientes / Bots
    if any(k in q for k in ["whatsapp", "soporte", "atencion al cliente", "chatbot", "ventas", "crm", "hubspot"]):
        return (
            "ALTA_VIABILIDAD",
            ["WhatsApp Cloud API", "FastAPI", "RAG (ChromaDB)", "Guardrails / Human-in-the-loop"]
        )
        
    # Caso: Scraping / Automatización de flujos repetitivos
    if any(k in q for k in ["scraping", "extraer de web", "notion", "sheets", "excel", "correo", "gmail"]):
        return (
            "ALTA_VIABILIDAD",
            ["Python Playwright / BeautifulSoup", "FastAPI", "Celery / Background Workers", "Webhooks"]
        )

    # Caso: Algoritmos combinatorios / Horarios / Rutas
    if any(k in q for k in ["horario", "rutas", "combinatoria", "optimizar tiempos", "asignacion"]):
        return (
            "ALTA_VIABILIDAD_DETERMINISTA",
            ["Algoritmos CSP (Branch & Bound)", "TypeScript / Python", "C++ si alta escala"]
        )

    return (None, [])

async def call_gemini_api(messages: List[ChatMessage], canonical_context: str = "") -> Optional[str]:
    """Llama a la API de Gemini aplicando ventana deslizante y contexto canónico."""
    if not GEMINI_API_KEY:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        system_text = SYSTEM_INSTRUCTION
        if canonical_context:
            system_text += f"\n\n[HECHOS CANÓNICOS DEL PORTAFOLIO]:\n{canonical_context}\nAdapta estos hechos a la consulta del usuario sin inventar datos adicionales."

        contents = []
        for msg in messages:
            role = "user" if msg.role == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.content}]
            })
            
        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_text}]
            },
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 600
            }
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if text:
                        return text.strip()
    except Exception:
        pass
    return None

def generate_local_response(messages: List[ChatMessage]) -> ChatResponse:
    """
    Motor semántico local de alta fidelidad pedagógica y técnica.
    Garantiza funcionamiento offline/local con cero dependencias externas.
    """
    if not messages:
        return ChatResponse(
            reply="¡Hola! Soy Daverick Assistant, copiloto de arquitectura de IA. ¿En qué te puedo asesorar hoy? Puedo despejar dudas sobre los proyectos de Erick, contarte qué se puede automatizar y qué no, o revisar la viabilidad de una idea que tengas en mente.",
            suggestions=[
                "✦ ¿Qué proyectos ha desarrollado Erick?",
                "💬 ¿Es viable automatizar mi soporte o facturas?",
                "🧠 ¿Por qué no usar IA para contabilidad directa?",
                "📋 ¿Cómo es el proceso de consultoría e implementación?"
            ],
            source="local_knowledge_engine",
            strategy="standard"
        )
        
    latest_msg = messages[-1].content.strip()
    q = latest_msg.lower()
    
    feasibility_verdict, tech_stack = evaluate_feasibility(latest_msg)

    # 1. Dudas sobre contabilidad / cálculos / LLMs
    if any(k in q for k in ["contabilidad", "calcular", "matematica", "numeros", "sumas", "impuesto", "por qué no usar ia para contabilidad"]):
        reply = (
            "**¡Gran pregunta técnica! Aquí está el veredicto arquitectónico:**\n\n"
            "Un modelo de lenguaje (LLM) es un motor probabilístico: predice qué palabra o token sigue según probabilidades estadísticas. "
            "Pedirle a un LLM que calcule impuestos o sume subtotales es un grave error de diseño porque puede 'alucinar' números con total seguridad.\n\n"
            "**¿Cómo lo resolvemos correctamente? Arquitectura Híbrida:**\n"
            "1. **Capa Semántica (LLM/OCR):** Lee la factura o recibo y extrae los campos clave a un esquema validado con Pydantic.\n"
            "2. **Capa Determinista (Python/SQL):** El código tradicional realiza las sumas, multiplica los impuestos y valida que el total coincida al centavo.\n"
            "3. **Auditoría:** Si hay discrepancia, se lanza una alerta al operador humano.\n\n"
            "De este modo obtienes la flexibilidad del lenguaje natural con la precisión matemática del 100%."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ Ver demo del Extractor de Facturas",
                "💬 ¿Cómo integrarlo con WhatsApp?",
                "📋 ¿Qué proyectos ha creado Erick?"
            ],
            feasibility_verdict="VIABLE_CON_RESTRICCIONES",
            tech_recommendations=["FastAPI", "Pydantic Schemas", "OCR / Multimodal", "PostgreSQL"],
            source="local_knowledge_engine",
            strategy="feasibility_eval"
        )

    # 2. Dudas sobre Graphito / Plagio
    if any(k in q for k in ["graphito", "plagio", "codigo", "copias", "ofuscad"]):
        proj = KNOWLEDGE_BASE["projects"]["graphito"]
        reply = (
            f"**Graphito // Detección de Plagio Semántico con Deep Learning**\n\n"
            f"Los detectores habituales (como Moss) comparan secuencias de tokens simples. Si un estudiante cambia `for` por `while` o renombra variables de `x` a `contador`, Moss se confunde.\n\n"
            f"**¿Cómo lo resolvió Erick?**\n"
            f"• Construyó un pipeline con **Tree-sitter** que compila el código en un Grafo de Flujo de Datos (DFG).\n"
            f"• Aplica **GraphCodeBERT con LoRA** para extraer la intención lógica del algoritmo, independientemente de la sintaxis.\n"
            f"• Incorpora estilometría con **CharCNN** para identificar patrones del autor.\n\n"
            f"**Resultado:** **{proj['accuracy']}** de efectividad incluso contra código intencionalmente ofuscado."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Cómo funciona Tetring para horarios?",
                "💬 ¿Cómo se despliega un modelo con FastAPI?",
                "📋 Ver GitHub de Graphito"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["GraphCodeBERT", "Tree-sitter", "PyTorch", "FastAPI"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    # 3. Dudas sobre Tetring / Algoritmos / CSP
    if any(k in q for k in ["tetring", "horario", "saes", "empalme", "combinatori"]):
        proj = KNOWLEDGE_BASE["projects"]["tetring"]
        reply = (
            f"**Tetring // Optimizador Combinatorio de Horarios (42ms)**\n\n"
            f"Muchos creen que para resolver un horario se necesita IA generativa. En realidad, usar un LLM aquí sería ineficiente y costoso.\n\n"
            f"Erick implementó un motor de **Satisfacción de Restricciones (CSP)** con poda *branch-and-bound*:\n"
            f"• Evalúa **14,200 combinaciones por segundo** en el navegador.\n"
            f"• Aplica restricciones duras (cero empalmes de materia) y restricciones blandas (minimizar huecos entre clases, balance de días).\n"
            f"• Resuelve el horario ideal en solo **{proj['speed']}** con compatibilidad directa para SAES IPN."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Qué es PAIDEA y cómo usa RAG?",
                "💬 ¿Qué es Paralel en C++?",
                "📋 Probar la demo de Tetring"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["CSP (Constraint Satisfaction)", "Algoritmos Combinatorios", "TypeScript"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    # 4. Dudas sobre PAIDEA / RAG / Multiagentes
    if any(k in q for k in ["paidea", "rag", "tecnoburro", "multiagente", "multi-agente", "docente", "profesor"]):
        proj = KNOWLEDGE_BASE["projects"]["paidea"]
        reply = (
            f"**PAIDEA // Ecosistema Multi-Agente Educativo con RAG**\n\n"
            f"Es una plataforma diseñada para liberar a los profesores de responder 50 veces la misma pregunta sobre criterios y rúbricas.\n\n"
            f"**Arquitectura:**\n"
            f"• Orquestador **TecnoBurro** que clasifica el rol del usuario (alumno vs docente).\n"
            f"• Memoria vectorial con **ChromaDB** que recupera fragmentos exactos del reglamento y del temario.\n"
            f"• Herramientas modulares (`alumno_tools`, `rubric_evaluator`) que ejecutan acciones como validar si un archivo ZIP cumple la nomenclatura exigida.\n\n"
            f"Precisión en recuperación de contexto: **95.4%**."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Cómo evitar alucinaciones en RAG?",
                "💬 ¿Qué diferencia hay entre RAG y Fine-Tuning?",
                "📋 ¿Quién es Erick Daniel?"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["LangChain", "ChromaDB", "FastAPI", "Multi-Agent System"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    # 5. Dudas sobre Paralel / Computación de alto rendimiento
    if any(k in q for k in ["paralel", "c++", "openmp", "tetris", "paralelo", "rendimiento", "multithread"]):
        proj = KNOWLEDGE_BASE["projects"]["paralel"]
        reply = (
            f"**Paralel // Motor de IA Heurística de Alto Rendimiento en C++**\n\n"
            f"Para decisiones de ultra-baja latencia (como un juego en tiempo real), Python suele tener sobrecarga por el GIL (Global Interpreter Lock).\n\n"
            f"Erick construyó este motor directamente en **C++ con OpenMP**:\n"
            f"• Despacha 8 hilos trabajadores en paralelo que evalúan árboles de decisión futuros.\n"
            f"• Procesa **68,000 nodos por segundo** con poda alfa-beta.\n"
            f"• Logró un **speedup de 7.4x** comparado con la ejecución monohilo, jugando partidas de Tetris automáticas de más de 15,000 líneas."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ Ver proyectos en el portafolio",
                "💬 ¿Haces automatizaciones para empresas?",
                "📋 ¿Cómo contactar a Erick?"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["C++ Moderno", "OpenMP", "Algoritmos Heurísticos", "Alpha-Beta Pruning"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    # 6. Viabilidad de automatizar procesos de negocio (Soporte, WhatsApp, Facturas, CRM)
    if any(k in q for k in ["factura", "whatsapp", "soporte", "crm", "mi negocio", "automatizar mi", "empresa", "ahorrar tiempo", "proceso"]):
        reply = (
            "**¡Es totalmente viable! Y tiene un retorno de inversión muy alto si se hace bien.**\n\n"
            "En automatización de procesos empresariales solemos abordar tres pilares:\n"
            "1. **Extracción y Validación de Documentos:** Procesar facturas, albaranes o recibos en segundos, sincronizándolos con tu base de datos o ERP.\n"
            "2. **Asistentes de WhatsApp / CRM:** Respuestas inmediatas a clientes 24/7 conectadas a tu inventario o agenda (vía WhatsApp Cloud API oficial).\n"
            "3. **Eliminación de Tareas Repetitivas:** Notificaciones automáticas, reportes ejecutivos en PDF/Excel y sincronización entre plataformas.\n\n"
            "**El método de trabajo de Erick:**\n"
            "Analizamos juntos tus cuellos de botella actuales, diseñamos la solución técnica a medida, e implementamos un piloto funcional en semanas."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Cómo agendar una llamada de diagnóstico?",
                "💬 ¿Qué costo o tiempos tiene un desarrollo?",
                "📋 Probar la demo de Facturación en vivo"
            ],
            feasibility_verdict="ALTA_VIABILIDAD",
            tech_recommendations=["FastAPI", "WhatsApp Cloud API", "OCR / Multimodal", "PostgreSQL", "React"],
            source="local_knowledge_engine",
            strategy="feasibility_eval"
        )

    # 7. Dudas sobre Erick (Quién es, experiencia, formación)
    if any(k in q for k in ["erick", "quien eres", "autor", "daarick", "experiencia", "estudios", "escom", "ipn"]):
        reply = (
            "**Erick Daniel (Daarick)** es Ingeniero en Sistemas Computacionales egresado de **ESCOM - IPN** (México).\n\n"
            "Se especializa en **Ingeniería de Sistemas de IA y Automatización**, con un enfoque radical en arquitecturas limpias, modulares y de alto rendimiento. "
            "No se limita a envoltorios de APIs; diseña desde pipelines de Deep Learning con PyTorch y Tree-sitter hasta APIs asíncronas con FastAPI y microservicios paralelos en C++.\n\n"
            "Su objetivo con cada cliente o equipo es eliminar trabajo manual repetitivo y dotar de sistemas autónomos confiables y medibles."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Qué proyectos ha construido?",
                "💬 Ver información de contacto",
                "📋 ¿Cómo ayuda a empresas y startups?"
            ],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    # 8. Contratación / Contacto / Servicios
    if any(k in q for k in ["contacto", "contratar", "precio", "cuanto cuesta", "agendar", "correo", "telefono", "whatsapp", "llamada"]):
        reply = (
            "**¿Listo para automatizar tus procesos?**\n\n"
            "El proceso de colaboración es transparente y sin fricción:\n"
            "1. **Diagnóstico inicial:** Evaluamos tus cuellos de botella operativos y los datos con los que cuentas.\n"
            "2. **Propuesta técnica & arquitectura:** Definimos el stack, alcance, tiempos y presupuesto exacto.\n"
            "3. **Implementación ágil:** Entregables iterativos con demostraciones funcionales desde las primeras semanas.\n\n"
            "Puedes contactar a Erick directamente a través de:\n"
            "• **WhatsApp:** Botón directo disponible en el encabezado y pie de página\n"
            "• **Correo:** [erick.daarick@gmail.com](mailto:erick.daarick@gmail.com)\n"
            "• **GitHub:** [github.com/SirDaarick](https://github.com/SirDaarick)"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Es viable automatizar mi soporte?",
                "💬 Ver demos interactivas en vivo",
                "📋 ¿Qué proyectos ha creado Erick?"
            ],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    # Default / Consulta general
    reply = (
        f"Analizando tu consulta: *\"{latest_msg}\"*.\n\n"
        "Desde la perspectiva de arquitectura de IA, cualquier solución debe evaluarse por su **viabilidad técnica**, **fidelidad de datos** y **retorno de inversión**.\n\n"
        "¿Te gustaría que evaluemos cómo aplicar una arquitectura de IA a un caso de uso particular (por ejemplo, procesamiento de documentos, agentes de soporte, o sincronización de bases de datos), o prefieres conocer los detalles de alguno de los proyectos de Erick?"
    )
    return ChatResponse(
        reply=reply,
        suggestions=[
            "✦ ¿Es viable automatizar mi negocio?",
            "💬 ¿Por qué no usar IA para contabilidad?",
            "📋 Cuéntame sobre el proyecto Graphito",
            "⚡ ¿Cómo contactar a Erick?"
        ],
        feasibility_verdict=feasibility_verdict,
        tech_recommendations=tech_stack,
        source="local_knowledge_engine",
        strategy="standard"
    )

async def process_chat(request_data: Dict[str, Any]) -> ChatResponse:
    """
    Orquestador de consultas con arquitectura de 3 capas:
    1. Guardrail de entrada: Anti-biblia (>1200 chars) y filtro de fuera de alcance.
    2. Sliding Window Memory: toma sólo los últimos 6 turnos de conversación.
    3. Model Multiplexing & Grounded Rewriter.
    """
    raw_messages = request_data.get("messages", [])
    if not raw_messages:
        return generate_local_response([])

    # 1. Ventana deslizante (Sliding Window de k=6)
    windowed = raw_messages[-6:]
    messages = [
        ChatMessage(
            role=m.get("role", "user"),
            content=m.get("content", ""),
            timestamp=m.get("timestamp")
        )
        for m in windowed
    ]

    latest_text = messages[-1].content.strip()

    # 2. Escudo Anti-Biblia (> 1,200 caracteres)
    if len(latest_text) > 1200:
        return ChatResponse(
            reply=(
                "**Nota de optimización de contexto:**\n\n"
                "Detecto un texto bastante extenso (más de 1,200 caracteres). Para mantener la precisión y evitar "
                "dilución de contexto (*Lost in the Middle*), ¿podrías sintetizar en **2 o 3 líneas** cuál es el "
                "objetivo o problema concreto que buscas evaluar?"
            ),
            suggestions=[
                "✦ Resumir mi caso en 2 líneas",
                "💬 ¿Qué proyectos ha creado Erick?",
                "📋 ¿Cómo contactar a Erick para un diagnóstico?"
            ],
            source="local_knowledge_engine",
            strategy="anti_biblia"
        )

    # 3. Filtro de Alcance (Out-of-Scope)
    if is_out_of_scope(latest_text):
        return ChatResponse(
            reply=(
                "**Fuera de alcance del sistema:**\n\n"
                "Mi rol como **Daverick Assistant** está enfocado exclusivamente en **ingeniería de software, "
                "sistemas de inteligencia artificial y automatización de procesos** para el portafolio de Erick Daniel.\n\n"
                "¿Te gustaría consultar sobre viabilidad de IA para un negocio o conocer proyectos como Graphito o Tetring?"
            ),
            suggestions=[
                "✦ ¿Qué proyectos ha desarrollado Erick?",
                "💬 ¿Es viable automatizar mi empresa?",
                "⚡ ¿Cómo agendar una llamada de diagnóstico?"
            ],
            source="local_knowledge_engine",
            strategy="out_of_scope"
        )

    # 4. Contexto canónico para reescritura guiada
    canonical_summary = (
        f"Perfil: {KNOWLEDGE_BASE['profile']['name']}, {KNOWLEDGE_BASE['profile']['role']} (ESCOM-IPN). "
        f"Filosofía: {KNOWLEDGE_BASE['profile']['philosophy']} "
        f"Proyectos: Graphito (DFG, LoRA, Tree-sitter), Tetring (CSP 42ms), PAIDEA (RAG ChromaDB), Paralel (C++ OpenMP)."
    )

    # 5. Si hay Gemini API Key disponible, intentamos la reescritura guiada con contexto
    if GEMINI_API_KEY:
        gemini_reply = await call_gemini_api(messages, canonical_context=canonical_summary)
        if gemini_reply:
            feasibility, tech = evaluate_feasibility(latest_text)
            suggestions = [
                "✦ ¿Es viable automatizar mi soporte o facturas?",
                "💬 ¿Cómo funciona Graphito contra plagio?",
                "📋 ¿Por qué no usar IA para contabilidad directa?",
                "⚡ ¿Cómo contactar a Erick para un proyecto?"
            ]
            return ChatResponse(
                reply=gemini_reply,
                suggestions=suggestions,
                feasibility_verdict=feasibility,
                tech_recommendations=tech,
                source="gemini",
                strategy="grounded_rewrite"
            )

    # 6. Fallback garantizado: Motor Semántico Local
    return generate_local_response(messages)
