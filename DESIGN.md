# DESIGN SPECIFICATION: AI AUTOMATION PORTFOLIO
**Aesthetic Style:** Modern Minimalist UI + Ambient TUI (Text User Interface) & ASCII Accents  
**Theme:** Violet Dusk & Electric Lilac  
**Target Audience:** Non-technical decision makers, business owners, and engineering leaders looking for real-world AI process automation.  
**Tech Stack:** React (Vite + TypeScript) + Tailwind CSS + Framer Motion + FastAPI (Python Backend Gateway)

---

## 1. Design Tokens & Visual Foundations

### 1.1 Color Palette (Violet Dusk System)

```css
:root {
  /* Backgrounds & Canvas Surfaces */
  --bg-primary: #160B1A;         /* Deep aubergine base background */
  --bg-secondary: #1E0F23;       /* Surface gradient transition */
  --bg-card: rgba(80, 45, 85, 0.22); /* Translucent glass card base (#502D55) */
  --bg-card-hover: rgba(80, 45, 85, 0.38);

  /* Borders & Dividers */
  --border-subtle: rgba(147, 80, 115, 0.28); /* Plum border (#935073) */
  --border-active: rgba(192, 132, 252, 0.50); /* Lilac border glow */

  /* Typography Colors */
  --text-primary: #F8F4E9;       /* Warm ivory for high-contrast reading */
  --text-secondary: #F6DBC0;     /* Warm peach for metadata and descriptions */
  --text-muted: rgba(246, 219, 192, 0.65); /* Faded peach for subtle text */

  /* Accents & TUI Highlights */
  --accent-lilac: #C084FC;       /* Electric lilac for badges, focus and links */
  --accent-glow: #D8B4FE;        /* Soft lilac glow */
  --accent-plum: #935073;        /* Muted berry accent */
  --status-live: #10B981;        /* Terminal emerald status dot */
}
```

### 1.2 Typography Hierarchy

We enforce a strict **80/20 typographic division**:
* **80% Human-First Sans-Serif (`font-sans`):** `Plus Jakarta Sans` or `Inter`. Used for all titles, problem descriptions, and explanations to ensure 100% legibility for non-technical visitors.
* **20% Precision Monospace (`font-mono`):** `JetBrains Mono` or `Fira Code`. Used exclusively for TUI metadata, index numbers (`[ 01 // PROYECTOS ]`), status tags (`[ ● OPERATIVO ]`), and terminal prompts.

---

## 2. ASCII & TUI Visual Grammar

To keep the interface clean and sophisticated, ASCII elements act as structural accents and background atmosphere:

### 2.1 Corner Crosshairs (`+`)
Cards and modal windows feature ASCII crosshair markers at their 4 corners, evoking technical blueprints without visual clutter:
```text
+-------------------------------------------------------+
| [ 01/04 ]                           [ ● OPERATIVO ]   |
|                                                       |
| Gestor Inteligente de Pedidos y Facturas              |
| Automatiza la extracción de datos y sincronización... |
|                                                       |
|                                     [ Probar Demo ↗ ] |
+-------------------------------------------------------+
```

### 2.2 Ambient ASCII Background Canvas (`<AsciiCanvas />`)
* **Technology:** Dedicated HTML5 `<canvas>` element rendered behind all UI (`z-[-1]`, `pointer-events-none`).
* **Frame Rate & Performance:** Driven by `requestAnimationFrame`, throttled to 30-45 FPS or paused when tab is inactive (`document.hidden`).
* **Characters:** Mathematical character density set: `["·", ":", "-", "~", "+", "*", "%"]`.
* **Behavior:** A slow diagonal sine-wave calculation where characters gently shift opacity between 6% and 10% in `--accent-plum` and `--accent-lilac`.
* **Outcome:** The background feels alive and atmospheric like digital mist, but completely non-intrusive for the text on top.

### 2.3 Status Indicators & Badges
* Monospaced brackets: `[ ✦ ]`, `[ // ]`, `[ ● LIVE ]`.
* Section numbering: `// 01. PROYECTOS`, `// 02. HERRAMIENTAS`, `// 03. VEREDICTOS`.

---

## 3. Page Structure & Component Wireframes

