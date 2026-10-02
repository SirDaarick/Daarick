from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.demos import router as demos_router
from app.api.v1.endpoints.projects import router as projects_router

app = FastAPI(
    title="Daarick Systems API Gateway",
    description="API Gateway y Runner de Demos para el Portafolio de Sistemas de IA",
    version="1.0.0"
)

# CORS setup to allow requests from frontend (local and production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(projects_router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(demos_router, prefix="/api/v1/demos", tags=["demos"])

@app.get("/")
async def root():
    return {
        "system": "Daarick AI Automation Gateway",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "api-gateway"}
