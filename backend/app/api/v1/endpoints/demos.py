from fastapi import APIRouter, HTTPException, Request
from app.schemas.demo import DemoRunRequest, DemoRunResponse, DemoTelemetry
import time

router = APIRouter()

DEMO_FALLBACK_DATABASE = {
    "triage": {
        "time": "1.12s",
        "accuracy": "98.4%",
        "tokens": "420",
        "category": "SOPORTE_FINANCIERO / FACTURACIÓN_DISCREPANCIA",
        "priority": "P1 - ALTA / ACCIÓN INMEDIATA",
        "actions": [
            "✓ Identificada discrepancia de 15% contractual en base de datos PostgreSQL.",
            "✓ Ticket creado en ERP con categoría FINANZAS_CORRECTIVA_AUTO.",
            "✓ Respuesta borrador generada y enviada a revisión con abono propuesto de 420.00 €."
        ],
        "output_data": {
            "ticket_id": "TICKET-0718492",
            "routing_queue": "finanzas_tier2",
            "sla_remaining_minutes": 15
        }
    },
    "invoicing": {
        "time": "1.45s",
        "accuracy": "99.8%",
        "tokens": "680",
        "category": "CONTABILIDAD / EXTRACCIÓN_FISCAL",
        "priority": "P2 - PRIORIDAD ESTÁNDAR",
        "actions": [
            "✓ NIF emisor B-84920394 verificado en registro mercantil.",
            "✓ Importe total de 4.500,00 € cuadrado al céntimo con desglose de impuestos.",
            "✓ Asiento pre-contable generado y enviado a cola de sincronización ERP."
        ],
        "output_data": {
            "cif": "B-84920394",
            "base_imponible": 3719.01,
            "iva_21": 780.99,
            "total": 4500.00,
            "estado": "VALIDADO_CON_OC_9012"
        }
    },
    "inventory": {
        "time": "0.42s",
        "accuracy": "100%",
        "tokens": "185",
        "category": "LOGÍSTICA / GESTIÓN_PREVENTIVA_ROTURA",
        "priority": "P3 - OPERATIVO ESTÁNDAR",
        "actions": [
            "✓ 1.250 SKUs recalculados con modelo de predicción estacional.",
            "✓ 3 productos en MAD-01 con riesgo de rotura identificados en 36h.",
            "✓ Orden de reposición automática despachada al proveedor primario vía Webhook."
        ],
        "output_data": {
            "skus_evaluados": 1250,
            "alertas_activas": 1,
            "proveedor_notificado": "true"
        }
    }
}

@router.post("/{slug}/run", response_model=DemoRunResponse)
async def run_demo(slug: str, payload: DemoRunRequest):
    start = time.time()
    if slug not in DEMO_FALLBACK_DATABASE:
        raise HTTPException(status_code=404, detail=f"Demo '{slug}' no encontrada.")

    data = DEMO_FALLBACK_DATABASE[slug]
    elapsed_ms = int((time.time() - start) * 1000) + 120

    return DemoRunResponse(
        status="success",
        project_slug=slug,
        execution_time_ms=elapsed_ms,
        telemetry=DemoTelemetry(
            time=data["time"],
            accuracy=data["accuracy"],
            tokens=data["tokens"],
            category=data["category"],
            priority=data["priority"],
            actions=data["actions"],
        ),
        is_simulated=True,
        output_data=data["output_data"]
    )
