import os
from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional, List
from app.schemas.testimonial import (
    TestimonialCreate,
    TestimonialResponse,
    TestimonialApproveRequest
)
from app.services.llm_summarizer import generate_impact_headline
from app.services.testimonial_db import (
    create_testimonial,
    get_approved_testimonials,
    get_all_testimonials,
    approve_testimonial,
    delete_testimonial
)

router = APIRouter()

DEFAULT_ADMIN_TOKEN = "erick-admin-2026"

def verify_admin_token(x_admin_token: Optional[str]):
    expected_token = os.getenv("ADMIN_TOKEN", DEFAULT_ADMIN_TOKEN)
    if not x_admin_token or x_admin_token.strip() != expected_token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clave de administrador incorrecta o ausente."
        )

@router.post("", response_model=TestimonialResponse, status_code=status.HTTP_201_CREATED)
async def submit_testimonial(payload: TestimonialCreate):
    """
    Registra un nuevo veredicto de usuario.
    El LLM sintetiza el titular de impacto automáticamente y se marca como pendiente de moderación.
    """
    author = payload.author_name.strip() if payload.author_name and payload.author_name.strip() else "Usuario Verificado"
    role = payload.author_role.strip() if payload.author_role and payload.author_role.strip() else "Evaluador de Sistema"
    
    # Síntesis con LLM (Gemini o Fallback)
    headline = await generate_impact_headline(
        system_name=payload.system,
        before=payload.before,
        after=payload.after
    )
    
    saved = create_testimonial(
        system=payload.system,
        author_name=author,
        author_role=role,
        before=payload.before,
        after=payload.after,
        headline=headline
    )
    return saved

@router.get("", response_model=List[TestimonialResponse])
async def list_approved_testimonials():
    """
    Obtiene la lista pública de testimonios aprobados con su titular de impacto y detalle.
    """
    return get_approved_testimonials()

@router.get("/admin", response_model=List[TestimonialResponse])
async def list_admin_testimonials(x_admin_token: Optional[str] = Header(None)):
    """
    Obtiene todos los testimonios (pendientes y aprobados) para el panel de moderación.
    """
    verify_admin_token(x_admin_token)
    return get_all_testimonials()

@router.patch("/admin/{test_id}/approve", response_model=dict)
async def approve_user_testimonial(
    test_id: str,
    payload: Optional[TestimonialApproveRequest] = None,
    x_admin_token: Optional[str] = Header(None)
):
    """
    Aprueba un testimonio y permite opcionalmente ajustar el titular generado por IA.
    """
    verify_admin_token(x_admin_token)
    headline = payload.headline if payload else None
    success = approve_testimonial(test_id, headline)
    if not success:
        raise HTTPException(status_code=404, detail="Testimonio no encontrado.")
    return {"status": "success", "message": "Testimonio aprobado con éxito.", "id": test_id}

@router.delete("/admin/{test_id}", response_model=dict)
async def delete_user_testimonial(
    test_id: str,
    x_admin_token: Optional[str] = Header(None)
):
    """
    Descarta y elimina un testimonio no deseado o spam.
    """
    verify_admin_token(x_admin_token)
    success = delete_testimonial(test_id)
    if not success:
        raise HTTPException(status_code=404, detail="Testimonio no encontrado.")
    return {"status": "success", "message": "Testimonio eliminado.", "id": test_id}
