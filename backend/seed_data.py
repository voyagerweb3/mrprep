"""
Начальные данные: категории и пункты чеклиста.
Запускать один раз python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import Category, ChecklistItem

Base.metadata.create_all(bind=engine)
