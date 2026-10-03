from fastapi import APIRouter, HTTPException
from app.schemas.assistant import ChatRequest, ChatResponse
from app.services.assistant_engine import process_chat, GEMINI_API_KEY

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest):
    """
    Endpoint interactivo para el Agente Copiloto de IA (Daarick Assistant).
    Resuelve consultas sobre proyectos, trayectoria de Erick y evalúa
    la viabilidad técnica de ideas de automatización.
    """
    try:
        response = await process_chat(request.model_dump())
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor del asistente: {str(e)}")

@router.get("/status")
async def assistant_status():
    """Retorna el estado de disponibilidad del copiloto y el motor activo."""
    return {
        "status": "online",
        "agent": "Daverick Assistant",
        "version": "2.4.0",
        "engine": "gemini-1.5-flash" if GEMINI_API_KEY else "local-semantic-engine",
        "capabilities": [
            "project_explainer",
            "feasibility_assessment",
            "architecture_recommendations",
            "contact_orchestration"
        ]
    }
