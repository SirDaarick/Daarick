from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class DemoRunRequest(BaseModel):
    scenario_id: str = Field(..., description="ID del caso de prueba o preset")
    custom_input: Optional[str] = Field(None, description="Entrada o payload JSON modificado por el usuario")

class DemoTelemetry(BaseModel):
    time: str
    accuracy: str
    tokens: str
    category: str
    priority: str
    actions: List[str]

class DemoRunResponse(BaseModel):
    status: str
    project_slug: str
    execution_time_ms: int
    telemetry: DemoTelemetry
    is_simulated: bool
    output_data: Dict[str, Any]
