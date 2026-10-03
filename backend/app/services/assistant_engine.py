import os
import re
import json
import httpx
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.assistant import ChatMessage, ChatResponse

from dotenv import load_dotenv

def get_env_config() -> Dict[str, str]:
    """Carga dinámicamente las variables de entorno para detectar cambios en .env sin reiniciar."""
    load_dotenv(override=True)
    return {
        "OPENROUTER_API_KEY": os.getenv("OPENROUTER_API_KEY", "").strip(),
        "OPENROUTER_ROUTER_MODEL": os.getenv("OPENROUTER_ROUTER_MODEL", "typesafe/jev-router").strip(),
        "OPENROUTER_CHEAP_MODEL": os.getenv("OPENROUTER_CHEAP_MODEL", "google/gemini-3.8-flash").strip(),
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY", "").strip(),
        "GEMINI_FAST_MODEL": os.getenv("GEMINI_FAST_MODEL", "gemini-flash-latest").strip(),
        "GEMINI_HEAVY_MODEL": os.getenv("GEMINI_HEAVY_MODEL", "gemini-pro-latest").strip(),
    }

# Variables de compatibilidad inicial
_initial_cfg = get_env_config()
OPENROUTER_API_KEY = _initial_cfg["OPENROUTER_API_KEY"]
OPENROUTER_ROUTER_MODEL = _initial_cfg["OPENROUTER_ROUTER_MODEL"]
OPENROUTER_CHEAP_MODEL = _initial_cfg["OPENROUTER_CHEAP_MODEL"]
GEMINI_API_KEY = _initial_cfg["GEMINI_API_KEY"]
GEMINI_FAST_MODEL = _initial_cfg["GEMINI_FAST_MODEL"]
GEMINI_HEAVY_MODEL = _initial_cfg["GEMINI_HEAVY_MODEL"]

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
Eres 'Wiki', el copiloto técnico y wiki interactiva de inteligencia artificial del portafolio de Erick Daniel (Daarick).
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
    """Filtro de seguridad previo: descarta temas no relacionados con software/IA."""
    q = text.lower()
    patterns = [
        r"\breceta\b", r"\bcocinar\b", r"\bdieta\b",
        r"\bhackear\b", r"\bvulnerar\b", r"\bdos attack\b",
        r"\bremedio\b", r"\bsintomas\b", r"\bmedicamento\b",
        r"\bhoroscopo\b", r"\btarot\b", r"\bfutbol\b", r"\bpartido de hoy\b"
    ]
    return any(re.search(pat, q) for pat in patterns)

def is_complex_query(text: str) -> bool:
    """Identifica si la duda requiere el modelo pesado (Gemini Pro) por su nivel de complejidad técnica/empresarial."""
    q = text.lower()
    complex_keywords = [
        "arquitectura empresarial", "evaluacion de viabilidad", "roi", "retorno de inversion",
        "migracion de sistema", "cuello de botella", "escalabilidad", "multi-agente complejo",
        "balance contable", "auditoria de codigo", "pipeline de datos", "despliegue en cluster"
    ]
    return any(k in q for k in complex_keywords) or len(text.split()) > 35

def evaluate_feasibility(query_text: str) -> Tuple[Optional[str], List[str]]:
    """Evalúa la viabilidad técnica de una idea de automatización planteada por el usuario."""
    q = query_text.lower()
    
    if any(k in q for k in ["contabilidad", "calcular impuestos", "balance contable", "sumar facturas", "matemática pura", "cálculo financiero"]):
        return (
            "VIABLE_CON_RESTRICCIONES",
            ["FastAPI", "SQL / PostgreSQL", "Pydantic", "LLM sólo para extracción"]
        )
        
    if any(k in q for k in ["factura", "facturas", "documento", "pdf", "contrato", "extraer datos", "ocr"]):
        return (
            "ALTA_VIABILIDAD",
            ["FastAPI", "Vision Models / OCR", "Pydantic Schemas", "PostgreSQL"]
        )
        
    if any(k in q for k in ["whatsapp", "soporte", "atencion al cliente", "chatbot", "ventas", "crm", "hubspot"]):
        return (
            "ALTA_VIABILIDAD",
            ["WhatsApp Cloud API", "FastAPI", "RAG (ChromaDB)", "Guardrails / Human-in-the-loop"]
        )
        
    if any(k in q for k in ["scraping", "extraer de web", "notion", "sheets", "excel", "correo", "gmail"]):
        return (
            "ALTA_VIABILIDAD",
            ["Python Playwright / BeautifulSoup", "FastAPI", "Celery / Background Workers", "Webhooks"]
        )

    if any(k in q for k in ["horario", "rutas", "combinatoria", "optimizar tiempos", "asignacion"]):
        return (
            "ALTA_VIABILIDAD_DETERMINISTA",
            ["Algoritmos CSP (Branch & Bound)", "TypeScript / Python", "C++ si alta escala"]
        )

    return (None, [])

