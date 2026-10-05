"""
Punto de entrada principal para la API de FastAPI.
Configura middlewares, lifespan para clientes HTTP compartidos y routers de endpoints.
"""
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.settings import settings
from app.api.v1.endpoints.demos import router as demos_router
from app.api.v1.endpoints.projects import router as projects_router
from app.api.v1.endpoints.testimonials import router as testimonials_router
from app.api.v1.endpoints.assistant import router as assistant_router
from app.api.v1.endpoints.calculator import router as calculator_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar cliente HTTP compartido reutilizable para conexiones salientes
    limits = httpx.Limits(max_keepalive_connections=20, max_connections=40)
    app.state.http_client = httpx.AsyncClient(limits=limits, timeout=15.0)
    yield
    # Cierre limpio de conexiones
    await app.state.http_client.aclose()

app = FastAPI(
    title="Daarick Systems API Gateway",
    description="API Gateway, Asistente Wiki y Servicios de Automatización",
    version="2.0.0",
    lifespan=lifespan
)

# Configuración de CORS segura
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Routers
app.include_router(projects_router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(demos_router, prefix="/api/v1/demos", tags=["demos"])
app.include_router(testimonials_router, prefix="/api/v1/testimonials", tags=["testimonials"])
app.include_router(assistant_router, prefix="/api/v1/assistant", tags=["assistant"])
app.include_router(calculator_router, prefix="/api/v1/calculator", tags=["calculator"])

@app.get("/")
@app.get("/api")
async def root():
    return {
        "system": "Daarick AI Automation Gateway",
        "status": "online",
        "version": "2.0.0"
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "api-gateway"}