```
+-----------------------------------------------------------------------------------+
|  [daarick@systems:~]$                             [ proyectos ] [ stack ] [ veredictos ] [ contacto ]
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  // SISTEMAS DE GESTIÓN & AUTOMATIZACIÓN CON IA                                    |
|                                                                                   |
|  Transformo tareas operativas lentas en                                           |
|  sistemas automáticos e inteligentes.                                             |
|                                                                                   |
|  Desarrollo herramientas a medida con FastAPI y React para eliminar cuellos de    |
|  botella operativos utilizando agentes y modelos de Inteligencia Artificial.       |
|                                                                                   |
|  [ Explorar Proyectos ↓ ]                                                         |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  +-- STACK PRINCIPAL ----------------------------------------------------------+  |
|  |   [ Python ]   [ FastAPI ]   [ React ]   [ PyTorch ]   [ Docker ]           |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  // 01. PROYECTOS SELECCIONADOS                                                   |
|  Sistemas reales en producción que resuelven fricción operativa.                  |
|                                                                                   |
|  +---------------------------+ +---------------------------+                      |
|  | +                       + | | +                       + |                      |
|  | | [ 01/04 ] [ ● LIVE ]  | | | | [ 02/04 ] [ ● LIVE ]  | |                      |
|  | |                       | | | |                       | |                      |
|  | | Triaje Inteligente    | | | | Extractor Documental  | |                      |
|  | | Clasifica y enruta    | | | | Parsea facturas y     | |                      |
|  | | solicitudes en 1.2s.  | | | | sincroniza inventario.| |                      |
|  | |                       | | | |                       | |                      |
|  | | [ Probar Demo ↗ ]     | | | | [ Probar Demo ↗ ]     | |                      |
|  | +                       + | | +                       + |                      |
|  +---------------------------+ +---------------------------+                      |
|                     < [ 01 / 04 ] >                                               |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  // 02. VEREDICTOS                                                                |
|  Opiniones de quienes operan estos sistemas en el día a día.                      |
|                                                                                   |
|  ┌────────────────────────────────────────┐ ┌───────────────────────────────────┐ |
|  │ "Nos redujo el tiempo de procesamiento │ │ "La interfaz es intuitiva y el    │ |
|  │  de pedidos de 35 minutos a 1 minuto." │ │  agente no comete errores."       │ |
|  │  -- Coord. de Operaciones, Retail      │ │  -- Director Financiero           │ |
|  └────────────────────────────────────────┘ └───────────────────────────────────┘ |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  [ ✦ sistema en línea // gracias por la visita ]          [ github ] [ linkedin ]  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Detailed Component Specifications

### 4.1 Navbar (`<Navbar />`)
* **Position:** Fixed top, `backdrop-blur-md`, subtle border bottom `rgba(147, 80, 115, 0.2)`.
* **Left:** Brand terminal prompt `[daarick@systems:~]$` in monospace lilac.
* **Right:** Navigation links in monospace brackets: `[ proyectos ]`, `[ stack ]`, `[ veredictos ]`, and a contact trigger `[ contacto ]` opening mailto or a clean contact modal.

### 4.2 Hero Section (`<HeroSection />`)
* **Padding:** Generous vertical spacing (`py-28 lg:py-36`).
* **Eyebrow Tag:** Monospaced label `// SISTEMAS DE GESTIÓN & AUTOMATIZACIÓN CON IA`.
* **Title:** Bold, spacious Sans-serif (`text-4xl md:text-6xl text-[#F8F4E9] font-semibold tracking-tight`).
* **Description:** Clean, empathetic copy focusing on business pain points and solutions.
* **CTA Button:** Glass pill with lilac border glow and corner indicators.

### 4.3 Tech Stack Ribbon (`<TechStack />`)
* A single, clean horizontal strip framed with ASCII wireframe borders.
* Contains only core tools: `Python`, `FastAPI`, `React`, `TypeScript`, `PyTorch / OpenAI`, `Docker`.
* Low visual noise: monochrome ivory text with soft lilac hover effects.

### 4.4 Projects Carousel (`<ProjectsCarousel />`)
* **Layout:** Embla Carousel or smooth touch-enabled horizontal slider with snap points.
* **Cards (`<ProjectCard />`):**
  * Aspect ratio: 16:10 or vertical card (`min-w-[340px] md:min-w-[420px]`).
  * Surface: Glassmorphism with `--bg-card` and thin `--border-subtle`.
  * Corner Markers: 4 absolute positioned `+` signs in `--accent-plum`.
  * Content:
    * Index and live status dot: `[ 01/04 ]` and `[ ● DEMO OPERATIVA ]`.
    * Human-friendly project title: (e.g., *"Clasificador Inteligente de Solicitudes"*).
    * Problem & Impact Summary (2 sentences max).
    * Tag strip: `[ FastAPI ]` `[ Agente IA ]`.
    * Action button: `[ Abrir Caso y Demo ↗ ]`.
* **Navigation Controls:** Centered bottom TUI controls `< [ 01 / 04 ] >`.

### 4.5 Project Detail & Interactive Sandbox Modal (`<ProjectDetailModal />`)
When a user clicks on a project, a full-screen or large centered modal appears:
* **Header:** Project title + Business impact tag + Close button `[ X ]`.
* **Tab Switcher:**
  * Tab 1: `[ 01. Caso de Estudio ]` (What manual problem existed, how the AI was integrated, and ROI).
  * Tab 2: `[ 02. Simulador Interactivo ]` (The live operational demo).