# ==============================================================================
# CLIENTE OPENROUTER (Jev Decision Router & Modelos Económicos)
# ==============================================================================
async def call_openrouter_api(
    messages: List[ChatMessage],
    model: str,
    system_text: str = SYSTEM_INSTRUCTION,
    max_tokens: int = 600
) -> Optional[str]:
    """Llama a la API de OpenRouter con cualquier modelo soportado."""
    cfg = get_env_config()
    api_key = cfg["OPENROUTER_API_KEY"]
    if not api_key:
        return None

    try:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:4321",
            "X-Title": "Daarick Portfolio Wiki"
        }

        formatted_msgs = [{"role": "system", "content": system_text}]
        for m in messages:
            formatted_msgs.append({
                "role": "user" if m.role == "user" else "assistant",
                "content": m.content
            })

        payload = {
            "model": model,
            "messages": formatted_msgs,
            "temperature": 0.3,
            "max_tokens": max_tokens
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    if content:
                        return content.strip()
            else:
                print(f"[OpenRouter Error: {model}] Status {resp.status_code}: {resp.text[:120]}")
    except Exception as e:
        print(f"[OpenRouter Exception: {model}] {e}")
    return None

# ==============================================================================
# CLIENTE GOOGLE AI (Gemini Flash & Gemini Pro vía Google AI Studio / Pro)
# ==============================================================================
async def call_gemini_api(
    messages: List[ChatMessage],
    model: str,
    system_text: str = SYSTEM_INSTRUCTION,
    canonical_context: str = "",
    max_tokens: int = 800
) -> Optional[str]:
    """Invoca la API de Google Generative Language directamente con la suscripción Google AI Pro."""
    cfg = get_env_config()
    api_key = cfg["GEMINI_API_KEY"]
    if not api_key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        full_system = system_text
        if canonical_context:
            full_system += f"\n\n[HECHOS CANÓNICOS DEL PORTAFOLIO]:\n{canonical_context}\n"

        contents = []
        for msg in messages:
            role = "user" if msg.role == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg.content}]
            })

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": full_system}]},
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": max_tokens
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "")
                        if text:
                            return text.strip()
            else:
                print(f"[Google AI Direct Info: {model}] Status {resp.status_code}: {resp.text[:120]}")
    except Exception as e:
        print(f"[Google AI Direct Exception: {model}] {e}")

    return None

