"""
Acciones de contacto y catálogo de proyectos expuestos de forma amigable y no técnica.
"""
from typing import Dict, List
from app.schemas.assistant import ContactAction, ProjectAction

CONTACT_BUTTONS: List[ContactAction] = [
    ContactAction(
        type="whatsapp",
        label="WhatsApp Directo",
        url="https://wa.me/525578666313?text=Hola%20Erick,%20vi%20tu%20portafolio%20y%20me%20gustar%C3%ADa%20platicar%20sobre%20un%20proyecto"
    ),
    ContactAction(
        type="email",
        label="Enviar Correo",
        url="mailto:e.danielgrz10@gmail.com?subject=Consulta%20desde%20Portafolio"
    ),
    ContactAction(
        type="linkedin",
        label="LinkedIn",
        url="https://www.linkedin.com/in/erickgarcia-ai/"
    )
]

PROJECT_ACTIONS_CATALOG: Dict[str, ProjectAction] = {
    "paidea": ProjectAction(
        id="paidea",
        title="PAIDEA (Asistente de Consulta de Datos)",
        tagline="Chatbot que responde preguntas sobre bases de datos de alumnos, profesores y notas escolares en segundos",
        demo_url="https://paidea-reloaded-xi.vercel.app/",
        github_url="https://github.com/SirDaarick/paidea-reloaded",
        action_label="Ver Demo de PAIDEA"
    ),
    "tetring": ProjectAction(
        id="tetring",
        title="Tetring (Optimizador de Horarios)",
        tagline="Motor de cálculo que arma turnos y horarios sin choques ni empalmes en 42 milisegundos",
        demo_url="https://tetring.vercel.app/",
        github_url="https://github.com/SirDaarick/Tetring",
        action_label="Ver Demo de Tetring"
    ),
    "invoicing": ProjectAction(
        id="invoicing",
        title="Extractor de Facturas y Tickets (Demo)",
        tagline="Lectura visual automática de facturas y tickets a Excel con cuentas matemáticas verificadas",
        demo_url="/demo/invoicing",
        action_label="Probar Sandbox de Facturas"
    ),
    "graphito": ProjectAction(
        id="graphito",
        title="Graphito",
        tagline="Detección y comparación inteligente de lógica para evitar plagios y copias",
        demo_url="https://graphito-escom.vercel.app/",
        github_url="https://github.com/SirDaarick/Graphito",
        action_label="Ver Demo de Graphito"
    ),
    "paralel": ProjectAction(
        id="paralel",
        title="Paralel",
        tagline="Toma de decisiones de altísima velocidad en milisegundos para procesos en tiempo real",
        demo_url="https://paralel-iota.vercel.app/",
        github_url="https://github.com/SirDaarick/Paralel",
        action_label="Ver Demo de Paralel"
    ),
    "stampy": ProjectAction(
        id="stampy",
        title="Stampy (Auditor Financiero & Gastos Telegram)",
        tagline="Bot en Telegram con segregación Negocio vs Personal y cálculo de impuestos en tiempo real",
        demo_url="https://stampy.vercel.app/",
        github_url="https://github.com/SirDaarick/Stampy",
        action_label="Probar Demo de Stampy"
    ),
    "wiki": ProjectAction(
        id="wiki",
        title="Wiki Assistant (Ventas & Citas)",
        tagline="Asistente guiado con streaming en tiempo real, reglas de empatía sin tecnicismos y agendado en Google Calendar",
        demo_url="#wiki",
        github_url="https://github.com/SirDaarick/Daarick",
        action_label="✨ Es este mismo chat en vivo"
    )
}
