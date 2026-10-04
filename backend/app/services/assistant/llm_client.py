"""
Cliente de llamada unificada a LLMs con Structured Outputs (JSON Schema).
Usa OpenRouter como motor principal por estabilidad y coste mínimo (~0.07 USD/M tokens),
con fallback al modelo 100% gratuito de OpenRouter (Qwen) y a Gemini Direct.
"""
import re
import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.settings import settings
from app.schemas.assistant import ChatMessage
from app.services.assistant.prompts import WIKI_SYSTEM_PROMPT, GEMINI_RESPONSE_SCHEMA

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """Extrae un objeto JSON válido de una respuesta que contenga markdown o texto extra."""
    if not text:
        return None
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    
    # Buscar bloque ```json ... ```
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    # Buscar primer { hasta el último }
    match_braces = re.search(r"(\{.*\})", text, re.DOTALL)
    if match_braces:
        try:
            return json.loads(match_braces.group(1))
        except Exception:
            pass

    return None

async def call_openrouter_model(
    client: httpx.AsyncClient,
    messages: List[ChatMessage],
    model_name: str
) -> Optional[Dict[str, Any]]:
    """Llama a OpenRouter con el modelo especificado solicitando respuesta en formato JSON."""
    api_key = settings.OPENROUTER_API_KEY
    if not api_key:
        return None

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:4321",
        "X-Title": "Daarick Portfolio Wiki"
    }

    formatted_msgs = [{"role": "system", "content": WIKI_SYSTEM_PROMPT}]
    for m in messages:
        formatted_msgs.append({
            "role": "user" if m.role == "user" else "assistant",
            "content": m.content
        })

    payload = {
        "model": model_name,
        "messages": formatted_msgs,
        "temperature": 0.35,
        "max_tokens": 450,
        "response_format": {"type": "json_object"}
    }

    try:
        resp = await client.post(url, headers=headers, json=payload, timeout=12.0)
        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                raw_text = choices[0].get("message", {}).get("content", "").strip()
                return extract_json_from_text(raw_text)
        else:
            print(f"[OpenRouter Notice: {model_name}] {resp.status_code}: {resp.text[:120]}")
    except Exception as e:
        print(f"[OpenRouter Exception: {model_name}] {e}")

    return None

async def call_gemini_direct(
    client: httpx.AsyncClient,
    messages: List[ChatMessage]
) -> Optional[Dict[str, Any]]:
    """Llamada a Google Gemini directa si está disponible."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}

    contents = []
    for msg in messages:
        role = "user" if msg.role == "user" else "model"
        contents.append({
            "role": role,
            "parts": [{"text": msg.content}]
        })

    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": WIKI_SYSTEM_PROMPT}]},
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": 450,
            "responseMimeType": "application/json",
            "responseSchema": GEMINI_RESPONSE_SCHEMA
        }
    }

    try:
        resp = await client.post(url, headers=headers, json=payload, timeout=10.0)
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    raw_text = parts[0].get("text", "").strip()
                    return extract_json_from_text(raw_text)
    except Exception:
        pass

    return None

async def query_llm_for_wiki(
    client: httpx.AsyncClient,
    messages: List[ChatMessage]
) -> Optional[Dict[str, Any]]:
    """
    Cadena de resolución de modelos:
    1. OpenRouter (modelo configurado: google/gemini-2.5-flash)
    2. OpenRouter (modelo de respaldo 100% gratuito: qwen/qwen3.8-27b:free)
    3. Google Gemini Direct
    """
    # 1. OpenRouter principal
    if settings.OPENROUTER_API_KEY:
        res = await call_openrouter_model(client, messages, settings.OPENROUTER_MODEL)
        if res and res.get("reply"):
            return res

        # 2. Respaldo gratuito en OpenRouter si falla el principal o cuota
        if settings.OPENROUTER_FALLBACK_FREE_MODEL != settings.OPENROUTER_MODEL:
            res_free = await call_openrouter_model(client, messages, settings.OPENROUTER_FALLBACK_FREE_MODEL)
            if res_free and res_free.get("reply"):
                return res_free

    # 3. Gemini Direct como tercer intento
    return await call_gemini_direct(client, messages)
