from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models import Category, ChecklistItem, User, UserItem

router = APIRouter(prefix="/api/checklist", tags=["checklist"])


# ── Схемы ответов ──────────────────────────────────────────────────────────────

class ItemOut(BaseModel):
    id: int
    title: str
    description: str | None
    quantity: str | None
    priority: int
    order: int
    is_checked: bool

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: int
    slug: str
    title: str
    description: str | None
    icon: str | None
    order: int
    items: List[ItemOut]
    progress: float  # 0.0 – 1.0

    class Config:
        from_attributes = True


class ProgressOut(BaseModel):
    total: int
    checked: int
    percent: float
    by_category: dict


# ── Хелпер: получить или создать пользователя ──────────────────────────────────

def get_or_create_user(telegram_id: int, db: Session, username: str = None, first_name: str = None) -> User:
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        user = User(telegram_id=telegram_id, username=username, first_name=first_name)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.last_seen = datetime.utcnow()
        db.commit()
    return user


# ── Эндпоинты ─────────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryOut])
def get_categories(telegram_id: int, db: Session = Depends(get_db)):
    """Все категории с пунктами и статусом пользователя"""
    user = get_or_create_user(telegram_id, db)

    # Загружаем отмеченные пункты пользователя
    checked_ids = {
        ui.item_id
        for ui in db.query(UserItem).filter(UserItem.user_id == user.id, UserItem.is_checked == True).all()
    }

    categories = db.query(Category).order_by(Category.order).all()
    result = []

    for cat in categories:
        items_out = []
        for item in sorted(cat.items, key=lambda x: x.order):
            items_out.append(ItemOut(
                id=item.id,
                title=item.title,
                description=item.description,
                quantity=item.quantity,
                priority=item.priority,
                order=item.order,
                is_checked=item.id in checked_ids,
            ))

        total = len(items_out)
        checked = sum(1 for i in items_out if i.is_checked)
        progress = checked / total if total > 0 else 0.0

        result.append(CategoryOut(
            id=cat.id,
            slug=cat.slug,
            title=cat.title,
            description=cat.description,
            icon=cat.icon,
            order=cat.order,
            items=items_out,
            progress=progress,
        ))

    return result


@router.post("/toggle/{item_id}")
def toggle_item(item_id: int, telegram_id: int, db: Session = Depends(get_db)):
    """Отметить / снять отметку с пункта"""
    user = get_or_create_user(telegram_id, db)
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    user_item = db.query(UserItem).filter(
        UserItem.user_id == user.id,
        UserItem.item_id == item_id
    ).first()

    if user_item:
        user_item.is_checked = not user_item.is_checked
        user_item.checked_at = datetime.utcnow() if user_item.is_checked else None
    else:
        user_item = UserItem(user_id=user.id, item_id=item_id, is_checked=True, checked_at=datetime.utcnow())
        db.add(user_item)

    db.commit()
    return {"item_id": item_id, "is_checked": user_item.is_checked}


@router.get("/progress", response_model=ProgressOut)
def get_progress(telegram_id: int, db: Session = Depends(get_db)):
    """Общий прогресс пользователя"""
    user = get_or_create_user(telegram_id, db)

    all_items = db.query(ChecklistItem).all()
    checked_ids = {
        ui.item_id
        for ui in db.query(UserItem).filter(UserItem.user_id == user.id, UserItem.is_checked == True).all()
    }

    categories = db.query(Category).order_by(Category.order).all()
    by_category = {}
    for cat in categories:
        cat_items = [i for i in all_items if i.category_id == cat.id]
        cat_checked = sum(1 for i in cat_items if i.id in checked_ids)
        by_category[cat.slug] = {
            "title": cat.title,
            "total": len(cat_items),
            "checked": cat_checked,
            "percent": round(cat_checked / len(cat_items) * 100) if cat_items else 0,
        }

    total = len(all_items)
    checked = len(checked_ids)
    return ProgressOut(
        total=total,
        checked=checked,
        percent=round(checked / total * 100) if total > 0 else 0,
        by_category=by_category,
    )
