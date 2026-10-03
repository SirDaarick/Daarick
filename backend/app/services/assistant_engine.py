import os
import re
import json
import asyncio
import httpx
from typing import List, Dict, Any, Optional, Tuple
from app.schemas.assistant import ChatMessage, ChatResponse, ContactAction, ProjectAction

from dotenv import load_dotenv

CONTACT_BUTTONS: List[ContactAction] = [
    ContactAction(
        type="whatsapp",
        label="WhatsApp Directo",
        url="https://wa.me/525578666313?text=Hola%20Erick,%20vi%20tu%20portafolio%20y%20me%20gustar%C3%ADa%20platicar%20sobre%20un%20proyecto"
    ),
    ContactAction(
        type="linkedin",
        label="LinkedIn",
        url="https://www.linkedin.com/in/erickgarcia-ai/"
    ),
    ContactAction(
        type="email",
        label="Enviar Correo",
        url="mailto:e.danielgrz10@gmail.com?subject=Consulta%20desde%20Portafolio"
    )
]

PROJECT_ACTIONS_CATALOG: Dict[str, ProjectAction] = {
    "graphito": ProjectAction(
        id="graphito",
        title="Graphito",
        tagline="Detección inteligente de plagio semántico y similitud en código (Tree-sitter + LoRA)",
        demo_url="https://graphito-escom.vercel.app/",
        github_url="https://github.com/SirDaarick/Graphito",
        action_label="Ver Demo de Graphito"
    ),
    "tetring": ProjectAction(
        id="tetring",
        title="Tetring",
        tagline="Motor combinatorio de satisfacción de restricciones (CSP 42ms) sin empalmes",
        demo_url="https://tetring.vercel.app/",
        github_url="https://github.com/SirDaarick/Tetring",
        action_label="Ver Demo de Tetring"
    ),
    "paidea": ProjectAction(
        id="paidea",
        title="PAIDEA",
        tagline="Arquitectura multi-agente con RAG sobre documentos y rúbricas (ChromaDB)",
        demo_url="https://paidea-reloaded-xi.vercel.app/",
        github_url="https://github.com/SirDaarick/paidea-reloaded",
        action_label="Ver Demo de PAIDEA"
    ),
    "paralel": ProjectAction(
        id="paralel",
        title="Paralel",
        tagline="Motor de IA heurística multihilo en C++ para decisiones en tiempo real (<12ms)",
        demo_url="https://paralel-iota.vercel.app/",
        github_url="https://github.com/SirDaarick/Paralel",
        action_label="Ver Demo de Paralel"
    ),
    "invoicing": ProjectAction(
        id="invoicing",
        title="Extractor de Facturas & Documentos",
        tagline="Extracción OCR multimodal con esquemas matemáticos y validación determinista",
        demo_url="/demo/invoicing",
        action_label="Probar Sandbox de Facturas"
    )
}

def detect_contact_intent(text: str) -> List[ContactAction]:
    """Detecta si la consulta del usuario se relaciona con contactar, contratar, agendar o hablar con Erick."""
    q = text.lower()
    contact_keywords = [
        "contacto", "contactar", "whatsapp", "linkedin", "correo", "email",
        "telefono", "teléfono", "agendar", "llamada", "reunion", "reunión",
        "contratar", "contratacion", "contratación", "precio", "cotizacion",
        "cotización", "cuanto cuesta", "presupuesto", "hablar con erick",
        "trabajar con erick", "escribir a erick", "diagnostico", "diagnóstico"
    ]
    if any(k in q for k in contact_keywords):
        return CONTACT_BUTTONS
    return []

