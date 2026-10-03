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
            headline TEXT NOT NULL,
            approved INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()

    # Semilla inicial si la base de datos está vacía
    cursor.execute("SELECT COUNT(*) as count FROM testimonials")
    row = cursor.fetchone()
    if row["count"] == 0:
        seed_data = [
            (
                str(uuid.uuid4()),
                "Graphito",
                "Elena M.",
                "Directora de Operaciones, Retail Supply",
                "Teníamos que revisar manualmente diagramas y árboles de decisión en papel con esperas de 40 minutos por caso de incidencia crítica.",
                "El sistema de triaje redujo de 40 minutos a 1.2 segundos la respuesta a incidencias críticas. Cero errores contables este trimestre.",
                "Reducción de 40 min a 1.2s en respuesta a incidencias críticas",
                1,
                datetime.now(timezone.utc).isoformat()
            ),
            (
                str(uuid.uuid4()),
                "Tetring",
                "Carlos R.",
                "Head of Logistics, Global Express",
                "El equipo perdía mañanas enteras transcribiendo a mano facturas en PDF desordenadas y con formatos variados.",
                "Extrajimos más de 12.000 facturas PDF desordenadas sin una sola intervención manual. El retorno de inversión fue inmediato en el primer mes.",
                "12.000 facturas PDF extraídas sin intervención manual en 30 días",
                1,
                datetime.now(timezone.utc).isoformat()
            ),
            (
                str(uuid.uuid4()),
                "PAIDEA",
                "Marcos T.",
                "Tech Lead & Enterprise Architect",
                "Los modelos de lenguaje alucinaban respuestas ambiguas sin conexión confiable a nuestra base de conocimiento interna.",
                "Los agentes son deterministas y seguros. Nada de alucinaciones descontroladas; el backend responde como un reloj suizo a diario.",
                "Agentes deterministas sin alucinaciones con latencia sub-segundo",
                1,
                datetime.now(timezone.utc).isoformat()
            )
        ]
        cursor.executemany("""
            INSERT INTO testimonials (id, system, author_name, author_role, before_text, after_text, headline, approved, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, seed_data)
        conn.commit()
    conn.close()

def create_testimonial(system: str, author_name: str, author_role: str, before: str, after: str, headline: str) -> Dict[str, Any]:
    test_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO testimonials (id, system, author_name, author_role, before_text, after_text, headline, approved, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (test_id, system, author_name, author_role, before, after, headline, now_iso))
    conn.commit()
    conn.close()
    return {
        "id": test_id,
        "system": system,
        "author_name": author_name,
        "author_role": author_role,
        "before": before,
        "after": after,
        "headline": headline,
        "approved": False,
        "created_at": now_iso
    }

def get_approved_testimonials() -> List[Dict[str, Any]]:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, system, author_name, author_role, before_text, after_text, headline, approved, created_at
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
        SELECT id, system, author_name, author_role, before_text, after_text, headline, approved, created_at
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