async def evaluate_decision_router(query: str) -> Optional[str]:
    """
    Consulta a Jev o al router de decisiones de OpenRouter si está configurado.
    Retorna la categoría: 'OUT_OF_SCOPE', 'CANON_FAQ', 'TIER_HEAVY', o 'TIER_FAST'.
    """
    cfg = get_env_config()
    api_key = cfg["OPENROUTER_API_KEY"]
    router_model = cfg["OPENROUTER_ROUTER_MODEL"]
    if not api_key:
        return None
    try:
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:4321",
            "X-Title": "Daarick Portfolio Wiki Router"
        }
        router_prompt = (
            "Eres un enrutador de intenciones para un asistente técnico de portafolio de ingeniería de software e IA. "
            "Clasifica la consulta del usuario en una de estas 4 categorías estrictas:\n"
            "- OUT_OF_SCOPE: Temas totalmente ajenos a software, IA o portafolio (recetas de cocina, medicina, deportes, horóscopos, etc.).\n"
            "- CANON_FAQ: Pregunta puntual sobre los proyectos de Erick (Graphito, Tetring, PAIDEA, Paralel) o contacto.\n"
            "- TIER_HEAVY: Pregunta compleja sobre diseño de arquitectura empresarial, viabilidad de automatización, migración masiva o contabilidad.\n"
            "- TIER_FAST: Pregunta técnica de programación (generar código en Python, dudas de librerías, algoritmos, explicaciones, etc.) o consulta estándar.\n\n"
            "Responde ÚNICAMENTE en formato JSON: {\"route\": \"CATEGORY\"}"
        )
        payload = {
            "model": router_model,
            "messages": [
                {"role": "system", "content": router_prompt},
                {"role": "user", "content": query}
            ],
            "temperature": 0.0,
            "max_tokens": 50
        }
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                json_match = re.search(r"\{.*\}", content, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    route = parsed.get("route", "").strip().upper()
                    if route in ["OUT_OF_SCOPE", "CANON_FAQ", "TIER_HEAVY", "TIER_FAST"]:
                        return route
    except Exception as e:
        print(f"[Jev Router Fallback to Heuristic]: {e}")
    return None

async def call_gemini_heavy(messages: List[ChatMessage], canonical_context: str = "") -> Tuple[Optional[str], str]:
    """Invoca Gemini Pro (Google AI Pro directo) con respaldo en OpenRouter si está configurado."""
    cfg = get_env_config()
    # 1. Llamada directa a Google AI Pro
    if cfg["GEMINI_API_KEY"]:
        res = await call_gemini_api(
            messages=messages,
            model=cfg["GEMINI_HEAVY_MODEL"],
            system_text=SYSTEM_INSTRUCTION,
            canonical_context=canonical_context,
            max_tokens=800
        )
        if res:
            return (res, "google_ai_pro_heavy")

    # 2. Respaldo vía OpenRouter si existe
    if cfg["OPENROUTER_API_KEY"]:
        res = await call_openrouter_api(
            messages,
            model=cfg["OPENROUTER_CHEAP_MODEL"],
            system_text=SYSTEM_INSTRUCTION + (f"\n\n[HECHOS]: {canonical_context}" if canonical_context else ""),
            max_tokens=800
        )
        if res:
            return (res, f"openrouter_{cfg['OPENROUTER_CHEAP_MODEL'].split('/')[-1]}")
    return (None, "local_fallback")

async def call_gemini_fast(messages: List[ChatMessage], canonical_context: str = "") -> Tuple[Optional[str], str]:
    """Invoca Gemini Flash (Google AI Pro directo) con respaldo en OpenRouter si está configurado."""
    cfg = get_env_config()
    # 1. Llamada directa a Google AI Pro
    if cfg["GEMINI_API_KEY"]:
        res = await call_gemini_api(
            messages=messages,
            model=cfg["GEMINI_FAST_MODEL"],
            system_text=SYSTEM_INSTRUCTION,
            canonical_context=canonical_context,
            max_tokens=600
        )
        if res:
            return (res, "google_ai_pro_flash")

    # 2. Respaldo vía OpenRouter si existe
    if cfg["OPENROUTER_API_KEY"]:
        res = await call_openrouter_api(
            messages,
            model=cfg["OPENROUTER_CHEAP_MODEL"],
            system_text=SYSTEM_INSTRUCTION + (f"\n\n[HECHOS]: {canonical_context}" if canonical_context else ""),
            max_tokens=600
        )
        if res:
            return (res, f"openrouter_{cfg['OPENROUTER_CHEAP_MODEL'].split('/')[-1]}")
    return (None, "local_fallback")

# ==============================================================================
# MOTOR LOCAL DETERMINISTA (Garantía de respuesta offline / 0 costo)
# ==============================================================================
def generate_local_response(messages: List[ChatMessage]) -> ChatResponse:
    if not messages:
        return ChatResponse(
            reply="¡Hola! Soy **Wiki**, el copiloto técnico del portafolio. ¿En qué te puedo asesorar hoy? Puedo despejar dudas sobre los proyectos de Erick, contarte qué se puede automatizar y qué no, o revisar la viabilidad de una idea que tengas en mente.",
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

    if any(k in q for k in ["contabilidad", "impuesto", "balance contable", "sumar facturas", "ia para contabilidad", "cálculo financiero", "por qué no usar ia para contabilidad"]):
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

    if any(k in q for k in ["graphito", "plagio de codigo", "deteccion de plagio", "ofuscad", "ofuscacion", "tree-sitter", "graphcodebert"]):
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

    if any(k in q for k in ["script", "libreria", "funcion", "ayudame a programar", "crear codigo", "escribir codigo"]):
        reply = (
            "**¡Con gusto te oriento en el diseño y arquitectura de tu código!**\n\n"
            "Como principio arquitectónico fundamental (**CONCEPTS > CODE**):\n"
            "• Para procesamiento de datos y scripts de automatización: Recomendamos **Python con Pandas o Polars**, tipado estricto con **Pydantic** y manejo robusto de excepciones.\n"
            "• Para APIs y microservicios: **FastAPI** con validación asíncrona.\n"
            "• Para lógica intensiva en rendimiento o tiempo real: Módulos compilados en **C++** o concurrencia multihilo.\n\n"
            "¿Qué objetivo específico buscas resolver en tu script (ej. procesar un archivo CSV, consumir una API o automatizar un flujo de datos)?"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ Limpiar y procesar un archivo CSV",
                "💬 Crear una API asíncrona con FastAPI",
                "📋 Automatizar extracción de datos con Python",
                "⚡ ¿Cómo estructura Erick sus arquitecturas?"
            ],
            source="local_knowledge_engine",
            strategy="standard"
        )

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

# ==============================================================================
# ORQUESTADOR PRINCIPAL MULTI-TIER
# ==============================================================================
async def process_chat(request_data: Dict[str, Any]) -> ChatResponse:
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
                "Mi rol como **Wiki** está enfocado exclusivamente en **ingeniería de software, "
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

    canonical_context = (
        f"Erick Daniel (Daarick): Ingeniero de Sistemas de IA & Automatización (ESCOM-IPN). "
        f"Proyectos: Graphito (Tree-sitter, LoRA, 96.8% plagio), Tetring (CSP 42ms), "
        f"PAIDEA (TecnoBurro RAG en ChromaDB), Paralel (C++ OpenMP 68k evals/s)."
    )
    feasibility, tech = evaluate_feasibility(latest_text)

    # 4. Decisión de Nivel y Enrutador Inteligente (Jev / Heurística)
    needs_heavy = is_complex_query(latest_text)
    router_verdict = await evaluate_decision_router(latest_text)
    
    if router_verdict == "OUT_OF_SCOPE":
        return ChatResponse(
            reply=(
                "**Fuera de alcance del sistema:**\n\n"
                "Mi rol como **Wiki** está enfocado exclusivamente en **ingeniería de software, "
                "sistemas de inteligencia artificial y automatización de procesos** para el portafolio de Erick Daniel.\n\n"
                "¿Te gustaría consultar sobre viabilidad de IA para un negocio o conocer proyectos como Graphito o Tetring?"
            ),
            suggestions=[
                "✦ ¿Qué proyectos ha desarrollado Erick?",
                "💬 ¿Es viable automatizar mi empresa?",
                "⚡ ¿Cómo agendar una llamada de diagnóstico?"
            ],
            source="router_jev",
            strategy="out_of_scope"
        )
    elif router_verdict == "TIER_HEAVY":
        needs_heavy = True

    # 5. TIER A: Razonamiento Complejo (Gemini Pro - Google AI Pro directo)
    if needs_heavy:
        heavy_reply, heavy_source = await call_gemini_heavy(messages, canonical_context=canonical_context)
        if heavy_reply:
            return ChatResponse(
                reply=heavy_reply,
                suggestions=[
                    "✦ ¿Cómo agendar una llamada de diagnóstico?",
                    "💬 ¿Qué stack técnico recomiendas?",
                    "📋 Ver demos interactivas en vivo"
                ],
                feasibility_verdict=feasibility or "ALTA_VIABILIDAD",
                tech_recommendations=tech or ["FastAPI", "Python", "RAG", "PostgreSQL"],
                source=heavy_source,
                strategy="heavy_reasoning"
            )

    # 6. TIER B: Pregunta ágil / Asesoría directa (Gemini Flash - Google AI Pro directo)
    # Aprovecha la suscripción Google AI Pro para velocidad (<400ms) y costo cero en OpenRouter
    fast_reply, fast_source = await call_gemini_fast(messages, canonical_context=canonical_context)
    if fast_reply:
        return ChatResponse(
            reply=fast_reply,
            suggestions=[
                "✦ ¿Es viable automatizar mi soporte o facturas?",
                "💬 ¿Cómo funciona Graphito contra plagio?",
                "📋 ¿Por qué no usar IA para contabilidad directa?",
                "⚡ ¿Cómo contactar a Erick para un proyecto?"
            ],
            feasibility_verdict=feasibility,
            tech_recommendations=tech,
            source=fast_source,
            strategy="fast_response"
        )

    # 7. TIER C: Respaldo garantizado: Motor Semántico Local de Alta Fidelidad (0 tokens, 100% determinista)
    return generate_local_response(messages)
