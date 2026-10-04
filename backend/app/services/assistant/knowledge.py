"""
Base de conocimiento de Erick Daniel (Daarick), catálogo de soluciones, metodología y política de precios.
Diseñada para alimentar al agente Wiki en lenguaje de negocio claro, accesible y sin tecnicismos pesados.
"""
import os
from pathlib import Path
from typing import Dict, Any

# Cargar conocimiento ampliado de proyectos desde Markdown si existe
KNOWLEDGE_PROJECTS_MD_PATH = Path(__file__).parent / "knowledge_projects.md"
KNOWLEDGE_PROJECTS_TEXT = ""
if KNOWLEDGE_PROJECTS_MD_PATH.exists():
    try:
        KNOWLEDGE_PROJECTS_TEXT = KNOWLEDGE_PROJECTS_MD_PATH.read_text(encoding="utf-8")
    except Exception:
        pass

PRICING_POLICY = (
    "Respecto a los precios: regularmente no se cobra nada por adelantado sin certeza; "
    "el cobro inicial del desarrollo se realiza una vez que el cliente aprueba el prototipo funcional interactivo. "
    "Posteriormente, cuando la solución ya está instalada y funcionando en producción, se maneja una cuota mensual accesible "
    "por concepto de soporte, mantenimiento y actualizaciones continuas. "
    "El costo exacto se adapta completamente a la complejidad, volumen y necesidades de cada proyecto, "
    "por lo que siempre sugerimos agendar una breve llamada de 15 a 20 minutos para definir el alcance sin compromiso."
)

METHODOLOGY = [
    {
        "fase": "01 Diagnóstico y Mapeo",
        "tiempo": "2 a 3 días",
        "descripcion": "Revisamos tus tareas manuales, cuellos de botella y herramientas en uso para definir exactamente qué automatizar y cuánto tiempo o dinero vas a ahorrar.",
        "entregable": "Mapa claro de tus procesos y cálculo estimado de ahorro."
    },
    {
        "fase": "02 Prototipo Funcional",
        "tiempo": "3 a 5 días",
        "descripcion": "Te mostramos un prototipo navegable interactivo y un plan de fechas cerrado para que pruebes y apruebes cómo funcionará la solución antes de programarla.",
        "entregable": "Prototipo interactivo navegable para que lo pruebe tu equipo."
    },
    {
        "fase": "03 Desarrollo e Integración",
        "tiempo": "Fase Principal",
        "descripcion": "Construimos los agentes, automatizaciones y conexiones a tus herramientas diarias (WhatsApp, Excel, Google Sheets, bases de datos o correo).",
        "entregable": "Sistemas conectados trabajando con reglas estrictas de validación."
    },
    {
        "fase": "04 Pruebas con Datos Reales",
        "tiempo": "Control de Calidad",
        "descripcion": "Ponemos a prueba el sistema con información real de tu negocio para comprobar que responda rápido, sin fallos ni equivocaciones.",
        "entregable": "Ajuste completo a tus casos de uso y cero fallos operativos."
    },
    {
        "fase": "05 Puesta en Marcha y Capacitación",
        "tiempo": "Puesta en Marcha",
        "descripcion": "Instalamos la solución en tus cuentas o servidores y capacitamos de forma práctica a tu personal para que la aprovechen desde el primer día.",
        "entregable": "Instalación completa y capacitación al equipo."
    },
    {
        "fase": "06 Soporte y Mantenimiento",
        "tiempo": "Continuidad",
        "descripcion": "Damos seguimiento continuo, soporte prioritario ante cualquier duda y actualizamos el sistema conforme tu empresa crezca.",
        "entregable": "Acompañamiento mensual garantizado."
    }
]

AUTOMATION_CATALOG = {
    "case-whatsapp": {
        "titulo": "Atención, Ventas y Agendado de Citas en WhatsApp / Web",
        "dolor": "No perder clientes por tardar en responder en WhatsApp o saturar al equipo con preguntas repetitivas y citas a mano.",
        "soluciones": [
            "Asistente para tomar pedidos, registrar citas sin empalmes y resolver dudas de productos sin intervención manual.",
            "Canalización automática y filtros de empatía: detecta la necesidad real sin tecnicismos y avisa a la persona indicada."
        ],
        "proyecto_analogo": "wiki",
        "como_aplica": "Sería como este mismo asistente que estás usando ahora mismo en tu pantalla: un agente conversacional en WhatsApp o web que atiende dudas con calidez, ofrece alternativas a la medida y agenda citas automáticamente sin que tengas que pausar tu trabajo."
    },
    "case-ocr": {
        "titulo": "Lectura Automática de Facturas, Tickets y Gastos",
        "dolor": "Pasar horas capturando a mano números de facturas, notas y comprobantes a hojas de cálculo o mezclar gastos personales con los del negocio.",
        "soluciones": [
            "Tomas foto al papel o subes el PDF y extrae montos, fechas, RFCs e impuestos a un Excel al instante.",
            "Cotejo de compras vs pagos: compara estados de cuenta bancarios contra notas y avisa si hay cobros que no cuadran.",
            "Auditor de Gastos vía Telegram (Stampy): envías notas de compra o mensajes en segundos y separa cuentas de Negocio vs Personal con cálculo de IVA acreditable."
        ],
        "proyecto_analogo": "invoicing y stampy (https://stampy.vercel.app/)",
        "como_aplica": "Lectura visual y bot interactivo con validación estricta que impiden errores humanos y recuperan deducciones fiscales."
    },
    "case-shifts": {
        "titulo": "Organización Inteligente de Turnos y Personal",
        "dolor": "Turnos de trabajo cruzados, personal inconforme y desorden al cuadrar semanas o descansos.",
        "soluciones": [
            "Generador automático de turnos que arma el horario semanal en segundos, respetando descansos y horas pico.",
            "Panel sencillo de inventario y ventas para llevar el control sin pagar mensualidades exorbitantes."
        ],
        "proyecto_analogo": "tetring",
        "como_aplica": "Un motor de cálculo que evalúa miles de combinaciones para encontrar el cuadrante perfecto sin empalmes."
    },
    "case-bi": {
        "titulo": "Gestión de Inventarios, Datos y Consultas de Clientes",
        "dolor": "Tener datos regados en hojas de cálculo o sistemas complejos, perdiendo tiempo al consultar existencias o responder preguntas de clientes sobre sus datos.",
        "soluciones": [
            "Consultas en lenguaje cotidiano sobre inventarios, existencias de productos y almacén sin buscar en tablas eternas.",
            "Chat inteligente para que clientes o alumnos consulten sus datos, notas, trámites o pedidos en tiempo real."
        ],
        "proyecto_analogo": "paidea",
        "como_aplica": "Un asistente como PAIDEA conectado de forma segura a tus inventarios, hojas de cálculo o base de datos que responde preguntas y datos exactos al instante."
    }
}
