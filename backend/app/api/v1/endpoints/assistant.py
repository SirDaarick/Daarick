from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services.assistant_engine import (
    process_chat,
    stream_chat_sse,
    OPENROUTER_API_KEY,
    OPENROUTER_CHEAP_MODEL,
    OPENROUTER_ROUTER_MODEL,
    GEMINI_API_KEY,
    GEMINI_FAST_MODEL,
    GEMINI_HEAVY_MODEL
)

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest):
    """
    Endpoint interactivo para 'Wiki', el copiloto técnico del portafolio.
    Aplica arquitectura Multi-Tier:
    - Tier 1: Router de decisión (Jev / System One)
    - Tier 2A: Modelo ágil para consultas simples y reescritura guiada (Gemini Flash vía Google AI Pro)
    - Tier 2B: Modelo pesado para razonamiento profundo de arquitectura (Gemini Pro vía Google AI Pro)
    - Tier 3: Motor semántico determinista local de respaldo garantizado (0 costo, 100% fidelidad)
    """
    try:
        response = await process_chat(request.model_dump())
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor de Wiki: {str(e)}")

@router.post("/chat/stream")
async def chat_interaction_stream(request: ChatRequest):
    """
    Endpoint interactivo con Server-Sent Events (SSE) para 'Wiki'.
    Transmite la respuesta token a token en tiempo real.
    Si la respuesta es premeditada (respuestas deterministas locales o de alcance),
    se transmite poco a poco para mantener una experiencia uniforme e indistinguible.
    """
    try:
        return StreamingResponse(
            stream_chat_sse(request.model_dump()),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el stream de Wiki: {str(e)}")

@router.get("/status")
async def assistant_status():
    """Retorna el estado de disponibilidad de Wiki y la configuración multi-tier activa."""
    return {
        "status": "online",
        "agent": "Wiki",
        "version": "3.1.0",
        "architecture": "multi_tier_google_ai_pro",
        "google_ai_pro": {
            "configured": bool(GEMINI_API_KEY),
            "fast_model": GEMINI_FAST_MODEL,
            "heavy_model": GEMINI_HEAVY_MODEL
        },
        "openrouter": {
            "configured": bool(OPENROUTER_API_KEY),
            "router_model": OPENROUTER_ROUTER_MODEL,
            "cheap_model": OPENROUTER_CHEAP_MODEL
        },
        "local_fallback": "active_guaranteed",
        "capabilities": [
            "anti_biblia_shield",
            "sliding_window_memory",
            "out_of_scope_guardrail",
            "grounded_rewriting",
            "multi_tier_model_routing"
        ]
    }
