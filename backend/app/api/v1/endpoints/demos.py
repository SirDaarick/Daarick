from fastapi import APIRouter, HTTPException, Request
from app.schemas.demo import DemoRunRequest, DemoRunResponse, DemoTelemetry
import time

router = APIRouter()

DEMO_FALLBACK_DATABASE = {
    "graphito": {
        "time": "180ms",
        "accuracy": "96.8%",
        "tokens": "412",
        "category": "INTEGRIDAD_ACADÉMICA / DEEP_LEARNING_CODE",
        "priority": "ALTA_COINCIDENCIA (94.7%)",
        "actions": [
            "✓ Generado Data Flow Graph (DFG) con 84 aristas de dependencia semántica.",
            "✓ Similitud estructural detectada a pesar de renombrado de variables y cambio de bucles.",
            "✓ Reporte de auditoría generado con mapa de calor de tensores de atención."
        ],
        "output_data": {
            "dfg_nodes": 84,
            "stylometry_score": 0.892,
            "semantic_similarity": 0.947,
            "verdict": "PLAGIARISM_CONFIRMED"
        }
    },
    "tetring": {
        "time": "42ms",
        "accuracy": "100%",
        "tokens": "0 (Motor CSP)",
        "category": "OPTIMIZACIÓN_COMBINATORIA / PLANIFICACIÓN_ACADÉMICA",
        "priority": "HORARIO_ÓPTIMO_GENERADO",
        "actions": [
            "✓ Evaluadas 14,200 combinaciones posibles sin superposición horaria.",
            "✓ Asignación de materias distribuidas de lunes a viernes sin huecos de más de 60m.",
            "✓ Exportación de horario lista para descarga en PDF y calendario iCal."
        ],
        "output_data": {
            "evaluations_per_second": 14200,
            "conflicts": 0,
            "gap_minimization": 0.92,
            "status": "OPTIMAL_SCHEDULE_FOUND"
        }
    },
    "paidea": {
        "time": "1.22s",
        "accuracy": "95.4%",
        "tokens": "580",
        "category": "SISTEMA_MULTI_AGENTE / ASISTENCIA_PEDAGÓGICA",
        "priority": "CONSULTA_RESUELTA_CON_ÉXITO",
        "actions": [
            "✓ Búsqueda vectorial semántica ejecutada en ChromaDB (k=3 fragmentos relevantes).",
            "✓ Invocada herramienta alumno_tools para contrastar formato de entrega ZIP.",
            "✓ Generada respuesta estructurada con desglose de puntos por sección de la rúbrica."
        ],
        "output_data": {
            "agent": "tecno_burro",
            "rag_chunks_retrieved": 3,
            "tools_invoked": ["alumno_tools.validar_requisitos_entrega"],
            "resolution": "RESOLVED"
        }
    },
    "paralel": {
        "time": "8.4ms",
        "accuracy": "99.2%",
        "tokens": "0 (Native Parallel C++)",
        "category": "COMPUTACIÓN_PARALELA / IA_HEURÍSTICA",
        "priority": "DECISIÓN_ÓPTIMA_EJECUTADA",
        "actions": [
            "✓ Repartición de 8 rotaciones posibles en 8 núcleos de CPU vía OpenMP.",
            "✓ Poda de ramas con pérdida de juego garantizada en profundidad 2.",
            "✓ Movimiento óptimo ejecutado con latencia menor a 10 milisegundos."
        ],
        "output_data": {
            "speedup": "7.4x",
            "nodes_per_sec": 68000,
            "chosen_rotation": 2,
            "chosen_column": 4
        }
    },
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
