from __future__ import annotations

from functools import lru_cache

try:
    from .services.gemini import GeminiService
    from .services.grading import GradingService
except ImportError:  # pragma: no cover - allows top-level module imports
    from services.gemini import GeminiService
    from services.grading import GradingService


@lru_cache(maxsize=1)
def get_gemini_service() -> GeminiService:
    return GeminiService()


@lru_cache(maxsize=1)
def get_grading_service() -> GradingService:
    return GradingService(gemini_service=get_gemini_service())
