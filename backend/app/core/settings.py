"""
Configuraciones centralizadas del backend de Daarick Systems.
Lectura determinista y sin duplicación de lecturas de disco por petición.
"""
import os
from typing import List
from dotenv import load_dotenv

# Cargar entorno una sola vez
load_dotenv(override=False)

class Settings:
    # LLM Providers (OpenRouter prioritario por disponibilidad y estabilidad de cuota)
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "").strip()
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash").strip()
    OPENROUTER_FALLBACK_FREE_MODEL: str = os.getenv("OPENROUTER_FALLBACK_FREE_MODEL", "qwen/qwen3.8-27b:free").strip()

    # Google Gemini Direct
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    
    # Google Calendar OAuth 2.0
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()
    GOOGLE_REFRESH_TOKEN: str = os.getenv("GOOGLE_REFRESH_TOKEN", "").strip()
    GOOGLE_CALENDAR_ID: str = os.getenv("GOOGLE_CALENDAR_ID", "primary").strip()
    
    # Booking Settings
    BOOKING_TIMEZONE: str = os.getenv("BOOKING_TIMEZONE", "America/Mexico_City").strip()
    BOOKING_DAYS: str = os.getenv("BOOKING_DAYS", "MON,TUE,WED,THU,FRI").strip()
    BOOKING_HOURS: str = os.getenv("BOOKING_HOURS", "10:00-18:00").strip()
    BOOKING_DURATION_MIN: int = int(os.getenv("BOOKING_DURATION_MIN", "30"))
    BOOKING_MIN_NOTICE_HOURS: int = int(os.getenv("BOOKING_MIN_NOTICE_HOURS", "12"))
    BOOKING_HORIZON_DAYS: int = int(os.getenv("BOOKING_HORIZON_DAYS", "14"))

    # Security & CORS
    CHAT_HMAC_SECRET: str = os.getenv("CHAT_HMAC_SECRET", "daarick-secret-signing-key-default-2026").strip()
    ALLOWED_ORIGINS: List[str] = [
        origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:4321,http://127.0.0.1:4321,https://daarick.vercel.app").split(",") if origin.strip()
    ]

settings = Settings()
