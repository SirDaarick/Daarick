"""
Endpoint FastAPI para la Calculadora de Cotización y Retorno de Inversión (ROI).
"""
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.calculator import QuoteRequest, QuoteResponse, AutomationItemSchema
from app.services.calculator_service import calculate_quote, CATALOG

router = APIRouter()

@router.get("/catalog", response_model=List[AutomationItemSchema], summary="Obtener catálogo de automatizaciones")
async def get_catalog():
    """Retorna los módulos de automatización disponibles con sus horas estimadas."""
    return CATALOG

@router.post("/quote", response_model=QuoteResponse, summary="Calcular cotización y ROI determinista")
async def generate_quote(payload: QuoteRequest):
    """
    Calcula el costo técnico piso, la fuga financiera del cliente y el precio basado en valor con ROI a 12 meses.
    """
    try:
        quote = calculate_quote(
            selected_ids=payload.selected_automation_ids,
            bleed=payload.bleed_inputs,
            dev_config=payload.dev_config,
            currency=payload.currency
        )
        return quote
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al calcular cotización: {str(e)}"
        )