def detect_analogous_project(text: str) -> Optional[ProjectAction]:
    """
    Detecta si el usuario está describiendo un problema técnico u operativo que guarda
    analogía directa con los sistemas creados por Erick.
    """
    q = text.lower()
    
    # 1. Tetring: Horarios, turnos, cuadrantes, empalmes, asignación, combinatoria
    if any(k in q for k in ["horario", "horarios", "turno", "turnos", "empalme", "empalmes", "cuadrante", "cuadrantes", "calendario", "asignacion", "asignación", "rutas", "combinatori", "branch and bound", "csp", "saes"]):
        return PROJECT_ACTIONS_CATALOG["tetring"]

    # 2. Facturas / Invoicing: facturas, tickets, recibos, ocr, albaranes, pdfs contables
    if any(k in q for k in ["factura", "facturas", "recibo", "recibos", "ticket", "tickets", "albaran", "albaranes", "ocr", "comprobante", "sat", "extraer documento", "extraer pdf"]):
        return PROJECT_ACTIONS_CATALOG["invoicing"]

    # 3. PAIDEA: RAG, agentes, soporte, dudas repetitivas, educación, manuales, chromadb
    if any(k in q for k in ["paidea", "soporte", "atencion al cliente", "atención al cliente", "atención", "chatbot", "agente", "agentes", "multiagente", "multi-agente", "faq", "preguntas frecuentes", "dudas", "tutor", "profesor", "alumno", "rubrica", "rúbrica", "rag", "chromadb", "manuales"]):
        return PROJECT_ACTIONS_CATALOG["paidea"]

    # 4. Graphito: Código, similitud, plagio, ast, ofuscación, tree-sitter
    if any(k in q for k in ["graphito", "plagio", "copia", "copias", "trampa", "código", "codigo", "ast", "tree-sitter", "similaridad", "comparar codigo", "ofuscacion", "ofuscado", "graphcodebert"]):
        return PROJECT_ACTIONS_CATALOG["graphito"]

    # 5. Paralel: C++, OpenMP, tiempo real, latencia, multihilo, juegos, simulacion
    if any(k in q for k in ["paralel", "latencia", "baja latencia", "tiempo real", "multihilo", "concurrencia", "c++", "openmp", "speedup", "simulacion", "simulación", "tetris", "minimax"]):
        return PROJECT_ACTIONS_CATALOG["paralel"]

    return None

def enrich_response_actions(response: ChatResponse, query: str) -> ChatResponse:
    """Enriquece una respuesta con botones de contacto y proyectos análogos si no estaban presentes."""
    contact_acts = detect_contact_intent(query) or detect_contact_intent(response.reply)
    if contact_acts and not response.contact_actions:
        response.contact_actions = contact_acts

    proj_act = detect_analogous_project(query) or detect_analogous_project(response.reply)
    if proj_act and not response.project_action:
        response.project_action = proj_act

    return response


