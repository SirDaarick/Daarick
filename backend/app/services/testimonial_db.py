import sqlite3
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
LOCAL_DB_PATH = os.path.join(DB_DIR, "testimonials.db")

_is_initialized = False

def get_db_path() -> str:
    """
    Retorna la ruta determinista de la base de datos SQLite.
    En Vercel Serverless / AWS Lambda, el sistema de archivos del despliegue es READ-ONLY.
    Por ello, redirigimos la base de datos a /tmp si detectamos Vercel o falta de permisos de escritura.
    """
    is_vercel = bool(os.getenv("VERCEL"))
    if is_vercel:
        import tempfile
        tmp_dir = tempfile.gettempdir()
        tmp_path = os.path.join(tmp_dir, "testimonials.db")
        if not os.path.exists(tmp_path):
            if os.path.exists(LOCAL_DB_PATH):
                try:
                    import shutil
                    shutil.copy2(LOCAL_DB_PATH, tmp_path)
                except Exception:
                    pass
        return tmp_path

    # En entorno local con permisos de escritura
    try:
        os.makedirs(DB_DIR, exist_ok=True)
        return LOCAL_DB_PATH
    except OSError:
        # Fallback a directorio temporal si el entorno no permite crear directorios
        import tempfile
        return os.path.join(tempfile.gettempdir(), "testimonials.db")

def get_connection() -> sqlite3.Connection:
    path = get_db_path()
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    global _is_initialized
    if _is_initialized:
        return

    try:
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

        # Verificar si la columna extra_comments existe
        cursor.execute("PRAGMA table_info(testimonials)")
        columns = [col["name"] for col in cursor.fetchall()]
        if "extra_comments" not in columns:
            cursor.execute("ALTER TABLE testimonials ADD COLUMN extra_comments TEXT DEFAULT ''")
            conn.commit()

        # Limpiar testimonios semilla de prueba para comenzar con testimonios reales
        cursor.execute("DELETE FROM testimonials WHERE id LIKE 'seed-%'")
        conn.commit()
        conn.close()
        _is_initialized = True
    except Exception as e:
        # Registrar y permitir continuar si ya existe esquema
        print(f"[testimonial_db] Advertencia en init_db: {e}")

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
