from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime
import uuid
import os
import asyncio
import threading

from .components import storage, transcriber
from .components.models import TranscriptionRecord


try:
    from .config import settings
    from .database import ensure_test_user
    from .database import init_db
    from .routers.attempts import router as attempts_router
    from .routers.quizzes import router as quizzes_router
except ImportError:  # pragma: no cover - allows `uvicorn main:app` from src/
    from config import settings
    from database import ensure_test_user
    from database import init_db
    from routers.attempts import router as attempts_router
    from routers.quizzes import router as quizzes_router


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s level=%(levelname)s name=%(name)s message=%(message)s",
)

app = FastAPI(title="Quiz & Viva Arena API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quizzes_router)
app.include_router(attempts_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    ensure_test_user()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
