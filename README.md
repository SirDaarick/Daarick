# Daarick — Portafolio de Sistemas de IA & Automatización

Portafolio de alto rendimiento y arquitectura determinista para Ingeniero en Inteligencia Artificial y Automatización de Procesos.

**Stack Tecnológico:**
* **Frontend:** [Astro](https://astro.build/) (Islands Architecture) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Tailwind CSS v4](https://tailwindcss.com/)
* **Backend:** [FastAPI](https://fastapi.tiangolo.com/) + Pydantic v2 + SlowAPI Rate Limiting + Fallback Mock Runner
* **Diseño UI/UX:** Tema *Violet Dusk* (`#160B1A`, `#502D55`, `#935073`, `#F8F4E9`, `#C084FC`) + Acentos TUI y Carrusel 3D Cover Flow

---

## Estructura del Monorepo

```text
Daarick/
├── frontend/                     # Aplicación web con Astro + Islas de React
│   ├── src/
│   │   ├── components/
│   │   │   ├── AsciiCanvas.tsx   # Fondo animado interactivo en Canvas 2D
│   │   │   ├── CoverFlowCarousel.tsx # Carrusel 3D con perspectiva Cover Flow
│   │   │   ├── SandboxModal.tsx  # Ventana de inspección y simulador de payloads
│   │   │   ├── DocumentExtractorDemo.tsx # Demo interactiva de extracción documental
│   │   │   ├── Navbar.astro      # Barra superior con prompt TUI
│   │   │   ├── Hero.astro        # Sección principal orientada a negocio
│   │   │   ├── TechStack.astro   # Ribbon de herramientas con iconos
│   │   │   ├── Testimonials.astro # Tarjetas de veredictos y métricas de impacto
│   │   │   └── Footer.astro      # Pie de página terminal
│   │   ├── layouts/
│   │   │   └── Layout.astro      # Plantilla global con fuentes e islas base
│   │   ├── pages/
│   │   │   ├── index.astro       # Landing page principal
│   │   │   └── demo/
│   │   │       └── invoicing.astro # Caso de estudio y demo en vivo
│   │   ├── data/
│   │   │   └── projects.ts       # Catálogo de proyectos y telemetría
│   │   └── styles/
│   │       └── global.css        # Tokens de diseño y estilos 3D
│   ├── astro.config.mjs
│   └── package.json
│
├── backend/                      # API Gateway y Runner de Demos con FastAPI
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── demos.py          # POST /api/v1/demos/{slug}/run
│   │   │   └── projects.py       # GET /api/v1/projects
│   │   ├── schemas/
│   │   │   └── demo.py           # Modelos Pydantic v2
│   │   └── main.py               # Instancia FastAPI con CORS y middleware
│   ├── requirements.txt
│   └── .venv/
│
├── DESIGN.md                     # Especificación de arquitectura y tokens
└── README.md
```

---

## Cómo Ejecutar el Proyecto en Local

### 1. Iniciar el Backend (FastAPI Gateway)

Abre una terminal en la raíz del proyecto:

```powershell
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

* Documentación interactiva Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
* Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Iniciar el Frontend (Astro + React)

En otra terminal:

```powershell
cd frontend
npm run dev
```

* Servidor local de desarrollo: [http://localhost:4321](http://localhost:4321)

---

## Compilación para Producción

```powershell
cd frontend
npm run build
```

Genera una compilación estática ultrarrápida lista para desplegar en Vercel, Cloudflare Pages o GitHub Pages en la carpeta `frontend/dist/`.
