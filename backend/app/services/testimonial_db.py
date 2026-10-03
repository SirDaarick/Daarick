import sqlite3
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DB_PATH = os.path.join(DB_DIR, "testimonials.db")

def get_connection() -> sqlite3.Connection:
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS testimonials (
            id TEXT PRIMARY KEY,
            system TEXT NOT NULL,
            author_name TEXT NOT NULL,
            author_role TEXT NOT NULL,
            before_text TEXT NOT NULL,
            after_text TEXT NOT NULL,
            extra_comments TEXT DEFAULT '',
            headline TEXT NOT NULL,
            approved INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()

    # Verificar si la columna extra_comments existe (migración segura)
    cursor.execute("PRAGMA table_info(testimonials)")
    columns = [col["name"] for col in cursor.fetchall()]
    if "extra_comments" not in columns:
        cursor.execute("ALTER TABLE testimonials ADD COLUMN extra_comments TEXT DEFAULT ''")
        conn.commit()

    # Re-sembrar si hay menos de 5 testimonios
    cursor.execute("SELECT COUNT(*) as count FROM testimonials WHERE approved = 1")
    count = cursor.fetchone()["count"]
    if count < 5:
        # Limpiamos para sembrar la lista enriquecida
        cursor.execute("DELETE FROM testimonials WHERE id LIKE 'seed-%'")
        seed_data = [
            (
                "seed-1",
                "Tetring",
                "Elena M.",
                "Gerente de Finanzas y Control de Gestión",
                "El equipo dedicaba más de 35 horas semanales a cotejar facturas PDF a mano en hojas de cálculo, con un margen de error del 8% en capturas.",
                "Extrajimos 12.000 facturas sin intervención manual. La conciliación bajó a segundos y el margen de error se redujo a cero este trimestre.",
                "La interfaz es intuitiva y el OCR determinista ahorra semanas enteras de auditoría tributaria.",
                "De 35h semanales a conciliación instantánea en 12.000 facturas",
                1,
                datetime.now(timezone.utc).isoformat()
            ),
            (
                "seed-2",
                "Graphito",
                "Carlos R.",
                "Director de Operaciones y Logística",
                "Para resolver cuellos de botella en rutas de distribución nos tomaba 40 minutos evaluar manualmente grafos y árboles de decisión en papel.",
                "El evaluador de grafos redujo el análisis de 40 minutos a 1.2 segundos con visualización interactiva en tiempo real.",
                "Ver los nodos iluminarse y recalcular la ruta óptima en segundos nos dio control absoluto de nuestras operaciones.",
                "Reducción de 40 min a 1.2s en optimización de rutas operativas",
                1,
                datetime.now(timezone.utc).isoformat()
            ),
            (
                "seed-3",
                "PAIDEA",
                "Marcos T.",
                "Tech Lead & Enterprise Architect",
                "Los modelos de lenguaje comerciales alucinaban respuestas ambiguas al consultar manuales técnicos internos de más de 800 páginas.",
                "La arquitectura RAG con ChromaDB responde con fuentes exactas y cero alucinaciones con latencia menor a 400ms.",
                "Es el primer sistema de agentes que podemos desplegar a producción sin miedo a respuestas inventadas.",
                "Consultas técnicas de 800 págs en <400ms con cero alucinaciones",
                1,
                datetime.now(timezone.utc).isoformat()
            ),
            (
                "seed-4",
                "Paralel",
                "Sofía V.",
                "Científica de Datos y Rendimiento",
                "Nuestros scripts en Python tardaban más de 2 horas en procesar simulaciones masivas de datos debido al bloqueo del GIL y ejecución secuencial.",
                "Con el runtime concurrente en C++ paralelizado, el tiempo de ejecución cayó de 2 horas a solo 4 minutos.",
                "Aprovecha al máximo todos los núcleos de CPU del servidor sin complejidad innecesaria en el código.",
                "Simulaciones masivas de 2 horas reducidas a 4 minutos en C++",
                1,
                datetime.now(timezone.utc).isoformat()
            ),
            (
                "seed-5",
                "Tetring",
                "Rodrigo A.",
                "Fundador de Startup B2B",
                "Perdíamos contratos porque tardábamos 3 días en emitir estados de cuenta validados para nuestros clientes corporativos.",
                "Ahora el pipeline procesa y valida los balances en menos de 10 segundos directamente desde la web.",
                "Excelente solución. Nos permitió cerrar clientes corporativos que exigían validación inmediata sin esperas.",
                "Validación de balances corporativos de 3 días a 10 segundos",
                1,
                datetime.now(timezone.utc).isoformat()
            )
        ]
        cursor.executemany("""
            INSERT OR REPLACE INTO testimonials (id, system, author_name, author_role, before_text, after_text, extra_comments, headline, approved, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_data)
        conn.commit()
    conn.close()

def create_testimonial(system: str, author_name: str, author_role: str, before: str, after: str, headline: str, extra_comments: str = "") -> Dict[str, Any]:
    test_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO testimonials (id, system, author_name, author_role, before_text, after_text, extra_comments, headline, approved, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (test_id, system, author_name, author_role, before, after, extra_comments, headline, now_iso))
    conn.commit()
    conn.close()
    return {
        "id": test_id,
        "system": system,
        "author_name": author_name,
        "author_role": author_role,
        "before": before,
        "after": after,
        "extra_comments": extra_comments,
        "headline": headline,
        "approved": False,
        "created_at": now_iso
    }

def get_approved_testimonials() -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, system, author_name, author_role, before_text, after_text, extra_comments, headline, approved, created_at
        FROM testimonials
        WHERE approved = 1
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "system": r["system"],
            "author_name": r["author_name"],
            "author_role": r["author_role"],
            "before": r["before_text"],
            "after": r["after_text"],
            "extra_comments": r["extra_comments"] or "",
            "headline": r["headline"],
            "approved": True,
            "created_at": r["created_at"]
        }
        for r in rows
    ]

def get_all_testimonials() -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, system, author_name, author_role, before_text, after_text, extra_comments, headline, approved, created_at
        FROM testimonials
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "system": r["system"],
            "author_name": r["author_name"],
            "author_role": r["author_role"],
            "before": r["before_text"],
            "after": r["after_text"],
            "extra_comments": r["extra_comments"] or "",
            "headline": r["headline"],
            "approved": bool(r["approved"]),
            "created_at": r["created_at"]
        }
        for r in rows
    ]

def approve_testimonial(test_id: str, new_headline: Optional[str] = None) -> bool:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    if new_headline and new_headline.strip():
        cursor.execute("""
            UPDATE testimonials
            SET approved = 1, headline = ?
            WHERE id = ?
        """, (new_headline.strip(), test_id))
    else:
        cursor.execute("""
            UPDATE testimonials
            SET approved = 1
            WHERE id = ?
        """, (test_id,))
    changed = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return changed

def delete_testimonial(test_id: str) -> bool:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM testimonials WHERE id = ?", (test_id,))
    changed = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return changed
