"""
CyberTrace — FastAPI Application Entrypoint
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import engine, Base
from routers import cases, evidence, graph, analytics, ai, reports
# Ensure all ORM models are registered with Base.metadata before create_all
import models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: dispose engine
    await engine.dispose()


app = FastAPI(
    title="CyberTrace API",
    description="AI-powered forensic fraud investigation platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────
app.include_router(cases.router, prefix="/api/cases", tags=["Cases"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["Evidence"])
app.include_router(graph.router, prefix="/api/graph", tags=["Graph"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "CyberTrace Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "CyberTrace Backend",
        "llm_provider": settings.LLM_PROVIDER,
    }
