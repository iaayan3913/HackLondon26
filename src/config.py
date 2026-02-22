from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str
    gemini_model: str
    claude_api_key: str
    claude_model: str
    db_path: Path
    cors_origins: tuple[str, ...]

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.db_path}"


def _resolve_db_path(raw: str) -> Path:
    path = Path(raw)
    if path.is_absolute():
        return path
    return (Path.cwd() / path).resolve()


def _parse_cors_origins(raw: str) -> tuple[str, ...]:
    if not raw:
        return ("http://localhost:5173", "http://127.0.0.1:5173")
    return tuple(origin.strip() for origin in raw.split(",") if origin.strip())


settings = Settings(
    gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
    gemini_model=os.getenv("GEMINI_MODEL", "gemini-3-flash-preview"),
    claude_api_key=os.getenv("CLAUDE_API_KEY", ""),
    claude_model=os.getenv("CLAUDE_MODEL", "claude-3-haiku-20240307"),
    db_path=_resolve_db_path(os.getenv("DB_PATH", "quiz_arena.db")),
    cors_origins=_parse_cors_origins(os.getenv("CORS_ORIGINS", "")),
)
