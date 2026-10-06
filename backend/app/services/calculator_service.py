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
        name="Asistente de WhatsApp que Atiende y Vende 24/7",
        tagline="Responde precios, catálogo y dudas al instante para no perder clientes por tardar en contestar",
        category="atencion",
        base_hours_first_time=24,
        reusable_discount_hours=6,
        description="Atención automática amable por WhatsApp o tu web. Resuelve dudas frecuentes, filtra prospectos y toma pedidos sin que tengas que estar pegado al teléfono.",
        popular=True
    ),
    AutomationItemSchema(
        id="calendar-sync",
        name="Agendador Automático de Citas sin Cruces de Horario",
        tagline="Tus clientes eligen su hora libre y reciben recordatorio automático 2 horas antes para evitar inasistencias",
        category="gestion",
        base_hours_first_time=16,
        reusable_discount_hours=4,
        description="Conecta con tu calendario en vivo. Evita empalmes, elimina cancelaciones de última hora y confirma la asistencia de tus clientes automáticamente.",
        popular=True
    ),
    AutomationItemSchema(
        id="doc-extractor-ocr",
        name="Lector Automático de Facturas, Recibos y Tickets a Excel",
        tagline="Pasa las fotos de tus comprobantes o facturas en PDF directo a tu Excel sin escribir nada a mano",
        category="extraccion",
        base_hours_first_time=28,
        reusable_discount_hours=8,
        description="Toma foto de cualquier ticket de compra o factura y el sistema extrae fechas, montos e impuestos directo a tu control de gastos sin errores humanos."
    ),
    AutomationItemSchema(
        id="debtor-recovery",
        name="Recordatorio Amable de Cobranza y Cuentas Pendientes",
        tagline="Manda avisos educados por WhatsApp a clientes con pagos atrasados para recuperar tu dinero sin desgaste",
        category="operacion",
        base_hours_first_time=18,
        reusable_discount_hours=5,
        description="Acelera tus cobros pendientes con mensajes profesionales y automáticos, reduciendo la morosidad sin generar fricción con tus clientes."
    ),
    AutomationItemSchema(
        id="crm-sheets-sync",
        name="Sincronizador de Pedidos y Ventas a tu Excel",
        tagline="Cada venta o pedido nuevo se anota solo en tu inventario o Excel sin errores de captura",
        category="operacion",
        base_hours_first_time=14,
        reusable_discount_hours=4,
        description="Conecta tu tienda, formularios o mensajes para que cada pedido se registre al instante en tu inventario o lista de control en tiempo real."
    ),
    AutomationItemSchema(
        id="support-ticket-bot",
        name="Asistente de Preguntas Frecuentes y Ayuda a Clientes",
        tagline="Resuelve las 10 preguntas que siempre te hacen sobre horarios, ubicación y envíos al momento",
        category="atencion",
        base_hours_first_time=22,
        reusable_discount_hours=6,
        description="Ahorra horas respondiendo las mismas dudas diarias y permite que tú o tu equipo solo intervengan cuando el cliente realmente requiera atención personalizada."
    ),
    AutomationItemSchema(
        id="churn-alert-system",
        name="Reactivador de Clientes que Dejaron de Comprar",
        tagline="Avisa a clientes que tienen semanas sin visitarte con una promoción especial para que vuelvan",
        category="gestion",
        base_hours_first_time=20,
        reusable_discount_hours=5,
        description="Detecta en tu historial a clientes inactivos y les envía promociones personalizadas para incentivar nuevas compras y fidelizarlos."
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
                lost_hours_per_week=10.0,
                hourly_labor_cost=180.0,
                average_ticket_value=1200.0,
                monthly_leads_or_clients=250,
                lost_clients_percentage=15.0,
                human_errors_monthly_cost=2000.0
            )
        else:
            bleed = ClientBleedInputsSchema(
                lost_hours_per_week=10.0,
                hourly_labor_cost=18.0,
                average_ticket_value=65.0,
                monthly_leads_or_clients=250,
                lost_clients_percentage=15.0,
                human_errors_monthly_cost=150.0
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
