import os
import re
import httpx
from typing import Optional

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

async def generate_impact_headline(system_name: str, before: str, after: str, extra: str = "") -> str:
    """
    Sintetiza el testimonio en un titular ultra-resumido tipo veredicto humano (15-20 palabras):
    Estructura: 'Me ayudó con [proceso], ahora tardamos [resultado/tiempo], pero [detalle/reto si lo hay]'.
    """
    if GEMINI_API_KEY:
        try:
            prompt = (
                f"Eres un sintetizador de veredictos reales de software.\n"
                f"Sistema evaluado: {system_name}\n"
                f"Antes (problema): \"{before}\"\n"
                f"Ahora (resultado): \"{after}\"\n"
                f"Comentarios extra: \"{extra}\"\n\n"
                f"Genera un ÚNICO titular en una sola frase breve y directa (máximo 18 palabras en español) con este estilo exacto:\n"
                f"'Me ayudó con [proceso], ahora tardo/logro [tiempo/resultado], pero [reto o detalle si existe]'.\n"
                f"Ejemplo: 'Automatizó la revisión de 12.000 facturas bajando a segundos, pero requiere que los PDFs no sean fotos borrosas.'\n"
                f"Devuelve SOLAMENTE la frase final, sin comillas ni explicaciones."
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
                        text = text.strip('"\'')
                        if text:
                            return text
        except Exception:
            pass

    # --- Fallback Heurístico Estructurado ---
    after_clean = re.sub(r'[\r\n]+', ' ', after.strip())
    sentences = [s.strip() for s in re.split(r'[.!?]', after_clean) if s.strip()]
    first_res = sentences[0] if sentences else after_clean

    if "segundo" in first_res.lower() or "minuto" in first_res.lower() or "hora" in first_res.lower():
        return f"Me ayudó a optimizar {system_name}: {first_res}"
    
    words = first_res.split()
    if len(words) <= 16:
        return first_res
    return " ".join(words[:14]) + "..."
