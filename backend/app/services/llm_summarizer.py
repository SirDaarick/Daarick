import os
import re
import httpx
from typing import Optional

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

async def generate_impact_headline(system_name: str, before: str, after: str) -> str:
    """
    Sintetiza el testimonio en un titular corto de impacto (máximo 8-12 palabras).
    Utiliza Gemini si hay API key configurada; de lo contrario utiliza un extractor heurístico determinista.
    """
    if GEMINI_API_KEY:
        try:
            prompt = (
                f"Eres un experto en redacción de casos de éxito y ROI de software.\n"
                f"Sistema evaluado: {system_name}\n"
                f"Cómo era el proceso antes (problema): \"{before}\"\n"
                f"Cómo es ahora con la herramienta (solución y resultados): \"{after}\"\n\n"
                f"Genera un ÚNICO titular de impacto (máximo 10 palabras en español) que resuma el beneficio principal "
                f"o tiempo ahorrado. Debe sonar profesional, sin tecnicismos complejos, directo al grano.\n"
                f"Ejemplos: 'Reducción de 40 min a 1.2s en conciliación de facturas' o 'Ahorro de 35h semanales en auditorías'.\n"
                f"Devuelve SOLAMENTE el texto del titular, sin comillas ni explicaciones."
            )
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 60
                }
            }
            
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        # Limpiar comillas iniciales/finales
                        text = text.strip('"\'')
                        if text:
                            return text
        except Exception:
            # Fallback inmediato en caso de error de red
            pass

    # --- Fallback Heurístico Determinista ---
    # Extrae la primera oración del resultado o busca métricas explícitas
    after_clean = re.sub(r'[\r\n]+', ' ', after.strip())
    # Buscar patrones de cifras o tiempo (ej. "35h", "99%", "2 segundos", etc.)
    sentences = [s.strip() for s in re.split(r'[.!?]', after_clean) if s.strip()]
    
    if sentences:
        first_sentence = sentences[0]
        words = first_sentence.split()
        if len(words) <= 12:
            return first_sentence
        return " ".join(words[:10]) + "..."
    
    return f"Optimización de flujo y resultados en {system_name}"
