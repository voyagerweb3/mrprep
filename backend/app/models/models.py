from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Category(Base):
    """Категория чеклиста (Вода, Документы, Аптечка, ...)"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)   # "water", "documents", ...
    title = Column(String, nullable=False)            # "💧 Вода и еда"
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)              # emoji
    order = Column(Integer, default=0)

    items = relationship("ChecklistItem", back_populates="category")


class ChecklistItem(Base):
    """Пункт чеклиста"""
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)   # совет / инструкция
    quantity = Column(String, nullable=True)     # "3 литра на человека в день"
    priority = Column(Integer, default=1)        # 1=высокий, 2=средний, 3=низкий
    order = Column(Integer, default=0)

    category = relationship("Category", back_populates="items")
    user_items = relationship("UserItem", back_populates="item")


class User(Base):
    """Пользователь (по Telegram ID)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    reminders_enabled = Column(Boolean, default=False)
    reminder_interval_days = Column(Integer, default=7)  # раз в неделю
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    user_items = relationship("UserItem", back_populates="user")


class UserItem(Base):
    """Статус пункта чеклиста для конкретного пользователя"""
    __tablename__ = "user_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=False)
    is_checked = Column(Boolean, default=False)
    checked_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="user_items")
    item = relationship("ChecklistItem", back_populates="user_items")