def get_env_config() -> Dict[str, str]:
    """Carga dinámicamente las variables de entorno para detectar cambios en .env sin reiniciar."""
    load_dotenv(override=True)
    return {
        "OPENROUTER_API_KEY": os.getenv("OPENROUTER_API_KEY", "").strip(),
        "OPENROUTER_ROUTER_MODEL": os.getenv("OPENROUTER_ROUTER_MODEL", "typesafe/jev-router").strip(),
        "OPENROUTER_CHEAP_MODEL": os.getenv("OPENROUTER_CHEAP_MODEL", "qwen/qwen3.8-27b:free").strip(),
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
Tu personalidad y propósito:
- Eres un Senior AI Solutions Architect y apasionado docente (GDE & MVP style).
- Tu misión es tender un puente pedagógico y honesto entre la alta ingeniería técnica y personas o clientes con o sin conocimiento técnico.
- Tono: Cálido, profesional, pedagógico y directo. En español.
- Filosofía: CONCEPTS > CODE. Una buena solución no es 'meterle IA a todo', sino usar la herramienta adecuada (motores deterministas para números/reglas, LLMs para lenguaje y extracción).
- LÍMITE ESTRICTO DE ALCANCE:
  1. Tu rol está acotado a asesorar sobre los proyectos construidos por Erick (Graphito, Tetring, PAIDEA, Paralel, extractor de facturas), la viabilidad de automatizaciones para empresas/clientes y la consultoría técnica.
  2. NUNCA actúes como un generador de código genérico para tareas personales o externas del usuario (por ejemplo: 'hazme un script para limpiar csv', 'crea un bot de discord', 'resuelve mi tarea escolar').
  3. Si te piden código o scripts para tareas ajenas al portafolio, NIÉGATE amablemente: explica que tu función es evaluar arquitecturas y orientar sobre viabilidad y proyectos de Erick, y redirige a cómo enfocarías ese problema como parte de una solución de automatización profesional o cómo contactar a Erick.
- VINCULACIÓN ANÁLOGA CON PROYECTOS DE ERICK (MANDATORIO):
  Cuando el usuario plantee un problema operativo, técnico o de automatización (ej. optimizar turnos u horarios, procesar facturas/documentos, atender dudas o soporte repetitivo, auditar código o decisiones en tiempo real):
  1. Identifica el proyecto análogo de Erick:
     • Tetring: para problemas combinatorios, horarios, turnos, cuadrantes y rutas con 0 empalmes en 42ms (usando CSP determinista en vez de LLM).
     • Extractor de Facturas: para procesar facturas, tickets y recibos con OCR multimodal + schemas Pydantic deterministas.
     • PAIDEA: para resolver preguntas repetitivas, educación y soporte con RAG contextual sobre ChromaDB y multi-agentes.
     • Graphito: para análisis de código, AST semántico con Tree-sitter y GraphCodeBERT resistente a ofuscación.
     • Paralel: para cuellos de botella de latencia crítica, evaluación de árboles y cómputo paralelo en C++ con OpenMP.
  2. Estructura tu respuesta abordando:
     • CÓMO SE RESOLVIÓ EN EL SISTEMA DE ERICK: Qué reto técnico existía y qué arquitectura concreta se empleó.
     • CÓMO SE APLICARÍA AL CASO DEL USUARIO: Cómo extrapolar ese mismo principio a su proceso, datos o empresa.
     • Concluye invitando a explorar la demo o sandbox del proyecto correspondiente (la interfaz mostrará la tarjeta de acceso).
- CANALES DE CONTACTO DIRECTO:
  Si el usuario pregunta cómo contactar a Erick, contratarlo, agendar una llamada de diagnóstico o pedir cotización, indícale cordialmente que puede escribir directamente vía WhatsApp, LinkedIn o correo electrónico, y que abajo en el chat se le habilitan botones de acceso directo.
- Honestidad radical en viabilidad:
  1. Si alguien pregunta si puede usar un LLM para contabilidad/balances matemáticos: Explícale por qué los LLMs son probabilísticos y NUNCA deben sumar o calcular impuestos directamente. Recomienda una arquitectura híbrida (LLM para extraer los datos + motor Python/SQL para el cálculo matemático exacto).
  2. Si preguntan sobre extracción de documentos, soporte WhatsApp, análisis de código, optimización o agentes: Explica la viabilidad (VIABLE), los retos reales (calidad de datos, latencia, costos) y la arquitectura recomendada.
  3. Si preguntan sobre Erick: Menciona su formación en ESCOM - IPN, sus proyectos (Graphito, Tetring, PAIDEA, Paralel) y su enfoque de ahorro de tiempo y costes mediante automatización a medida.

Respuestas estructuradas:
- Comienza con una respuesta clara y pedagógica.
- Explica el concepto arquitectónico de fondo.
- Termina con sugerencias de preguntas siguientes orientadas a proyectos o consultoría.
"""

def is_out_of_scope(text: str) -> bool:
    """Filtro de seguridad previo: descarta temas no relacionados con software/IA o peticiones de código genérico."""
    q = text.lower()
    patterns = [
        r"\breceta\b", r"\bcocinar\b", r"\bdieta\b",
        r"\bhackear\b", r"\bvulnerar\b", r"\bdos attack\b",
        r"\bremedio\b", r"\bsintomas\b", r"\bmedicamento\b",
        r"\bhoroscopo\b", r"\btarot\b", r"\bfutbol\b", r"\bpartido de hoy\b",
        # Peticiones de scripts o código genérico para tareas personales/externas
        r"\b(hazme|escribe(me)?|crea(me)?|generame|dame)\s+(un\s+)?(script|codigo|programa|bot|tarea)\b",
        r"\b(resuelve|haz)\s+(mi\s+)?(tarea|examen|ejercicio)\b"
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
            "Eres el guardian y enrutador estricto para 'Wiki', el copiloto técnico del portafolio de Erick Daniel (Daarick).\n"
            "ALCANCE PERMITIDO:\n"
            "- Preguntas sobre los proyectos de Erick (Graphito, Tetring, PAIDEA, Paralel, extractor).\n"
            "- Viabilidad de automatizar procesos empresariales (facturas, WhatsApp, CRM, agentes, RAG).\n"
            "- Servicios de consultoría, experiencia y contacto con Erick.\n"
            "- Filosofía de arquitectura de software (CONCEPTS > CODE, motores deterministas vs LLM).\n\n"
            "FUERA DE ALCANCE (OUT_OF_SCOPE):\n"
            "- Peticiones de código o scripts genéricos para tareas externas (ej. 'hazme un script de python', 'escribe un código para limpiar datos', 'resuelve este ejercicio').\n"
            "- Tareas escolares, recetas, medicina, temas personales o ajenos.\n\n"
            "Clasifica la consulta del usuario en una de estas 4 categorías:\n"
            "- OUT_OF_SCOPE: Peticiones de código genérico ajeno al portafolio, tareas escolares o temas no relacionados.\n"
            "- CANON_FAQ: Preguntas directas sobre los proyectos de Erick o contacto.\n"
            "- TIER_HEAVY: Consultas complejas de viabilidad técnica empresarial, arquitecturas híbridas o ROI.\n"
            "- TIER_FAST: Preguntas conceptuales válidas sobre los servicios de Erick, automatización o IA.\n\n"
            "Responde UNICAMENTE en formato JSON: {\"route\": \"CATEGORY\"}"
        )
        payload = {
            "model": router_model,
            "messages": [
                {"role": "system", "content": router_prompt},
                {"role": "user", "content": query}
            ],
            "temperature": 0.0,
            "max_tokens": 150
        }
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                msg = data.get("choices", [{}])[0].get("message", {})
                content = (msg.get("content") or msg.get("refusal") or "").strip()
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

    if any(k in q for k in ["graphito", "plagio", "copia", "copias", "trampa", "código", "codigo", "ast", "tree-sitter", "similaridad", "comparar codigo", "ofuscacion", "ofuscado", "graphcodebert"]):
        proj = KNOWLEDGE_BASE["projects"]["graphito"]
        reply = (
            "**Problema análogo resuelto en Graphito // Detección Semántica de Código (96.8%)**\n\n"
            "**1. Cómo se resolvió en el sistema de Erick:**\n"
            "Detectores tradicionales como JPlag o Moss quedan ciegos cuando alguien altera nombres de variables o intercambia bucles `for` por `while`. "
            "Erick desarrolló **Graphito**, un pipeline que compila código en **Grafos de Flujo de Datos (DFG)** con gramáticas **Tree-sitter** y extrae representaciones vectoriales profundas con **GraphCodeBERT + LoRA**. "
            "Esto permite detectar similitudes algorítmicas genuinas con un **96.8% de precisión** incluso ante código fuertemente ofuscado.\n\n"
            "**2. Cómo se aplicaría a tu problema:**\n"
            "Si necesitas auditar código, detectar duplicidades en grandes bases de repositorios o verificar la originalidad de entregas técnicas, podemos parsear el AST/DFG semántico. "
            "Tu solución dejará de depender de comparaciones superficiales de texto y evaluará la lógica real del código de forma robusta e inmune a cambios cosméticos.\n\n"
            "Explora la arquitectura y demo interactiva con el botón a continuación:"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Cómo funciona Tree-sitter para AST?",
                "💬 ¿Cómo desplegar este modelo en FastAPI?",
                "📋 Ver Demo en vivo de Graphito"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["GraphCodeBERT", "Tree-sitter", "PyTorch", "FastAPI"],
            project_action=PROJECT_ACTIONS_CATALOG["graphito"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    if any(k in q for k in ["tetring", "horario", "horarios", "turno", "turnos", "saes", "empalme", "empalmes", "cuadrante", "cuadrantes", "asignacion", "asignación", "rutas", "combinatori"]):
        proj = KNOWLEDGE_BASE["projects"]["tetring"]
        reply = (
            "**Problema análogo resuelto en Tetring // Optimizador Combinatorio CSP (42ms)**\n\n"
            "**1. Cómo se resolvió en el sistema de Erick:**\n"
            "Organizar horarios o turnos suele parecer una tarea para LLMs, pero un modelo de lenguaje es probabilístico y alucina ante combinatoria dura. "
            "En **Tetring**, Erick desarrolló un motor determinista de **Satisfacción de Restricciones (CSP)** con algoritmos de poda *branch-and-bound*. "
            "El motor evalúa **14,200 combinaciones por segundo**, aplicando restricciones duras (cero empalmes, límites de horas) y blandas (minimizar huecos muertos) para resolver el horario ideal en solo **42 milisegundos**.\n\n"
            "**2. Cómo se aplicaría a tu problema:**\n"
            "Modelamos las reglas de tu negocio (disponibilidad de tu personal, descansos obligatorios por ley, máximos de horas consecutivas o rotación de áreas) "
            "como restricciones CSP en un microservicio en Python o TypeScript. La IA generativa se aprovecha únicamente para recibir las preferencias del equipo en lenguaje natural, mientras el motor determinista calcula la asignación matemática perfecta en segundos y sin riesgo de error humano.\n\n"
            "Puedes probar la demo interactiva en vivo con el botón a continuación:"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Cómo agendar una sesión de diagnóstico?",
                "💬 ¿Qué diferencia hay entre CSP y un LLM?",
                "📋 Ver la demo de Tetring en vivo"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["CSP (Constraint Satisfaction)", "Poda Branch & Bound", "TypeScript / Python", "FastAPI"],
            project_action=PROJECT_ACTIONS_CATALOG["tetring"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    if any(k in q for k in ["paidea", "soporte", "atencion al cliente", "atención al cliente", "atención", "chatbot", "agente", "agentes", "multiagente", "multi-agente", "faq", "preguntas frecuentes", "dudas", "tutor", "profesor", "alumno", "rubrica", "rúbrica", "rag", "chromadb", "manuales"]):
        proj = KNOWLEDGE_BASE["projects"]["paidea"]
        reply = (
            "**Problema análogo resuelto en PAIDEA // Ecosistema Multi-Agente con RAG**\n\n"
            "**1. Cómo se resolvió en el sistema de Erick:**\n"
            "Los profesores universitarios perdían horas contestando una y otra vez las mismas consultas sobre criterios de evaluación. "
            "Erick construyó **PAIDEA**, una plataforma multi-agente (*TecnoBurro*) conectada a una base de conocimiento vectorial en **ChromaDB**. "
            "Mediante recuperación semántica (RAG) y herramientas especializadas (`alumno_tools`), el agente consulta los fragmentos oficiales exactos antes de responder, "
            "alcanzando un **95.4% de precisión** sin alucinaciones y validando archivos entregados de manera automática.\n\n"
            "**2. Cómo se aplicaría a tu problema:**\n"
            "Podemos indexar tus manuales operativos, políticas de servicio, catálogos de productos o bases de conocimiento en una base vectorial. "
            "El agente responderá las dudas repetitivas de tus clientes o colaboradores en WhatsApp o web con fidelidad garantizada (*grounding*), "
            "y si la solicitud requiere ejecutar una acción (como consultar el estado de una orden o generar un ticket), el agente dispara la herramienta hacia tu CRM o ERP.\n\n"
            "Descubre la arquitectura y demo en vivo con el botón inferior:"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Cómo evitar alucinaciones en un RAG?",
                "💬 ¿Es viable conectarlo a WhatsApp oficial?",
                "📋 Ver la demo de PAIDEA en vivo"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["LangChain", "ChromaDB", "FastAPI", "Multi-Agent System", "RAG Grounding"],
            project_action=PROJECT_ACTIONS_CATALOG["paidea"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    if any(k in q for k in ["paralel", "latencia", "baja latencia", "tiempo real", "multihilo", "concurrencia", "c++", "openmp", "speedup", "simulacion", "simulación", "tetris", "minimax", "rendimiento"]):
        proj = KNOWLEDGE_BASE["projects"]["paralel"]
        reply = (
            "**Problema análogo resuelto en Paralel // Motor de IA Heurística en C++ (OpenMP)**\n\n"
            "**1. Cómo se resolvió en el sistema de Erick:**\n"
            "Al evaluar jugadas futuras con lookahead profundo, los bucles en Python provocan explosión combinatoria y bloqueos por el GIL. "
            "Erick implementó **Paralel** directamente en **C++ moderno**, repartiendo la búsqueda en 8 hilos trabajadores con **OpenMP** y poda alfa-beta. "
            "El sistema evalúa **68,000 nodos por segundo** con un **speedup de 7.4x** y latencias menores a 12 milisegundos por decisión.\n\n"
            "**2. Cómo se aplicaría a tu problema:**\n"
            "Si tu sistema tiene cuellos de botella en simulaciones numéricas, cálculo de riesgos o procesamiento masivo de datos en tiempo real, separamos la capa crítica en módulos multihilo optimizados en bajo nivel (C++ / Rust), manteniendo FastAPI y la web como interfaces ágiles sin retrasos.\n\n"
            "Conoce la demo interactiva y el código en el botón inferior:"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Qué es la poda alfa-beta?",
                "💬 ¿Cómo conectar C++ con APIs de Python?",
                "📋 Ver Demo en vivo de Paralel"
            ],
            feasibility_verdict="CASO_DE_ÉXITO",
            tech_recommendations=["C++ Moderno", "OpenMP Multithreading", "FastAPI", "Algoritmos Heurísticos"],
            project_action=PROJECT_ACTIONS_CATALOG["paralel"],
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    if any(k in q for k in ["factura", "facturas", "recibo", "recibos", "ticket", "tickets", "albaran", "albaranes", "ocr", "documento", "documentos", "pdf", "pdfs", "comprobante", "sat"]):
        reply = (
            "**Problema análogo resuelto en el Extractor Inteligente de Facturas y Documentos**\n\n"
            "**1. Cómo se resolvió en el sistema de Erick:**\n"
            "La captura y cotejo manual de facturas y albaranes suele generar errores de digitación y demoras en cuentas por pagar. "
            "Erick diseñó un pipeline de extracción estructurada que combina **modelos multimodales de visión / OCR** con esquemas de validación estricta en **Pydantic**. "
            "El sistema extrae emisor, RFC, ítems y totales, pero los cálculos matemáticos (subtotal, IVA, retenciones) se recalculan con código determinista para garantizar cero errores contables.\n\n"
            "**2. Cómo se aplicaría a tu problema:**\n"
            "Configuramos un pipeline que reciba automáticamente tus PDFs o imágenes (vía correo o carpeta compartida), extraiga la información estructurada en segundos, "
            "valide las sumas y las coteje contra tus órdenes de compra en tu base de datos o ERP, alertando a tu equipo únicamente cuando exista una discrepancia real.\n\n"
            "Puedes probar el sandbox interactivo de facturas aquí mismo en el portafolio:"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Cómo agendar una sesión de diagnóstico?",
                "💬 ¿Por qué no dejar que el LLM sume los totales?",
                "📋 Probar el Sandbox de Facturas en vivo"
            ],
            feasibility_verdict="ALTA_VIABILIDAD",
            tech_recommendations=["FastAPI", "Vision Models / OCR", "Pydantic Schemas", "PostgreSQL"],
            project_action=PROJECT_ACTIONS_CATALOG["invoicing"],
            source="local_knowledge_engine",
            strategy="feasibility_eval"
        )

    if any(k in q for k in ["contacto", "contratar", "precio", "cuanto cuesta", "agendar", "correo", "telefono", "teléfono", "whatsapp", "llamada", "reunion", "reunión"]):
        reply = (
            "**¿Listo para automatizar tus procesos o evaluar un proyecto con Erick?**\n\n"
            "El proceso de colaboración técnica es ágil, transparente y directo:\n"
            "1. **Diagnóstico inicial sin costo:** Evaluamos tus cuellos de botella operativos, volumen de datos y stack actual.\n"
            "2. **Propuesta técnica & arquitectura:** Definimos la solución óptima (motores deterministas, RAG o agentes), tiempos de entrega y presupuesto exacto.\n"
            "3. **Entrega iterativa:** Demos funcionales probadas desde las primeras semanas con métricas claras de ahorro de tiempo.\n\n"
            "Puedes iniciar contacto inmediato a través de los botones directos que aparecen a continuación (WhatsApp, LinkedIn o Correo):"
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "✦ ¿Es viable automatizar mi soporte o facturas?",
                "💬 Ver demos interactivas en vivo",
                "📋 ¿Qué proyectos ha creado Erick?"
            ],
            contact_actions=CONTACT_BUTTONS,
            source="local_knowledge_engine",
            strategy="predefined_canon"
        )

    reply = (
        f"Analizando tu consulta: *\"{latest_msg}\"*.\n\n"
        "Desde la perspectiva de arquitectura de IA, cualquier solución debe evaluarse por su **viabilidad técnica**, **fidelidad de datos** y **retorno de inversión**.\n\n"
        "¿Te gustaría que evaluemos cómo aplicar una arquitectura de IA a un caso de uso particular (por ejemplo, procesamiento de documentos, agentes de soporte, o sincronización de bases de datos), o prefieres conocer los detalles de alguno de los proyectos de Erick?"
    )
    res = ChatResponse(
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
    return enrich_response_actions(res, latest_msg)

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

    # 3. Filtro de Alcance (Out-of-Scope Heurístico)
    if is_out_of_scope(latest_text):
        is_code = any(k in latest_text.lower() for k in ["codigo", "script", "programa", "bot", "tarea", "hazme", "escribe un", "generame", "ayudame a crear", "ayudame a generar"])
        if is_code:
            reply = (
                "**Límite de alcance del asistente:**\n\n"
                "Como copiloto especializado en el portafolio y consultoría de **Erick Daniel**, mi función no es actuar "
                "como un generador de código genérico ni resolver scripts o ejercicios externos.\n\n"
                "Mi especialidad es **evaluar la viabilidad técnica y arquitectura de automatizaciones empresariales**, "
                "explicar los proyectos que Erick ha desarrollado ([Graphito](https://graphito-escom.vercel.app/), "
                "[Tetring](https://tetring.vercel.app/), [PAIDEA](https://paidea-reloaded-xi.vercel.app/), "
                "[Paralel](https://paralel-iota.vercel.app/)) y ayudarte a estructurar soluciones confiables y medibles.\n\n"
                "Si buscas evaluar la arquitectura técnica para procesar datos, integrar APIs o automatizar flujos "
                "de negocio con Erick, con gusto podemos analizarlo."
            )
            suggestions = [
                "✦ ¿Cómo evaluar la viabilidad de mi automatización?",
                "💬 Ver los proyectos desarrollados por Erick",
                "📋 ¿Qué tipo de soluciones construye Erick?",
                "⚡ ¿Cómo agendar una sesión de diagnóstico?"
            ]
        else:
            reply = (
                "**Fuera de alcance del sistema:**\n\n"
                "Mi rol como **Wiki** está enfocado exclusivamente en **ingeniería de software, "
                "sistemas de inteligencia artificial y automatización de procesos** para el portafolio de Erick Daniel.\n\n"
                "¿Te gustaría consultar sobre viabilidad de IA para un negocio o conocer proyectos como Graphito o Tetring?"
            )
            suggestions = [
                "✦ ¿Qué proyectos ha desarrollado Erick?",
                "💬 ¿Es viable automatizar mi empresa?",
                "⚡ ¿Cómo agendar una llamada de diagnóstico?"
            ]

        return ChatResponse(
            reply=reply,
            suggestions=suggestions,
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
        is_code = any(k in latest_text.lower() for k in ["codigo", "script", "programa", "bot", "tarea", "hazme", "escribe un", "generame", "ayudame a crear", "ayudame a generar"])
        if is_code:
            reply = (
                "**Límite de alcance del asistente:**\n\n"
                "Como copiloto especializado en el portafolio y consultoría de **Erick Daniel**, mi función no es actuar "
                "como un generador de código genérico ni resolver scripts o ejercicios externos.\n\n"
                "Mi especialidad es **evaluar la viabilidad técnica y arquitectura de automatizaciones empresariales**, "
                "explicar los proyectos que Erick ha desarrollado ([Graphito](https://graphito-escom.vercel.app/), "
                "[Tetring](https://tetring.vercel.app/), [PAIDEA](https://paidea-reloaded-xi.vercel.app/), "
                "[Paralel](https://paralel-iota.vercel.app/)) y ayudarte a estructurar soluciones confiables y medibles.\n\n"
                "Si buscas evaluar la arquitectura técnica para procesar datos, integrar APIs o automatizar flujos "
                "de negocio con Erick, con gusto podemos analizarlo."
            )
            suggestions = [
                "✦ ¿Cómo evaluar la viabilidad de mi automatización?",
                "💬 Ver los proyectos desarrollados por Erick",
                "📋 ¿Qué tipo de soluciones construye Erick?",
                "⚡ ¿Cómo agendar una sesión de diagnóstico?"
            ]
        else:
            reply = (
                "**Fuera de alcance del sistema:**\n\n"
                "Mi rol como **Wiki** está enfocado exclusivamente en **ingeniería de software, "
                "sistemas de inteligencia artificial y automatización de procesos** para el portafolio de Erick Daniel.\n\n"
                "¿Te gustaría consultar sobre viabilidad de IA para un negocio o conocer proyectos como Graphito o Tetring?"
            )
            suggestions = [
                "✦ ¿Qué proyectos ha desarrollado Erick?",
                "💬 ¿Es viable automatizar mi empresa?",
                "⚡ ¿Cómo agendar una llamada de diagnóstico?"
            ]

        return ChatResponse(
            reply=reply,
            suggestions=suggestions,
            source="router_jev",
            strategy="out_of_scope"
        )
    elif router_verdict == "TIER_HEAVY":
        needs_heavy = True

    # 5. TIER A: Razonamiento Complejo (Gemini Pro - Google AI Pro directo)
    if needs_heavy:
        heavy_reply, heavy_source = await call_gemini_heavy(messages, canonical_context=canonical_context)
        if heavy_reply:
            res = ChatResponse(
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
            return enrich_response_actions(res, latest_text)

    # 6. TIER B: Pregunta ágil / Asesoría directa (Gemini Flash - Google AI Pro directo)
    # Aprovecha la suscripción Google AI Pro para velocidad (<400ms) y costo cero en OpenRouter
    fast_reply, fast_source = await call_gemini_fast(messages, canonical_context=canonical_context)
    if fast_reply:
        res = ChatResponse(
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
        return enrich_response_actions(res, latest_text)

    # 7. TIER C: Respaldo garantizado: Motor Semántico Local de Alta Fidelidad (0 tokens, 100% determinista)
    return enrich_response_actions(generate_local_response(messages), latest_text)

async def stream_chat_sse(request_data: Dict[str, Any]):
    """
    Generador asíncrono para Server-Sent Events (SSE).
    Ejecuta el pipeline de procesamiento de Wiki y emite la respuesta progresivamente.
    Para respuestas premeditadas (motor determinista local, FAQs canónicas o filtros
    de alcance), emite los fragmentos con una pausa natural (15-20ms) de modo que la
    experiencia de lectura sea fluida e indistinguible de un modelo generativo en vivo.
    """
    try:
        response = await process_chat(request_data)
        reply_text = response.reply

        # Fragmentamos en tokens respetando espacios y saltos de línea
        tokens = re.split(r'(\s+)', reply_text)
        
        buffer = ""
        for i, token in enumerate(tokens):
            buffer += token
            # Emitir en bloques de palabra o al final
            if token.strip() or i == len(tokens) - 1:
                data_obj = {"token": buffer}
                yield f"data: {json.dumps(data_obj, ensure_ascii=False)}\n\n"
                buffer = ""
                await asyncio.sleep(0.018)

        if buffer:
            data_obj = {"token": buffer}
            yield f"data: {json.dumps(data_obj, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.018)

        # Evento final con metadatos completos y sugerencias
        final_data = {
            "done": True,
            "reply": reply_text,
            "suggestions": response.suggestions,
            "feasibility_verdict": response.feasibility_verdict,
            "tech_recommendations": response.tech_recommendations,
            "source": response.source,
            "strategy": response.strategy,
            "contact_actions": [c.model_dump() for c in response.contact_actions] if response.contact_actions else [],
            "project_action": response.project_action.model_dump() if response.project_action else None
        }
        yield f"data: {json.dumps(final_data, ensure_ascii=False)}\n\n"
    except Exception as e:
        err_data = {
            "error": True,
            "detail": str(e)
        }
        yield f"data: {json.dumps(err_data, ensure_ascii=False)}\n\n"

