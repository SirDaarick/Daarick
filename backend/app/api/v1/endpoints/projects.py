from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

PROJECTS_CATALOG = [
    {
        "id": "PRJ-01",
        "slug": "triage",
        "title": "Triaje Inteligente de Solicitudes",
        "short_desc": "Clasifica y enruta tickets en 1.2s reduciendo escalados en un 78%.",
        "status": "DEMO DISPONIBLE",
        "tags": ["FastAPI", "Agentes IA", "Celery"],
        "metric_primary": "98.4% Precisión"
    },
    {
        "id": "PRJ-02",
        "slug": "invoicing",
        "title": "Extractor Documental & Facturas",
        "short_desc": "Parsea albaranes y facturas PDF sincronizando con ERP en menos de 2s.",
        "status": "DEMO OPERATIVA",
        "tags": ["Python", "OCR Multimodal", "PostgreSQL"],
        "metric_primary": "99.8% Extracción"
    },
    {
        "id": "PRJ-03",
        "slug": "inventory",
        "title": "Agente Conciliador de Inventario",
        "short_desc": "Detecta discrepancias de stock físico en tiempo real emitiendo alertas preventivas.",
        "status": "EN PRODUCCIÓN",
        "tags": ["FastAPI", "Redis Streams", "Webhooks"],
        "metric_primary": "100% Sin Desajustes"
    }
]

@router.get("", response_model=List[Dict[str, Any]])
async def list_projects():
    return PROJECTS_CATALOG
