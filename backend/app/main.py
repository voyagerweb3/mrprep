from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base
from app.routers import checklist, users

Base.metadata.create_all(bind=engine)

@app.on_event("startup")
async def auto_seed_on_startup():
    """Auto-seed database on startup if empty (SQLite resets on each Railway deploy)"""
    try:
        from app.database import SessionLocal
        from app.models.models import Category
        db = SessionLocal()
        try:
            count = db.query(Category).count()
            if count == 0:
                import subprocess, sys
                subprocess.run([sys.executable, "/app/seed_data.py"], capture_output=True, cwd="/app")
        finally:
            db.close()
    except Exception:
        pass


app = FastAPI(
    title="Survival Checklist API",
    description="API для Telegram Mini App",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(checklist.router)
app.include_router(users.router)

@app.get("/")
def root(): return {"status": "ok"}

@app.get("/health")
def health(): return {"status": "healthy"}



@app.post("/api/admin/seed")
def run_seed():
    import subprocess, sys
    result = subprocess.run([sys.executable, "/app/seed_data.py"], capture_output=True, text=True, cwd="/app")
    return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
