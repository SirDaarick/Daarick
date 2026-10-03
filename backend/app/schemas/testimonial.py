from pydantic import BaseModel, Field
from typing import Optional

class TestimonialCreate(BaseModel):
    system: str = Field(..., description="Nombre del sistema evaluado (ej. Graphito, Tetring, PAIDEA, Paralel)")
    author_name: Optional[str] = Field("Usuario Anónimo", description="Nombre de quien emite el veredicto")
    author_role: Optional[str] = Field("Cliente / Evaluador", description="Cargo o contexto profesional")
    before: str = Field(..., min_length=10, description="Descripción de cómo era el proceso antes")
    after: str = Field(..., min_length=10, description="Descripción de cómo es el proceso ahora con la herramienta")

class TestimonialResponse(BaseModel):
    id: str
    system: str
    author_name: str
    author_role: str
    before: str
    after: str
    headline: str
    approved: bool
    created_at: str

class TestimonialApproveRequest(BaseModel):
    headline: Optional[str] = None
