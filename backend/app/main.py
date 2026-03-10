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
    import subprocess
    seed_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed_data.py')
    result = subprocess.run(['python', seed_path], capture_output=True, text=True, cwd=os.path.dirname(seed_path))
    return {"stdout": result.stdout[-2000:] if result.stdout else "", "stderr": result.stderr[-1000:] if result.stderr else "", "returncode": result.returncode}

