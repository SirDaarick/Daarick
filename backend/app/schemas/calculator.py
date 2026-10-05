"""
Esquemas Pydantic v2 para la Calculadora de Cotización y Retorno de Inversión (ROI).
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class AutomationItemSchema(BaseModel):
    id: str = Field(..., description="Identificador único del módulo")
    name: str = Field(..., description="Nombre comercial del servicio")
    tagline: str = Field(..., description="Beneficio de negocio principal")
    category: str = Field(..., description="Categoría: atencion, extraccion, gestion, operacion")
    base_hours_first_time: int = Field(..., description="Horas de desarrollo base")
    reusable_discount_hours: int = Field(..., description="Horas ahorradas por reutilización")
    description: str = Field(..., description="Descripción detallada de la solución")
    popular: Optional[bool] = False

class ClientBleedInputsSchema(BaseModel):
    lost_hours_per_week: float = Field(default=12.0, ge=0, le=100, description="Horas semanales en tareas repetitivas")
    hourly_labor_cost: float = Field(default=18.0, ge=0, le=1000, description="Costo por hora de trabajo manual ($)")
    average_ticket_value: float = Field(default=250.0, ge=0, le=100000, description="Ticket promedio o cuota mensual por cliente ($)")
    monthly_leads_or_clients: int = Field(default=40, ge=0, le=10000, description="Prospectos o clientes atendidos al mes")
    lost_clients_percentage: float = Field(default=20.0, ge=0, le=100, description="% de clientes perdidos por lentitud o errores")
    human_errors_monthly_cost: float = Field(default=200.0, ge=0, le=50000, description="Costo mensual de retrabajos o morosidad ($)")

class DeveloperConfigSchema(BaseModel):
    erick_hourly_rate: float = Field(default=13.0, ge=5, le=500, description="Tarifa base por hora de desarrollo de Erick ($ USD)")
    platform_base_hours: int = Field(default=6, ge=0, le=200, description="Horas de infraestructura y arquitectura")
    meetings_and_pm_hours: int = Field(default=4, ge=0, le=100, description="Horas de reuniones, diseño UX y QA")
    value_capture_percentage: float = Field(default=0.12, ge=0.05, le=0.5, description="Porcentaje del beneficio capturado")
    min_monthly_retainer: float = Field(default=46.0, ge=20, le=2000, description="Retainer mensual mínimo ($ USD)")
    exchange_rate_usd_to_mxn: float = Field(default=18.5, ge=10, le=30, description="Tipo de cambio USD a MXN")

class QuoteRequest(BaseModel):
    selected_automation_ids: List[str] = Field(default_factory=list, description="IDs de las automatizaciones seleccionadas")
    bleed_inputs: Optional[ClientBleedInputsSchema] = None
    dev_config: Optional[DeveloperConfigSchema] = None
    currency: Literal["USD", "MXN"] = Field(default="MXN", description="Moneda para el reporte")

class MonthProjectionSchema(BaseModel):
    month: int
    cumulative_cost_without_automation: float
    cumulative_investment_with_automation: float
    cumulative_benefit_with_automation: float
    net_profit: float

class QuoteResponse(BaseModel):
    selected_automation_count: int
    total_automation_hours: int
    platform_and_pm_hours: int
    total_project_hours: int
    technical_floor_cost: float
    monthly_time_loss_cost: float
    monthly_sales_loss_cost: float
    total_monthly_bleed: float
    total_annual_bleed: float
    annual_recovered_benefit: float
    recommended_setup_price: float
    recommended_monthly_retainer: float
    year_one_total_investment: float
    year_one_net_savings: float
    roi_percentage: int
    payback_months: float
    payback_days: int
    currency: str
    monthly_breakdown: List[MonthProjectionSchema]
