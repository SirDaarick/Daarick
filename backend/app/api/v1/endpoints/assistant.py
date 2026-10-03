from fastapi import APIRouter, HTTPException
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services.assistant_engine import (
    process_chat,
    OPENROUTER_API_KEY,
    OPENROUTER_CHEAP_MODEL,
    OPENROUTER_ROUTER_MODEL,
    GEMINI_API_KEY,
    GEMINI_HEAVY_MODEL
)

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest):
    """
    Endpoint interactivo para 'Wiki', el copiloto técnico del portafolio.
    Aplica arquitectura Multi-Tier:
    - Tier 1: Router de decisión (Jev / System One)
    - Tier 2A: Modelo económico para consultas simples y reescritura guiada (OpenRouter)
    - Tier 2B: Modelo pesado para razonamiento profundo de arquitectura (Gemini Pro)
    - Tier 3: Motor semántico determinista local de respaldo garantizado
    """
    try:
        response = await process_chat(request.model_dump())
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor de Wiki: {str(e)}")

@router.get("/status")
async def assistant_status():
    """Retorna el estado de disponibilidad de Wiki y la configuración multi-tier activa."""
    return {
        "status": "online",
        "agent": "Wiki",
        "version": "3.0.0",
        "architecture": "multi_tier_router",
        "openrouter": {
            "configured": bool(OPENROUTER_API_KEY),
            "router_model": OPENROUTER_ROUTER_MODEL,
            "cheap_model": OPENROUTER_CHEAP_MODEL
        },
        "gemini_heavy": {
            "configured": bool(GEMINI_API_KEY),
            "model": GEMINI_HEAVY_MODEL
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
