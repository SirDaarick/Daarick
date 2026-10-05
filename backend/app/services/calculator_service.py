"""
Servicio determinista de cálculo de cotizaciones y retorno de inversión en Python.
Sincronizado idénticamente con calculatorEngine.ts para garantizar verdad única.
"""
from typing import List, Dict, Any, Optional
from app.schemas.calculator import (
    ClientBleedInputsSchema,
    DeveloperConfigSchema,
    QuoteResponse,
    MonthProjectionSchema,
    AutomationItemSchema
)

CATALOG: List[AutomationItemSchema] = [
    AutomationItemSchema(
        id="ai-sales-bot",
        name="Asistente de Ventas & Calificación 24/7 (WhatsApp/Web)",
        tagline="Responde dudas, filtra prospectos y agenda reuniones sin intervención humana",
        category="atencion",
        base_hours_first_time=24,
        reusable_discount_hours=6,
        description="Atención conversacional empática con memoria de contexto y agendado.",
        popular=True
    ),
    AutomationItemSchema(
        id="doc-extractor-ocr",
        name="Extractor Inteligente de Facturas, Recibos & Tickets",
        tagline="Lectura visual con IA a Excel o base de datos con verificación matemática",
        category="extraccion",
        base_hours_first_time=28,
        reusable_discount_hours=8,
        description="Elimina la captura manual de tickets y facturas PDF/JPG validando totales.",
        popular=True
    ),
    AutomationItemSchema(
        id="calendar-sync",
        name="Agendador Determinista & Recordatorios Anti-Inasistencias",
        tagline="Sincronización en tiempo real con Google Calendar y avisos preventivos",
        category="gestion",
        base_hours_first_time=16,
        reusable_discount_hours=4,
        description="Evita choques de horarios y confirma asistencia por WhatsApp 2 horas antes."
    ),
    AutomationItemSchema(
        id="debtor-recovery",
        name="Auditoría de Cobranza & Avisos Preventivos a Clientes",
        tagline="Seguimiento automatizado de pagos pendientes con tono amable y profesional",
        category="operacion",
        base_hours_first_time=18,
        reusable_discount_hours=5,
        description="Acelera el flujo de caja enviando estados de cuenta sin fricciones."
    ),
    AutomationItemSchema(
        id="crm-sheets-sync",
        name="Integración Webhooks & Sincronización ERP / Google Sheets",
        tagline="Conexión bidireccional entre formularios, pagos y hojas de cálculo sin fallos",
        category="operacion",
        base_hours_first_time=14,
        reusable_discount_hours=4,
        description="Cada venta se refleja de inmediato eliminando errores de transcripción."
    ),
    AutomationItemSchema(
        id="support-ticket-bot",
        name="Agente Autónomo de Soporte Nivel 1 & Preguntas Frecuentes",
        tagline="Resuelve el 80% de las consultas rutinarias de clientes al instante",
        category="atencion",
        base_hours_first_time=22,
        reusable_discount_hours=6,
        description="Guía al cliente paso a paso ante dudas técnicas o comerciales comunes."
    ),
    AutomationItemSchema(
        id="churn-alert-system",
        name="Radar de Retención & Reactivación de Clientes Inactivos",
        tagline="Detecta cuentas que están dejando de comprar y lanza ofertas de reactivación",
        category="gestion",
        base_hours_first_time=20,
        reusable_discount_hours=5,
        description="Analiza la frecuencia de compra de tu clientela y detona mensajes preventivos."
    )
]

CATALOG_BY_ID = {item.id: item for item in CATALOG}

