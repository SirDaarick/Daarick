from pydantic import BaseModel, Field
from typing import Optional

class TestimonialCreate(BaseModel):
    system: str = Field(..., description="Nombre del sistema evaluado (Graphito, Tetring, PAIDEA, Paralel)")
    author_name: Optional[str] = Field("Usuario Anónimo", max_length=50, description="Nombre de quien emite el veredicto")
    author_role: Optional[str] = Field("Cliente / Evaluador", max_length=60, description="Ocupación o contexto profesional")
    before: str = Field(..., min_length=10, max_length=300, description="Cómo era el proceso antes")
    after: str = Field(..., min_length=10, max_length=300, description="Cómo es el proceso después con la herramienta")
    extra_comments: Optional[str] = Field("", max_length=400, description="Espacio para escribir lo que quieran")

class TestimonialResponse(BaseModel):
    id: str
    system: str
    author_name: str
    author_role: str
    before: str
    after: str
    extra_comments: Optional[str] = ""
    headline: str
    approved: bool
    created_at: str

class TestimonialApproveRequest(BaseModel):
    headline: Optional[str] = None
