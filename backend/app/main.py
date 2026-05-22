from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, settings
from app.routers import auth, beans, grinders, methods, brews

# Create all tables on startup (idempotent — safe to run on existing DB)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Coffee Management System",
    description="Self-hosted coffee tracking for your household ☕",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the configured frontend origin(s)
origins = [o.strip() for o in settings.cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,     prefix="/api/auth",     tags=["Auth"])
app.include_router(beans.router,    prefix="/api/beans",    tags=["Beans"])
app.include_router(grinders.router, prefix="/api/grinders", tags=["Grinders"])
app.include_router(methods.router,  prefix="/api/methods",  tags=["Brew Methods"])
app.include_router(brews.router,    prefix="/api/brews",    tags=["Brew Logs"])


@app.get("/api/health", tags=["Health"])
def health_check():
    """Simple liveness probe."""
    return {"status": "ok"}