def calculate_quote(
    selected_ids: List[str],
    bleed: Optional[ClientBleedInputsSchema] = None,
    dev_config: Optional[DeveloperConfigSchema] = None,
    currency: str = "MXN"
) -> QuoteResponse:
    if dev_config is None:
        dev_config = DeveloperConfigSchema()

    if bleed is None:
        if currency == "MXN":
            bleed = ClientBleedInputsSchema(
                lost_hours_per_week=12.0,
                hourly_labor_cost=200.0,
                average_ticket_value=3500.0,
                monthly_leads_or_clients=40,
                lost_clients_percentage=20.0,
                human_errors_monthly_cost=3000.0
            )
        else:
            bleed = ClientBleedInputsSchema(
                lost_hours_per_week=12.0,
                hourly_labor_cost=18.0,
                average_ticket_value=250.0,
                monthly_leads_or_clients=40,
                lost_clients_percentage=20.0,
                human_errors_monthly_cost=200.0
            )

    # Tarifa horaria efectiva en la divisa elegida
    currency_rate = dev_config.exchange_rate_usd_to_mxn if currency == "MXN" else 1.0
    effective_hourly_rate = dev_config.erick_hourly_rate * currency_rate
    effective_min_retainer = dev_config.min_monthly_retainer * currency_rate

    # Módulo 1: Costo Técnico Piso
    selected_items = [CATALOG_BY_ID[item_id] for item_id in selected_ids if item_id in CATALOG_BY_ID]
    total_automation_hours = sum(item.base_hours_first_time for item in selected_items)
    platform_and_pm_hours = (dev_config.platform_base_hours + dev_config.meetings_and_pm_hours) if selected_items else 0
    total_project_hours = total_automation_hours + platform_and_pm_hours
    technical_floor_cost = total_project_hours * effective_hourly_rate

    # Módulo 2: Fuga Financiera (Nativo en la moneda)
    monthly_time_loss = bleed.lost_hours_per_week * 4.333 * bleed.hourly_labor_cost
    lost_pct = max(0.0, min(100.0, bleed.lost_clients_percentage)) / 100.0
    monthly_sales_loss = bleed.monthly_leads_or_clients * bleed.average_ticket_value * lost_pct
    total_monthly_bleed = monthly_time_loss + monthly_sales_loss + bleed.human_errors_monthly_cost
    total_annual_bleed = total_monthly_bleed * 12.0

    # Módulo 3: Value-Based Pricing
    annual_recovered_benefit = total_annual_bleed * 0.75
    monthly_recovered_benefit = annual_recovered_benefit / 12.0

    value_priced_setup = annual_recovered_benefit * dev_config.value_capture_percentage
    recommended_setup_price = max(technical_floor_cost, value_priced_setup)

    calculated_retainer = recommended_setup_price * 0.08
    recommended_monthly_retainer = max(effective_min_retainer, calculated_retainer) if selected_items else 0.0

    year_one_total_investment = recommended_setup_price + (recommended_monthly_retainer * 12.0)
    year_one_net_savings = max(0.0, annual_recovered_benefit - year_one_total_investment)

    roi_percentage = int(round(((annual_recovered_benefit - year_one_total_investment) / year_one_total_investment) * 100.0)) if year_one_total_investment > 0 else 0

    net_monthly_gain = monthly_recovered_benefit - recommended_monthly_retainer
    payback_months = round(recommended_setup_price / net_monthly_gain, 1) if net_monthly_gain > 0 else 12.0
    payback_days = max(1, int(round(payback_months * 30.4)))

    # Proyección a 12 meses
    monthly_breakdown: List[MonthProjectionSchema] = []
    cumulative_loss = 0.0
    cumulative_inv = recommended_setup_price
    cumulative_ben = 0.0

    for m in range(1, 13):
        cumulative_loss += total_monthly_bleed
        cumulative_inv += recommended_monthly_retainer
        cumulative_ben += monthly_recovered_benefit
        monthly_breakdown.append(MonthProjectionSchema(
            month=m,
            cumulative_cost_without_automation=round(cumulative_loss, 0),
            cumulative_investment_with_automation=round(cumulative_inv, 0),
            cumulative_benefit_with_automation=round(cumulative_ben, 0),
            net_profit=round((cumulative_ben - cumulative_inv), 0)
        ))

    return QuoteResponse(
        selected_automation_count=len(selected_items),
        total_automation_hours=total_automation_hours,
        platform_and_pm_hours=platform_and_pm_hours,
        total_project_hours=total_project_hours,
        technical_floor_cost=round(technical_floor_cost, 0),
        monthly_time_loss_cost=round(monthly_time_loss, 0),
        monthly_sales_loss_cost=round(monthly_sales_loss, 0),
        total_monthly_bleed=round(total_monthly_bleed, 0),
        total_annual_bleed=round(total_annual_bleed, 0),
        annual_recovered_benefit=round(annual_recovered_benefit, 0),
        recommended_setup_price=round(recommended_setup_price, 0),
        recommended_monthly_retainer=round(recommended_monthly_retainer, 0),
        year_one_total_investment=round(year_one_total_investment, 0),
        year_one_net_savings=round(year_one_net_savings, 0),
        roi_percentage=roi_percentage,
        payback_months=payback_months,
        payback_days=payback_days,
        currency=currency,
        monthly_breakdown=monthly_breakdown
    )
