from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import User
from app.routers.checklist import get_or_create_user

router = APIRouter(prefix="/api/users", tags=["users"])


class ReminderSettings(BaseModel):
    enabled: bool
    interval_days: int = 7  # 1, 3, 7, 14, 30


@router.post("/register")
def register_user(
    telegram_id: int,
    username: str = None,
    first_name: str = None,
    db: Session = Depends(get_db)
):
    """Регистрация / обновление пользователя при открытии Mini App"""
    user = get_or_create_user(telegram_id, db, username=username, first_name=first_name)
    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "reminders_enabled": user.reminders_enabled,
        "reminder_interval_days": user.reminder_interval_days,
    }


@router.put("/reminders/{telegram_id}")
def update_reminders(
    telegram_id: int,
    settings: ReminderSettings,
    db: Session = Depends(get_db)
):
    """Настройка напоминаний"""
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        return {"error": "User not found"}

    user.reminders_enabled = settings.enabled
    user.reminder_interval_days = settings.interval_days
    db.commit()
    return {"status": "ok", "reminders_enabled": user.reminders_enabled}
