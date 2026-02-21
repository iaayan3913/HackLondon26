from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from database import init_db
from routers import files, folders

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup: Create storage directory and initialize database
    os.makedirs("storage", exist_ok=True)
    await init_db()
    print("✓ Database initialized")
    print("✓ Storage directory ready")
    yield
    # Shutdown (if needed)
    print("✓ Application shutting down")

app = FastAPI(
    title="StudyPro File Management API",
    description="Backend API for StudyPro file and folder management",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS to allow communication from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(files.router, prefix="/api")
app.include_router(folders.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "StudyPro File Management API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/test")
def test_api():
    return {"message": "Hello from the FastAPI backend!"}
