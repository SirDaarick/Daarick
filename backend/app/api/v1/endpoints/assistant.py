"""
Endpoints de la API para el asistente Wiki y el agendado de citas con Google Calendar.
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.schemas.assistant import ChatRequest, ChatResponse, BookSlotRequest, BookSlotResponse
from app.services.assistant.orchestrator import orchestrate_wiki_turn, stream_wiki_sse
from app.services.calendar_service import calendar_service

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_interaction(request: ChatRequest, req: Request):
    """Endpoint directo para interacción no-stream con Wiki."""
    try:
        http_client = req.app.state.http_client
        response = await orchestrate_wiki_turn(http_client, request.messages)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al procesar la respuesta.")

@router.post("/chat/stream")
async def chat_interaction_stream(request: ChatRequest, req: Request):
    """
    Endpoint interactivo con Server-Sent Events (SSE).
    Transmite el texto token por token en tiempo real y finaliza con las acciones resueltas.
    """
    try:
        http_client = req.app.state.http_client
        return StreamingResponse(
            stream_wiki_sse(http_client, request.messages),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al iniciar la transmisión de chat.")

@router.get("/availability")
async def get_booking_availability(req: Request):
    """Retorna los próximos huecos de agenda disponibles en Google Calendar."""
    try:
        http_client = req.app.state.http_client
        slots = await calendar_service.get_available_slots(http_client, max_slots=6)
        return {"slots": slots}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al consultar disponibilidad.")

@router.post("/book", response_model=BookSlotResponse)
async def book_calendar_slot(request: BookSlotRequest, req: Request):
    """
    Reserva un hueco en Google Calendar y crea la reunión en Google Meet.
    Incluye protección contra honeypot y verificación determinista de disponibilidad.
    """
    # 1. Filtro anti-bots honeypot
    if request.honeypot:
        return BookSlotResponse(success=True, message="Solicitud recibida.")

    try:
        http_client = req.app.state.http_client
        res = await calendar_service.create_calendar_event(
            client=http_client,
            start_iso=request.start_iso,
            end_iso=request.end_iso,
            client_name=request.client_name,
            client_email=request.client_email,
            need_summary=request.need_summary or ""
        )
        return BookSlotResponse(
            success=res.get("success", False),
            message=res.get("message", ""),
            event_id=res.get("event_id"),
            meet_link=res.get("meet_link")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo completar la reservación: {str(e)}")

@router.get("/status")
async def assistant_status():
    """Retorna el estado de operatividad de Wiki."""
    return {
        "status": "online",
        "agent": "Wiki",
        "version": "2.0.0",
        "calendar_connected": calendar_service.is_configured()
    }