* **Interactive Sandbox UX (Optimized for Non-Technical Users):**
  * **No blank state:** Provides 2 to 3 pre-configured scenario buttons (e.g. `[ Ejemplo 1: Consulta urgente ]`, `[ Ejemplo 2: Factura proveedor ]`).
  * **Input View:** Displays the selected scenario data.
  * **Execution Button:** `[ Ejecutar Automatización ⚡ ]`.
  * **Output View:** Renders the AI-processed output in a clean structured card with metrics (`// TIEMPO: 1.1s · PRECISIÓN: 98% · ESTADO: RESUELTO`).
  * **Fallback / Offline Mode:** If the backend demo is waking up or reaches quota limit, it immediately serves realistic pre-cached results so the user never sees a failure.

### 4.6 Veredictos / Social Proof (`<Testimonials />`)
* Clean ASCII box-drawing borders (`┌─┐`, `│ │`, `└─┘`).
* Authentic quotes describing operational improvements.
* Author name and role formatted in clean ivory typography.

### 4.7 Footer (`<Footer />`)
* Minimalist terminal sign-off: `[ ✦ sistema en línea // gracias por la visita ]`.
* Clean links: GitHub, LinkedIn, Email.

---

## 5. Frontend Architecture & Directory Layout

```text
frontend/src/
├── assets/                  # Static assets and icons
├── components/
│   ├── ascii/
│   │   └── AsciiCanvas.tsx  # Ambient 2D canvas sine-wave animation
│   ├── layout/
│   │   ├── Navbar.tsx       # Glassmorphic top navigation
│   │   └── Footer.tsx       # Minimalist terminal footer
│   ├── sections/
│   │   ├── HeroSection.tsx  # Value proposition & CTA
│   │   ├── TechStack.tsx    # Monospace framed technology strip
│   │   ├── Carousel.tsx     # Featured projects carousel with TUI controls
│   │   └── Testimonials.tsx # ASCII framed quote cards
│   ├── project/
│   │   ├── ProjectCard.tsx  # Individual project card with corner '+'
│   │   └── ProjectModal.tsx # Case study & Interactive Sandbox runner
│   └── ui/
│       ├── Button.tsx       # TUI styled button with brackets and hover glow
│       └── Tag.tsx          # Monospace tag pill
├── data/
│   └── projects.ts          # Strongly-typed project catalog and demo presets
├── types/
│   └── project.d.ts         # TypeScript interfaces for projects and demos
├── App.tsx                  # Main single-page application orchestrator
├── index.css                # Tailwind directives & Violet Dusk CSS variables
└── main.tsx                 # React DOM mount point
```

---

## 6. Backend API Gateway Architecture (FastAPI)

```text
backend/app/
├── api/
│   └── v1/
│       ├── endpoints/
│       │   ├── projects.py   # GET /api/v1/projects (Project catalog & metadata)
│       │   └── demos.py      # POST /api/v1/demos/{slug}/run (Demo execution)
│       └── api.py            # APIRouter aggregating endpoints
├── core/
│   ├── config.py             # Settings, CORS origins, environment secrets
│   └── limiter.py            # SlowAPI rate limiting (e.g. 10 req/hour per IP)
├── schemas/
│   └── demo.py               # Pydantic models for demo inputs, presets & outputs
├── services/
│   ├── demo_runner.py        # Dispatcher to AI models with fallback cache
│   └── mock_service.py       # Instant graceful degradation responses
└── main.py                   # FastAPI initialization & middleware
```

### Key API Contracts

#### `POST /api/v1/demos/{slug}/run`
* **Request:**
```json
{
  "scenario_id": "urgent_ticket_01",
  "custom_input": "El sistema no procesa las órdenes de compra desde esta mañana..."
}
```
* **Response:**
```json
{
  "status": "success",
  "execution_time_ms": 1120,
  "output": {
    "category": "Soporte Crítico - Facturación",
    "priority": "Alta",
    "suggested_action": "Escalar a equipo de infraestructura y notificar a cuenta",
    "automated_reply": "Estimado cliente, hemos detectado el incidente..."
  },
  "is_simulated": false
}
```

---

## 7. Performance & Usability Principles

1. **Zero Layout Shift (CLS):** Project cards and modal windows have defined dimensions and skeleton loaders.
2. **Battery & CPU Conservation:** The `<AsciiCanvas />` uses `window.requestAnimationFrame`, reduces tick rate when idle, and completely halts rendering if `document.hidden === true`.
3. **Graceful Fallbacks:** The interactive playground never leaves the user with a broken spinner. If the backend is cold or rate-limited, it transitions cleanly to realistic pre-computed demo results.
4. **Mobile Responsive First:** On mobile screens, the ASCII canvas density automatically adjusts its grid column count, and the carousel supports native touch swipe.
