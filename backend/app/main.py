from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base
from app.routers import checklist, users

Base.metadata.create_all(bind=engine)

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
